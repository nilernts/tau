import { useEffect, useMemo, useState } from "react"
import { useFCL } from "../../../hooks/fcl/useFCL"
import { COMMON_ADDRESS } from "../../addresses/addresses"

export function getTokenBalancesScript(tokens: string[], address: string) {
    tokens = tokens.map((t) => t.toUpperCase())

    const balances: string[] = []
    const imports: string[] = []

    const snippet = tokens
        .map((token, index) => {
            const symbolRef = `tokenBalanceRef${index}`
            const symbol = `tokenBalance${index}`
            imports.push(`import ${token} from 0xTOKEN1ADDRESS`)
            balances.push(symbol)

            return `
            let ${symbolRef} = account.getCapability(${token}.balancePublicPath).borrow<&${token}.Vault{FungibleToken.Balance}>()
            let ${symbol} = ${symbolRef} == nil ? 0.0 : ${symbolRef}!.balance
        `
        })
        .join("\n")

    return `
        import FungibleToken from 0xFUNGIBLETOKENADDRESS
        ${imports.join("\n")}
        
        pub fun main(): [UFix64] {
            let account = getAccount(ADDRESS)
            
            ${snippet}

            return [${balances.join(", ")}]
        }
    `
        .replaceAll("0xFUNGIBLETOKENADDRESS", COMMON_ADDRESS)
        .replaceAll("0xTOKEN1ADDRESS", COMMON_ADDRESS)
        .replaceAll("0xTOKEN2ADDRESS", COMMON_ADDRESS)
        .replaceAll("0xEXCHANGEROUTERADDRESS", COMMON_ADDRESS)
        .replaceAll("ADDRESS", address)
    // .replaceAll("TOKEN2", token2)
    // .replaceAll("EXCHANGEROUTER", `${token1}_${token2}_ExchangeRouter`)
}

export function useFlowTokenBalances(tokens: string[], address: string) {
    const fcl = useFCL()
    const [balances, setBalances] = useState<{ token: string; balance: string }[]>([])

    const tokensFiltered = tokens.filter((t) => t && typeof t === "string" && t.length > 1)

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

        const script = getTokenBalancesScript(tokensFiltered, address)

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
                    setBalances(
                        results.map((r, idx) => {
                            return { token: tokens[idx], balance: Number(r).toFixed(3) }
                        })
                    )
                }
            })

        return callback
    }, [tokensFiltered?.length, tokensFiltered?.[0]])

    return useMemo(() => balances, [balances])
}
