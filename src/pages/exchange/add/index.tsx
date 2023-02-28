import { ApprovalState, useApproveCallback } from "../../../hooks/useApproveCallback"
import { AutoRow, RowBetween } from "../../../components/Row"
import Button, { ButtonError } from "../../../components/Button"
import { Currency, CurrencyAmount, Percent, WNATIVE, currencyEquals } from "../../../sdk"
import { ZERO_PERCENT } from "../../../constants"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import TransactionConfirmationModal, { ConfirmationModalContent } from "../../../modals/TransactionConfirmationModal"
import { calculateGasMargin, calculateSlippageAmount } from "../../../functions/trade"
import { currencyId, maxAmountSpend } from "../../../functions/currency"
import { useDerivedMintInfo, useMintActionHandlers, useMintState } from "../../../state/mint/hooks"
import { useExpertModeManager, useUserSlippageToleranceWithDefault } from "../../../state/user/hooks"

import { AutoColumn } from "../../../components/Column"
import { BigNumber } from "@ethersproject/bignumber"
import { ConfirmAddModalBottom } from "../../../features/liquidity/ConfirmAddModalBottom"
import Container from "../../../components/Container"
import CurrencyInputPanel from "../../../components/CurrencyInputPanel"
import Dots from "../../../components/Dots"
import DoubleCurrencyLogo from "../../../components/DoubleLogo"
import ExchangeHeader from "../../../components/ExchangeHeader"
import { Field } from "../../../state/mint/actions"
import Head from "next/head"
import LiquidityPrice from "../../../features/liquidity/LiquidityPrice"
import { MinimalPositionCard } from "../../../components/PositionCard"
import NavLink from "../../../components/NavLink"
import { PairState } from "../../../hooks/useV2Pairs"
import { Plus } from "react-feather"
import ReactGA from "react-ga"
import { TransactionResponse } from "@ethersproject/providers"
import UnsupportedCurrencyFooter from "../../../features/swap/UnsupportedCurrencyFooter"
import Web3Connect from "../../../components/Web3Connect"

import { useActiveWeb3React } from "../../../hooks/useActiveWeb3React"
import { useCurrency } from "../../../hooks/Tokens"
import { useIsSwapUnsupported } from "../../../hooks/useIsSwapUnsupported"

import { useRouter } from "next/router"
import { useRouterContract } from "../../../hooks"
import { useTransactionAdder } from "../../../state/transactions/hooks"
import useTransactionDeadline from "../../../hooks/useTransactionDeadline"
import { useWalletModalToggle } from "../../../state/application/hooks"
import DoubleGlowShadow from "../../../components/DoubleGlowShadow"
import { updateAddTokensRouter } from "../../../sdk/utils/utils"
import TauLogo from "../../../components/TauLogo"
import { useFlowTokenBalances } from "../../../fcl/scripts/token/getTokenBalances"
import { useFCL } from "../../../hooks/fcl/useFCL"
import { FCL_TOKENS, IFCL_TOKEN } from "../../../fcl/addresses/addresses"
import { useFCLAddLiquidityCallback } from "../../../fcl/transactions/swap/addLiquidity"

const DEFAULT_ADD_V2_SLIPPAGE_TOLERANCE = new Percent(50, 10_000)
const ADD_JSON_STORAGE = "add-tokens"

