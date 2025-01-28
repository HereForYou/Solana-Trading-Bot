import fetch from 'cross-fetch';

/**
 *
 * @param {string} inputAddr
 * @param {string} outputAddr
 * @param {number} amount
 * @param {number} slippageBps
 * @returns
 */
export async function getQuoteForSwap(inputAddr: string, outputAddr: string, amount: number, slippageBps: number) {
  try {
    const response = await fetch(
      `https://quote-api.jup.ag/v6/quote?inputMint=${inputAddr}&outputMint=${outputAddr}&amount=${amount}&slippageBps=${slippageBps}`
    );
    const quote = await response.json();
    return quote;
  } catch (error) {
    console.error('Error while getQuoteForSwap:', error);
    throw new Error('Error while getQuoteForSwap');
  }
}

/**
 *
 * @param {any} quote
 * @param {string} publicKey
 * @returns
 */
export async function getSerializedTransaction(quote: any, publicKey: string, priorityFee: number) {
  try {
    const response = await fetch('https://quote-api.jup.ag/v6/swap', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey: publicKey,
        wrapAndUnwrapSol: true,
        prioritizationFeeLamports: priorityFee,
      }),
    });
    const { swapTransaction } = await response.json();
    return swapTransaction;
  } catch (error) {
    console.log('Error while getSerializedTransaction:', error);
    throw new Error('Error while getSerializedTransaction');
  }
}

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
