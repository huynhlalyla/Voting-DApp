import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  sepolia,
  rootstockTestnet,
  arbitrum,
  base,
  mainnet,
  optimism,
  polygon,
  hardhat
} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'RainbowKit App',
  projectId: 'YOUR_PROJECT_ID',
  chains: [
    sepolia,
    rootstockTestnet,
    mainnet,
    hardhat,
    polygon,
    optimism,
    arbitrum,
    base,
    ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true' ? [sepolia] : []),
  ],
  ssr: true,
});
