import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { QueryClient } from '@tanstack/react-query';
import {
  arbitrum,
  base,
  mainnet,
  optimism,
  polygon,
  sepolia,
  hardhat
} from 'wagmi/chains';

// Rootstock Testnet
const rootstockTestnet = {
  id: 31,
  name: 'Rootstock Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Test RBTC',
    symbol: 'tRBTC',
  },
  rpcUrls: {
    default: { http: ['https://public-node.testnet.rsk.co'] },
    public: { http: ['https://public-node.testnet.rsk.co'] },
  },
  blockExplorers: {
    default: { name: 'RSK Explorer', url: 'https://explorer.testnet.rsk.co' },
  },
  testnet: true,
} as const;

// Klaytn Baobab
const klaytnBaobab = {
  id: 1001,
  name: 'Klaytn Baobab',
  nativeCurrency: {
    decimals: 18,
    name: 'KLAY',
    symbol: 'KLAY',
  },
  rpcUrls: {
    default: { http: ['https://public-en-baobab.klaytn.net'] },
    public: { http: ['https://public-en-baobab.klaytn.net'] },
  },
  blockExplorers: {
    default: { name: 'Klaytnscope', url: 'https://baobab.klaytnscope.com' },
  },
  testnet: true,
} as const;

// Cronos Testnet
const cronosTestnet = {
  id: 338,
  name: 'Cronos Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'TCRO',
    symbol: 'TCRO',
  },
  rpcUrls: {
    default: { http: ['https://evm-t3.cronos.org'] },
    public: { http: ['https://evm-t3.cronos.org'] },
  },
  blockExplorers: {
    default: { name: 'Cronos Explorer', url: 'https://testnet.cronoscan.com' },
  },
  testnet: true,
} as const;

// Aurora Testnet
const auroraTestnet = {
  id: 1313161555,
  name: 'Aurora Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://testnet.aurora.dev'] },
    public: { http: ['https://testnet.aurora.dev'] },
  },
  blockExplorers: {
    default: { name: 'Aurora Explorer', url: 'https://testnet.aurorascan.dev' },
  },
  testnet: true,
} as const;

// Moonbase Alpha
const moonbaseAlpha = {
  id: 1287,
  name: 'Moonbase Alpha',
  nativeCurrency: {
    decimals: 18,
    name: 'DEV',
    symbol: 'DEV',
  },
  rpcUrls: {
    default: { http: ['https://rpc.api.moonbase.moonbeam.network'] },
    public: { http: ['https://rpc.api.moonbase.moonbeam.network'] },
  },
  blockExplorers: {
    default: { name: 'Moonscan', url: 'https://moonbase.moonscan.io' },
  },
  testnet: true,
} as const;

// Gnosis Chiado
const gnosisChiado = {
  id: 10200,
  name: 'Gnosis Chiado',
  nativeCurrency: {
    decimals: 18,
    name: 'xDAI',
    symbol: 'xDAI',
  },
  rpcUrls: {
    default: { http: ['https://rpc.chiadochain.net'] },
    public: { http: ['https://rpc.chiadochain.net'] },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: 'https://blockscout.chiadochain.net' },
  },
  testnet: true,
} as const;

// Celo Alfajores
const celoAlfajores = {
  id: 44787,
  name: 'Celo Alfajores',
  nativeCurrency: {
    decimals: 18,
    name: 'CELO',
    symbol: 'CELO',
  },
  rpcUrls: {
    default: { http: ['https://alfajores-forno.celo-testnet.org'] },
    public: { http: ['https://alfajores-forno.celo-testnet.org'] },
  },
  blockExplorers: {
    default: { name: 'Celo Explorer', url: 'https://alfajores.celoscan.io' },
  },
  testnet: true,
} as const;

// Fantom Testnet
const fantomTestnet = {
  id: 4002,
  name: 'Fantom Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'FTM',
    symbol: 'FTM',
  },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.fantom.network'] },
    public: { http: ['https://rpc.testnet.fantom.network'] },
  },
  blockExplorers: {
    default: { name: 'FTMScan', url: 'https://testnet.ftmscan.com' },
  },
  testnet: true,
} as const;

// Polygon zkEVM Cardona
const polygonZkEvmCardona = {
  id: 2442,
  name: 'Polygon zkEVM Cardona',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://rpc.cardona.zkevm-rpc.com'] },
    public: { http: ['https://rpc.cardona.zkevm-rpc.com'] },
  },
  blockExplorers: {
    default: { name: 'Polygon Scan', url: 'https://cardona-zkevm.polygonscan.com' },
  },
  testnet: true,
} as const;

// zkSync Sepolia Testnet
const zkSyncSepoliaTestnet = {
  id: 300,
  name: 'zkSync Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://sepolia.era.zksync.dev'] },
    public: { http: ['https://sepolia.era.zksync.dev'] },
  },
  blockExplorers: {
    default: { name: 'zkSync Explorer', url: 'https://sepolia.explorer.zksync.io' },
  },
  testnet: true,
} as const;

// CoinEx Smart Chain Testnet
const coinexTestnet = {
  id: 53,
  name: 'CoinEx Smart Chain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'CET',
    symbol: 'tCET',
  },
  rpcUrls: {
    default: { http: ['https://53.rpc.thirdweb.com '] },
    public: { http: ['https://testnet-rpc.coinex.net'] },
  },
  blockExplorers: {
    default: { name: 'CoinEx Explorer', url: 'https://testnet.coinex.net' },
  },
  testnet: true,
} as const;

// Custom QueryClient với refetchOnWindowFocus = false
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Tắt refetch khi focus window
      refetchOnMount: true, // Vẫn refetch khi mount
      refetchOnReconnect: false, // Tắt refetch khi reconnect
    },
  },
});

export const config = getDefaultConfig({
  appName: 'VoteChain - Blockchain Voting',
  projectId: 'YOUR_PROJECT_ID',
  chains: [
    rootstockTestnet,
    coinexTestnet,
    sepolia,
    klaytnBaobab,
    cronosTestnet,
    auroraTestnet,
    moonbaseAlpha,
    gnosisChiado,
    celoAlfajores,
    fantomTestnet,
    polygonZkEvmCardona,
    zkSyncSepoliaTestnet,
    hardhat,
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
  ],
  ssr: true,
});

// Helper function to get chain by chainId
export const getChain = (chainId: number) => {
  const chains = [
    rootstockTestnet,
    coinexTestnet,
    sepolia,
    klaytnBaobab,
    cronosTestnet,
    auroraTestnet,
    moonbaseAlpha,
    gnosisChiado,
    celoAlfajores,
    fantomTestnet,
    polygonZkEvmCardona,
    zkSyncSepoliaTestnet,
    hardhat,
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
  ];
  
  return chains.find(chain => chain.id === chainId);
};
