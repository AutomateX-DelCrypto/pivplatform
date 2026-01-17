// ===========================================
// EVM Blockchain Client (Ethereum, Polygon, etc.)
// ===========================================

import {
  createPublicClient,
  createWalletClient,
  http,
  type Chain,
  type PublicClient,
  type WalletClient,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet, polygon, bsc, arbitrum, base } from 'viem/chains';
import type { ChainType } from '@/types/api';
import type { BlockchainAnchor, AnchorVerification } from '@/types/blockchain';

// Chain configurations
const chainConfigs: Record<string, Chain> = {
  ethereum: mainnet,
  polygon: polygon,
  bsc: bsc,
  arbitrum: arbitrum,
  base: base,
};

// Client caches
const publicClients = new Map<string, PublicClient>();

/**
 * Get RPC URL for a chain
 */
function getRpcUrl(chain: string): string {
  const envVar = `${chain.toUpperCase()}_RPC_URL`;
  const url = process.env[envVar];

  if (!url) {
    // Fallback to public RPCs (limited rate, not recommended for production)
    const publicRpcs: Record<string, string> = {
      ethereum: 'https://eth.llamarpc.com',
      polygon: 'https://polygon.llamarpc.com',
      bsc: 'https://bsc.llamarpc.com',
      arbitrum: 'https://arbitrum.llamarpc.com',
      base: 'https://base.llamarpc.com',
    };
    return publicRpcs[chain] || '';
  }

  return url;
}

/**
 * Get or create a public client for a chain
 */
function getPublicClient(chain: string): PublicClient {
  if (!publicClients.has(chain)) {
    const chainConfig = chainConfigs[chain];
    if (!chainConfig) {
      throw new Error(`Unsupported EVM chain: ${chain}`);
    }

    const client = createPublicClient({
      chain: chainConfig,
      transport: http(getRpcUrl(chain)),
    });

    publicClients.set(chain, client);
  }

  return publicClients.get(chain)!;
}

/**
 * Get a wallet client for signing transactions
 */
function getWalletClient(chain: string): WalletClient {
  const privateKey = process.env.EVM_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('EVM_PRIVATE_KEY not configured');
  }

  const chainConfig = chainConfigs[chain];
  if (!chainConfig) {
    throw new Error(`Unsupported EVM chain: ${chain}`);
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);

  return createWalletClient({
    account,
    chain: chainConfig,
    transport: http(getRpcUrl(chain)),
  });
}

/**
 * EVM client for blockchain operations
 */
export const evmClient = {
  /**
   * Anchor content hash to an EVM blockchain
   * Creates a self-transaction with the hash in the data field
   */
  async anchor(
    contentHash: string,
    chain: ChainType,
    metadata?: Record<string, string>
  ): Promise<BlockchainAnchor> {
    const walletClient = getWalletClient(chain);
    const publicClient = getPublicClient(chain);

    if (!walletClient.account) {
      throw new Error('Wallet account not available');
    }

    // Prepare data: JSON with hash and metadata, hex encoded
    const anchorData = {
      type: 'pivp-evidence-anchor',
      hash: contentHash,
      timestamp: new Date().toISOString(),
      ...metadata,
    };
    const dataString = JSON.stringify(anchorData);
    const dataHex = `0x${Buffer.from(dataString).toString('hex')}` as `0x${string}`;

    // Send self-transaction with data
    const chainConfig = chainConfigs[chain];
    const txHash = await walletClient.sendTransaction({
      account: walletClient.account,
      chain: chainConfig,
      to: walletClient.account.address,
      value: BigInt(0),
      data: dataHex,
    });

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    // Get block timestamp
    const block = await publicClient.getBlock({ blockNumber: receipt.blockNumber });

    return {
      txHash,
      blockNumber: Number(receipt.blockNumber),
      timestamp: new Date(Number(block.timestamp) * 1000),
      chain,
      contentHash,
    };
  },

  /**
   * Verify an EVM anchor
   */
  async verify(
    txHash: string,
    chain: ChainType,
    expectedHash: string
  ): Promise<AnchorVerification> {
    const publicClient = getPublicClient(chain);

    try {
      const tx = await publicClient.getTransaction({ hash: txHash as `0x${string}` });
      const block = await publicClient.getBlock({ blockNumber: tx.blockNumber! });

      // Decode data
      const dataHex = tx.input;
      const dataString = Buffer.from(dataHex.slice(2), 'hex').toString('utf-8');

      let anchoredHash = '';
      try {
        const anchorData = JSON.parse(dataString);
        anchoredHash = anchorData.hash || '';
      } catch {
        // Data might be raw hash
        anchoredHash = dataString;
      }

      return {
        verified: anchoredHash.toLowerCase() === expectedHash.toLowerCase(),
        anchoredAt: new Date(Number(block.timestamp) * 1000),
        contentHash: anchoredHash,
        chain,
      };
    } catch (error) {
      console.error('EVM verification error:', error);
      throw new Error(`Failed to verify ${chain} transaction: ${txHash}`);
    }
  },

  /**
   * Get transaction details
   */
  async getTransaction(
    txHash: string,
    chain: ChainType
  ): Promise<{
    confirmed: boolean;
    blockNumber?: number;
    timestamp?: Date;
    data?: string;
  }> {
    const publicClient = getPublicClient(chain);

    try {
      const tx = await publicClient.getTransaction({ hash: txHash as `0x${string}` });

      if (!tx.blockNumber) {
        return { confirmed: false };
      }

      const block = await publicClient.getBlock({ blockNumber: tx.blockNumber });

      // Decode data
      let data: string | undefined;
      if (tx.input && tx.input !== '0x') {
        try {
          data = Buffer.from(tx.input.slice(2), 'hex').toString('utf-8');
        } catch {
          data = tx.input;
        }
      }

      return {
        confirmed: true,
        blockNumber: Number(tx.blockNumber),
        timestamp: new Date(Number(block.timestamp) * 1000),
        data,
      };
    } catch {
      return { confirmed: false };
    }
  },

  /**
   * Check connection to an EVM network
   */
  async healthCheck(chain: string): Promise<boolean> {
    try {
      const publicClient = getPublicClient(chain);
      await publicClient.getBlockNumber();
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get current gas price for a chain
   */
  async getGasPrice(chain: string): Promise<bigint> {
    const publicClient = getPublicClient(chain);
    return publicClient.getGasPrice();
  },

  /**
   * Estimate gas for an anchor transaction
   */
  async estimateAnchorGas(chain: string, dataSize: number): Promise<bigint> {
    // Base gas + gas per byte of data
    const baseGas = BigInt(21000);
    const gasPerByte = BigInt(16);
    return baseGas + BigInt(dataSize) * gasPerByte;
  },
};

export default evmClient;
