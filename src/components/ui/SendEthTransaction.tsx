// SendEthTransaction.tsx
"use client";

import React, { useCallback, useMemo } from "react";
import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useChainId,
} from "wagmi";
import { Button } from "~/components/ui/Button"; // adjust the import as needed
import { truncateAddress } from "~/lib/truncateAddress"; // adjust the import as needed
import { base } from "wagmi/chains";

const SendEthTransaction: React.FC = () => {
  const { isConnected } = useAccount();
  console.log("isConnected", isConnected);
  const chainId = useChainId();

  const {
    sendTransaction,
    data,
    error: sendTxError,
    isError: isSendTxError,
    isPending: isSendTxPending,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: data,
  });

  // Choose a recipient address based on the chain.
  const toAddr = useMemo(() => {
    return chainId === base.id
      ? "0x8b80755c441d355405ca7571443bb9247b77ec16"
      : "0xB3d8d7887693a9852734b4D25e9C0Bb35Ba8a830";
  }, [chainId]);

  const handleSend = useCallback(() => {
    sendTransaction({
      to: toAddr,
      value: 1n, // sending 1 wei; adjust the value as needed
    });
  }, [toAddr, sendTransaction]);

  return (
    <div>
      <Button
        onClick={handleSend}
        disabled={!isConnected || isSendTxPending}
        isLoading={isSendTxPending}
      >
        Buy now
      </Button>
      {isSendTxError && (
        <div className="text-red-500 text-xs mt-1">
          Error: {sendTxError?.message}
        </div>
      )}
      {data && (
        <div className="mt-2 text-xs">
          <div>Hash: {truncateAddress(data)}</div>
          <div>
            Status:{" "}
            {isConfirming
              ? "Confirming..."
              : isConfirmed
              ? "Confirmed!"
              : "Pending"}
          </div>
        </div>
      )}
    </div>
  );
};

export default SendEthTransaction;
