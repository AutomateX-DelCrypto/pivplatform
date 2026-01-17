// ===========================================
// Blockchain Types
// ===========================================

import type { ChainType } from './api';

export interface BlockchainAnchor {
  txHash: string;
  blockNumber: number;
  timestamp: Date;
  chain: ChainType;
  contentHash: string;
}

export interface AnchorInput {
  contentHash: string;
  chain: ChainType;
  metadata?: Record<string, string>;
}

export interface AnchorVerification {
  verified: boolean;
  anchoredAt: Date;
  contentHash: string;
  chain: ChainType;
}

// Algorand-specific types
export interface AlgorandTxInfo {
  txId: string;
  confirmedRound: number;
  timestamp: number;
  note?: string;
}

// EVM-specific types
export interface EvmTxInfo {
  hash: string;
  blockNumber: bigint;
  timestamp: number;
  data: string;
}

// Chain configuration
export interface ChainConfig {
  name: string;
  chainId?: number; // EVM only
  rpcUrl: string;
  explorerUrl: string;
  isTestnet: boolean;
}

export const SUPPORTED_CHAINS: Record<ChainType, ChainConfig> = {
  algorand: {
    name: 'Algorand',
    rpcUrl: 'https://mainnet-api.algonode.cloud',
    explorerUrl: 'https://algoexplorer.io',
    isTestnet: false,
  },
  ethereum: {
    name: 'Ethereum',
    chainId: 1,
    rpcUrl: 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    isTestnet: false,
  },
  polygon: {
    name: 'Polygon',
    chainId: 137,
    rpcUrl: 'https://polygon.llamarpc.com',
    explorerUrl: 'https://polygonscan.com',
    isTestnet: false,
  },
  bsc: {
    name: 'BNB Chain',
    chainId: 56,
    rpcUrl: 'https://bsc.llamarpc.com',
    explorerUrl: 'https://bscscan.com',
    isTestnet: false,
  },
  arbitrum: {
    name: 'Arbitrum',
    chainId: 42161,
    rpcUrl: 'https://arbitrum.llamarpc.com',
    explorerUrl: 'https://arbiscan.io',
    isTestnet: false,
  },
  base: {
    name: 'Base',
    chainId: 8453,
    rpcUrl: 'https://base.llamarpc.com',
    explorerUrl: 'https://basescan.org',
    isTestnet: false,
  },
};
