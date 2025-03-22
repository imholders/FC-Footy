'use client';

import React from 'react';
import { FaUserTie, FaMoneyBillWave, FaExclamationTriangle, FaUndo } from 'react-icons/fa';

interface UserInstructionsProps {
  className?: string;
}

/**
 * UserInstructions - A simple component that displays brief instructions for new users
 * This can be embedded in different parts of the application or used as a standalone component
 */
const UserInstructions: React.FC<UserInstructionsProps> = ({ className = '' }) => {
  return (
    <div className={`bg-gray-900/70 rounded-lg border border-gray-700 p-4 ${className}`}>
      <h3 className="text-lg font-bold text-white mb-3">How to Play ScoreSquare Lottery</h3>
      
      <div className="space-y-3 text-gray-300">
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">1</div>
          <p className="text-sm"><span className="font-medium text-white">Buy Tickets:</span> Select squares on the grid that represent possible halftime and final scores.</p>
        </div>
        
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">2</div>
          <p className="text-sm"><span className="font-medium text-white">Complete Purchase:</span> Review your cart and click &quot;Buy Tickets&quot; to complete your purchase.</p>
        </div>
        
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">3</div>
          <p className="text-sm"><span className="font-medium text-white">Wait for Match:</span> Once all squares are filled, the trusted referee will enter both halftime and final scores.</p>
        </div>
        
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">4</div>
          <p className="text-sm"><span className="font-medium text-white">Prize Distribution:</span> Halftime score winner gets 25% of the pot, final score winner gets 75%.</p>
        </div>
        
        <div className="mt-2 pt-2 border-t border-gray-700">
          <p className="text-xs text-gray-400 flex items-center gap-1 mb-1">
            <FaUserTie className="text-yellow-400 flex-shrink-0" /> 
            <span>The referee is trusted to enter the correct scores and distribute the prize pool</span>
          </p>
          <p className="text-xs text-gray-400 flex items-center gap-1 mb-1">
            <FaMoneyBillWave className="text-green-400 flex-shrink-0" /> 
            <span>This is a money game based on luck, not skill or prediction accuracy</span>
          </p>
          <p className="text-xs text-gray-400 flex items-center gap-1 mb-1">
            <FaUndo className="text-blue-400 flex-shrink-0" /> 
            <span>The referee may refund all tickets if fewer than 25 tickets are sold</span>
          </p>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <FaExclamationTriangle className="text-orange-400 flex-shrink-0" /> 
            <span>No player-initiated refunds: You are not entitled to a refund for purchased squares</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserInstructions; 