// ===========================================
// Blockchain Integration - Main Interface
// ===========================================

import type { ChainType } from '@/types/api';
import type { BlockchainAnchor, AnchorInput, AnchorVerification } from '@/types/blockchain';
import { algorandClient } from './algorand/client';
import { evmClient } from './evm/client';

/**
 * Anchor content hash to a blockchain
 * Creates an immutable timestamp proof
 */
export async function anchorToBlockchain(input: AnchorInput): Promise<BlockchainAnchor> {
  const { contentHash, chain, metadata } = input;

  switch (chain) {
    case 'algorand':
      return algorandClient.anchor(contentHash, metadata);

    case 'ethereum':
    case 'polygon':
    case 'bsc':
    case 'arbitrum':
    case 'base':
      return evmClient.anchor(contentHash, chain, metadata);

    default:
      throw new Error(`Unsupported blockchain: ${chain}`);
  }
}

/**
 * Verify an existing blockchain anchor
 */
export async function verifyAnchor(
  txHash: string,
  chain: ChainType,
  expectedHash: string
): Promise<AnchorVerification> {
  switch (chain) {
    case 'algorand':
      return algorandClient.verify(txHash, expectedHash);

    case 'ethereum':
    case 'polygon':
    case 'bsc':
    case 'arbitrum':
    case 'base':
      return evmClient.verify(txHash, chain, expectedHash);

    default:
      throw new Error(`Unsupported blockchain: ${chain}`);
  }
}

/**
 * Get transaction details from blockchain
 */
export async function getTransactionDetails(
  txHash: string,
  chain: ChainType
): Promise<{
  confirmed: boolean;
  blockNumber?: number;
  timestamp?: Date;
  data?: string;
}> {
  switch (chain) {
    case 'algorand':
      return algorandClient.getTransaction(txHash);

    case 'ethereum':
    case 'polygon':
    case 'bsc':
    case 'arbitrum':
    case 'base':
      return evmClient.getTransaction(txHash, chain);

    default:
      throw new Error(`Unsupported blockchain: ${chain}`);
  }
}

/**
 * Check if a chain is configured and available
 */
export function isChainAvailable(chain: ChainType): boolean {
  switch (chain) {
    case 'algorand':
      return !!process.env.ALGORAND_API_URL;

    case 'ethereum':
      return !!process.env.ETHEREUM_RPC_URL;

    case 'polygon':
      return !!process.env.POLYGON_RPC_URL;

    case 'bsc':
      return !!process.env.BSC_RPC_URL;

    case 'arbitrum':
      return !!process.env.ARBITRUM_RPC_URL;

    case 'base':
      return !!process.env.BASE_RPC_URL;

    default:
      return false;
  }
}

/**
 * Get available chains
 */
export function getAvailableChains(): ChainType[] {
  const chains: ChainType[] = ['algorand', 'ethereum', 'polygon', 'bsc', 'arbitrum', 'base'];
  return chains.filter(isChainAvailable);
}

/**
 * Get block explorer URL for a transaction
 */
export function getExplorerUrl(txHash: string, chain: ChainType): string {
  const explorers: Record<ChainType, string> = {
    algorand: `https://algoexplorer.io/tx/${txHash}`,
    ethereum: `https://etherscan.io/tx/${txHash}`,
    polygon: `https://polygonscan.com/tx/${txHash}`,
    bsc: `https://bscscan.com/tx/${txHash}`,
    arbitrum: `https://arbiscan.io/tx/${txHash}`,
    base: `https://basescan.org/tx/${txHash}`,
  };

  return explorers[chain] || '#';
}

// Re-export clients for direct access if needed
export { algorandClient } from './algorand/client';
export { evmClient } from './evm/client';
