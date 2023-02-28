import { useEffect, useMemo, useState } from "react"
import { getPoolAmountsScript } from "../../fcl/scripts/swap/getPoolAmounts"
import { useFCL } from "./useFCL"

export function usePoolAmounts(token1: string, token2: string): { [tokenName: string]: number } {
    const { fcl, chainId } = useFCL()
    const [poolAmounts, setPoolAmounts] = useState<{ [tokenName: string]: number }>({})

    useEffect(() => {
        let isSubscribed = true

        const callback = () => {
            isSubscribed = false
        }

        if (
            !(
                (token1 === "DCT" && token2 === "MAV") ||
                (token1 === "MAV" && token2 === "PRT") ||
                (token1 === "DCT" && token2 === "PRT")
            )
        ) {
            console.error("[usePoolAmounts] ERROR. Incorrect tokens:", { token1, token2 })
            return callback
        }

        fcl.send([
            fcl.script(getPoolAmountsScript(token1, token2)),
            // fcl.script(replaceContractAddresses(getPoolAmounts[symbol] ?? "", chainId)),
        ])
            .then(fcl.decode)
            .then((results: [string, string]) => {
                isSubscribed &&
                    setPoolAmounts({
                        [token1]: parseFloat(results[0]),
                        [token2]: parseFloat(results[1]),
                    })
            })
            .catch((error: Error) => {
                console.log(error)
            })

        return callback
    }, [fcl, token1, token2, chainId])

    return useMemo(() => poolAmounts, [poolAmounts])
}
