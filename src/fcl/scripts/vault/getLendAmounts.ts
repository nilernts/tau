import { useEffect, useMemo, useState } from "react"
import { useFCL } from "../../../hooks/fcl/useFCL"
import { COMMON_ADDRESS, LENDING_ADDRESS } from "../../addresses/addresses"

export function getLendingAmountsScript() {
    return _lendAmountsScript
        .replaceAll("0xFUNGIBLETOKENADDRESS", COMMON_ADDRESS)
        .replaceAll("0xLENDINGVAULTADDRESS", LENDING_ADDRESS)
}

const _lendAmountsScript = `
import LendingVault from 0xLENDINGVAULTADDRESS

pub fun main(): { Address: LendingVault.Amount } {
    return LendingVault.lendAmount
}
`

export function useFCLLendAmounts(address: string) {
    const fcl = useFCL()
    const [results, setResults] = useState<any>(undefined)

    useEffect(() => {
        let isSubscribed = true
        const callback = () => {
            isSubscribed = false
        }

        if (!address) {
            return callback
        }

        const script = getLendingAmountsScript()

        fcl.fcl
            .send([fcl.fcl.script(script)])
            .then(fcl.fcl.decode)
            .then((results: any) => {
                if (isSubscribed) {
                    let val = results[address]
                    val && setResults(val)
                }
            })

        return callback
    }, [])

    return useMemo(() => results, [results])
}
