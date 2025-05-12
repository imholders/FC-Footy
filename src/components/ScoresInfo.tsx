'use client';

import React from 'react';
import { FaQuestionCircle, FaTimes, FaUserTie, FaTrophy, FaMoneyBillWave  } from 'react-icons/fa';

interface ScoresInfoProps {
  className?: string;
  defaultOpen?: boolean;
  onClose?: () => void;
}

const ScoresInfo: React.FC<ScoresInfoProps> = ({ className = '', defaultOpen, onClose }) => {
  return (
    <div className={`relative ${className}`}>
      {/* Help button */}
      {!defaultOpen && (
        <button 
          onClick={() => {}}
          className="flex items-center gap-1 px-1 py-4.5 text-fontRed rounded-full text-sm font-medium transition-colors shadow-md"
          aria-label="Open user guide"
        >
          <FaQuestionCircle className="text-fontRed" />
          <span></span>
        </button>
      )}

      {/* Modal */}
      {defaultOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white"></h2>
                <button 
                  onClick={onClose}
                  className="text-gray-400 hover:text-white"
                  aria-label="Close guide"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              <div className="space-y-6 text-lightPurple">
                {/* Introduction: About $SCORES */}
                <div>
                  <h3 className="text-lg font-semibold text-notWhite mb-2">What Are SCORES points?</h3>
                  <p>SCORES are the native points used in the Footy App. You can earn them, use them to play games like ScoreSquare, or buy them to unlock new features, access digital match memorabilia, or support your favorite football communities.</p>
                  </div>

                {/* Step 1 */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white">
                    <FaUserTie size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-notWhite">For Fans, Forever</h4>
                    <p className="text-sm">SCORES are yours — onchain and permanent. They don&apos;t expire, and no Referee or rulebook can take them away. Fans who collect early and stay active benefit more as the fan base grows.</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white">
                    <FaTrophy size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-notWhite">Backed by the Crowd</h4>
                    <p className="text-sm">SCORES points are created when fans pay for them. The price per point adjusts substantially during the summer preseason and weekly during the 25/26 game weeks. Early fans get more SCORES points for their money. The cash out curve rewards early and loyal supporters who help grow the app. As the World Cup 2026 kicks off token issuance will stop which freezes the supply of SCORES forever.</p>
                  </div>
                </div >

                {/* Step 3 */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white">
                    <FaMoneyBillWave size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-notWhite">Fuel the Team</h4>
                    <p className="text-sm">Prior to the FIFA World Cup a portion of every SCORES issuance goes to support the people and partners who keep the Footy App alive. You’re not just buying points — you’re backing the app.</p>
                  </div>
                </div>

                {/* Get Started Button */}
                <div className="flex flex-col items-center justify-center mt-4 space-y-2">
                  <div className="text-center text-sm">
                    <a
                      href="https://app.revnet.eth.sucks/base:53"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-lightPurple hover:text-deepPink transition"
                    >
                      For more information, visit revnet.eth.sucks
                    </a>
                  </div>
                  <button 
                    onClick={onClose}
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

export default ScoresInfo; 