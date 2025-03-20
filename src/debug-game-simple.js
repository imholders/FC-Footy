/**
 * DEBUG FILE - COMMENTED OUT TO PREVENT LINTER/BUILD ISSUES
 * This file contains debugging utilities for the ScoreSquare contract.
 * To use this file, uncomment it and run with Node.js.
 */

/*
// Import fetch for making HTTP requests
const fetch = require('node-fetch');

// Constants
const RPC_URL = "https://base.llamarpc.com";
const CONTRACT_ADDRESS = "0x6147b9AB63496aCE7f3D270F8222e09038FD0870";
const EVENT_ID = "usa_1_VAN_LA_726827";

// Function selectors
const FUNCTION_SELECTORS = {
  getGameIdByEventId: "0x2c1c9d6e", // keccak256("getGameIdByEventId(string)") first 4 bytes
  getGameStatus: "0x1c9d7eb3", // keccak256("getGameStatus(uint256)") first 4 bytes
  getTickets: "0x8d1e5c1f" // keccak256("getTickets(uint256)") first 4 bytes
};

// Helper function to make HTTP requests to the RPC endpoint
async function makeHttpRequest(method, params) {
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(`RPC Error: ${data.error.message}`);
  }
  return data.result;
}

// Helper functions to parse different data types from hex strings
function parseAddress(hexString) {
  // Addresses are 20 bytes (40 hex chars) with 0x prefix
  return hexString.slice(0, 42).toLowerCase();
}

function parseNumber(hexString) {
  return parseInt(hexString, 16);
}

function parseBoolean(hexString) {
  return hexString === '0x01';
}

function parseString(hexString) {
  // Remove 0x prefix
  const hex = hexString.slice(2);
  
  // Convert hex to bytes
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  
  return new TextDecoder().decode(new Uint8Array(bytes));
}

async function main() {
  try {
    console.log("Debugging ScoreSquare contract on Base network");
    console.log("Contract address:", CONTRACT_ADDRESS);
    console.log("Event ID:", EVENT_ID);
    
    // Step 1: Get the game ID from the event ID
    console.log("\nStep 1: Getting game ID from event ID...");
    
    // Encode the event ID parameter
    const eventIdBytes = new TextEncoder().encode(EVENT_ID);
    const eventIdHex = Array.from(eventIdBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Calculate the offset for the dynamic string parameter (32 bytes)
    const offsetHex = '0000000000000000000000000000000000000000000000000000000000000020';
    
    // Calculate the length of the string (in bytes)
    const lengthHex = eventIdBytes.length.toString(16).padStart(64, '0');
    
    // Pad the string data to a multiple of 32 bytes
    const paddedEventIdHex = eventIdHex.padEnd(Math.ceil(eventIdHex.length / 64) * 64, '0');
    
    // Construct the full calldata
    const getGameIdCalldata = FUNCTION_SELECTORS.getGameIdByEventId + offsetHex + lengthHex + paddedEventIdHex;
    
    // Make the eth_call
    const gameIdHex = await makeHttpRequest('eth_call', [{
      to: CONTRACT_ADDRESS,
      data: '0x' + getGameIdCalldata
    }, 'latest']);
    
    // Parse the game ID
    const gameId = parseNumber(gameIdHex);
    console.log("Game ID:", gameId);
    
    if (gameId === 0) {
      console.log("No game found for event ID:", EVENT_ID);
      return;
    }
    
    // Step 2: Get the game status
    console.log("\nStep 2: Getting game status...");
    
    // Encode the game ID parameter
    const gameIdHexParam = gameId.toString(16).padStart(64, '0');
    
    // Construct the calldata
    const getGameStatusCalldata = FUNCTION_SELECTORS.getGameStatus + gameIdHexParam;
    
    // Make the eth_call
    const gameStatusHex = await makeHttpRequest('eth_call', [{
      to: CONTRACT_ADDRESS,
      data: '0x' + getGameStatusCalldata
    }, 'latest']);
    
    // Parse the game status
    // The response is a complex tuple, so we need to parse it carefully
    // First, remove the 0x prefix
    const statusHex = gameStatusHex.slice(2);
    
    // Parse each field
    const active = parseBoolean('0x' + statusHex.slice(0, 64));
    const referee = parseAddress('0x' + statusHex.slice(64, 128));
    const squarePrice = BigInt('0x' + statusHex.slice(128, 192));
    const ticketsSold = parseNumber('0x' + statusHex.slice(192, 256));
    const prizePool = BigInt('0x' + statusHex.slice(256, 320));
    
    // For dynamic arrays (winningSquares, winnerPercentages) and string (eventId),
    // we need to parse the offsets first
    const winningSquaresOffset = parseNumber('0x' + statusHex.slice(320, 384));
    const winnerPercentagesOffset = parseNumber('0x' + statusHex.slice(384, 448));
    const prizeClaimed = parseBoolean('0x' + statusHex.slice(448, 512));
    const eventIdOffset = parseNumber('0x' + statusHex.slice(512, 576));
    const refunded = parseBoolean('0x' + statusHex.slice(576, 640));
    
    // Now parse the dynamic data
    // For winningSquares
    const winningSquaresLengthStart = 640 + (winningSquaresOffset - 320) * 2;
    const winningSquaresLength = parseNumber('0x' + statusHex.slice(winningSquaresLengthStart, winningSquaresLengthStart + 64));
    const winningSquares = [];
    for (let i = 0; i < winningSquaresLength; i++) {
      const start = winningSquaresLengthStart + 64 + i * 64;
      winningSquares.push(parseNumber('0x' + statusHex.slice(start, start + 64)));
    }
    
    // For winnerPercentages
    const winnerPercentagesLengthStart = 640 + (winnerPercentagesOffset - 320) * 2;
    const winnerPercentagesLength = parseNumber('0x' + statusHex.slice(winnerPercentagesLengthStart, winnerPercentagesLengthStart + 64));
    const winnerPercentages = [];
    for (let i = 0; i < winnerPercentagesLength; i++) {
      const start = winnerPercentagesLengthStart + 64 + i * 64;
      winnerPercentages.push(parseNumber('0x' + statusHex.slice(start, start + 64)));
    }
    
    // For eventId
    const eventIdLengthStart = 640 + (eventIdOffset - 320) * 2;
    const eventIdLength = parseNumber('0x' + statusHex.slice(eventIdLengthStart, eventIdLengthStart + 64));
    const eventIdStart = eventIdLengthStart + 64;
    const eventIdEnd = eventIdStart + eventIdLength * 2;
    const eventIdHexData = statusHex.slice(eventIdStart, eventIdEnd);
    const eventIdBytes = [];
    for (let i = 0; i < eventIdHexData.length; i += 2) {
      eventIdBytes.push(parseInt(eventIdHexData.substr(i, 2), 16));
    }
    const eventId = new TextDecoder().decode(new Uint8Array(eventIdBytes));
    
    // Output the game status
    console.log("Game Status:");
    console.log("- Active:", active);
    console.log("- Referee:", referee);
    console.log("- Square Price:", squarePrice.toString(), "wei");
    console.log("- Tickets Sold:", ticketsSold);
    console.log("- Prize Pool:", prizePool.toString(), "wei");
    console.log("- Winning Squares:", winningSquares);
    console.log("- Winner Percentages:", winnerPercentages);
    console.log("- Prize Claimed:", prizeClaimed);
    console.log("- Event ID:", eventId);
    console.log("- Refunded:", refunded);
    
    // Step 3: Get the tickets
    console.log("\nStep 3: Getting tickets...");
    
    // Construct the calldata
    const getTicketsCalldata = FUNCTION_SELECTORS.getTickets + gameIdHexParam;
    
    // Make the eth_call
    const ticketsHex = await makeHttpRequest('eth_call', [{
      to: CONTRACT_ADDRESS,
      data: '0x' + getTicketsCalldata
    }, 'latest']);
    
    // Parse the tickets
    // The response is a tuple of two dynamic arrays
    const ticketsHexData = ticketsHex.slice(2);
    
    // Get the offsets
    const squareIndicesOffset = parseNumber('0x' + ticketsHexData.slice(0, 64));
    const ownersOffset = parseNumber('0x' + ticketsHexData.slice(64, 128));
    
    // Parse square indices
    const squareIndicesLengthStart = 128 + (squareIndicesOffset - 64) * 2;
    const squareIndicesLength = parseNumber('0x' + ticketsHexData.slice(squareIndicesLengthStart, squareIndicesLengthStart + 64));
    const squareIndices = [];
    for (let i = 0; i < squareIndicesLength; i++) {
      const start = squareIndicesLengthStart + 64 + i * 64;
      squareIndices.push(parseNumber('0x' + ticketsHexData.slice(start, start + 64)));
    }
    
    // Parse owners
    const ownersLengthStart = 128 + (ownersOffset - 64) * 2;
    const ownersLength = parseNumber('0x' + ticketsHexData.slice(ownersLengthStart, ownersLengthStart + 64));
    const owners = [];
    for (let i = 0; i < ownersLength; i++) {
      const start = ownersLengthStart + 64 + i * 64;
      owners.push(parseAddress('0x' + ticketsHexData.slice(start, start + 64)));
    }
    
    // Output the tickets
    console.log("Tickets:");
    for (let i = 0; i < squareIndices.length; i++) {
      console.log(`- Square ${squareIndices[i]}: ${owners[i]}`);
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
*/ 