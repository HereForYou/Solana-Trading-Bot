import { Keypair, VersionedTransaction, PublicKey, PartiallyDecodedInstruction } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';
import { UserType } from '../models/user.model';
import { TokenInfoType } from '../config/types';
import { User } from '../models/user.model';
import {
  connection,
  bot,
  INSTRUCTION_NAME,
  RAYDIUM,
  SOL_ADDRESS,
  sigHistory,
  RAYDIUM_PUBLIC_KEY,
  SOL_DECIMAL,
  JUPITER_FEE_ACCOUNT,
} from '../config/config';
import { buySuccessText } from '../models/text.model';
import { sendMessageToAllActiveUsers, addItemToArray } from './functions';
import { getQuoteForSwap, getSerializedTransaction, getTokenPrice } from './jupiter';
import { bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes';

//-------------------------------------------------------------------------------------------------------------+
//                                            Define the functions                                             |
//-------------------------------------------------------------------------------------------------------------+

export async function getTokenInfo(mintAddress: string) {
  const metaplex = Metaplex.make(connection);

  const mint = new PublicKey(mintAddress);

  try {
    const tokenMetadata = await metaplex.nfts().findByMint({ mintAddress: mint });
    const price = await getTokenPrice(mintAddress);
    const risk = tokenMetadata.mint.freezeAuthorityAddress ? 100 : tokenMetadata.mint.mintAuthorityAddress ? 50 : 0;
    return {
      name: tokenMetadata.name,
      symbol: tokenMetadata.symbol,
      address: tokenMetadata.address.toString(),
      decimals: tokenMetadata.mint.decimals,
      risk,
      price,
    };
  } catch (error) {
    console.error('Error fetching token metadata:', error);
  }
}

export async function getBalanceOfWallet(walletAddress: string) {
  try {
    const balance = await connection.getBalance(new PublicKey(walletAddress));
    return balance;
  } catch (error) {
    console.error('Error while getBalanceOfWallet', error);
    return 0;
  }
}

export async function getTokenBalanceOfWallet(walletAddr: string, tokenAddr: string) {
  try {
    const info = await connection.getParsedTokenAccountsByOwner(new PublicKey(walletAddr), {
      mint: new PublicKey(tokenAddr),
    });
    const tokenInfo = info?.value[0]?.account?.data.parsed.info.tokenAmount;
    return Number(tokenInfo?.amount);
  } catch (error) {
    console.error('Error while getBalanceOfWallet', error);
    return 0;
  }
}

export async function monitorNewToken() {
  console.log('Monitoring new Token...');
  try {
    await connection.onLogs(
      RAYDIUM,
      ({ logs, err, signature }) => {
        // Skip if signature is error signature
        if (err) {
          return;
        }

        // Filter logs by instruction
        if (logs && logs.some((log) => log.includes(INSTRUCTION_NAME))) {
          // Skip if the signature is already processed
          if (sigHistory.includes(signature)) {
            return;
          }

          // Add signature in history to skip the processed signature
          addItemToArray(signature, sigHistory);

          console.log("Signature for 'initialize2':", `https://explorer.solana.com/tx/${signature}`);

          // Process the signature
          fetchRaydiumMints(signature);
        }
      },
      'finalized'
    );
  } catch (error) {
    console.error('Error while monitorNewToken:', error);
  }
}

export async function fetchRaydiumMints(signature: string) {
  try {
    // Fetch the transaction by signature
    const tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed',
    });

    // Extract the accounts of Raydium Liquidity Pool V4 instruction
    const accounts = (
      tx?.transaction?.message?.instructions.find(
        (ix) => ix.programId.toBase58() == RAYDIUM_PUBLIC_KEY
      ) as PartiallyDecodedInstruction
    )?.accounts;

    // If not accounts
    if (!accounts) {
      return;
    }

    // Get the token accounts of pool
    const tokens = [];
    tokens.push(accounts[8].toBase58());
    tokens.push(accounts[9].toBase58());

    // Get the address of pool
    const poolAddress = accounts[4].toBase58();

    // If the token is not paired with SOL
    if (tokens.some((token) => token === SOL_ADDRESS) === false) {
      return;
    }

    const token = tokens.find((token) => token !== SOL_ADDRESS);
    if (!token) {
      return;
    }

    const tokenInfo = await getTokenInfo(token);
    if (!tokenInfo) {
      return;
    }

    // Skip the high risk token
    if (tokenInfo?.risk === 100) {
      console.log('High risk token.');
      throw new Error('High risk: It is a freezeable token.');
    }

    console.log('New LP Found', tokenInfo);

    // Send the new migration message to all users
    await sendMessageToAllActiveUsers({ ...tokenInfo, poolAddress });

    // Buy the new token
    await swapTokenForAllActiveUsers({ ...tokenInfo, poolAddress });
  } catch (error: any) {
    if (error?.message) {
      console.log(signature, '=====', error?.message);
    } else {
      console.error('Error fetching transaction:', signature, error);
    }
    // return;
  }
}

export const generateWallet = async () => {
  try {
    const keyPair = Keypair.generate(); // Generate new key pair of publicKey and privateKey
    return {
      publicKey: keyPair.publicKey.toString(),
      privateKey: bs58.encode(keyPair.secretKey),
    };
  } catch (error) {
    console.error('Error while generating wallet:', error);
    throw new Error('Failed to generate new Solana wallet.');
  }
};

