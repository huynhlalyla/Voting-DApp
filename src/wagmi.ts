import { getDefaultConfig } from '@rainbow-me/rainbowkit';
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

export const config = getDefaultConfig({
  appName: 'VoteChain - Blockchain Voting',
  projectId: 'YOUR_PROJECT_ID',
  chains: [
    rootstockTestnet, // Mạng chính của bạn
    hardhat,
    sepolia,
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
  ],
  ssr: true,
});
