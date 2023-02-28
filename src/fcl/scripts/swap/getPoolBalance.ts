import { useEffect, useState } from "react"
import { useFCL } from "../../../hooks/fcl/useFCL"
import { COMMON_ADDRESS } from "../../addresses/addresses"

function getPoolBalanceScript(token1: string, token2: string) {
    token1 = token1.toUpperCase()
    token2 = token2.toUpperCase()

    return _getPoolBalanceScript
        .replaceAll("0xFUNGIBLETOKENADDRESS", COMMON_ADDRESS)
        .replaceAll("0xTOKEN1ADDRESS", COMMON_ADDRESS)
        .replaceAll("0xTOKEN2ADDRESS", COMMON_ADDRESS)
        .replaceAll("0xEXCHANGEROUTERADDRESS", COMMON_ADDRESS)
        .replaceAll("TOKEN1", token1)
        .replaceAll("TOKEN2", token2)
        .replaceAll("EXCHANGEROUTER", `${token1}_${token2}_ExchangeRouter`)
}

const _getPoolBalanceScript = `
import EXCHANGEROUTER from 0xEXCHANGEROUTERADDRESS

pub fun main(): [UFix64] {
    let account = getAccount(ADDRESS)
    let vaultRef <- account.borrow
    let poolAmounts = EXCHANGEROUTER.getPoolAmounts()
    return [poolAmounts.token1Amount, poolAmounts.token2Amount]
}
`

export function useFCLPoolBalance(token1: string, token2: string, address: string) {
    alert("FCL POOL BALANCE IS TODO")
    const fcl = useFCL()
    const [result, setResult] = useState()

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

        const script = getPoolBalanceScript(token1, token2, address)

        fcl.fcl
            .send([fcl.fcl.script(script)])
            .then(fcl.fcl.decode)
            .then((results: any) => {
                if (isSubscribed) {
                    // console.debug(
                    //     ">>>>> Results:",
                    //     results,
                    //     results.map((r) => Number(r).toFixed(3))
                    // )
                    setResult(
                        results.map((r, idx) => {
                            return { token: tokens[idx], balance: Number(r).toFixed(3) }
                        })
                    )
                }
            })

        return callback
    }, [tokensFiltered?.length, tokensFiltered?.[0]])

    return useMemo(() => result, [result])
}
