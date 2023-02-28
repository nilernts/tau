import { useEffect, useMemo, useState } from "react"
import * as fcl from "@blocto/fcl"
import * as types from "@onflow/types"
import { ChainId } from "@uniswap/sdk"
import { accountAtom } from "../../state/atoms/atoms"
import { useAtom } from "jotai"

const WALLET_URL = {
    mainnet: "https://flow-wallet.blocto.app/authn",
    testnet: "https://flow-wallet-testnet.blocto.app/authn",
}

const ACCESS_NODE_LIST = {
    mainnet: "https://access-mainnet-beta.onflow.org",
    testnet: "https://rest-testnet.onflow.org", // "https://access-testnet.onflow.org",
}

const NETWORK = true ? "testnet" : "mainnet"

export function useFCL() {
    const [account, setAccount] = useAtom(accountAtom)

    const [accessNodeUrl, walletUrl] = useMemo(() => {
        if (!NETWORK) return [undefined, undefined, undefined]

        return [ACCESS_NODE_LIST[NETWORK] || ACCESS_NODE_LIST["testnet"], WALLET_URL[NETWORK] || WALLET_URL["testnet"]]
    }, [])

    const connect = useMemo(() => {
        // eslint-disable-next-line
        if (!NETWORK || !walletUrl)
            return () => {
                console.debug("Returning for some reason")
            }

        return function () {
            fcl.authenticate()
        }
    }, [walletUrl])

    useEffect(() => {
        if (!accessNodeUrl || !walletUrl) return

        fcl.config().put("accessNode.api", accessNodeUrl).put("discovery.wallet", walletUrl)
    }, [accessNodeUrl, walletUrl])

    useEffect(() => {
        return fcl.currentUser().subscribe((user: any) => {
            setAccount(user?.addr as string)
        })
    }, [])

    return useMemo(
        () => ({
            fcl: accessNodeUrl ? fcl : undefined,
            types,
            authorization: fcl.currentUser().authorization,
            // @todo: remove chainId in response
            chainId: NETWORK === "mainnet" ? ChainId.MAINNET : ChainId.RINKEBY,
            active: !!account,
            account: account,
            connect: accessNodeUrl ? connect : () => {},
            disconnect: accessNodeUrl
                ? () => {
                      fcl.unauthenticate()
                      setAccount("")
                  }
                : () => {},
        }),
        [account, accessNodeUrl, connect]
    )
}
