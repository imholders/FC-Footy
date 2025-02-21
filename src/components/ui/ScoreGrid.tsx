import React from 'react';
import { TicketType, GameState } from '../../lib/kvScoreSquare';

interface ScoreGridProps {
  homeScore: number;
  awayScore: number;
  homeTeam: string;
  awayTeam: string;
  tickets: TicketType[];
  boardPositions: TicketType[];
  gameState: GameState;
  winningTicket: number | null;
}

const ScoreGrid: React.FC<ScoreGridProps> = ({
  homeScore,
  awayScore,
  homeTeam,
  awayTeam,
  tickets,
  boardPositions,
  gameState,
  winningTicket
}) => {
  const colHeaders = ['0', '1', '2', '3', '4+'];
  const rowHeaders = ['0', '1', '2', '3', '4+'];

  return (
    <div className="flex flex-col items-center"> {/* Center align everything */}
      {/* Home Team Label (Centered Above Grid) */}
      <div className="text-center font-bold text-notWhite text-xs mb-2 w-full flex justify-center">
        {homeTeam} Score
      </div>

      <div className="flex">
        {/* Away Team Label (Rotated) */}
        <div className="flex items-center justify-center pr-1">
          <span
            className="rotate-[-90deg] text-center font-bold text-xs text-notWhite whitespace-nowrap"
            style={{ height: '25px', width: '10px', padding: '0', margin: '-10px 0' }} // Ensure single line
          >
            {awayTeam} Score
          </span>
        </div>

        {/* Score Grid */}
        <div className="grid gap-1 mb-4" style={{ gridTemplateColumns: `1fr repeat(5, 45px)` }}>
          {/* Empty space for row labels */}
          <div></div>

          {/* Column Headers */}
          {colHeaders.map((header, colIdx) => {
            const isHomeScoreHighlight = homeScore < 4 ? header === homeScore.toString() : header === '4+';
            return (
              <div
                key={`col-header-${colIdx}`}
                className={`text-center font-bold text-xs px-2 ${
                  isHomeScoreHighlight ? 'text-limeGreenOpacity' : 'text-notWhite'
                }`}
              >
                {header}
              </div>
            );
          })}

          {/* Render rows with labels and ticket grid */}
          {Array.from({ length: 5 }, (_, rowIdx) => {
            const isAwayScoreHighlight = awayScore < 4 ? rowHeaders[rowIdx] === awayScore.toString() : rowHeaders[rowIdx] === '4+';

            return (
              <React.Fragment key={`row-${rowIdx}`}>
                {/* Row Labels with Right Padding & Highlighting */}
                <div
                  className={`text-center font-bold text-xs flex items-center justify-center pr-2 ${
                    isAwayScoreHighlight ? 'text-limeGreenOpacity' : 'text-notWhite'
                  }`}
                  style={{ height: '45px' }} // Ensures vertical alignment with grid squares
                >
                  {rowHeaders[rowIdx]}
                </div>

                {/* Ticket Grid */}
                {Array.from({ length: 5 }, (_, colIdx) => {
                  const ticketIndex = rowIdx * 5 + colIdx;
                  const currentTicket = gameState === 'buying' ? tickets[ticketIndex] : boardPositions[ticketIndex];

                  // Convert header values to numbers (treat "4+" as 4)
                  const rowVal = rowHeaders[rowIdx] === '4+' ? 4 : parseInt(rowHeaders[rowIdx]);
                  const colVal = colHeaders[colIdx] === '4+' ? 4 : parseInt(colHeaders[colIdx]);

                  // Determine if this cell should be highlighted based on score
                  const shouldHighlight = rowVal < awayScore || colVal < homeScore;

                  // Check if the cell matches the current score
                  const isScoreMatch =
                    (homeScore < 4 ? colHeaders[colIdx] === homeScore.toString() : colHeaders[colIdx] === '4+') &&
                    (awayScore < 4 ? rowHeaders[rowIdx] === awayScore.toString() : rowHeaders[rowIdx] === '4+');

                  // Only apply score styles when the game is not in the "buying" state.
                  const applyScoreStyles = gameState !== 'buying';
                  const cellBgClass = applyScoreStyles && isScoreMatch ? 'bg-limeGreenOpacity' : '';
                  const imgBorderClass = applyScoreStyles && shouldHighlight ? 'border-2 border-fontRed' : '';

                  if (!currentTicket) {
                    return (
                      <div
                        key={ticketIndex}
                        className={`aspect-square rounded p-1 flex items-center justify-center bg-darkPurple border border-lightPurple ${cellBgClass}`}
                      />
                    );
                  }

                  return (
                    <div
                      key={`ticket-${ticketIndex}`}
                      className={`aspect-square p-1 flex items-center justify-center border border-lightPurple rounded transition-all duration-200
                        ${cellBgClass} 
                        ${winningTicket === ticketIndex && gameState === 'completed' ? 'ring-2 ring-limeGreenOpacity bg-limeGreenOpacity' : ''}`}
                    >
                      {currentTicket?.owner && (
                        <a href={`https://warpcast.com/~/profiles/${currentTicket.owner}`} target="_blank" rel="noopener noreferrer">
                          <img
                            src={currentTicket.pfp}
                            alt="Ticket Owner"
                            className={`w-8 h-8 rounded-full 
                              ${imgBorderClass} 
                              ${shouldHighlight ? 'border-2 border-fontRed' : ''}`} // Apply both styles properly
                          />
                        </a>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ScoreGrid;
