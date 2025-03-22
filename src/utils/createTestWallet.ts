import { ethers } from 'ethers';

// Add TypeScript declarations at the top level
declare global {
  interface Window {
    createTestWallet: () => { address: string; privateKey: string };
    addBaseSepoliaToMetaMask: () => Promise<boolean>;
  }
}

/**
 * Creates a new Ethereum wallet for testing purposes
 * This function generates a new random wallet and displays the private key and address
 * IMPORTANT: Never use this wallet for real funds or in production!
 */
export function createTestWallet() {
  try {
    // Create a new random wallet
    const wallet = ethers.Wallet.createRandom();
    
    // Get the wallet details
    const privateKey = wallet.privateKey;
    const address = wallet.address;
    
    console.log('=== TEST WALLET CREATED ===');
    console.log('Address:', address);
    console.log('Private Key:', privateKey);
    console.log('');
    console.log('IMPORTANT: Save these details! They will not be shown again.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Add this wallet to MetaMask:');
    console.log('   - Open MetaMask');
    console.log('   - Click on the account icon in the top-right');
    console.log('   - Select "Import Account"');
    console.log('   - Paste the private key and click "Import"');
    console.log('');
    console.log('2. Get test ETH from a Base Sepolia faucet:');
    console.log('   - Go to https://www.coinbase.com/faucets/base-sepolia-faucet');
    console.log('   - Connect your wallet');
    console.log('   - Request test ETH');
    console.log('');
    console.log('3. Switch to the Base Sepolia network in MetaMask:');
    console.log('   - Network Name: Base Sepolia');
    console.log('   - RPC URL: https://sepolia.base.org');
    console.log('   - Chain ID: 84532');
    console.log('   - Currency Symbol: ETH');
    console.log('');
    
    return { address, privateKey };
  } catch (error) {
    console.error('Error creating test wallet:', error);
    throw error;
  }
}

// Export a function to add the Base Sepolia network to MetaMask
export async function addBaseSepoliaToMetaMask() {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }
    
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x14a34', // 84532 in hexadecimal
        chainName: 'Base Sepolia',
        nativeCurrency: {
          name: 'Sepolia Ether',
          symbol: 'ETH',
          decimals: 18
        },
        rpcUrls: ['https://sepolia.base.org'],
        blockExplorerUrls: ['https://sepolia.basescan.org']
      }]
    });
    
    console.log('Base Sepolia network added to MetaMask');
    return true;
  } catch (error) {
    console.error('Error adding Base Sepolia to MetaMask:', error);
    return false;
  }
}

// If this file is executed directly, create a test wallet
if (typeof window !== 'undefined') {
  // Add global functions that can be called from the browser console
  window.createTestWallet = createTestWallet;
  window.addBaseSepoliaToMetaMask = addBaseSepoliaToMetaMask;
  
  console.log('Test wallet utilities loaded!');
  console.log('Run createTestWallet() in the console to generate a new wallet');
  console.log('Run addBaseSepoliaToMetaMask() to add the Base Sepolia network to MetaMask');
} 