/**
 * DEBUG FILE - COMMENTED OUT TO PREVENT LINTER/BUILD ISSUES
 * This file contains debugging utilities for the ScoreSquare contract.
 * To use this file, uncomment it and run with Node.js.
 */

/*
// Debug script to query game data directly from the contract
const { ethers } = require('ethers');

// Contract details
const SCORE_SQUARE_ADDRESS = "0x6147b9AB63496aCE7f3D270F8222e09038FD0870";
const SCORE_SQUARE_ABI = [
  "function getGameIdByEventId(string calldata _eventId) external view returns (uint256)",
  "function getGameStatus(uint256 gameId) external view returns (bool active, address referee, uint256 squarePrice, uint8 ticketsSold, uint256 prizePool, uint8[] winningSquares, uint8[] winnerPercentages, bool prizeClaimed, string eventId, bool refunded)",
  "function getGame(uint256 _gameId) external view returns (tuple(uint256 gameId, string eventId, uint256 squarePrice, address referee, uint8 deployerFeePercent, address[] players, uint8 status) game)"
];

// Event ID to look up
const eventId = "usa_1_VAN_LA_726827";

async function debugGame() {
  try {
    console.log("Starting debug process...");
    
    // Connect to the provider
    const provider = new ethers.JsonRpcProvider("https://base.llamarpc.com");
    
    // Create a contract instance
    const contract = new ethers.Contract(SCORE_SQUARE_ADDRESS, SCORE_SQUARE_ABI, provider);
    
    // Check if the contract exists
    console.log("Checking if contract exists...");
    const code = await provider.getCode(SCORE_SQUARE_ADDRESS);
    
    if (code && code !== "0x") {
      console.log(`Contract exists! Code length: ${(code.length - 2) / 2} bytes`);
    } else {
      console.log("Contract does not exist at the specified address.");
      return;
    }
    
    // Get game ID from event ID
    console.log("\nLooking up game ID for event:", eventId);
    
    try {
      const gameIdFromEvent = await contract.getGameIdByEventId(eventId);
      console.log("Game ID from getGameIdByEventId:", gameIdFromEvent.toString());
      
      if (gameIdFromEvent.toString() === "0") {
        console.log("No game found for event ID:", eventId);
        return;
      }
      
      // Get game status
      console.log("\nGetting game status for game ID:", gameIdFromEvent.toString());
      const gameStatus = await contract.getGameStatus(gameIdFromEvent);
      
      // Format the game status
      const formattedStatus = {
        active: gameStatus[0],
        referee: gameStatus[1],
        squarePrice: ethers.formatEther(gameStatus[2]),
        ticketsSold: gameStatus[3],
        prizePool: ethers.formatEther(gameStatus[4]),
        winningSquares: Array.from(gameStatus[5]).map(n => n.toString()),
        winnerPercentages: Array.from(gameStatus[6]).map(n => n.toString()),
        prizeClaimed: gameStatus[7],
        eventId: gameStatus[8],
        refunded: gameStatus[9]
      };
      
      console.log("Game Status:", JSON.stringify(formattedStatus, null, 2));
      
      // Get full game data
      console.log("\nGetting full game data for game ID:", gameIdFromEvent.toString());
      const gameData = await contract.getGame(gameIdFromEvent);
      
      // Format the game data
      const formattedGame = {
        gameId: gameData.gameId.toString(),
        eventId: gameData.eventId,
        squarePrice: ethers.formatEther(gameData.squarePrice),
        referee: gameData.referee,
        deployerFeePercent: gameData.deployerFeePercent,
        players: gameData.players,
        status: gameData.status
      };
      
      console.log("Game Data:", JSON.stringify(formattedGame, null, 2));
      
      // Count non-zero addresses in players array
      const nonZeroPlayers = formattedGame.players.filter(addr => addr !== ethers.ZeroAddress);
      console.log("\nNon-zero players count:", nonZeroPlayers.length);
      
      // Print the first few non-zero players
      console.log("First few players:");
      nonZeroPlayers.slice(0, 5).forEach((player, index) => {
        console.log(`Player ${index}: ${player}`);
      });
      
    } catch (error) {
      console.error("getGameIdByEventId failed:", error);
      console.log("No game found for event ID:", eventId);
    }
    
  } catch (error) {
    console.error("Error in debug process:", error);
  }
}

// Run the debug function
debugGame();
*/ 