import { Apothem, ChainId } from "../sdk"

const Mainnet = "/images/networks/ethereum.png"
const Matic =
    "https://s3.us-west-2.amazonaws.com/secure.notion-static.com/938afd3e-e620-4946-9206-41d9f00e581e/Primary_Token.svg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAT73L2G45EIPT3X45%2F20230114%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20230114T171433Z&X-Amz-Expires=86400&X-Amz-Signature=bbf9f88801561e0df042edf8c997bf84be2aaa8456dde9107f4bcc687178736d&X-Amz-SignedHeaders=host&response-content-disposition=filename%3D%22Primary%2520Token.svg%22&x-id=GetObject"
const Moonbeam = "/images/networks/moonbeam-network.jpg"
const Moonriver = "/images/networks/moonriver.png"
const XDC_APOTHEM = "https://xinfin.org/assets/images/brand-assets/xdc-icon.png"
export const NETWORK_ICON = {
    [ChainId.MAINNET]: Mainnet,
    [ChainId.MATIC]: Matic,
    [ChainId.MATIC_TESTNET]: Matic,
    [ChainId.MOONBEAM_TESTNET]: Moonbeam,
    [ChainId.MOONRIVER]: Moonriver,
    [ChainId.XDC_APOTHEM]: XDC_APOTHEM,
}

export const NETWORK_LABEL: { [chainId in ChainId]?: string } = {
    [ChainId.MAINNET]: "Ethereum",
    [ChainId.XDC_APOTHEM]: "XDC Apothem",
    [ChainId.MATIC]: "Polygon (Matic)",
    [ChainId.MATIC_TESTNET]: "Polygon Mumbai",
    [ChainId.MOONBEAM_TESTNET]: "Moonbase",
    [ChainId.MOONRIVER]: "Moonriver",
}
