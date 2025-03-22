'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * GameNavigation - A navigation component for the game pages
 * 
 * This component provides navigation links to the different game-related pages:
 * - Active Games: Games that are currently active and can be participated in
 * - Completed Games: Games that have been finalized and prizes have been claimed
 * - Create Game: Page to create a new game
 */
const GameNavigation: React.FC = () => {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'Active', href: '/active-games', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { name: 'Completed', href: '/completed-games', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'Create', href: '/create-game', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' },
  ];
  
  return (
    <>
      {/* Top navigation for larger screens */}
      <div className="bg-purplePanel shadow-sm mb-6 hidden sm:block border-b border-gray-800">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-4 py-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-900 text-blue-200'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`}
                >
                  <svg
                    className={`w-5 h-5 mr-2 ${isActive ? 'text-blue-200' : 'text-gray-500'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d={item.icon}
                    ></path>
                  </svg>
                  <span>{item.name} Games</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      
      {/* Fixed bottom navigation for mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-purplePanel border-t border-gray-800 sm:hidden z-10">
        <nav className="flex justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center py-3 px-2 ${
                  isActive ? 'text-blue-400' : 'text-gray-400'
                }`}
              >
                <svg
                  className={`w-6 h-6 ${isActive ? 'text-blue-400' : 'text-gray-500'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d={item.icon}
                  ></path>
                </svg>
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      
      {/* Add padding at the bottom to prevent content from being hidden behind the fixed navigation */}
      <div className="pb-16 sm:pb-0"></div>
    </>
  );
};

export default GameNavigation; 