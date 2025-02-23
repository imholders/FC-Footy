import React from 'react';
import { useMintNFT } from '../../hooks/useMintNft';

const MintButton = ({ metadataCID }) => {
  const { mint, isLoading, isSuccess, data, error } = useMintNFT(metadataCID);

  return (
    <button
      onClick={() => mint?.()}
      disabled={isLoading || !mint}
      className={`flex-1 bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-400 transition ${
        isLoading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {isLoading ? 'Minting...' : 'Mint NFT'}
      {isSuccess && data && (
        <div className="mt-2 text-green-400">
          Minted!{' '}
          <a
            href={`https://basescan.org/tx/${data.hash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Basescan
          </a>
        </div>
      )}
      {error && <p className="mt-2 text-red-400">Minting failed!</p>}
    </button>
  );
};

export default MintButton;
