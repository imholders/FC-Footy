/**
 * Formats an Ethereum address for display by truncating the middle part
 * @param address The Ethereum address to format
 * @param startChars Number of characters to show at the start (default: 6)
 * @param endChars Number of characters to show at the end (default: 4)
 * @returns The formatted address
 */
export function formatAddress(address: string, startChars = 6, endChars = 4): string {
  if (!address) return '';
  
  // Handle case where address might not be a valid Ethereum address
  if (address.length < startChars + endChars) {
    return address;
  }
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Formats an amount of ETH for display
 * @param wei The amount in wei (as a bigint or string)
 * @param decimals Number of decimal places to show (default: 4)
 * @returns The formatted ETH amount
 */
export function formatEth(wei: bigint | string, decimals = 4): string {
  if (!wei) return '0 ETH';
  
  const weiValue = typeof wei === 'string' ? BigInt(wei) : wei;
  const ethValue = Number(weiValue) / 1e18;
  
  return `${ethValue.toFixed(decimals)} ETH`;
} 