import { ethers } from "ethers";

// Replace with your deployed contract address and ABI
const CONTRACT_ADDRESS = "0xYourDeployedContractAddressHere";
const CONTRACT_ABI = [
  // Replace with your actual ABI from Remix or Basescan
  "function mintAsWhitelisted(string memory cid) public payable returns (uint256)",
  "function addToWhitelist(address user) public",
  "function isWhitelisted(address user) public view returns (bool)"
];

// ✅ Connect to the contract
export const getContract = async () => {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  } else {
    throw new Error("MetaMask not detected");
  }
};
