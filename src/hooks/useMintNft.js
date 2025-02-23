import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { ethers } from 'ethers';

// Replace with your actual contract address and ABI
const CONTRACT_ADDRESS = '0xdCc32F6Efce28B595f255363ae6EEAA6Cd4B9499';
const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "cid",
        "type": "string"
      }
    ],
    "name": "mintAsWhitelisted",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  }
];

export const useMintNFT = (metadataCID) => {
  const { config } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'mintAsWhitelisted',
    args: [`${metadataCID}`],
    overrides: {
      value: ethers.parseEther('0.0007'), // Match with your contract minting price
    },
  });

  const { write, data, isLoading, isSuccess, error } = useContractWrite(config);

  return {
    mint: write,
    data,
    isLoading,
    isSuccess,
    error,
  };
};