export default function Add() {
    const { account, chainId, library } = useActiveWeb3React()
    const fcl = useFCL()
    const [reRenderValue, reRender] = useState(1)
    console.debug("Account:", fcl.account)

    const [currencyIdA, currencyIdB] = (JSON.parse(localStorage?.getItem(ADD_JSON_STORAGE))?.tokens as string[]) || [
        undefined,
        undefined,
    ]

    function updateRouter(tokenA: string, tokenB: string) {
        updateAddTokensRouter(tokenA, tokenB)
        reRender(Math.random())
    }

    const currencyA = FCL_TOKENS.find((t) => t.id === currencyIdA)
    const currencyB = FCL_TOKENS.find((t) => t.id === currencyIdB)

    const currencies: { [field in Field]?: IFCL_TOKEN } = useMemo(
        () => ({
            [Field.CURRENCY_A]: currencyA ?? undefined,
            [Field.CURRENCY_B]: currencyB ?? undefined,
        }),
        [currencyA, currencyB]
    )

    const tokenBalances = useFlowTokenBalances(
        [currencies[Field.CURRENCY_A]?.symbol, currencies[Field.CURRENCY_B]?.symbol],
        fcl.account
    )

    const oneCurrencyIsWETH = false

    const [isExpertMode] = [true] // useExpertModeManager()

    // mint state
    const { independentField, typedValue, otherTypedValue } = useMintState()
    const dependentField = independentField === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A
    // const {
    //     dependentField,
    //     currencies,
    //     pair,
    //     pairState,
    //     currencyBalances,
    //     parsedAmounts,
    //     price,
    //     noLiquidity,
    //     liquidityMinted,
    //     poolTokenPercentage,
    //     error,
    // } = useDerivedMintInfo(currencyA ?? undefined, currencyB ?? undefined)

    const { onFieldAInput, onFieldBInput } = useMintActionHandlers(false)

    // modal and loading
    const [showConfirm, setShowConfirm] = useState<boolean>(false)
    const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

    // txn values
    const deadline = useTransactionDeadline() // custom from users settings

    // const [allowedSlippage] = useUserSlippageTolerance(); // custom from users

    const allowedSlippage = useUserSlippageToleranceWithDefault(DEFAULT_ADD_V2_SLIPPAGE_TOLERANCE) // custom from users

    const [txHash, setTxHash] = useState<string>("")

    // get formatted amounts
    const formattedAmounts = {
        [independentField]: typedValue,
        [dependentField]: typedValue, // parsedAmounts[dependentField]?.toSignificant(6) ?? "",
    }

    // get the max amounts user can add
    const maxAmounts: { [field in Field]?: string } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
        (accumulator, field, index) => {
            return {
                ...accumulator,
                [field]: tokenBalances?.[index]?.balance ?? "0.0",
            }
        },
        {}
    )

    const atMaxAmounts: { [field in Field]?: string } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
        (accumulator, field) => {
            return {
                ...accumulator,
                [field]: +maxAmounts[field] === +typedValue, // parsedAmounts[field] ?? "0"),
            }
        },
        {}
    )

    const isValid =
        +typedValue >= 0 && +typedValue <= +tokenBalances?.[0]?.balance && +typedValue <= +tokenBalances?.[1]?.balance

    // const routerContract = useRouterContract()

    // check whether the user has approved the router on the tokens
    // const [approvalA, approveACallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_A], routerContract?.address)
    // const [approvalB, approveBCallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_B], routerContract?.address)

    // const addTransaction = useTransactionAdder()

    async function onAdd(tokens: any, typedVal: string) {
        // if (!chainId || !library || !account || !routerContract) return

        // const { [Field.CURRENCY_A]: parsedAmountA, [Field.CURRENCY_B]: parsedAmountB } = parsedAmounts

        // if (!parsedAmountA || !parsedAmountB || !currencyA || !currencyB || !deadline) {
        //     return
        // }

        // const amountsMin = {
        //     [Field.CURRENCY_A]: calculateSlippageAmount(parsedAmountA, noLiquidity ? ZERO_PERCENT : allowedSlippage)[0],
        //     [Field.CURRENCY_B]: calculateSlippageAmount(parsedAmountB, noLiquidity ? ZERO_PERCENT : allowedSlippage)[0],
        // }

        // let estimate,
        //     method: (...args: any) => Promise<TransactionResponse>,
        //     args: Array<string | string[] | number>,
        //     value: BigNumber | null
        // if (currencyA.isNative || currencyB.isNative) {
        //     const tokenBIsETH = currencyB.isNative
        //     estimate = routerContract.estimateGas.addLiquidityETH
        //     method = routerContract.addLiquidityETH
        //     args = [
        //         (tokenBIsETH ? currencyA : currencyB)?.wrapped?.address ?? "", // token
        //         (tokenBIsETH ? parsedAmountA : parsedAmountB).quotient.toString(), // token desired
        //         amountsMin[tokenBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(), // token min
        //         amountsMin[tokenBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(), // eth min
        //         account,
        //         deadline.toHexString(),
        //     ]
        //     value = BigNumber.from((tokenBIsETH ? parsedAmountB : parsedAmountA).quotient.toString())
        // } else {
        //     estimate = routerContract.estimateGas.addLiquidity
        //     method = routerContract.addLiquidity
        //     args = [
        //         currencyA?.wrapped?.address ?? "",
        //         currencyB?.wrapped?.address ?? "",
        //         parsedAmountA.quotient.toString(),
        //         parsedAmountB.quotient.toString(),
        //         amountsMin[Field.CURRENCY_A].toString(),
        //         amountsMin[Field.CURRENCY_B].toString(),
        //         account,
        //         deadline.toHexString(),
        //     ]
        //     value = null
        // }

        setAttemptingTxn(true)
        useFCLAddLiquidityCallback(
            fcl,
            tokens[Field.CURRENCY_A]?.symbol,
            tokens[Field.CURRENCY_B]?.symbol,
            typedVal,
            typedVal
        ).then((res: any) => {
            console.debug("Result:", res)
            alert("Added liquidity")
        })

        // await estimate(...args, value ? { value } : {})
        //     .then((estimatedGasLimit) => {
        //         return method(...args, {
        //             ...(value ? { value } : {}),
        //             gasLimit: calculateGasMargin(estimatedGasLimit),
        //         }).then((response) => {
        //             setAttemptingTxn(false)

        //             addTransaction(response, {
        //                 summary: `Add ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(3)} ${
        //                     currencies[Field.CURRENCY_A]?.symbol
        //                 } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(3)} ${
        //                     currencies[Field.CURRENCY_B]?.symbol
        //                 }`,
        //             })

        //             setTxHash(response.hash)

        //             ReactGA.event({
        //                 category: "Liquidity",
        //                 action: "Add",
        //                 label: [currencies[Field.CURRENCY_A]?.symbol, currencies[Field.CURRENCY_B]?.symbol].join("/"),
        //             })
        //         })
        //     })
        //     .catch((error) => {
        //         //fallback
        //         method(...args, {
        //             ...(value ? { value } : {}),
        //             gasLimit: "1000000",
        //         })
        //             .then((response) => {
        //                 setAttemptingTxn(false)

        //                 addTransaction(response, {
        //                     summary: `Add ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(3)} ${
        //                         currencies[Field.CURRENCY_A]?.symbol
        //                     } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(3)} ${
        //                         currencies[Field.CURRENCY_B]?.symbol
        //                     }`,
        //                 })

        //                 setTxHash(response.hash)

        //                 ReactGA.event({
        //                     category: "Liquidity",
        //                     action: "Add",
        //                     label: [currencies[Field.CURRENCY_A]?.symbol, currencies[Field.CURRENCY_B]?.symbol].join(
        //                         "/"
        //                     ),
        //                 })
        //             })
        //             .catch((e) => {
        //                 setAttemptingTxn(false)

        //                 // we only care if the error is something _other_ than the user rejected the tx
        //                 if (e?.code !== 4001) {
        //                     console.error(e)
        //                 }
        //             })

        //         // we only care if the error is something _other_ than the user rejected the tx
        //         if (error?.code !== 4001) {
        //             console.error(error)
        //         }
        //     })
    }

    // const modalHeader = () => {
    //     return noLiquidity ? (
    //         <div className="pb-4">
    //             <div className="flex items-center justify-start gap-3">
    //                 <div className="text-2xl font-bold text-high-emphesis">
    //                     {currencies[Field.CURRENCY_A]?.symbol + "/" + currencies[Field.CURRENCY_B]?.symbol}
    //                 </div>
    //                 <DoubleCurrencyLogo currency0={currencyA} currency1={currencyB} size={48} />
    //             </div>
    //         </div>
    //     ) : (
    //         <div className="pb-4">
    //             <div className="flex items-center justify-start gap-3">
    //                 <div className="text-xl font-bold md:text-3xl text-high-emphesis">
    //                     {liquidityMinted?.toSignificant(6)}
    //                 </div>
    //                 <div className="grid grid-flow-col gap-2">
    //                     <DoubleCurrencyLogo currency0={currencyA} currency1={currencyB} size={48} />
    //                 </div>
    //             </div>
    //             <div className="text-lg font-medium md:text-2xl text-high-emphesis">
    //                 {currencies[Field.CURRENCY_A]?.symbol}/{currencies[Field.CURRENCY_B]?.symbol}
    //                 &nbsp;{`Pool Tokens`}
    //             </div>
    //             <div className="pt-3 text-xs italic text-secondary">
    //                 {`Output is estimated. If the price changes by more than ${allowedSlippage.toSignificant(
    //                     4
    //                 )}% your transaction will revert.`}
    //             </div>
    //         </div>
    //     )
    // }

    // const modalBottom = () => {
    //     return (
    //         <ConfirmAddModalBottom
    //             price={price}
    //             currencies={currencies}
    //             parsedAmounts={parsedAmounts}
    //             noLiquidity={noLiquidity}
    //             onAdd={onAdd}
    //             poolTokenPercentage={poolTokenPercentage}
    //         />
    //     )
    // }

    // const pendingText = `Supplying ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)} ${
    //     currencies[Field.CURRENCY_A]?.symbol
    // }
    // and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)} ${currencies[Field.CURRENCY_B]?.symbol}`

    const handleCurrencyASelect = useCallback(
        (currencyA: Currency) => {
            const newCurrencyIdA = currencyId(currencyA)
            if (newCurrencyIdA === currencyIdB) {
                updateRouter(currencyIdB, currencyIdA)
            } else {
                updateRouter(newCurrencyIdA, currencyIdB)
            }
        },
        [currencyIdB, currencyIdA]
    )

    const handleCurrencyBSelect = useCallback(
        (currencyB: Currency) => {
            const newCurrencyIdB = currencyId(currencyB)
            if (currencyIdA === newCurrencyIdB) {
                if (currencyIdB) {
                    updateRouter(currencyIdB, newCurrencyIdB)
                } else {
                    updateRouter(newCurrencyIdB, undefined)
                }
            } else {
                updateRouter(currencyIdA ? currencyIdA : "ETH", newCurrencyIdB)
            }
        },
        [currencyIdA, currencyIdB]
    )

    const handleDismissConfirmation = useCallback(() => {
        setShowConfirm(false)
        // if there was a tx hash, we want to clear the input
        if (txHash) {
            onFieldAInput("")
        }
        setTxHash("")
    }, [onFieldAInput, txHash])

    // const addIsUnsupported = useIsSwapUnsupported(currencies?.CURRENCY_A, currencies?.CURRENCY_B)

    return (
        <>
            <Head>
                <title>Add Liquidity | Tau</title>
                <meta
                    key="description"
                    name="description"
                    content="Add liquidity to the Solarbeam AMM to enable gas optimised and low slippage trades across countless networks"
                />
            </Head>

            <TauLogo />

            <Container id="remove-liquidity-page" maxWidth="2xl" className="space-y-4">
                <DoubleGlowShadow>
                    <div className="p-4 space-y-4 rounded bg-dark-900" style={{ zIndex: 1 }}>
                        <ExchangeHeader
                            input={currencies[Field.CURRENCY_A]}
                            output={currencies[Field.CURRENCY_B]}
                            allowedSlippage={allowedSlippage}
                        />

                        {/* <TransactionConfirmationModal
                            isOpen={showConfirm}
                            onDismiss={handleDismissConfirmation}
                            attemptingTxn={attemptingTxn}
                            hash={txHash}
                            content={() => (
                                <ConfirmationModalContent
                                    title={noLiquidity ? `You are creating a pool` : `You will receive`}
                                    onDismiss={handleDismissConfirmation}
                                    topContent={modalHeader}
                                    bottomContent={modalBottom}
                                />
                            )}
                            pendingText={pendingText}
                        /> */}
                        <div className="flex flex-col space-y-4">
                            {/* {pair && pairState !== PairState.INVALID && (
                                <LiquidityHeader input={currencies[Field.CURRENCY_A]} output={currencies[Field.CURRENCY_B]} />
                            )} */}

                            <div>
                                <CurrencyInputPanel
                                    value={formattedAmounts[Field.CURRENCY_A]}
                                    onUserInput={onFieldAInput}
                                    onMax={() => {
                                        onFieldAInput(maxAmounts[Field.CURRENCY_A] ?? "")
                                    }}
                                    onCurrencySelect={handleCurrencyASelect}
                                    showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
                                    currency={currencies[Field.CURRENCY_A]}
                                    currencyBalance={tokenBalances[0]?.balance}
                                    id="add-liquidity-input-tokena"
                                    showCommonBases
                                />

                                <AutoColumn justify="space-between" className="py-2.5">
                                    <AutoRow
                                        justify={isExpertMode ? "space-between" : "flex-start"}
                                        style={{ padding: "0 1rem" }}
                                    >
                                        <button className="z-10 -mt-6 -mb-6 rounded-full cursor-default bg-dark-900 p-3px">
                                            <div className="p-3 rounded-full bg-dark-800">
                                                <Plus size="32" />
                                            </div>
                                        </button>
                                    </AutoRow>
                                </AutoColumn>

                                <CurrencyInputPanel
                                    value={formattedAmounts[Field.CURRENCY_B]}
                                    onUserInput={onFieldBInput}
                                    onCurrencySelect={handleCurrencyBSelect}
                                    onMax={() => {
                                        onFieldBInput(maxAmounts[Field.CURRENCY_B] ?? "")
                                    }}
                                    showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
                                    currency={currencies[Field.CURRENCY_B]}
                                    currencyBalance={tokenBalances[1]?.balance}
                                    id="add-liquidity-input-tokenb"
                                    showCommonBases
                                />
                            </div>

                            {/* {currencies[Field.CURRENCY_A] &&
                                currencies[Field.CURRENCY_B] &&
                                pairState !== PairState.INVALID && (
                                    <div className="p-1 rounded bg-dark-800">
                                        <LiquidityPrice
                                            currencies={currencies}
                                            price={price}
                                            noLiquidity={noLiquidity}
                                            poolTokenPercentage={poolTokenPercentage}
                                            className="bg-dark-900"
                                        />
                                    </div>
                                )} */}

                            {/* {addIsUnsupported ? ( */}
                            {/* <Button color="gradient" size="lg" disabled> */}
                            {/* {`Unsupported Asset`} */}
                            {/* </Button> */}
                            {/* ) : !fcl.account ? ( */}
                            {!fcl.account ? (
                                <Web3Connect size="lg" color="gradient" className="w-full" />
                            ) : !isValid ? (
                                <Button size="lg" color="gray" className="w-full" disabled>
                                    {`Enter an amount`}
                                </Button>
                            ) : (
                                isValid && (
                                    <AutoColumn gap={"md"}>
                                        {/* {
                                            <RowBetween>
                                                {approvalA !== ApprovalState.APPROVED && (
                                                    <Button
                                                        color="gradient"
                                                        size="lg"
                                                        onClick={approveACallback}
                                                        disabled={approvalA === ApprovalState.PENDING}
                                                        style={{
                                                            width:
                                                                approvalB !== ApprovalState.APPROVED ? "48%" : "100%",
                                                        }}
                                                    >
                                                        {approvalA === ApprovalState.PENDING ? (
                                                            <Dots>{`Approving ${
                                                                currencies[Field.CURRENCY_A]?.symbol
                                                            }`}</Dots>
                                                        ) : (
                                                            `Approve ${currencies[Field.CURRENCY_A]?.symbol}`
                                                        )}
                                                    </Button>
                                                )}
                                                {approvalB !== ApprovalState.APPROVED && (
                                                    <Button
                                                        color="gradient"
                                                        size="lg"
                                                        onClick={approveBCallback}
                                                        disabled={approvalB === ApprovalState.PENDING}
                                                        style={{
                                                            width:
                                                                approvalA !== ApprovalState.APPROVED ? "48%" : "100%",
                                                        }}
                                                    >
                                                        {approvalB === ApprovalState.PENDING ? (
                                                            <Dots>{`Approving ${
                                                                currencies[Field.CURRENCY_B]?.symbol
                                                            }`}</Dots>
                                                        ) : (
                                                            `Approve ${currencies[Field.CURRENCY_B]?.symbol}`
                                                        )}
                                                    </Button>
                                                )}
                                            </RowBetween>
                                        } */}

                                        {/* {approvalA === ApprovalState.APPROVED && */}
                                        {/* approvalB === ApprovalState.APPROVED && ( */}
                                        <ButtonError
                                            onClick={() => {
                                                isExpertMode ? onAdd(currencies, typedValue) : setShowConfirm(true)
                                            }}
                                            disabled={
                                                !isValid
                                                // approvalA !== ApprovalState.APPROVED ||
                                                // approvalB !== ApprovalState.APPROVED
                                            }
                                            error={
                                                !isValid
                                                // !!parsedAmounts[Field.CURRENCY_A] &&
                                                // !!parsedAmounts[Field.CURRENCY_B]
                                            }
                                        >
                                            {`Confirm Adding Liquidity`}
                                        </ButtonError>
                                        {/* )} */}
                                    </AutoColumn>
                                )
                            )}
                        </div>

                        {/* {!addIsUnsupported ? (
                            pair && !noLiquidity && pairState !== PairState.INVALID ? (
                                <MinimalPositionCard showUnwrapped={oneCurrencyIsWETH} pair={pair} />
                            ) : null
                        ) : (
                            <UnsupportedCurrencyFooter
                                show={addIsUnsupported}
                                currencies={[currencies.CURRENCY_A, currencies.CURRENCY_B]}
                            />
                        )} */}
                    </div>
                </DoubleGlowShadow>
                {/* <div className="flex items-center px-4">
                    <NavLink href="/exchange/pool">
                        <a className="flex items-center space-x-2 font-medium text-center cursor-pointer text-base hover:text-high-emphesis">
                            <span>{`View Liquidity Positions`}</span>
                        </a>
                    </NavLink>
                </div> */}
            </Container>
        </>
    )
}
