import { useEffect, useMemo, useState } from "react"
import { useFCL } from "../../../hooks/fcl/useFCL"
import { COMMON_ADDRESS, LENDING_ADDRESS } from "../../addresses/addresses"

export function getBorrowAmountsScript() {
    return _lendAmountsScript
        .replaceAll("0xFUNGIBLETOKENADDRESS", COMMON_ADDRESS)
        .replaceAll("0xLENDINGVAULTADDRESS", LENDING_ADDRESS)
}

const _lendAmountsScript = `
import LendingVault from 0xLENDINGVAULTADDRESS

pub fun main(): { Address: LendingVault.Amount } {
    return LendingVault.borrowAmount
}
`

export function useFCLBorrowAmounts(address: string) {
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

        const script = getBorrowAmountsScript()

        fcl.fcl
            .send([fcl.fcl.script(script)])
            .then(fcl.fcl.decode)
            .then((results: any) => {
                if (isSubscribed) {
                    setResults(results)
                }
            })

        return callback
    }, [])

    return useMemo(() => results, [results])
}
