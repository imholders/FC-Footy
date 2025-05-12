import { FixedInt } from "fpnum";
import { useJBRulesetContext } from "juice-sdk-react";
import { ReservedPercent, RulesetWeight, getTokenAToBQuote } from "juice-sdk-core";
import { formatUnits, parseUnits } from "viem";

interface TokenIssuanceParams {
  weight?: RulesetWeight;
  reservedPercent?: ReservedPercent;
}

/**
 * Returns the amount of token B you can get for each token A.
 *
 * Depends on JBRulesetContext.
 * Can pass in differnt weight and reservePercent if looking at future stage issuance.
 */
export function useFormattedTokenIssuance(params?: TokenIssuanceParams) {
  const tokenA =  { symbol: '$SCORES', decimals: 18 };
  const { ruleset, rulesetMetadata } = useJBRulesetContext();

  if (!ruleset?.data || !rulesetMetadata?.data) {
    return;
  }
  const weight = params?.weight || ruleset.data.weight;
  const reservedPercent = params?.reservedPercent || rulesetMetadata.data.reservedPercent;
  const quote = getTokenAToBQuote(
    new FixedInt(parseUnits("1", tokenA.decimals), tokenA.decimals), {
      weight,
      reservedPercent
    }
  );
  const amount = formatUnits(quote.payerTokens, tokenA.decimals);
  const formattedAmount = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 3
  }).format(Number(amount));
  return `${formattedAmount} ${'$SCORES / ETH'}`;
}