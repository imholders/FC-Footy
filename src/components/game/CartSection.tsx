import React from 'react';
import { formatEther } from 'viem';

interface CartSectionProps {
  cart: number[];
  squarePrice: bigint;
  handleBuyTickets: () => Promise<void>;
  isBuying: boolean;
  removeFromCart: (index: number) => void;  // ✅ Ensure this is in the props
  clearCart: () => void;  // ✅ Ensure this is in the props
}


const CartSection: React.FC<CartSectionProps> = ({
  cart = [],  // ✅ Ensure cart is always an array
  squarePrice,
  handleBuyTickets,
  isBuying,
  removeFromCart,
  clearCart
}) => {
  // Calculate total price safely
  const totalPrice = squarePrice * BigInt(cart.length || 0);  // ✅ Ensure length check

  return (
    <div className="bg-gray-800/70 rounded-lg shadow-lg p-4 border border-gray-700">
      <h3 className="text-xl font-bold text-white mb-3 flex justify-between items-center">
        <span>Your Cart</span>
        <span className="text-sm font-normal text-gray-400">
          {cart.length} {cart.length === 1 ? 'square' : 'squares'}
        </span>
      </h3>
      
      {cart.length > 0 ? (
        <>
          <div className="max-h-40 overflow-y-auto mb-4">
            <div className="grid grid-cols-4 gap-2">
              {cart.map((squareIndex) => (
                <div 
                  key={squareIndex} 
                  className="bg-blue-500 text-white p-2 rounded flex items-center justify-between"
                >
                  <span>{squareIndex}</span>
                  <button 
                    onClick={() => removeFromCart(squareIndex)}
                    className="text-white hover:text-red-200"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-300">Total:</span>
            <span className="text-white font-bold">
              {formatEther(totalPrice)} ETH
            </span>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={clearCart}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleBuyTickets}
              disabled={isBuying}
              className={`flex-1 py-2 px-4 rounded transition-colors ${
                isBuying
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isBuying ? 'Buying...' : 'Buy Squares'}
            </button>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-400 py-4">
          <p>Your cart is empty</p>
          <p className="text-sm mt-2">Click on available squares to add them to your cart</p>
        </div>
      )}
    </div>
  );
};

export default CartSection; 