"use client";

import React, { useState } from 'react';
import { createTestWallet, addBaseSepoliaToMetaMask } from '../utils/createTestWallet';

export default function TestWalletPage() {
  const [walletInfo, setWalletInfo] = useState<{ address: string; privateKey: string } | null>(null);
  const [copied, setCopied] = useState<'address' | 'privateKey' | null>(null);
  const [networkAdded, setNetworkAdded] = useState<boolean>(false);

  const handleCreateWallet = () => {
    try {
      const wallet = createTestWallet();
      setWalletInfo(wallet);
    } catch (error) {
      console.error('Error creating wallet:', error);
      alert('Failed to create wallet. See console for details.');
    }
  };

  const handleAddNetwork = async () => {
    try {
      const success = await addBaseSepoliaToMetaMask();
      setNetworkAdded(success);
    } catch (error) {
      console.error('Error adding network:', error);
      alert('Failed to add network. See console for details.');
    }
  };

  const copyToClipboard = (text: string, type: 'address' | 'privateKey') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-darkPurple p-4">
      <div className="max-w-2xl mx-auto bg-purplePanel rounded shadow-md p-6">
        <h1 className="text-2xl text-notWhite font-bold mb-4">Test Wallet Generator</h1>
        
        <div className="mb-6">
          <p className="text-lightPurple mb-4">
            This tool helps you create a test wallet and get ETH from a faucet to test the Score Square game.
            <strong className="text-red-500 block mt-2">
              IMPORTANT: This is for testing only! Never use this wallet for real funds.
            </strong>
          </p>
          
          <button
            onClick={handleCreateWallet}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 mr-3"
          >
            Generate Test Wallet
          </button>
          
          <button
            onClick={handleAddNetwork}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Add Base Sepolia to MetaMask
          </button>
          
          {networkAdded && (
            <p className="text-green-400 mt-2">
              ✓ Base Sepolia network added successfully!
            </p>
          )}
        </div>
        
        {walletInfo && (
          <div className="bg-darkPurple p-4 rounded">
            <h2 className="text-xl text-notWhite font-semibold mb-3">Your Test Wallet</h2>
            
            <div className="mb-3">
              <label className="block text-xs text-lightPurple mb-1">Wallet Address</label>
              <div className="flex items-center">
                <input
                  type="text"
                  readOnly
                  value={walletInfo.address}
                  className="flex-1 p-2 bg-gray-800 border border-limeGreenOpacity rounded text-lightPurple"
                />
                <button
                  onClick={() => copyToClipboard(walletInfo.address, 'address')}
                  className="ml-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  {copied === 'address' ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-xs text-lightPurple mb-1">Private Key</label>
              <div className="flex items-center">
                <input
                  type="text"
                  readOnly
                  value={walletInfo.privateKey}
                  className="flex-1 p-2 bg-gray-800 border border-limeGreenOpacity rounded text-lightPurple"
                />
                <button
                  onClick={() => copyToClipboard(walletInfo.privateKey, 'privateKey')}
                  className="ml-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  {copied === 'privateKey' ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-red-400 text-xs mt-1">
                Never share your private key with anyone!
              </p>
            </div>
            
            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-lg text-notWhite font-semibold mb-2">Next Steps</h3>
              <ol className="list-decimal pl-5 text-lightPurple">
                <li className="mb-2">
                  <span className="font-semibold">Import to MetaMask:</span> Open MetaMask, click the account icon, select &quot;Import Account&quot;, and paste your private key.
                </li>
                <li className="mb-2">
                  <span className="font-semibold">Get test ETH:</span> Visit the{' '}
                  <a 
                    href="https://www.coinbase.com/faucets/base-sepolia-faucet" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 underline"
                  >
                    Base Sepolia Faucet
                  </a>, connect your wallet, and request test ETH.
                </li>
                <li className="mb-2">
                  <span className="font-semibold">Test the game:</span> Go to the Score Square game, connect your new wallet, and buy tickets to test the randomization.
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 