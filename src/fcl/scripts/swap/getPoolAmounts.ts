import { COMMON_ADDRESS } from "../../addresses/addresses"

export function getPoolAmountsScript(token1: string, token2: string) {
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

pub fun main(): [UFix64] {
    let poolAmounts = EXCHANGEROUTER.getPoolAmounts()
    return [poolAmounts.token1Amount, poolAmounts.token2Amount]
}
`
