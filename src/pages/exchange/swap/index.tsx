import { ApprovalState, useApproveCallbackFromTrade } from "../../../hooks/useApproveCallback"
import { BottomGrouping, SwapCallbackError } from "../../../features/swap/styleds"
import { AutoRow, RowBetween } from "../../../components/Row"
import { ButtonConfirmed, ButtonError } from "../../../components/Button"
import { Currency, CurrencyAmount, JSBI, Token, TradeType, Trade as V2Trade } from "../../../sdk"
import Column, { AutoColumn } from "../../../components/Column"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useAllTokens, useCurrency } from "../../../hooks/Tokens"
import {
    useDefaultsFromURLSearch,
    useDerivedSwapInfo,
    useSwapActionHandlers,
    useSwapState,
} from "../../../state/swap/hooks"
import { useExpertModeManager, useUserSingleHopOnly, useUserTransactionTTL } from "../../../state/user/hooks"
import useWrapCallback, { WrapType } from "../../../hooks/useWrapCallback"

import AddressInputPanel from "../../../components/AddressInputPanel"
import Button from "../../../components/Button"
import ConfirmSwapModal from "../../../features/swap/ConfirmSwapModal"
import CurrencyInputPanel from "../../../components/CurrencyInputPanel"
import { Field } from "../../../state/swap/actions"
import Loader from "../../../components/Loader"
import Lottie from "lottie-react"
import ProgressSteps from "../../../components/ProgressSteps"
import ExchangeHeader from "../../../components/ExchangeHeader"
import TokenWarningModal from "../../../modals/TokenWarningModal"
import TradePrice from "../../../features/swap/TradePrice"
import UnsupportedCurrencyFooter from "../../../features/swap/UnsupportedCurrencyFooter"
import Web3Connect from "../../../components/Web3Connect"
import { computeFiatValuePriceImpact } from "../../../functions/trade"
import confirmPriceImpactWithoutFee from "../../../features/swap/confirmPriceImpactWithoutFee"
import { maxAmountSpend } from "../../../functions/currency"
import swapArrowsAnimationData from "../../../animation/swap-arrows.json"

import { useActiveWeb3React } from "../../../hooks/useActiveWeb3React"
import useENSAddress from "../../../hooks/useENSAddress"
import useIsArgentWallet from "../../../hooks/useIsArgentWallet"
import { useIsSwapUnsupported } from "../../../hooks/useIsSwapUnsupported"
import { useSwapCallback } from "../../../hooks/useSwapCallback"
import { useUSDCValue } from "../../../hooks/useUSDCPrice"
import { warningSeverity } from "../../../functions/prices"
import DoubleGlowShadow from "../../../components/DoubleGlowShadow"
import TauLogo from "../../../components/TauLogo"
import { useFCL } from "../../../hooks/fcl/useFCL"
import { useFlowTokenBalances } from "../../../fcl/scripts/token/getTokenBalances"
import { useFCLSwapCallback } from "../../../fcl/transactions/swap/swap"

