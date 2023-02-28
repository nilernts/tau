import { setup, fromDecimals, toDecimals } from "./contracts"

import TauFactory from "../../constants/artifacts/contracts/swap/TauFactory.sol/TauFactory.json"
import TauPair from "../../constants/artifacts/contracts/swap/TauPair.sol/TauPair.json"
import TauRouter02 from "../../constants/artifacts/contracts/swap/TauRouter02.sol/TauRouter02.json"
import { getDeployedAddresses } from "../../constants"

// Tau Factory
export async function getPair(account: string | undefined, tokenA: string, tokenB: string) {
    if (!account || !tokenA || !tokenB) return undefined

    const web3 = setup()

    const contract = new web3.eth.Contract(TauFactory.abi as any, getDeployedAddresses().swap.TauFactory)
    const pairAddress = await contract.methods.getPair(tokenA, tokenB).call()
    return pairAddress
}

export async function getReserves(account: string | undefined, pairAddress: string) {
    if (!account || !pairAddress) return undefined

    if (pairAddress === "0x0000000000000000000000000000000000000000") return [0, 0]

    const web3 = setup()

    const contract = new web3.eth.Contract(TauPair.abi as any, pairAddress)
    const call = await contract.methods.getReserves().call()
    return [
        call[0],
        call[1],
        // +fromDecimals(call[0]),
        // +fromDecimals(call[1])
    ]
}
