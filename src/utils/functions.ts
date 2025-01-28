import { bot } from '../config/config';
import { User } from '../models/user.model';

export function uint8ArrayToHex(uint8Array: Uint8Array) {
  try {
    return Array.from(uint8Array)
      .map((byte) => byte.toString(16).padStart(2, '0')) // Convert each byte to hex and pad with zeros
      .join(''); // Join all hex strings together
  } catch (error) {
    console.error('Error while uint8ArrayToHex function:', error);
    throw new Error('Failed to convert uint8Array to hexadecimal string.');
  }
}

export async function sendMessageToAllActiveUsers(tokenInfo: any) {
  try {
    const users = await User.find({ botStatus: true });
    await Promise.all(
      users.map(async (user) => {
        await bot.telegram.sendMessage(
          user.tgId,
          `🔔 New Migration (${tokenInfo.name} / ${tokenInfo.symbol}) 🔔\n` +
            `💶 <code>${tokenInfo.address}</code>\n` +
            `📊 <a href="https://solscan.io/token/${tokenInfo.address}">Contract</a> • ` +
            `<a href="https://birdeye.so/token/${tokenInfo.address}?chain=solana">Birdeye</a> • ` +
            `<a href="https://dexscreener.com/solana/${tokenInfo.address}">Dexscreener</a>`,
          { parse_mode: 'HTML', link_preview_options: { is_disabled: true } }
        );
      })
    );
  } catch (error) {
    console.error('Error while sendMessageToAllActiveUsers:', error);
  }
}

// Round up the number to specific decimal
export function roundToSpecificDecimal(num: number, decimal = 0) {
  const decimals = 10 ** decimal;
  return Math.floor(num * decimals) / decimals;
}

// Check if the number is valid or not
export function isNumber(str: string) {
  return !isNaN(Number(str)) && str != 'Infinity' && str?.toString()?.trim() !== '';
}

// Check if the format of time is valid
export function checkTimeFormat(time: string) {
  if (time.split(':').length !== 2) {
    return {
      ok: false,
    };
  }
  const [hour, minute] = time.split(':');
  if (!isNumber(hour) || !isNumber(minute)) {
    return {
      ok: false,
    };
  }
  if (Number(hour) < 0 || Number(hour) > 23 || Number(minute) < 0 || Number(minute) > 59) {
    return { ok: false };
  }
  return { ok: true };
}

export function addItemToArray(item: string, array: string[]) {
  array.push(item);
  if (array.length > 10) {
    array.splice(0, 1);
  }
}
