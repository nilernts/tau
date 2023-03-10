import { computeRealizedLPFeePercent } from "../../functions/prices"
import FormattedPriceImpact from "../swap/FormattedPriceImpact"
import QuestionHelper from "../../components/QuestionHelper"
import React, { useMemo } from "react"
import SwapRoute from "../swap/SwapRoute"
import { TradeType, Trade as V2Trade, Currency } from "../../sdk"

import { useActiveWeb3React } from "../../hooks/useActiveWeb3React"

function TradeReview({
    trade,
    allowedSlippage,
}: {
    trade: V2Trade<Currency, Currency, TradeType> | undefined
    allowedSlippage: any
}) {
    const { chainId } = useActiveWeb3React()
    const showRoute = Boolean(trade && trade.route.path.length > 2)

    // const slippageAdjustedAmounts = computeSlippageAdjustedAmounts(
    //   trade,
    //   allowedSlippage
    // );
    // const { priceImpactWithoutFee, realizedLPFee } =
    //   computeTradePriceBreakdown(trade);

    const { realizedLPFee, priceImpact } = useMemo(() => {
        if (!trade) return { realizedLPFee: undefined, priceImpact: undefined }

        const realizedLpFeePercent = computeRealizedLPFeePercent(trade)
        const realizedLPFee = trade.inputAmount.multiply(realizedLpFeePercent)
        const priceImpact = trade.priceImpact.subtract(realizedLpFeePercent)
        return { priceImpact, realizedLPFee }
    }, [trade])

    return (
        <>
            <div className="text-xl text-high-emphesis">Swap Review</div>
            {trade ? (
                <div className="py-4 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="text-lg text-secondary">
                            {`Minimum received`}
                            <QuestionHelper
                                text={`Your transaction will revert if there is a large, unfavorable price movement before it is confirmed.`}
                            />
                        </div>
                        <div className="text-lg">
                            {`${trade.minimumAmountOut(allowedSlippage)?.toSignificant(4)} ${
                                trade.outputAmount.currency.symbol
                            }` ?? "-"}
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="text-lg text-secondary">
                            {`Price Impact`}
                            <QuestionHelper
                                text={`The difference between the market price and estimated price due to trade size.`}
                            />
                        </div>
                        <div className="text-lg">
                            <FormattedPriceImpact priceImpact={priceImpact} />
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="text-lg text-secondary">
                            Liquidity Provider Fee
                            <QuestionHelper
                                text={`A portion of each trade (0.25%) goes to liquidity providers as a protocol incentive.`}
                            />
                        </div>
                        <div className="text-lg">
                            {realizedLPFee
                                ? `${realizedLPFee.toSignificant(4)} ${trade.inputAmount.currency.symbol}`
                                : "-"}
                        </div>
                    </div>
                    {showRoute && (
                        <div className="flex items-center justify-between">
                            <div className="text-lg text-secondary">
                                {`Route`}
                                <QuestionHelper
                                    text={`Routing through these tokens resulted in the best price for your trade.`}
                                />
                            </div>
                            <div className="text-lg">
                                <SwapRoute trade={trade} />
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="mb-4 text-lg text-secondary">{`No liquidity found to do swap`}</div>
            )}
        </>
    )
}

export default TradeReview
