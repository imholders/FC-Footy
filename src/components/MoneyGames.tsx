import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import GameTabNavigation from './GameTabNavigation';
import MoneyGamesContent from './MoneyGamesContent';

// Define the available money game types
type GameType = 'scoreSquare' | 'comingSoon';

const MoneyGames: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get gameType from query params or default to 'scoreSquare'
  const gameTypeParam = searchParams?.get('gameType') || 'scoreSquare';
  const [selectedGame, setSelectedGame] = useState<GameType>(
    gameTypeParam === 'comingSoon' ? 'comingSoon' : 'scoreSquare'
  );
  
  // Update URL when selected game changes
  useEffect(() => {
    // Preserve existing query parameters
    const params = new URLSearchParams(searchParams?.toString());
    
    // Update the gameType parameter
    params.set('gameType', selectedGame);
    
    // Preserve tab and league parameters
    const tab = searchParams?.get('tab') || 'moneyGames';
    const league = searchParams?.get('league') || 'eng.1';
    
    // Update the URL without refreshing the page
    router.push(`/?tab=${tab}&league=${league}&gameType=${selectedGame}`);
  }, [selectedGame, router, searchParams]);
  
  // Update selectedGame when gameType query param changes
  useEffect(() => {
    const newGameType = searchParams?.get('gameType');
    if (newGameType === 'scoreSquare' || newGameType === 'comingSoon') {
      setSelectedGame(newGameType);
    }
  }, [searchParams]);

  return (
    <div className="w-full">
      {/* Game type navigation (second level) */}
      <GameTabNavigation selectedTab={selectedGame} />
      
      {/* Content based on selected game type */}
      {selectedGame === 'scoreSquare' ? (
        <MoneyGamesContent />
      ) : (
        <div className="bg-purplePanel rounded shadow-md max-w-4xl mx-auto p-4 text-center">
          <h2 className="text-xl text-notWhite font-bold mb-4">More Money Games Coming Soon</h2>
          <p className="text-lightPurple">
            Add your football money game here soon<sup>TM</sup>
          </p>
        </div>
      )}
    </div>
  );
};

export default MoneyGames; 