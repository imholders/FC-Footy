import React, { useEffect, useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

// Define an interface for the Ethereum provider.
interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

// Define an interface for a wallet.
interface Wallet {
  walletClientType: string;
  address: string;
  getEthereumProvider: () => Promise<EthereumProvider>;
}

const GetBalance: React.FC = () => {
  // walletBalance will be a string (the formatted balance), and embeddedWallet is either a Wallet or null.
  const [walletBalance, setWalletBalance] = useState<string>("");
  const [embeddedWallet, setEmbeddedWallet] = useState<Wallet | null>(null);
  const { ready } = usePrivy();
  const { wallets } = useWallets();

  useEffect(() => {
    if (!ready) {
      return;
    } else {
      setup();
    }

    async function setup() {
      // Cast wallets as Wallet[] since we expect them to conform to our Wallet interface.
      const embedWallet = (wallets as Wallet[]).find(
        (wallet) => wallet.walletClientType === 'privy'
      );
      if (embedWallet) {
        const provider = await embedWallet.getEthereumProvider();
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${Number(8453).toString(16)}` }],
        });

        const ethProvider = await embedWallet.getEthereumProvider();
        const balanceResult = await ethProvider.request({
          method: 'eth_getBalance',
          params: [embedWallet.address, 'latest']
        });
        // We expect balanceResult to be a string representing a hex value.
        const balanceStr = balanceResult as string;
        const formattedBalance = (Number(balanceStr) / 10 ** 18).toFixed(5);
        setWalletBalance(formattedBalance);
        setEmbeddedWallet(embedWallet);
        console.log("Balance: ", embeddedWallet);
      }
    }
  }, [ready, wallets]);

  return (
    <p className="text-xl">
      Balance: {walletBalance} Ξ
    </p>
  );
};

export default GetBalance;
