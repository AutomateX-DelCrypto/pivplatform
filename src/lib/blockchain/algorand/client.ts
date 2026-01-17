// ===========================================
// Algorand Blockchain Client
// ===========================================

import algosdk from 'algosdk';
import type { BlockchainAnchor, AnchorVerification } from '@/types/blockchain';

// Algorand client singleton
let client: algosdk.Algodv2 | null = null;
let indexer: algosdk.Indexer | null = null;

/**
 * Get or create Algorand client
 */
function getClient(): algosdk.Algodv2 {
  if (!client) {
    const apiUrl = process.env.ALGORAND_API_URL || 'https://mainnet-api.algonode.cloud';
    const apiToken = process.env.ALGORAND_API_TOKEN || '';

    client = new algosdk.Algodv2(apiToken, apiUrl, '');
  }
  return client;
}

/**
 * Get or create Algorand indexer
 */
function getIndexer(): algosdk.Indexer {
  if (!indexer) {
    const indexerUrl = process.env.ALGORAND_INDEXER_URL || 'https://mainnet-idx.algonode.cloud';
    const apiToken = process.env.ALGORAND_API_TOKEN || '';

    indexer = new algosdk.Indexer(apiToken, indexerUrl, '');
  }
  return indexer;
}

/**
 * Algorand client for blockchain operations
 */
export const algorandClient = {
  /**
   * Anchor content hash to Algorand blockchain
   * Creates a self-transaction with the hash in the note field
   */
  async anchor(
    contentHash: string,
    metadata?: Record<string, string>
  ): Promise<BlockchainAnchor> {
    const mnemonic = process.env.ALGORAND_MNEMONIC;
    if (!mnemonic) {
      throw new Error('ALGORAND_MNEMONIC not configured');
    }

    const algodClient = getClient();
    const account = algosdk.mnemonicToSecretKey(mnemonic);

    // Get suggested params
    const suggestedParams = await algodClient.getTransactionParams().do();

    // Create note with content hash and metadata
    const noteData = {
      type: 'pivp-evidence-anchor',
      hash: contentHash,
      timestamp: new Date().toISOString(),
      ...metadata,
    };
    const note = new TextEncoder().encode(JSON.stringify(noteData));

    // Create a self-transaction (0 ALGO)
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: account.addr,
      receiver: account.addr,
      amount: 0,
      note,
      suggestedParams,
    });

    // Sign and send
    const signedTxn = txn.signTxn(account.sk);
    const response = await algodClient.sendRawTransaction(signedTxn).do();
    const txId = response.txid;

    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);

    return {
      txHash: txId,
      blockNumber: Number(confirmedTxn.confirmedRound || 0),
      timestamp: new Date(),
      chain: 'algorand',
      contentHash,
    };
  },

  /**
   * Verify an Algorand anchor
   */
  async verify(txHash: string, expectedHash: string): Promise<AnchorVerification> {
    const indexerClient = getIndexer();

    try {
      const response = await indexerClient.lookupTransactionByID(txHash).do();
      const txn = response.transaction;

      // Get timestamp from transaction
      const roundTime = (txn as unknown as Record<string, unknown>).roundTime as number || 0;

      // Decode note
      const noteBase64 = txn.note;
      if (!noteBase64) {
        return {
          verified: false,
          anchoredAt: new Date(roundTime * 1000),
          contentHash: '',
          chain: 'algorand',
        };
      }

      // Handle note decoding - could be Uint8Array or base64 string
      let noteString: string;
      if (typeof noteBase64 === 'string') {
        noteString = Buffer.from(noteBase64, 'base64').toString('utf-8');
      } else {
        noteString = new TextDecoder().decode(noteBase64);
      }
      const noteData = JSON.parse(noteString);

      return {
        verified: noteData.hash === expectedHash,
        anchoredAt: new Date(roundTime * 1000),
        contentHash: noteData.hash || '',
        chain: 'algorand',
      };
    } catch (error) {
      console.error('Algorand verification error:', error);
      throw new Error(`Failed to verify Algorand transaction: ${txHash}`);
    }
  },

  /**
   * Get transaction details
   */
  async getTransaction(txHash: string): Promise<{
    confirmed: boolean;
    blockNumber?: number;
    timestamp?: Date;
    data?: string;
  }> {
    const indexerClient = getIndexer();

    try {
      const response = await indexerClient.lookupTransactionByID(txHash).do();
      const txn = response.transaction;

      // Get block and time info - use type assertion for SDK compatibility
      const txnAny = txn as unknown as Record<string, unknown>;
      const confirmedRound = txnAny.confirmedRound as number | undefined;
      const roundTime = txnAny.roundTime as number || 0;

      let data: string | undefined;
      if (txn.note) {
        if (typeof txn.note === 'string') {
          data = Buffer.from(txn.note, 'base64').toString('utf-8');
        } else {
          data = new TextDecoder().decode(txn.note);
        }
      }

      return {
        confirmed: true,
        blockNumber: confirmedRound,
        timestamp: new Date(roundTime * 1000),
        data,
      };
    } catch {
      return { confirmed: false };
    }
  },

  /**
   * Check connection to Algorand network
   */
  async healthCheck(): Promise<boolean> {
    try {
      const algodClient = getClient();
      await algodClient.status().do();
      return true;
    } catch {
      return false;
    }
  },
};

export default algorandClient;
