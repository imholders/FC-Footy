import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import BlockchainScoreSquareCreate from './BlockchainScoreSquareCreate';
import ActiveGamesBrowser from './ActiveGamesBrowser';
import CompletedGamesBrowser from './CompletedGamesBrowser';
import GameStateNavigation from './GameStateNavigation';

/**
 * MoneyGamesContent - A component that handles all game states internally
 * 
 * This component manages the display of different game states (active, create, completed)
 * without using route navigation, keeping everything within the main app navigation.
 */
const MoneyGamesContent: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get gameId from query params
  const gameId = searchParams?.get('gameId');
  
  // Get gameState from query params or default to 'active'
  const gameStateParam = searchParams?.get('gameState') || 'active';
  
  // Set initial game state
  const [gameState, setGameState] = useState<'create' | 'active' | 'completed'>(
    gameStateParam === 'completed' ? 'completed' : 
    gameStateParam === 'create' ? 'create' : 'active'
  );
  
  // If gameId is present but gameState is 'create', we need to determine the correct state
  useEffect(() => {
    if (gameId && gameState === 'create') {
      // Default to 'active' when a gameId is present but no specific state is set
      // This ensures game details are shown when a user navigates directly to a URL with a gameId
      setGameState('active');
      
      // Update URL to reflect the correct state
      const params = new URLSearchParams(searchParams?.toString());
      params.set('gameState', 'active');
      
      // Preserve tab and gameType parameters
      const tab = searchParams?.get('tab') || 'moneyGames';
      const gameType = searchParams?.get('gameType') || 'scoreSquare';
      
      // Update the URL without refreshing the page
      router.replace(`/?tab=${tab}&gameType=${gameType}&gameState=active&gameId=${gameId}`, { scroll: false });
    }
  }, [gameId, gameState, router, searchParams]);
  
  // Handle game state change
  const handleGameStateChange = (state: string) => {
    setGameState(state as 'create' | 'active' | 'completed');
    
    // Update URL with the new game state
    const params = new URLSearchParams(searchParams?.toString());
    params.set('gameState', state);
    
    // If changing to a different state, remove the gameId parameter
    // This prevents showing game details when switching between states
    if (gameId && state !== 'active' && state !== 'completed') {
      params.delete('gameId');
    }
    
    // Preserve tab and gameType parameters
    const tab = searchParams?.get('tab') || 'moneyGames';
    const gameType = searchParams?.get('gameType') || 'scoreSquare';
    
    // Update the URL without refreshing the page
    router.push(`/?tab=${tab}&gameType=${gameType}&gameState=${state}${gameId && (state === 'active' || state === 'completed') ? `&gameId=${gameId}` : ''}`);
  };
  
  // Update gameState when gameState query param changes
  useEffect(() => {
    const newGameState = searchParams?.get('gameState');
    if (newGameState) {
      setGameState(newGameState as 'create' | 'active' | 'completed');
    }
  }, [searchParams]);
  
  return (
    <div className="w-full">
      {/* Game state navigation (third level) */}
      <GameStateNavigation 
        selectedState={gameState} 
        onStateChange={handleGameStateChange} 
      />
      
      {/* Content based on selected game state */}
      {gameState === 'create' ? (
        <BlockchainScoreSquareCreate />
      ) : gameState === 'active' ? (
        <ActiveGamesBrowser initialGameId={gameId} />
      ) : gameState === 'completed' ? (
        <CompletedGamesBrowser initialGameId={gameId} />
      ) : (
        <div className="p-4 bg-yellow-100 border border-yellow-300 rounded text-yellow-800">
          <p>Unknown game state. Please select a valid option.</p>
        </div>
      )}
    </div>
  );
};

export default MoneyGamesContent; 