import { SOL_DECIMAL } from '../config/config';
import { UserType } from './user.model';
import { roundToSpecificDecimal } from '../utils/functions';
import { TokenInfoType } from '../config/types';

/**
 * The text when start command is inputed
 */
export const startText = (user: UserType) => {
  return (
    `🎉 @${user?.username}, <b>Welcome to Smart Solana Trading Bot</b>\n\n` +
    `👍 The Unique Solana Trading Bot.\n` +
    `💨 Snipe asap, 💨 Trade as reasonable as possible`
  );
};

/**
 * The text to be sent when new user login
 * @param {} user
 */
export const newUserText = (user: UserType) => {
  try {
    return (
      `👋 Hello, *@${user?.username}*\n\n` +
      `⚠ Keep your _private keys_ *safe*\n` +
      `💳 Public Key: \`${user.wallet.publicKey}\`\n` +
      `🔑 Private Key: ||_${user.wallet.privateKey}_||\n`
    );
  } catch (error) {
    console.error('Error while getting newUserText:', error);
    throw new Error('Failed to create newUser text.');
  }
};

/**
 * The text when help command is inputed
 */
export const helpText =
  `🚀 <b>Smart 🦊 Solana Trading Bot</b> 🚀 \n\n` +
  `Supercharge your trading with our cutting-edge bot that tracks and capitalizes on Serum migrations from Pump.fun! 💎\n\n` +
  `Key Features:\n` +
  `✅ Lightning-fast transaction tracking\n` +
  `✅ Instant buy execution\n` +
  `✅ Smart auto-buy/sell based on MC\n` +
  `✅ Real-time Telegram alerts\n\n` +
  `How it works:\n\n` +
  `🔍 Monitors Pump.fun migrations to Serum\n` +
  `💨 Executes rapid buy orders upon detection\n` +
  `📊 Tracks market cap in real-time\n` +
  `💰 Triggers auto-sell when your conditions are met\n\n` +
  `Join the trading revolution today! 🌟`;

export const swapSuccessText = (tokenInfo: any, signature: string, solAmount: number, tokenAmount: number) => {
  return (
    `🟢 <b>Buying <b>${tokenInfo.symbol || tokenInfo.name}</b> is success</b>.\n` +
    `You bought <b>${roundToSpecificDecimal(tokenAmount / 10 ** tokenInfo.decimals, 4)}</b> ` +
    `${tokenInfo.symbol || tokenInfo.name} using <b>${solAmount / SOL_DECIMAL}</b> SOL.\n` +
    `📝<a href='https://solscan.io/tx/${signature}'>Transaction</a>`
  );
};

export const settingText = `User Setting:\n\n` + 'You can set auto trading amount, priority fee, time range, etc.';

export const buySuccessText = (tokenInfo: TokenInfoType, signature: string, solAmount: number, tokenAmount: number) => {
  return (
    `🟢 <b>Buying <b>${tokenInfo.symbol || tokenInfo.name}</b> is success</b>.\n` +
    `You bought <b>${roundToSpecificDecimal(tokenAmount, 4)}</b>` +
    ` ${tokenInfo.symbol || tokenInfo.name} using <b>${solAmount}</b> SOL.\n` +
    `📝<a href='https://solscan.io/tx/${signature}'>Transaction</a>`
  );
};

export const sellSuccessText = (token: any, earn: number, pl: number, signature: string) => {
  return (
    `🔴 <b>Selling ${token.symbol || token.name} was success! 🟢</b>\n` +
    `💵 You got <b>${roundToSpecificDecimal(earn, 4)}</b> SOL\n` +
    `${pl > 0 ? '🟢 Profit' : '🔴 Loss'}: <b>${pl}</b> SOL\n` +
    `📝 <a href='https://solscan.io/tx/${signature}'>Transaction</a>`
  );
};
