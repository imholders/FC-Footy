'use client';

import React, { useState } from 'react';
import { FaQuestionCircle, FaTimes, FaUserTie, FaTrophy, FaMoneyBillWave, FaExclamationTriangle, FaUndo } from 'react-icons/fa';

interface UserGuideProps {
  className?: string;
}

const UserGuide: React.FC<UserGuideProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      {/* Help button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-sm font-medium transition-colors shadow-md"
        aria-label="Open user guide"
      >
        <FaQuestionCircle className="text-white" />
        <span>How to Play</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">ScoreSquare: Lottery Game Guide</h2>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white"
                  aria-label="Close guide"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              <div className="space-y-6 text-gray-300">
                {/* Introduction */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Welcome to ScoreSquare!</h3>
                  <p>ScoreSquare is a football lottery game where you can win money by having the lucky squares that match the halftime and final scores of a match.</p>
                  <div className="mt-2 p-2 bg-gray-800 rounded-md text-sm flex items-start gap-2">
                    <FaMoneyBillWave className="text-green-400 flex-shrink-0 mt-0.5" />
                    <span>This is a money game based on luck, not skill or prediction accuracy.</span>
                  </div>
                </div>

                {/* Step 1 */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">1</div>
                  <div>
                    <h4 className="font-semibold text-white">Buy Tickets</h4>
                    <p className="text-sm">Select one or more squares on the grid. Each square represents a possible score combination for both halftime and final scores. Click on empty squares to add them to your cart.</p>
                    <div className="mt-2 p-2 bg-gray-800 rounded-md text-sm">
                      <span className="text-yellow-400 font-medium">Tip:</span> The numbers along the top and left side represent the possible scores for each team.
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">2</div>
                  <div>
                    <h4 className="font-semibold text-white">Complete Your Purchase</h4>
                    <p className="text-sm">Review your selected squares in the cart and click &quot;Buy Tickets&quot; to complete your purchase using your connected wallet.</p>
                    <div className="mt-2 p-2 bg-gray-800 rounded-md text-sm">
                      <span className="text-yellow-400 font-medium">Note:</span> You need to be connected to Base network and have enough ETH to cover the ticket price and gas fees.
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">3</div>
                  <div>
                    <h4 className="font-semibold text-white">Wait for the Match</h4>
                    <p className="text-sm">Once all squares are filled, the game enters the &quot;playing&quot; state. After the match ends, the trusted referee will enter both the halftime and final scores.</p>
                    <div className="mt-2 p-2 bg-gray-800 rounded-md text-sm flex items-start gap-2">
                      <FaUserTie className="text-yellow-400 flex-shrink-0 mt-0.5" />
                      <span>The referee is a trusted individual responsible for entering the correct scores from the actual match.</span>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">4</div>
                  <div>
                    <h4 className="font-semibold text-white">Prize Distribution</h4>
                    <p className="text-sm">The prize pool is distributed as follows:</p>
                    <ul className="list-disc pl-5 mt-1 text-sm space-y-1">
                      <li><span className="text-yellow-400 font-medium">25%</span> goes to the player who owns the square matching the halftime score</li>
                      <li><span className="text-yellow-400 font-medium">75%</span> goes to the player who owns the square matching the final score</li>
                    </ul>
                    <div className="mt-2 p-2 bg-gray-800 rounded-md text-sm flex items-start gap-2">
                      <FaTrophy className="text-yellow-400 flex-shrink-0 mt-0.5" />
                      <span>If the same player owns both winning squares, they receive the entire prize pool. The referee has the authority to distribute the prize in cases where the exact score might not be on the grid.</span>
                    </div>
                  </div>
                </div>

                {/* About Refunds */}
                <div className="p-3 bg-gray-800/70 rounded-lg border border-gray-700">
                  <h4 className="text-sm font-semibold text-white mb-2">About Refunds</h4>
                  
                  <div className="flex items-start gap-2 mb-3">
                    <FaUndo className="text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="mb-1"><span className="font-medium text-white">Referee-Initiated Refunds:</span> The referee has the authority to refund all tickets if:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Fewer than 25 tickets have been sold</li>
                        <li>The game needs to be cancelled for any reason</li>
                      </ul>
                      <p className="mt-1">If a refund is initiated, all players will receive back the full amount they paid for their squares.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <FaExclamationTriangle className="text-orange-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="mb-1"><span className="font-medium text-white">No Player-Initiated Refunds:</span> Players cannot request individual refunds.</p>
                      <p>Once you purchase a square, you cannot individually request a refund. All transactions are recorded on the blockchain and are permanent unless the referee initiates a full game refund.</p>
                    </div>
                  </div>
                </div>

                {/* Get Started Button */}
                <div className="flex justify-center mt-4">
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md font-medium transition-colors"
                  >
                    Got it, let&apos;s play!
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserGuide; 