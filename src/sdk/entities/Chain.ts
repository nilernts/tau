import { ChainId } from ".."
import { NETWORK_ICON, NETWORK_LABEL } from "../../constants/networks"

export type Chain = {
    id: ChainId
    name?: string
    icon?: string
}

export const DEFAULT_CHAIN_FROM: Chain = {
    id: ChainId.XDC_APOTHEM,
    icon: NETWORK_ICON[ChainId.XDC_APOTHEM],
    name: NETWORK_LABEL[ChainId.XDC_APOTHEM],
}

export const DEFAULT_CHAIN_TO: Chain = {
    id: ChainId.MATIC_TESTNET,
    icon: "/images/networks/polygon-network.jpg",
    name: NETWORK_LABEL[ChainId.MATIC_TESTNET],
}