export async function getTokenDiffFromSignature(signature: string, token: string) {
  try {
    const transaction = await connection.getParsedTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    const postTokenBalance = transaction?.meta?.postTokenBalances;
    const preTokenBalance = transaction?.meta?.preTokenBalances;

    const diff = Math.abs(
      (postTokenBalance?.find((post) => post.mint === token && post.owner !== JUPITER_FEE_ACCOUNT)?.uiTokenAmount
        .uiAmount || 0) -
        (preTokenBalance?.find((pre) => pre.mint === token && pre.owner !== JUPITER_FEE_ACCOUNT)?.uiTokenAmount
          .uiAmount || 0)
    );

    return diff;
  } catch (error) {
    console.error(error);
  }
}

/**
 *
 * @param {string} swapTransaction
 * @returns
 */
export async function getDeserialize(swapTransaction: string) {
  try {
    const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
    return transaction;
  } catch (error) {
    console.error('Error while getDeserialize:', error);
    throw new Error('Error while getDeserialize');
  }
}

export async function signTransaction(transaction: VersionedTransaction, keyPair: Keypair) {
  try {
    transaction.sign([keyPair]);
    return transaction;
  } catch (error) {
    console.error('Error while signTransaction:', error);
    throw new Error('Error while signTransaction');
  }
}

export async function executeTransaction(transaction: VersionedTransaction) {
  try {
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

    const rawTransaction = transaction.serialize();
    const signature = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: true,
      maxRetries: 5,
    });

    await connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature,
    });
    return { success: true, signature: signature };
  } catch (error) {
    console.error('Error while executeTransaction:', error);
    return { success: false, signature: '' };
  }
}

export async function swapTokens(
  inputAddr: string,
  outputAddr: string,
  amount: number,
  secretKey: string,
  priorityFee: number,
  slippageBps: number,
  jitoFee: number
) {
  try {
    const keyPair = Keypair.fromSecretKey(bs58.decode(secretKey));

    const quote = await getQuoteForSwap(inputAddr, outputAddr, amount, slippageBps);
    console.log('quote:', quote);
    if (quote.error) {
      return { success: false, message: quote.error as string };
    }

    const swapTransaction = await getSerializedTransaction(quote, keyPair.publicKey.toString(), priorityFee);

    const transaction = await getDeserialize(swapTransaction);

    const signedTransaction = await signTransaction(transaction, keyPair);

    const result = await executeTransaction(signedTransaction);

    // const result = await sendBundle([signedTransaction], keyPair, jitoFee);
    // console.log('sendBundle result:', result);

    if (result.success === true) {
      const outAmount = (await getTokenDiffFromSignature(result.signature, outputAddr)) || 0;
      const solDiff = (await getTokenDiffFromSignature(result.signature, SOL_ADDRESS)) || 0;
      return {
        success: true,
        signature: result.signature,
        outAmount: outAmount,
        solDiff,
        message: '',
      };
    } else {
      return { success: false, message: 'Transaction is failed' };
    }
  } catch (error: any) {
    console.error('Error while swapTransaction:', error);
    if (error.message) {
      return { success: false, message: error.message };
    } else {
      return { success: false, message: 'Something went wrong! Please contact with @QualityAtTheFirst' };
    }
  }
}

export async function swapTokenForAllActiveUsers(tokenInfo: TokenInfoType) {
  try {
    // Find all active users
    const users = await User.find({ botStatus: true, autoTrade: true, snipeAmount: { $gt: 0 } });
    const currentDate = new Date();
    const currentHour = currentDate.getHours();
    const currentMin = currentDate.getMinutes();
    await Promise.all(
      users
        .filter((user: UserType) => {
          const [startHour, startMin] = [Number(user.startAt.split(':')[0]), Number(user.startAt.split(':')[1])];
          const [stopHour, stopMin] = [Number(user.stopAt.split(':')[0]), Number(user.stopAt.split(':')[1])];
          const startCheck = startHour < currentHour || (startHour === currentHour && startMin < currentMin);
          const stopCheck = stopHour > currentHour || (stopHour === currentHour && stopMin > currentMin);
          return !user.timeStatus || (user.timeStatus && startCheck && stopCheck);
        })
        .map(async (user: UserType) => {
          const amount = user.snipeAmount * SOL_DECIMAL;
          const balance = await getBalanceOfWallet(user.wallet.publicKey); // Fetch the balance of wallet

          // If balance is lower than amount
          if (balance < amount) {
            await bot.telegram.sendMessage(
              user.tgId,
              '🙅‍♀ Insufficient balance. Please top up your wallet and then continue running the bot.',
              { parse_mode: 'HTML' }
            );
          } else {
            // Buy the token with SOL
            const result = await swapTokens(
              SOL_ADDRESS,
              tokenInfo?.address,
              amount,
              user.wallet.privateKey,
              user.priorityFee,
              user.slippageBps,
              user.jitoFee
            );
            const solPrice = await getTokenPrice(SOL_ADDRESS);

            // If purchase is succeed
            if (result.success === true && result.outAmount) {
              const tokenAmount = result.outAmount;
              const price = tokenInfo.price || (amount * solPrice) / tokenAmount;

              user.tokens.push({
                name: tokenInfo.name,
                symbol: tokenInfo.symbol,
                decimals: tokenInfo.decimals,
                address: tokenInfo.address,
                amount: tokenAmount,
                usedSolAmount: result?.solDiff,
                price,
                risk: tokenInfo.risk,
              });
              await user.save();

              await bot.telegram.sendMessage(
                user.tgId,
                buySuccessText(tokenInfo, result.signature || '', amount / SOL_DECIMAL, tokenAmount),
                { parse_mode: 'HTML' }
              );
            } else {
              await bot.telegram.sendMessage(
                user.tgId,
                `🔴 Buy failed. \nPriority Fee is too low. Please increase the fee.`,
                { parse_mode: 'HTML' }
              );
            }
            console.log('================================ end ================================');
          }
        })
    );
  } catch (error) {
    console.error('Error while swapTokenForAllActiveUsers:', error);
  }
}