export default function Swap() {
    // const loadedUrlParams = useDefaultsFromURLSearch()

    // token warning stuff
    // const [loadedInputCurrency, loadedOutputCurrency] = [
    //     useCurrency(loadedUrlParams?.inputCurrencyId),
    //     useCurrency(loadedUrlParams?.outputCurrencyId),
    // ]

    // const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false)
    // const urlLoadedTokens: Token[] = useMemo(
    //     () => [loadedInputCurrency, loadedOutputCurrency]?.filter((c): c is Token => c?.isToken ?? false) ?? [],
    //     [loadedInputCurrency, loadedOutputCurrency]
    // )

    // const handleConfirmTokenWarning = useCallback(() => {
    //     setDismissTokenWarning(true)
    // }, [])

    // dismiss warning if all imported tokens are in active lists
    // const defaultTokens = useAllTokens()

    // const importTokensNotInDefault =
    //     urlLoadedTokens &&
    //     urlLoadedTokens.filter((token: Token) => {
    //         return !Boolean(token.address in defaultTokens)
    //     })

    const { account } = useActiveWeb3React()
    const fcl = useFCL()

    // for expert mode
    const [isExpertMode] = useExpertModeManager()

    // get custom setting values for user
    const [ttl] = useUserTransactionTTL()

    // swap state
    const { independentField, typedValue, recipient } = useSwapState()
    const {
        v2Trade,
        currencyBalances,
        parsedAmount,
        currencies,
        inputError: swapInputError,
        allowedSlippage,
    } = useDerivedSwapInfo(false)

    const tokenBalances = useFlowTokenBalances(
        [currencies[Field.INPUT]?.symbol, currencies[Field.OUTPUT]?.symbol],
        fcl.account
    )

    // const {
    //     wrapType,
    //     execute: onWrap,
    //     inputError: wrapInputError,
    // } = useWrapCallback(currencies[Field.INPUT], currencies[Field.OUTPUT], typedValue)

    const showWrap: boolean = false // wrapType !== WrapType.NOT_APPLICABLE
    // const { address: recipientAddress } = useENSAddress(recipient)

    const trade = showWrap ? undefined : v2Trade

    // const parsedAmounts = useMemo(
    //     () =>
    //         // showWrap
    //             ? {
    //                   [Field.INPUT]: parsedAmount,
    //                   [Field.OUTPUT]: parsedAmount,
    //               }
    //               : {}
    //             // : {
    //                 //   [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
    //                 //   [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
    //             //   },
    //     [independentField, parsedAmount, showWrap, trade]
    // )
    const parsedAmounts = {
        [Field.INPUT]: Number(parsedAmount) ?? 0,
        [Field.OUTPUT]: Number(parsedAmount) ?? 0,
    }

    const fiatValueInput = parsedAmounts[Field.INPUT] // useUSDCValue(parsedAmounts[Field.INPUT])
    const fiatValueOutput = parsedAmounts[Field.OUTPUT] // / useUSDCValue(parsedAmounts[Field.OUTPUT])
    // const priceImpact = computeFiatValuePriceImpact(fiatValueInput, fiatValueOutput)

    const { onSwitchTokens, onCurrencySelection, onUserInput, onChangeRecipient } = useSwapActionHandlers()

    const isValid = !swapInputError

    const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

    const handleTypeInput = useCallback(
        (value: string) => {
            onUserInput(Field.INPUT, value)
        },
        [onUserInput]
    )

    const handleTypeOutput = useCallback(
        (value: string) => {
            onUserInput(Field.OUTPUT, value)
        },
        [onUserInput]
    )

    // modal and loading
    const [{ showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn, txHash }, setSwapState] = useState<{
        showConfirm: boolean
        tradeToConfirm: V2Trade<Currency, Currency, TradeType> | undefined
        attemptingTxn: boolean
        swapErrorMessage: string | undefined
        txHash: string | undefined
    }>({
        showConfirm: false,
        tradeToConfirm: undefined,
        attemptingTxn: false,
        swapErrorMessage: undefined,
        txHash: undefined,
    })

    const formattedAmounts = {
        [independentField]: typedValue,
        // [dependentField]: showWrap
        //     ? parsedAmounts[independentField]?.toExact() ?? ""
        //     : Number(parsedAmounts[dependentField])?.toFixed(6) ?? "",
        [dependentField]: parsedAmounts[dependentField].toString() ?? "",
    }

    const userHasSpecifiedInputOutput = Boolean(
        currencies[Field.INPUT] &&
            currencies[Field.OUTPUT] &&
            !isNaN(parsedAmounts[independentField]) &&
            parsedAmounts[independentField] > 0 // .greaterThan(JSBI.BigInt(0))
    )

    const routeNotFound = !trade?.route

    // check whether the user has approved the router on the input token
    // const [approvalState, approveCallback] = useApproveCallbackFromTrade(trade, allowedSlippage, false)
    const approvalState = true ? ApprovalState.APPROVED : ApprovalState.PENDING
    const approveCallback = () => {
        alert("Remove approve")
    }

    const signatureData = undefined

    const handleApprove = useCallback(async () => {
        // await approveCallback()
        alert("HANDLE APPROVE SHOULD BE REMOVED")
    }, [approveCallback])

    // check if user has gone through approval process, used to show two step buttons, reset on token change
    const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

    // mark when a user has submitted an approval, reset onTokenSelection for input field
    useEffect(() => {
        if (approvalState === ApprovalState.PENDING) {
            setApprovalSubmitted(true)
        }
    }, [approvalState, approvalSubmitted])

    const maxInputAmount = Number(tokenBalances?.[0]?.balance ?? 0.0) // tokenBalances[Field.INPUT]
    const showMaxButton = Boolean(maxInputAmount! > 0 && parsedAmounts[Field.INPUT] !== maxInputAmount!)

    // the callback to execute the swap
    const { callback: swapCallback, error: swapCallbackError } = useSwapCallback(
        trade,
        allowedSlippage,
        recipient,
        signatureData,
        false ? ttl : undefined
    )

    const [singleHopOnly] = useUserSingleHopOnly()

    const handleSwap = useCallback(
        (tokens: any, amounts: any) => {
            // if (!swapCallback) {
            //     return
            // }
            // if (priceImpact && !confirmPriceImpactWithoutFee(priceImpact)) {
            //     return
            // }

            console.debug("TOKENS:", tokens)
            console.debug("AMOUNTS:", amounts)
            setSwapState({
                attemptingTxn: true,
                tradeToConfirm,
                showConfirm,
                swapErrorMessage: undefined,
                txHash: undefined,
            })

            // swapCallback()
            useFCLSwapCallback(
                fcl,
                tokens[Field.INPUT]?.symbol,
                tokens[Field.OUTPUT].symbol,
                amounts[Field.INPUT].toString(),
                amounts[Field.INPUT].toString()
            )
                .then((hash) => {
                    setSwapState({
                        attemptingTxn: false,
                        tradeToConfirm,
                        showConfirm,
                        swapErrorMessage: undefined,
                        txHash: hash.transactionId,
                    })
                })
                .catch((error) => {
                    setSwapState({
                        attemptingTxn: false,
                        tradeToConfirm,
                        showConfirm,
                        swapErrorMessage: error.message,
                        txHash: undefined,
                    })
                })
        },
        [
            swapCallback,
            // priceImpact,
            tradeToConfirm,
            showConfirm,
            recipient,
            // recipientAddress,
            account,
            trade?.inputAmount?.currency?.symbol,
            trade?.outputAmount?.currency?.symbol,
            singleHopOnly,
        ]
    )

    // errors
    const [showInverted, setShowInverted] = useState<boolean>(false)

    // warnings on slippage
    // const priceImpactSeverity = warningSeverity(priceImpactWithoutFee);
    // const priceImpactSeverity = useMemo(() => {
    //     const executionPriceImpact = trade?.priceImpact
    //     return warningSeverity(
    //         executionPriceImpact && priceImpact
    //             ? executionPriceImpact.greaterThan(priceImpact)
    //                 ? executionPriceImpact
    //                 : priceImpact
    //             : executionPriceImpact ?? priceImpact
    //     )
    // }, [priceImpact, trade])

    const isArgentWallet = false

    // show approve flow when: no error on inputs, not approved or pending, or approved in current session
    // never show if price impact is above threshold in non expert mode
    const showApproveFlow =
        !isArgentWallet &&
        !swapInputError &&
        // (approvalState === ApprovalState.NOT_APPROVED ||
        (approvalState === ApprovalState.PENDING || (approvalSubmitted && approvalState === ApprovalState.APPROVED))
    // !(priceImpactSeverity > 3 && !isExpertMode)

    const handleConfirmDismiss = useCallback(() => {
        setSwapState({
            showConfirm: false,
            tradeToConfirm,
            attemptingTxn,
            swapErrorMessage,
            txHash,
        })
        // if there was a tx hash, we want to clear the input
        if (txHash) {
            onUserInput(Field.INPUT, "")
        }
    }, [attemptingTxn, onUserInput, swapErrorMessage, tradeToConfirm, txHash])

    const handleAcceptChanges = useCallback(() => {
        setSwapState({
            tradeToConfirm: trade,
            swapErrorMessage,
            txHash,
            attemptingTxn,
            showConfirm,
        })
    }, [attemptingTxn, showConfirm, swapErrorMessage, trade, txHash])

    const handleInputSelect = useCallback(
        (inputCurrency) => {
            setApprovalSubmitted(false) // reset 2 step UI for approvals
            onCurrencySelection(Field.INPUT, inputCurrency)
        },
        [onCurrencySelection]
    )

    const handleMaxInput = useCallback(() => {
        maxInputAmount && onUserInput(Field.INPUT, maxInputAmount.toString())
    }, [maxInputAmount, onUserInput])

    const handleOutputSelect = useCallback(
        (outputCurrency) => onCurrencySelection(Field.OUTPUT, outputCurrency),
        [onCurrencySelection]
    )

    const swapIsUnsupported = false // useIsSwapUnsupported(currencies?.INPUT, currencies?.OUTPUT)
    const [animateSwapArrows, setAnimateSwapArrows] = useState<boolean>(false)

    return (
        <>
            {/* <TokenWarningModal
                isOpen={importTokensNotInDefault.length > 0 && !dismissTokenWarning}
                tokens={importTokensNotInDefault}
                onConfirm={handleConfirmTokenWarning}
            /> */}

            <TauLogo />

            <DoubleGlowShadow opacity="0.6">
                <div id="swap-page" className="w-full max-w-2xl p-4 space-y-4 rounded bg-dark-900 z-1">
                    <ExchangeHeader
                        input={currencies[Field.INPUT]}
                        output={currencies[Field.OUTPUT]}
                        allowedSlippage={allowedSlippage}
                    />

                    {/* <ConfirmSwapModal
                        isOpen={showConfirm}
                        trade={trade}
                        originalTrade={tradeToConfirm}
                        onAcceptChanges={handleAcceptChanges}
                        attemptingTxn={attemptingTxn}
                        txHash={txHash}
                        recipient={recipient}
                        allowedSlippage={allowedSlippage}
                        onConfirm={handleSwap}
                        swapErrorMessage={swapErrorMessage}
                        onDismiss={handleConfirmDismiss}
                        minerBribe={undefined}
                    /> */}

                    <div>
                        <CurrencyInputPanel
                            label={independentField === Field.OUTPUT && !showWrap ? `Swap From (est.):` : `Swap From:`}
                            value={formattedAmounts[Field.INPUT]}
                            showMaxButton={showMaxButton}
                            currency={currencies[Field.INPUT]}
                            currencyBalance={tokenBalances?.[0]?.balance}
                            onUserInput={handleTypeInput}
                            onMax={handleMaxInput}
                            fiatValue={fiatValueInput ?? undefined}
                            // fiatValue={undefined}
                            onCurrencySelect={handleInputSelect}
                            otherCurrency={currencies[Field.OUTPUT]}
                            showCommonBases={true}
                            id="swap-currency-input"
                        />

                        <AutoColumn justify="space-between" className="py-3">
                            <AutoRow
                                justify={isExpertMode ? "space-between" : "flex-start"}
                                style={{ padding: "0 1rem" }}
                            >
                                <button
                                    className="z-10 -mt-6 -mb-6 rounded-full"
                                    onClick={() => {
                                        setApprovalSubmitted(false) // reset 2 step UI for approvals
                                        onSwitchTokens()
                                    }}
                                >
                                    <div className="rounded-full bg-dark-900 p-3px">
                                        <div
                                            className="p-3 rounded-full bg-dark-800 hover:bg-dark-700"
                                            onMouseEnter={() => setAnimateSwapArrows(true)}
                                            onMouseLeave={() => setAnimateSwapArrows(false)}
                                        >
                                            <Lottie
                                                animationData={swapArrowsAnimationData}
                                                autoplay={animateSwapArrows}
                                                loop={false}
                                                style={{ width: 32, height: 32 }}
                                            />
                                        </div>
                                    </div>
                                </button>
                            </AutoRow>
                        </AutoColumn>

                        <div>
                            <CurrencyInputPanel
                                value={formattedAmounts[Field.OUTPUT]}
                                onUserInput={handleTypeOutput}
                                label={independentField === Field.INPUT && !showWrap ? `Swap To (est.):` : `Swap To:`}
                                showMaxButton={false}
                                hideBalance={false}
                                fiatValue={fiatValueOutput ?? undefined}
                                priceImpact={undefined}
                                currency={currencies[Field.OUTPUT]}
                                currencyBalance={tokenBalances?.[1]?.balance}
                                onCurrencySelect={handleOutputSelect}
                                otherCurrency={currencies[Field.INPUT]}
                                showCommonBases={true}
                                id="swap-currency-output"
                            />
                            {Boolean(trade) && (
                                <div className="p-1 -mt-2 rounded-b-md bg-dark-800">
                                    <TradePrice
                                        price={trade?.executionPrice}
                                        showInverted={showInverted}
                                        setShowInverted={setShowInverted}
                                        className="bg-dark-900"
                                        trade={trade}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {recipient !== null && !showWrap && (
                        <AddressInputPanel id="recipient" value={recipient} onChange={onChangeRecipient} />
                    )}

                    <BottomGrouping>
                        {swapIsUnsupported ? (
                            <Button color="red" size="lg" disabled>
                                {`Unsupported Asset`}
                            </Button>
                        ) : !fcl.account ? (
                            <Web3Connect size="lg" color="gradient" className="w-full" />
                        ) : (
                            // ) : showWrap ? (
                            //     <Button
                            //         color="gradient"
                            //         size="lg"
                            //         className="font-bold text-light"
                            //         disabled={Boolean(wrapInputError)}
                            //         onClick={onWrap}
                            //     >
                            //         {wrapInputError ??
                            //             (wrapType === WrapType.WRAP
                            //                 ? `Wrap`
                            //                 : wrapType === WrapType.UNWRAP
                            //                 ? `Unwrap`
                            //                 : null)}
                            //     </Button>

                            // routeNotFound && userHasSpecifiedInputOutput ? (
                            //     <div style={{ textAlign: "center" }}>
                            //         <div className="mb-1">{`Insufficient liquidity for this trade`}</div>
                            //         {singleHopOnly && <div className="mb-1">{`Try enabling multi-hop trades`}</div>}
                            //     </div>
                            // ) : showApproveFlow ? (
                            //     <RowBetween>
                            //         {approvalState !== ApprovalState.APPROVED && (
                            //             <ButtonConfirmed
                            //                 onClick={handleApprove}
                            //                 // disabled={approvalState === ApprovalState.APPROVED || approvalSubmitted}
                            //                 disabled={true}
                            //             >
                            //                 {approvalState === ApprovalState.PENDING ? (
                            //                     <AutoRow gap="6px" justify="center">
                            //                         Approving <Loader stroke="white" />
                            //                     </AutoRow>
                            //                 ) : (
                            //                     `Approve ${currencies[Field.INPUT]?.symbol}`
                            //                 )}
                            //             </ButtonConfirmed>
                            //         )}

                            //         {approvalState === ApprovalState.APPROVED && (
                            //             <ButtonError
                            //                 className="font-bold text-light"
                            //                 onClick={() => {
                            //                     if (isExpertMode) {
                            //                         handleSwap()
                            //                     } else {
                            //                         setSwapState({
                            //                             tradeToConfirm: trade,
                            //                             attemptingTxn: false,
                            //                             swapErrorMessage: undefined,
                            //                             showConfirm: true,
                            //                             txHash: undefined,
                            //                         })
                            //                     }
                            //                 }}
                            //                 style={{
                            //                     width: "100%",
                            //                 }}
                            //                 id="swap-button"
                            //                 disabled={
                            //                     !isValid || approvalState !== ApprovalState.APPROVED
                            //                     // (priceImpactSeverity > 3 && !isExpertMode)
                            //                 }
                            //                 // error={isValid && priceImpactSeverity > 2}
                            //             >
                            //                 {/* {priceImpactSeverity > 3 && !isExpertMode
                            //                     ? `Price Impact High`
                            //                     : priceImpactSeverity > 2
                            //                     ? `Swap Anyway`
                            //                     : `Swap`} */}
                            //                 {"Swap"}
                            //             </ButtonError>
                            //         )}
                            //     </RowBetween>
                            // ) : (
                            <ButtonError
                                onClick={() => {
                                    // if (isExpertMode) {
                                    handleSwap(currencies, parsedAmounts)
                                    // } else {
                                    //     setSwapState({
                                    //         tradeToConfirm: trade,
                                    //         attemptingTxn: false,
                                    //         swapErrorMessage: undefined,
                                    //         showConfirm: true,
                                    //         txHash: undefined,
                                    //     })
                                    // }
                                }}
                                id="swap-button"
                                // disabled={!isValid || (priceImpactSeverity > 3 && !isExpertMode) || !!swapCallbackError}
                                disabled={
                                    (parsedAmounts[Field.INPUT] <= 0 &&
                                        parsedAmounts[Field.INPUT] > +tokenBalances?.[0]?.balance) ||
                                    (parsedAmounts[Field.OUTPUT] <= 0 &&
                                        parsedAmounts[Field.OUTPUT] > +tokenBalances?.[1]?.balance)
                                }
                                // error={isValid && priceImpactSeverity > 2 && !swapCallbackError}
                                // error={isValid && !swapCallbackError}
                            >
                                {/* {swapInputError
                                    ? swapInputError
                                    : priceImpactSeverity > 3 && !isExpertMode
                                    ? `Price Impact Too High`
                                    : priceImpactSeverity > 2
                                    ? `Swap Anyway`
                                    : `Swap`} */}
                                {"Swap"}
                            </ButtonError>
                        )}
                        {/* // {showApproveFlow && (
                        //     <Column style={{ marginTop: "1rem" }}>
                        //         <ProgressSteps steps={[approvalState === ApprovalState.APPROVED]} />
                        //     </Column>
                        // )}
                        // {isExpertMode && swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null} */}
                    </BottomGrouping>
                    {/* {!swapIsUnsupported ? null : (
                        <UnsupportedCurrencyFooter
                            show={swapIsUnsupported}
                            currencies={[currencies.INPUT, currencies.OUTPUT]}
                        />
                    )} */}
                </div>
            </DoubleGlowShadow>
        </>
    )
}
