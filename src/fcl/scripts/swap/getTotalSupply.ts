import { useEffect, useMemo, useState } from "react"
import { useFCL } from "../../../hooks/fcl/useFCL"
import { COMMON_ADDRESS } from "../../addresses/addresses"

export function getTotalSupplyScript(token1: string, token2: string) {
    token1 = token1.toUpperCase()
    token2 = token2.toUpperCase()

    return _getPoolAmountsScript
        .replaceAll("0xFUNGIBLETOKENADDRESS", COMMON_ADDRESS)
        .replaceAll("0xTOKEN1ADDRESS", COMMON_ADDRESS)
        .replaceAll("0xTOKEN2ADDRESS", COMMON_ADDRESS)
        .replaceAll("0xEXCHANGEROUTERADDRESS", COMMON_ADDRESS)
        .replaceAll("TOKEN1", token1)
        .replaceAll("TOKEN2", token2)
        .replaceAll("EXCHANGEROUTER", `${token1}_${token2}_ExchangeRouter`)
}

const _getPoolAmountsScript = `
import EXCHANGEROUTER from 0xEXCHANGEROUTERADDRESS

pub fun main(): UFix64 {
    return EXCHANGEROUTER.totalSupply
}
`

export function useFLCPoolTotalSupply(token1: string, token2: string, address: string) {
    const fcl = useFCL()
    const [results, setResults] = useState<string>("")

    useEffect(() => {
        let isSubscribed = true
        const callback = () => {
            isSubscribed = false
        }

        if (!address) {
            return callback
        }

        // const tokensBefore = tokens
        // console.debug("TOKENS FILTERED:", { tokensBefore, tokens })

        const script = getTotalSupplyScript(token1, token2)

        fcl.fcl
            .send([fcl.fcl.script(script)])
            .then(fcl.fcl.decode)
            .then((results: any) => {
                if (isSubscribed) {
                    // console.debug(
                    //     ">>>>> Total supply Results:",
                    //     results,
                    // )
                    setResults(results)
                }
            })

        return callback
    }, [token1, token2])

    return useMemo(() => results, [results])
}
