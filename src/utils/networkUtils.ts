/**
 * Network utility functions for blockchain interactions
 */

interface NetworkCheckResult {
  isBase: boolean;
  error: string | null;
}

/**
 * Checks if the current network is Base or Base Sepolia
 * @param chainId The current chain ID from wagmi
 * @returns Object with isBase flag and error message if not on Base
 */
export const checkBaseNetwork = (chainId: number): NetworkCheckResult => {
  // Base Mainnet: 8453
  // Base Sepolia: 84532
  if (chainId === 8453) {
    return {
      isBase: true,
      error: null
    };
  } else if (chainId === 84532) {
    return {
      isBase: true,
      error: null
    };
  } else {
    return {
      isBase: false,
      error: "Please connect to Base Mainnet or Base Sepolia"
    };
  }
};

/**
 * Gets the network name from chain ID
 * @param chainId The current chain ID from wagmi
 * @returns The network name as a string
 */
export const getNetworkName = (chainId: number): string => {
  switch (chainId) {
    case 1:
      return "Ethereum Mainnet";
    case 5:
      return "Goerli Testnet";
    case 8453:
      return "Base Mainnet";
    case 84532:
      return "Base Sepolia";
    default:
      return "Unknown Network";
  }
};

/**
 * Checks if the network is supported for the application
 * @param chainId The current chain ID from wagmi
 * @returns Boolean indicating if the network is supported
 */
export const isSupportedNetwork = (chainId: number): boolean => {
  return chainId === 8453 || chainId === 84532;
};

// Define more specific types for blockchain errors
interface BlockchainErrorData {
  message?: string;
}

export interface BlockchainError {
  code?: number;
  message?: string;
  data?: BlockchainErrorData;
  reason?: string;
}

/**
 * Formats blockchain errors for better user experience
 * @param error The error object from a contract call
 * @returns A user-friendly error message
 */
export function formatBlockchainError(error: Error | BlockchainError): string {
  console.error("Blockchain error:", error);
  
  // Check for common error patterns
  if (!error) {
    return "An unknown error occurred";
  }
  
  // Get message (works for both Error and BlockchainError)
  const errorMessage = error.message || "";
  
  // Check for provider errors
  if (errorMessage.includes("network")) {
    return "Network error. Please check your connection and try again.";
  }
  
  // Check for user rejected transaction
  if (
    ('code' in error && error.code === 4001) || 
    errorMessage.includes("rejected")
  ) {
    return "Transaction was rejected by the user.";
  }
  
  // Check for gas errors
  if (errorMessage.includes("gas")) {
    return "Transaction failed due to gas estimation. The contract may have reverted.";
  }
  
  // Check for contract errors
  if (errorMessage.includes("execution reverted")) {
    let revertReason = "unknown reason";
    
    if ('data' in error && error.data?.message) {
      revertReason = error.data.message;
    } else if ('reason' in error && error.reason) {
      revertReason = error.reason;
    }
    
    return `Contract execution failed: ${revertReason}`;
  }
  
  // Check for RPC errors
  if (errorMessage.includes("JSON-RPC error")) {
    return "RPC connection error. The blockchain node may be experiencing issues.";
  }
  
  // Default error message
  return errorMessage || "An error occurred while interacting with the blockchain";
}

/**
 * Checks if a wallet is connected
 * @param address The wallet address from useAccount() hook
 * @returns An object with isConnected (boolean) and error message (if any)
 */
export function checkWalletConnection(address: string | undefined) {
  if (!address) {
    return {
      isConnected: false,
      error: "No Ethereum provider found. Please install MetaMask or connect a wallet."
    };
  }
  
  return {
    isConnected: true,
    error: null
  };
} 