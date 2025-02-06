import { Keypair, PublicKey, PartiallyDecodedInstruction } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';
import {
  connection,
  INSTRUCTION_NAME,
  RAYDIUM,
  SOL_ADDRESS,
  sigHistory,
  RAYDIUM_PUBLIC_KEY,
} from '../config/config';
import { sendMessageToAllActiveUsers, addItemToArray } from './functions';
import { getTokenPrice } from './jupiter';
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

export const generateWalletFromKey = async (privateKey: string) => {
  try {
    const uint8Array = bs58.decode(privateKey);
    const keyPair = Keypair.fromSecretKey(uint8Array);
    return {
      publicKey: keyPair.publicKey.toString(),
      privateKey: bs58.encode(keyPair.secretKey),
      message: '',
    };
  } catch (error) {
    console.error(error);
    return {
      message:
        'Invalid private key. Please enter your Phantom wallet private key. The private key format should be 4TYcXh*********LL5SqM.',
    };
  }
};
