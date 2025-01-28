import { User } from '../models/user.model';
import { getTokenPrice } from './jupiter';
import { roundToSpecificDecimal } from './functions';
import { swapTokens, getTokenBalanceOfWallet } from './web3';
import { SOL_ADDRESS, bot, MAX_RATE, MIN_RATE, SOL_DECIMAL, UP_DOWN_RATE } from '../config/config';

/**
 * Get all users have some bought token
 */
async function getAllInfosForSell() {
  try {
    const currentDate = new Date();
    const currentTime = currentDate.getHours() * 60 + currentDate.getMinutes();
    const users = await User.aggregate([
      {
        $match: {
          $and: [{ botStatus: true }, { autoTrade: true }],
        },
      },
      {
        $unwind: '$tokens', // Deconstruct the tokens array
      },
      {
        $match: {
          'tokens.status': 'Bought', // Match tokens with status 'Bought'
          'tokens.amount': { $gt: 0 }, // Match tokens with amount greater than 0
        },
      },
      {
        $match: {
          $expr: {
            $or: [
              { $eq: ['$timeStatus', false] },
              {
                $and: [
                  { $eq: ['$timeStatus', true] },
                  {
                    $lt: [
                      {
                        $add: [
                          { $multiply: [{ $toInt: { $substr: ['$startAt', 0, 2] } }, 60] },
                          { $toInt: { $substr: ['$startAt', 3, 2] } },
                        ],
                      },
                      currentTime,
                    ],
                  },
                  {
                    $gt: [
                      {
                        $add: [
                          { $multiply: [{ $toInt: { $substr: ['$stopAt', 0, 2] } }, 60] },
                          { $toInt: { $substr: ['$stopAt', 3, 2] } },
                        ],
                      },
                      currentTime,
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
      {
        $project: {
          tgId: 1,
          wallet: 1,
          jitoFee: 1,
          priorityFee: 1,
          slippageBps: 1,
          username: 1,
          snipeAmount: 1,
          'tokens.name': 1,
          'tokens.symbol': 1,
          'tokens.address': 1,
          'tokens.usedSolAmount': 1,
          'tokens.amount': 1,
          'tokens.price': 1,
          'tokens.status': 1,
        },
      },
    ]);

    return users;
  } catch (error) {
    console.error('Error while getAllInfosForSell:', error);
    throw new Error('Error while getAllInfosForSell');
  }
}

/**
 *
 * @param {[]} infos
 */
async function monitorTokenPrice(infos: any[]) {
  try {
    if (infos.length === 0) {
      return { success: false, message: 'no infos' };
    }

    let reachedMaxPrice: number[] = [];
    infos.forEach((info) => {
      reachedMaxPrice.push(info.tokens.price);
    });

    await Promise.all(
      infos.map(async (info, index) => {
        const tokenAddress = info.tokens.address;
        const tokenPrice = info.tokens.price;
        const currentPrice = await getTokenPrice(tokenAddress);

        // Update the max price
        if (currentPrice > reachedMaxPrice[index]) {
          reachedMaxPrice[index] = currentPrice;
        }
        console.log('reachedMaxPrice', reachedMaxPrice[index], 'currentPrice:', currentPrice, 'oldPrice:', tokenPrice);

        // Determine to sell the token or not
        if (
          reachedMaxPrice[index] >= tokenPrice * MAX_RATE ||
          currentPrice <= tokenPrice * MIN_RATE ||
          currentPrice <= reachedMaxPrice[index] * UP_DOWN_RATE
        ) {
          const amount = await getTokenBalanceOfWallet(info.wallet.publicKey, tokenAddress);

          // Sell the token for SOL
          const result = await swapTokens(
            tokenAddress,
            SOL_ADDRESS,
            Math.floor(amount),
            info.wallet.privateKey,
            info.priorityFee,
            info.slippageBps,
            info.jitoFee
          );

          // If the sale is failed
          if (result.success === false || !result.outAmount) {
            await bot.telegram.sendMessage(info.tgId, '🛍 Selling was failed!🔴');
            return { success: false, message: 'Selling is failed' };

            // If the sale is success
          } else {
            const earn = result.outAmount;
            const pl = roundToSpecificDecimal(earn / SOL_DECIMAL - info.snipeAmount, 4);
            await bot.telegram.sendMessage(
              info.tgId,
              `🔴 <b>Selling ${info.tokens.symbol || info.tokens.name} was succeed! 🟢</b>\n ` +
                `💵 You got <b>${roundToSpecificDecimal(earn / SOL_DECIMAL, 4)}</b> SOL\n ` +
                `${pl > 0 ? '🟢 Profit' : '🔴 Loss'}: <b>${pl}</b> SOL\n ` +
                `📝 <a href='https://solscan.io/tx/${result?.signature}'>Transaction</a>`,
              {
                parse_mode: 'HTML',
                link_preview_options: { is_disabled: true },
              }
            );

            // Update the token status from Bought to Sold
            await User.findOneAndUpdate(
              { tgId: info.tgId, 'tokens.address': tokenAddress },
              { $set: { 'tokens.$.status': 'Sold' } }
            );
          }
        }
      })
    );
    return { success: true, message: 'Selling is success' };
  } catch (error: any) {
    console.error('Error while monitorTokenPrice:', error);
    return { success: false, message: error.message ?? 'Error while monitoring token price' };
  }
}

export async function monitorTokenToSell() {
  console.log('Monitoring bought token price...');
  try {
    while (true) {
      // Fetch all tokens infor to sell
      const infos = await getAllInfosForSell();

      // Monitor the price of bought token, determine to sell or not, if true, sell the token
      await monitorTokenPrice(infos);
    }
  } catch (error) {
    console.error('Error while monitorTokenToSell:', error);
  }
}
