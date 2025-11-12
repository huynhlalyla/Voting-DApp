'use client';

import { useChainId } from 'wagmi';
import { getContractAddress, CONTRACT_ADDRESSES } from '@/contracts/AdvancedVoting';

const EXPLORER_URLS: Record<number, string> = {
  31: 'https://explorer.testnet.rootstock.io', // Rootstock Testnet
  53: 'https://testnet.coinex.net', // CoinEx Testnet
  11155111: 'https://sepolia.etherscan.io', // Sepolia
  1001: 'https://baobab.klaytnscope.com', // Klaytn Baobab
  // Add more explorers...
};

export default function Footer() {
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId);
  const explorerUrl = chainId ? EXPLORER_URLS[chainId] : EXPLORER_URLS[31];
  const isContractDeployed = chainId ? CONTRACT_ADDRESSES[chainId] !== undefined : false;

  const contractLink = isContractDeployed 
    ? `${explorerUrl}/address/${contractAddress}`
    : '#';

  return (
    <footer className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 mt-auto border-t border-gray-800 dark:border-gray-200 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Cột 1: Thông tin dự án */}
          <div>
            <h3 className="text-2xl font-bold mb-3 text-white dark:text-gray-900">
              Voting DApp
            </h3>
            <p className="text-gray-400 dark:text-gray-600 mb-3 text-sm">
              Bỏ phiếu phi tập trung, minh bạch & bảo mật.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-gray-800 dark:bg-gray-200 rounded text-xs text-gray-300 dark:text-gray-700">
                ⚡ Web3
              </span>
              <span className="px-2 py-1 bg-gray-800 dark:bg-gray-200 rounded text-xs text-gray-300 dark:text-gray-700">
                🔐 Secure
              </span>
              <span className="px-2 py-1 bg-gray-800 dark:bg-gray-200 rounded text-xs text-gray-300 dark:text-gray-700">
                🌐 Decentralized
              </span>
            </div>
          </div>

          {/* Cột 2: Smart Contract & Explorer */}
          <div>
            <h3 className="text-lg font-bold mb-3 text-gray-100 dark:text-gray-900">
              📜 Smart Contract
            </h3>
            <div className="space-y-2">
              <div>
                <p className="text-gray-400 text-sm mb-1">Contract Address:</p>
                <a
                  href={contractLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-sm font-mono break-all transition-all ${
                    isContractDeployed
                      ? 'text-blue-300 hover:text-blue-200 hover:underline'
                      : 'text-gray-500 cursor-not-allowed'
                  }`}
                  onClick={(e) => !isContractDeployed && e.preventDefault()}
                >
                  {contractAddress}
                </a>
              </div>
              
              {isContractDeployed ? (
                <a
                  href={contractLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 dark:bg-blue-600 rounded-lg hover:bg-gray-700 dark:hover:bg-blue-700 transition-all text-sm font-medium text-white"
                >
                  <span>🔍</span>
                  <span>Xem trên Explorer</span>
                  <span>↗</span>
                </a>
              ) : (
                <div className="text-yellow-400 text-sm flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Contract chưa deploy trên mạng này</span>
                </div>
              )}

              <div className="text-gray-400 text-xs pt-2">
                <p>✅ Verified & Open Source</p>
                <p>✅ Immutable & Transparent</p>
              </div>
            </div>
          </div>

          {/* Cột 3: Liên hệ & Links */}
          <div>
            <h3 className="text-lg font-bold mb-3 text-gray-100 dark:text-gray-900">
              🔗 Liên Kết
            </h3>
            <div className="space-y-2">
              
              {/* GitHub Repository */}
              <a
                href="https://github.com/huynhlalyla/Voting-DApp"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-300 dark:text-gray-700 hover:text-white dark:hover:text-gray-900 transition-colors group"
              >
                <div className="w-10 h-10 bg-gray-800 dark:bg-gray-200 rounded-lg flex items-center justify-center group-hover:bg-gray-700 dark:group-hover:bg-gray-300 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">GitHub Repository</p>
                  <p className="text-xs text-gray-400">Mã nguồn mở</p>
                </div>
              </a>

              {/* Smart Contract Source */}
              <a
                href="https://github.com/huynhlalyla/BE-Voting"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-300 dark:text-gray-700 hover:text-white dark:hover:text-gray-900 transition-colors group"
              >
                <div className="w-10 h-10 bg-indigo-800 dark:bg-indigo-200 rounded-lg flex items-center justify-center group-hover:bg-indigo-700 dark:group-hover:bg-indigo-300 transition-colors">
                  <span className="text-xl">📄</span>
                </div>
                <div>
                  <p className="font-medium">Smart Contract Code</p>
                  <p className="text-xs text-gray-400">Solidity source code</p>
                </div>
              </a>

              {/* Documentation */}
              <a
                href="https://github.com/huynhlalyla/Voting-DApp#readme"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-300 dark:text-gray-700 hover:text-white dark:hover:text-gray-900 transition-colors group"
              >
                <div className="w-10 h-10 bg-purple-800 dark:bg-purple-200 rounded-lg flex items-center justify-center group-hover:bg-purple-700 dark:group-hover:bg-purple-300 transition-colors">
                  <span className="text-xl">📚</span>
                </div>
                <div>
                  <p className="font-medium">Documentation</p>
                  <p className="text-xs text-gray-400">Hướng dẫn sử dụng</p>
                </div>
              </a>

            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 dark:border-gray-300 mt-6 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Copyright */}
            <div className="text-gray-400 dark:text-gray-600 text-sm text-center md:text-left">
              <p>© 2025 Voting DApp. Built with ❤️ on Blockchain.</p>
              <p className="text-xs mt-1">Powered by Rootstock, Wagmi, Next.js & Hardhat</p>
            </div>

            {/* Tech Stack Icons */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-700">
                <span className="px-2 py-1 bg-indigo-900/50 dark:bg-indigo-100 rounded">⚡ Next.js</span>
                <span className="px-2 py-1 bg-purple-900/50 dark:bg-purple-100 rounded">🔷 Solidity</span>
                <span className="px-2 py-1 bg-pink-900/50 dark:bg-pink-100 rounded">🌐 Wagmi</span>
              </div>
            </div>
          </div>

          {/* Network Status */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-600">
              {isContractDeployed ? (
                <span className="text-green-400 dark:text-green-600">✅ Contract đang hoạt động trên Chain ID: {chainId}</span>
              ) : (
                <span className="text-yellow-400 dark:text-yellow-600">⚠️ Vui lòng chuyển sang mạng đã deploy contract</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
