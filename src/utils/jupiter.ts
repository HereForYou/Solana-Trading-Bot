import fetch from 'cross-fetch';

/**
 * Get token price using its address using jupiter API
 * @param {string} token
 * @returns
 */
export async function getTokenPrice(token: string) {
  try {
    const response = await fetch(`https://api.jup.ag/price/v2?ids=${token}`, {
      method: 'get',
      redirect: 'follow',
    });
    const { data } = await response.json();
    return data[token]?.price;
  } catch (error) {
    console.error('Error while getTokenPrice:', error);
    throw new Error('Error while getTokenPrice');
  }
}
