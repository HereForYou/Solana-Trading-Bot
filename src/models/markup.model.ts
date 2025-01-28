import { SOL_DECIMAL } from '../config/config';
import { Markup, Types } from 'telegraf';
import { UserType } from './user.model';
import { getBalanceOfWallet } from '../utils/web3';

export const startMarkUp = () => {
  try {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🛠 Setting', 'Setting'), Markup.button.callback('📜 Help', 'Help')],
    ]).reply_markup;
  } catch (error) {
    console.error('Error while startMarkUp:', error);
    throw new Error('Failed to create markup for start command');
  }
};

export const settingMarkUp = async (user: UserType) => {
  const balance = await getBalanceOfWallet(user.wallet.publicKey);
  try {
    return Markup.inlineKeyboard([
      [Markup.button.callback(`💳 Wallet (${balance / SOL_DECIMAL})`, 'Wallet')],
      [
        Markup.button.callback(
          `${user.botStatus ? '🆕 New Migration Alarm On 🟢' : '🆕 New Migration Alarm Off 🔴'}`,
          'On Off'
        ),
        Markup.button.callback(`${user.autoTrade ? '⚙ Auto Trade On 🟢' : '⚙ Auto Trade Off 🔴'}`, 'Auto Trade'),
      ],
      [
        Markup.button.callback(`💵 Amount: ${user.snipeAmount} SOL`, 'Snipe Amount'),
        Markup.button.callback(`💵 Priority Fee: ${user.priorityFee}`, 'Priority Fee'),
        Markup.button.callback(`🆚 Slippage Bps: ${user.slippageBps}`, 'Slippage Bps'),
      ],
      [
        Markup.button.callback(`${user.timeStatus ? '⏰ Time Check On 🟢' : '⏰ Time Check Off 🔴'}`, 'Time On Off'),
        Markup.button.callback(`⌛ Start At: ${user.startAt}`, 'Start Time'),
        Markup.button.callback(`⌛ Stop At: ${user.stopAt}`, 'Stop Time'),
      ],
      [Markup.button.callback('🔙 Back', 'Return'), Markup.button.callback('✖ Close', 'Close')],
    ]);
  } catch (error) {
    console.error('Error while settingMarkUp:', error);
    throw new Error('Failed to create markup for user settings.');
  }
};

export const closeMarkUp = Markup.inlineKeyboard([[Markup.button.callback('✖ Close', 'Close')]]);

export const walletMarkUp = Markup.inlineKeyboard([
  [Markup.button.callback('🔙 Back', 'Setting'), Markup.button.callback('✖ Close', 'Close')],
]);

export const helpMarkup = Markup.inlineKeyboard([
  [Markup.button.callback('🔙 Back', 'Return'), Markup.button.callback('✖ Close', 'Close')],
]);
