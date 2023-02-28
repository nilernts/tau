import { useMemo } from "react"
import { useFCL } from "./useFCL"
import { removeLiquidityTransaction } from "../../fcl/transactions/swap/removeLiquidity"

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useRemoveLiquidity(): Function | undefined {
    const { fcl, authorization, types, chainId } = useFCL()

    return useMemo(() => {
        const isSealed = false
        return (token1: string, token2: string, amount: number) => {
            if (
                !(
                    (token1 === "DCT" && token2 === "MAV") ||
                    (token1 === "MAV" && token2 === "PRT") ||
                    (token1 === "DCT" && token2 === "PRT")
                )
            ) {
                console.error("[useRemoveLiquidity] ERROR. Incorrect tokens:", { token1, token2 })
                return undefined
            }

            return fcl
                .send([fcl.getBlock(isSealed)])
                .then(fcl.decode)
                .then((block: any) =>
                    fcl.send([
                        fcl.transaction(
                            removeLiquidityTransaction(token1, token2)
                            // replaceContractAddresses(
                            //     removeLiquidity[pair.token0.symbol ?? ""][pair.token1.symbol ?? ""],
                            //     chainId
                            // )
                        ),
                        fcl.args([fcl.arg(amount.toFixed(8), types.UFix64)]),
                        fcl.limit(200),
                        fcl.proposer(authorization),
                        fcl.authorizations([authorization]),
                        fcl.payer(authorization),
                        fcl.ref(block.id),
                    ])
                )
                .catch((error: Error) => {
                    // if the user rejected the tx, pass this along
                    if (error?.message.indexOf("Cannot read property 'sig' of null") !== -1) {
                        throw new Error("Transaction rejected.")
                    } else {
                        // otherwise, the error was unexpected and we need to convey that
                        console.error(`Remove failed`, error, { token1, token2 })
                        throw new Error(`Remove failed: ${error.message}`)
                    }
                })
        }
    }, [authorization, fcl, types, chainId])
}
