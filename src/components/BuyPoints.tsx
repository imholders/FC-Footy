import React, { useState, useEffect } from 'react';
import { PriceIncreaseCountdown } from '~/components/points/PriceIncreaseCountdown';
import ScoresInfo from '~/components/ScoresInfo';
import { getTeamPreferences } from '~/lib/kvPerferences';
import { useAccount } from 'wagmi';
import { useFormattedTokenIssuance } from '~/hooks/useFormattedTokenIssuance';
import { useWriteJbMultiTerminalPay, useJBRulesetContext } from 'juice-sdk-react';
import { parseEther } from 'viem';
import { usePrivy } from '@privy-io/react-auth';
import { usePathname, useSearchParams } from 'next/navigation';
import { TERMINAL_ADDRESS, PROJECT_ID } from '~/constants/contracts';

export default function BuyPoints() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const memo = '';
  const [ethAmount, setEthAmount] = useState('0.1');
  const [showInstructions, setShowInstructions] = useState(false);
  const { address } = useAccount();
  const { writeContractAsync } = useWriteJbMultiTerminalPay();
  
  const { ready, authenticated, user } = usePrivy();
  const [favClub, setFavClub] = useState<string | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { rulesetMetadata } = useJBRulesetContext();
  const issuance = useFormattedTokenIssuance({
    reservedPercent: rulesetMetadata?.data?.reservedPercent,
  });

  const [hasAgreed, setHasAgreed] = useState(false);

  const getIssuedPoints = (eth: number) => {
    const pointsPerEth = Number(issuance?.replace(/[^\d.]/g, '') ?? 0);
    return Math.round(pointsPerEth * eth).toLocaleString();
  };

  useEffect(() => {
    const fetchTeam = async () => {
      const farcasterAccount = user?.linkedAccounts.find(
        (account) => account.type === 'farcaster'
      );
      const fid = farcasterAccount?.fid;
      if (!fid) return;
      const prefs = await getTeamPreferences(fid);
      const rawTeam = prefs?.[0]; // e.g. 'eng.1-liv'
      console.log('User FID:', fid);
      console.log('Raw Team Preference:', rawTeam);

      const clubCode = rawTeam?.split('-')?.[1]; // → 'liv'
      if (clubCode) {
        console.log('Favorite Club Code:', clubCode.toUpperCase());
        setFavClub(clubCode.toUpperCase());
      }
    };
    if (authenticated) fetchTeam();
  }, [user, authenticated]);

  if (!ready || !authenticated) return null;

  const handleBuyPack = async (ethAmount: string) => {
    if (!address) return;

    setIsSubmitting(true);
    try {
      const weiAmount = parseEther(ethAmount);
      const finalMemo = favClub ? `${memo} I support ${favClub}` : memo;
      await writeContractAsync({
        args: [
          PROJECT_ID,
          '0x000000000000000000000000000000000000EEEe',
          weiAmount,
          address,
          0n,
          finalMemo,
          '0x0',
        ],
        address: TERMINAL_ADDRESS,
        value: weiAmount,
      });
    } catch (err) {
      console.error('Contract call failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

 /*  const packs = [
    {
      label: 'OG Booster',
      amount: '0.1',
      image: '/og.png',
      subtext: '💰 Legendary scoreboard sabotage—OG style',
      description: "Own goal? Nah—OG move. This pack is only for the real ones on the whitelist.",
    },
    {
      label: 'VAR Pack',
      amount: '0.01',
      image: '/var.png',
      subtext: '🧐 Not much flex, but hey, it gets you on the board',
      description: "Like the ref, you've got no idea what's happening—but points might help.",
    },
    {
      label: 'Red Card',
      amount: '0.005',
      image: '/redcard.png',
      subtext: '🚨 Big plays or big penalties—still counts',
      description: "Get sent off in style. 2 match suspension. Bold moves earn bold points.",
    },
  ]; */

  return (
    <div className="bg-purplePanel rounded shadow-md max-w-4xl mx-auto p-2">
      {/* Modal for ScoresInfo */}
      {showInstructions && <ScoresInfo defaultOpen onClose={() => setShowInstructions(false)} />}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl text-notWhite font-bold">Join the team</h2>
        {/* <div className="mb-6">
          {!false && (
            <button
              onClick={() => setShowInstructions(true)}
              className="flex items-center text-deepPink hover:text-fontRed focus:outline-none transition"
            >
              <Info className="w-5 h-5" />
            </button>
          )}
        </div> */}
      </div>
      <div className="relative">
        {!favClub && (
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams?.toString());
              params.set('tab', 'settings');
              window.history.pushState(null, '', `${pathname}?${params.toString()}`);
            }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-start bg-black/70 rounded-lg text-center px-4 pt-10 hover:opacity-80 transition"
          >
            <img src="/banny_redcard.png" alt="Red card" className="max-w-xs mb-4 opacity-90" />
            <p className="text-lightPurple text-sm">
              Follow your favorite team in settings to unlock point packs.
            </p>
          </button>
        )}
        <div className={`overflow-x-auto flex gap-4 pb-2 snap-x snap-mandatory scroll-smooth scroll-pl-6 ${!favClub ? 'pointer-events-none opacity-50' : ''}`}>
          {/* {packs.map(({ label, amount, image, description }) => (
            <div
              key={amount}
              className="w-[220px] flex-shrink-0 snap-center [scroll-snap-align:center]"
              onClick={() => setSelectedCard(amount)}
            >
              <div className={`relative h-[240px] [perspective:1000px]`}>
                <div
                  className={`relative w-full h-full transition-transform duration-500`}
                  style={{
                    transform: flippedCard === amount ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <div
                    className={`absolute inset-0 p-4 flex flex-col rounded-md bg-darkPurple border-2 text-notWhite shadow-lg overflow-hidden [border-top-right-radius:0] ${
                      selectedCard === amount ? 'border-limeGreenOpacity' : 'border-lightPurple'
                    }`}
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="flex-grow">
                      {label === 'OG Booster' && (
                        <div className="absolute top-2 left-2 bg-white text-black text-[10px] font-bold px-2 py-1 rounded-sm uppercase">
                          Whitelist: {favClub} Supporters
                        </div>
                      )}
                      <div className="flex items-center gap-4 mb-4 border-t-2 border-deepPink pt-1">
                        <img src={image} alt={label} className="h-20 w-20 object-contain" />                        <div>
                          <div className="text-lg font-semibold text-notWhite leading-tight">
                            {label}
                          </div>
                        </div>
                      </div>
                      <div className="text-lg font-extrabold text-limeGreen mt-2">
                        {getIssuedPoints(Number(amount))} $SCORES
                      </div>
                      <div className="text-xs text-lightPurple -mt-1 mb-1">for {amount} ETH</div>
                    </div>
                    <button
                      onClick={() => handleBuyPack(amount)}
                      disabled={isSubmitting || selectedCard !== amount}
                      className="w-full mt-4 py-2 px-4 rounded transition-colors bg-deepPink text-white hover:bg-fontRed disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Buy
                    </button>
                  </div>
                  <div className="absolute inset-0 p-4 flex flex-col justify-center items-center rounded-md bg-black border-2 border-deepPink text-lightPurple [transform:rotateY(180deg)] overflow-hidden [border-top-right-radius:0]" style={{ backfaceVisibility: 'hidden' }}>
                    <>
                      <p className="text-sm font-bold text-center text-notWhite">{packs.find(p => p.amount === amount)?.subtext}</p>
                      <p className="text-xs text-center mt-2">{packs.find(p => p.amount === amount)?.description}</p>
                    </>
                  </div>
                </div>
                {selectedCard === amount && (
                  <div className="absolute top-0 right-0 p-1 cursor-pointer z-10" onClick={() => setFlippedCard(flippedCard === amount ? null : amount)}>
                    <FaForward className="w-5 h-5 text-lightPurple transform -rotate-45" /> 
                  </div>
                )}
              </div>
            </div>
          ))} */}
        </div>
      </div>
      <div className={`bg-gray-800/70 rounded-lg shadow-lg p-4 border border-gray-700 mt-2 ${!favClub ? 'pointer-events-none opacity-50 relative' : ''}`}>
        <h3 className="text-lg font-semibold text-notWhite mb-2">Participate in Footy App</h3>
        <PriceIncreaseCountdown />
        <p className="text-sm text-lightPurple mt-2 mb-2">
          {ethAmount || '0'} ETH = {getIssuedPoints(Number(ethAmount || '0'))} $SCORES
        </p>
        <input
          type="number"
          step="0.0001"
          min="0"
          placeholder="Enter ETH amount"
          className="border border-limeGreenOpacity p-2 rounded w-full bg-darkPurple text-lightPurple"
          value={ethAmount}
          onChange={(e) => setEthAmount(e.target.value)}
          disabled={isSubmitting}
        />
        <div className="flex items-center mt-4 space-x-2">
          <input
            type="checkbox"
            id="agree"
            checked={hasAgreed}
            onChange={(e) => setHasAgreed(e.target.checked)}
            className="form-checkbox text-limeGreen rounded"
          />
          <label htmlFor="agree" className="text-sm text-lightPurple">
            I have read and agree to the <button onClick={() => setShowInstructions(true)} className="underline text-deepPink hover:text-fontRed">rules</button>.
          </label>
        </div>
        <button
          onClick={() => handleBuyPack(ethAmount)}
          disabled={isSubmitting || !ethAmount || !hasAgreed}
          className={`w-full mt-4 py-2 px-4 rounded transition-colors ${
            isSubmitting
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-deepPink text-white hover:bg-fontRed'
          }`}
        >
          {isSubmitting ? 'Processing...' : `Buy for ${ethAmount || '...'} ETH`}
        </button>
      </div>
    </div>
  );
}
