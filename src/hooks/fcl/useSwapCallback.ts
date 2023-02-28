import { useCallback, useMemo } from "react"
import { useFCL } from "./useFCL"
import { INITIAL_ALLOWED_SLIPPAGE } from "../constants"
import { useTransactionAdder } from "../state/transactionsFlow/hooks"
import { computeSlippageAdjustedAmounts } from "../utils/prices"
import { Field } from "../state/swap/actions"
import { FlowTokenMetadata, PairDetail, TokenInfo, TransactionResponse } from "../types"
import { ChainId, TradeType } from "@uniswap/sdk"
// import useSwapRouter from "./useSwapRouter"
import useFlowTokenMetadata from "./useFlowTokenMetadata"
import { COMMON_ADDRESS } from "../../fcl/addresses/addresses"

// @todo: move network to a global context so to make switching network easier
const NETWORK = process.env.REACT_APP_NETWORK ?? "testnet"

export enum SwapCallbackState {
    INVALID,
    LOADING,
    VALID,
}

export const scriptBuilder = (
    route: Array<{ from: string; to: string; pair: PairDetail }>,
    token1: string,
    token2: string,
    tokenMetadata: FlowTokenMetadata[],
    isExactIn: boolean
) => {
    const args0 = isExactIn ? "amountIn: UFix64" : "maxAmountIn: UFix64"
    const args1 = isExactIn ? "minAmountOut: UFix64" : "amountOut: UFix64"

    const tokenStart = tokenMetadata[0]
    const tokenDest = tokenMetadata[tokenMetadata.length - 1]
    if (!tokenStart || !tokenDest) return ""
    // const vaultStart = `${tokenStart.name}Vault`
    // const vaultDest = `${tokenDest.name}Vault`

    // const importSwapPairsSnippet = route.map(({ pair }) => `import ${pair.name} from ${pair.address}`).join("\n")

    // const declareAmountsSnippet = route
    // .slice()
    // .reverse()
    // .map(({ pair, from, to }, index) => {
    // const { token0, name } = pair
    // const symbol = index === route.length - 1 ? "amountIn" : `amount${index}`
    const symbol = "amountIn"
    const amountOut = "amountOut"
    const t0 = isExactIn ? token1 : token2
    const tokenFrom = `${isExactIn ? "Exact" : ""}${token1 === t0 ? "Token2" : "Token1"}`
    const tokenTo = `${isExactIn ? "" : "Exact"}${token1 === t0 ? "Token1" : "Token2"}`
    const swapMethod = `quoteSwap${tokenFrom}For${tokenTo}`
    const name = `${token1}_${token2}_ExchangeRouter`

    const val = isExactIn
        ? `let ${symbol} = ${name}.${swapMethod}(amount: ${amountOut} * (1.0 - ${name}.getFeePercentage()))`
        : `let ${symbol} = ${name}.${swapMethod}(amount: ${amountOut}) / (1.0 - ${name}.getFeePercentage())`
    // })
    // .join("\n")

    const checkVaultExistSnippet = `
            if signer.borrow<&${token2}.Vault>(from: ${token2}.vaultStoragePath) == nil {
                signer.save(<-${token2}.createEmptyVault(), to: ${token2}.vaultStoragePath)

                signer.link<&${token2}.Vault{FungibleToken.Receiver}>(
                    ${token2}.receiverPublicPath,
                    target: ${token2}.vaultStoragePath
                )

                signer.link<&${token2}.Vault{FungibleToken.Balance}>(
                    ${token2}.balancePublicPath,
                    target: ${token2}.vaultStoragePath
                )
            }
    `

    // const swapSnippet = route
    // .map(({ pair, from }, index) => {
    // const { token0 } = pair
    const previous = `token1Vault`
    const _symbol = `token2Vault`
    const _tokenFrom = "Token1"
    const _tokenTo = "Token2"
    const _swapMethod = `swap${_tokenFrom}For${_tokenTo}`
    const swapSnippet = `let ${_symbol} <- ${name}.${_swapMethod}(from: <- ${previous})`
    // })
    // .join("\n")

    const minInputAssertion = `assert(amountIn <= maxAmountIn, message: "Input amount too large")`
    const finalAmountValut = `token${route.length}Vault`
    const minOutputAssertion = `assert(${finalAmountValut}.balance >= minAmountOut, message: "Output amount too small")`

    return `
        import FungibleToken from ${COMMON_ADDRESS}
        import ${token1} from ${COMMON_ADDRESS}
        import ${token2} from ${COMMON_ADDRESS}
        
        transaction(${args0}, ${args1}) {
            prepare(signer: AuthAccount) {
                ${!isExactIn ? val : ""}
                ${!isExactIn ? minInputAssertion : ""}
            
                let fromVaultRef = signer.borrow<&${token1}.Vault>(from: ${token1}.vaultStoragePath) 
                    ?? panic("Could not borrow a reference to ${token1} Vault")
            
                let token1Vault <- fromVaultRef.withdraw(amount: amountIn) as! @${token1}.Vault
                let token2Vault <- ${name}.swapToken1ForToken2(from: <- token1Vault)
            
                ${checkVaultExistSnippet}
                let destVaultRef = signer.borrow<&${token2}.Vault>(from: ${token2}.vaultStoragePath) 
                    ?? panic("Could not borrow a reference to ${token2} Vault")
            
                ${isExactIn ? minOutputAssertion : ""}
            
                destVaultRef.deposit(from: <- ${finalAmountValut})
            }
        }
    `
}

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapCallback(
    trade: Trade | undefined, // trade to execute, required
    allowedSlippage: number = INITIAL_ALLOWED_SLIPPAGE // in bips
): { state: SwapCallbackState; callback: null | (() => Promise<string>); error: string | null } {
    const { account, fcl, authorization, types } = useFCL()

    const addTransaction = useTransactionAdder()
    const router = useSwapRouter()
    const flowTokensMedadata = useFlowTokenMetadata()

    const createScript = useCallback(
        (oldrouterPlan, isExactIn) => {
            if (!oldrouterPlan) return null
            const { pathDetails, path } = oldrouterPlan
            const tokenMetadata = path.map((tokenInfo: TokenInfo) =>
                flowTokensMedadata.find((meta) => meta.symbol === tokenInfo.symbol)
            )
            if (!pathDetails || !pathDetails.length) return null
            return scriptBuilder(pathDetails, tokenMetadata, isExactIn)
        },
        [flowTokensMedadata]
    )

    return useMemo(() => {
        if (!trade || !account || !trade?.inputCurrency?.symbol || !trade?.outputCurrency?.symbol) {
            return { state: SwapCallbackState.INVALID, callback: null, error: "Missing dependencies" }
        }

        const isExactIn = trade.tradeType === TradeType.EXACT_INPUT

        const { inputCurrency, outputCurrency } = trade
        const symbolIn = inputCurrency?.symbol
        const symbolOut = outputCurrency?.symbol
        const oldrouterPlan = oldrouter.plan(symbolIn, symbolOut)
        let script = createScript(oldrouterPlan, isExactIn)
        if (!script)
            return {
                state: SwapCallbackState.INVALID,
                callback: null,
                error: `${symbolIn}-${symbolOut} pair does not exist.`,
            }
        script = replaceContractAddresses(script, NETWORK === "mainnet" ? ChainId.MAINNET : ChainId.RINKEBY)
        if (!script) {
            return { state: SwapCallbackState.INVALID, callback: null, error: "Cannot find swap sciprt" }
        }

        const slippage = trade && allowedSlippage && computeSlippageAdjustedAmounts(trade, allowedSlippage)
        const maxAmountIn = (slippage && slippage[Field.INPUT]) || trade.inputAmount
        const minAmountOut = (slippage && slippage[Field.OUTPUT]) || trade.outputAmount
        const formattedInput = isExactIn ? trade.inputAmount.toFixed(8) : maxAmountIn.toFixed(8)
        const formattedOutput = isExactIn ? minAmountOut.toFixed(8) : trade.outputAmount.toFixed(8)

        const isSealed = false

        return {
            state: SwapCallbackState.VALID,
            callback: async function onSwap(): Promise<string> {
                return fcl
                    .send([fcl.getBlock(isSealed)])
                    .then(fcl.decode)
                    .then((block: any) =>
                        fcl.send([
                            fcl.transaction(script),
                            fcl.args([fcl.arg(formattedInput, types.UFix64), fcl.arg(formattedOutput, types.UFix64)]),
                            fcl.limit(300),
                            fcl.proposer(authorization),
                            fcl.authorizations([authorization]),
                            fcl.payer(authorization),
                            fcl.ref(block.id),
                        ])
                    )
                    .then((response: TransactionResponse) => {
                        const inputSymbol = trade.inputCurrency.symbol
                        const outputSymbol = trade.outputCurrency.symbol
                        const inputAmount = trade.inputAmount.toFixed(4)
                        const outputAmount = trade.outputAmount.toFixed(4)

                        const summary = `Swap ${inputAmount} ${inputSymbol} for ${outputAmount} ${outputSymbol}`

                        addTransaction(response, {
                            summary,
                        })

                        return response.transactionId
                    })
                    .catch((error: Error) => {
                        // if the user rejected the tx, pass this along
                        if (error?.message.indexOf("Cannot read property 'sig' of null") !== -1) {
                            throw new Error("Transaction rejected.")
                        } else {
                            // otherwise, the error was unexpected and we need to convey that
                            console.error(`Swap failed`, error, script)
                            throw new Error(error.message)
                        }
                    })
            },
            error: null,
        }
    }, [trade, account, allowedSlippage, addTransaction, authorization, fcl, types, createScript, oldrouter])
}
