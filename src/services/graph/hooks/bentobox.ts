import { useEffect, useMemo } from "react"
import useSWR, { SWRConfiguration } from "swr"

import { ChainId } from "../../../sdk"
import { getKashiPairs } from "../fetchers/bentobox"
import { useActiveWeb3React } from "../../../hooks"

export function useKashiPairs(variables = undefined, swrConfig: SWRConfiguration = undefined) {
    const { chainId } = useActiveWeb3React()

    const shouldFetch = chainId && (chainId === ChainId.MAINNET || chainId === ChainId.MATIC)
    const { data } = useSWR(
        shouldFetch ? () => ["kashiPairs", chainId, JSON.stringify(variables)] : null,
        (_, chainId) => getKashiPairs(chainId, variables),
        swrConfig
    )

    return data
}
