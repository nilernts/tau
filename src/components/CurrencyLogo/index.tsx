import { ChainId, Currency, WNATIVE } from "../../sdk"
import React, { FunctionComponent, useMemo } from "react"
import Logo from "../Logo"
import { WrappedTokenInfo } from "../../state/lists/wrappedTokenInfo"
import useHttpLocations from "../../hooks/useHttpLocations"
import { tokenAddressToLogo } from "../../constants"
import { IFCL_TOKEN } from "../../fcl/addresses/addresses"

export const getTokenLogoURL = (address: string, chainId: ChainId) => {
    return `https://raw.githubusercontent.com/solarbeamio/assets/master/blockchains/${BLOCKCHAIN[chainId]}/assets/${address}/logo.png`
}

const BLOCKCHAIN = {
    [ChainId.MAINNET]: "ethereum",
    [ChainId.BSC]: "smartchain",
    [ChainId.CELO]: "celo",
    [ChainId.FANTOM]: "fantom",
    [ChainId.HARMONY]: "harmony",
    [ChainId.MATIC]: "polygon",
    [ChainId.XDC_APOTHEM]: "apothem",
    [ChainId.XDAI]: "xdai",
    [ChainId.MOONRIVER]: "moonriver",
    // [ChainId.OKEX]: 'okex',
}

function getCurrencySymbol(currency) {
    if (currency.symbol === "WBTC") {
        return "btc"
    }
    if (currency.symbol === "WETH") {
        return "eth"
    }
    return currency.symbol.toLowerCase()
}

function getCurrencyLogoUrls(currency) {
    const urls = []
    if (currency.chainId in BLOCKCHAIN) {
        urls.push(
            `https://raw.githubusercontent.com/solarbeamio/assets/master/blockchains/${
                BLOCKCHAIN[currency.chainId]
            }/assets/${currency.address}/logo.png`
        )
    }

    return urls
}

const AvalancheLogo = "https://raw.githubusercontent.com/sushiswap/icons/master/token/avax.jpg"
const BinanceCoinLogo =
    "https://raw.githubusercontent.com/solarbeamio/assets/master/blockchains/smartchain/info/logo.png"
const EthereumLogo = "https://raw.githubusercontent.com/solarbeamio/assets/master/blockchains/ethereum/info/logo.png"
const FantomLogo = "https://raw.githubusercontent.com/sushiswap/icons/master/token/ftm.jpg"
const HarmonyLogo = "https://raw.githubusercontent.com/sushiswap/icons/master/token/one.jpg"
const HecoLogo = "https://raw.githubusercontent.com/sushiswap/icons/master/token/heco.jpg"
const MaticLogo = "https://raw.githubusercontent.com/sushiswap/icons/master/token/polygon.jpg"
const MoonbeamLogo = "https://raw.githubusercontent.com/sushiswap/icons/master/token/eth.jpg"
const OKExLogo = "https://raw.githubusercontent.com/sushiswap/icons/master/token/okt.jpg"
const xDaiLogo = "https://raw.githubusercontent.com/sushiswap/icons/master/token/dai.jpg"
const CeloLogo = "https://raw.githubusercontent.com/sushiswap/icons/master/token/celo.jpg"
const MoonriverLogo = "https://solarbeam.io/images/tokens/movr.png"
const ApothemLogo = "https://xinfin.org/assets/images/brand-assets/xdc-icon.png"

const logo: { readonly [chainId in ChainId]?: string } = {
    [ChainId.MAINNET]: EthereumLogo,
    [ChainId.FANTOM]: FantomLogo,
    [ChainId.FANTOM_TESTNET]: FantomLogo,
    [ChainId.MATIC]: MaticLogo,
    [ChainId.MATIC_TESTNET]: MaticLogo,
    [ChainId.XDAI]: xDaiLogo,
    [ChainId.BSC]: BinanceCoinLogo,
    [ChainId.BSC_TESTNET]: BinanceCoinLogo,
    [ChainId.MOONBEAM_TESTNET]: MoonbeamLogo,
    [ChainId.AVALANCHE]: AvalancheLogo,
    [ChainId.AVALANCHE_TESTNET]: AvalancheLogo,
    [ChainId.HECO]: HecoLogo,
    [ChainId.HECO_TESTNET]: HecoLogo,
    [ChainId.HARMONY]: HarmonyLogo,
    [ChainId.HARMONY_TESTNET]: HarmonyLogo,
    [ChainId.OKEX]: OKExLogo,
    [ChainId.OKEX_TESTNET]: OKExLogo,
    [ChainId.ARBITRUM]: EthereumLogo,
    [ChainId.ARBITRUM_TESTNET]: EthereumLogo,
    [ChainId.CELO]: CeloLogo,
    [ChainId.MOONRIVER]: MoonriverLogo,
    [ChainId.XDC_APOTHEM]: ApothemLogo,
}

interface CurrencyLogoProps {
    currency?: Currency | IFCL_TOKEN
    size?: string | number
    style?: React.CSSProperties
    className?: string
    squared?: boolean
}

const unknown = "https://raw.githubusercontent.com/sushiswap/icons/master/token/unknown.png"

const CurrencyLogo: FunctionComponent<CurrencyLogoProps> = ({
    currency,
    size = "24px",
    style,
    className = "",
    ...rest
}) => {
    let uriLocations: string[] = [""]
    let skip = false

    if ("logoURI" in currency) {
        skip = true
        uriLocations = [currency.logoURI as string]
    } else {
        uriLocations = useHttpLocations(
            currency instanceof WrappedTokenInfo ? currency.logoURI || currency.tokenInfo.logoURI : undefined
        )
    }

    const srcs = useMemo(() => {
        if (!currency) {
            return [unknown]
        }

        if (!skip) {
            if (
                (currency as Currency).isNative ||
                (currency as Currency).equals(WNATIVE[(currency as Currency).chainId])
            ) {
                return [logo[(currency as Currency).chainId], unknown]
            }

            if ((currency as Currency).isToken) {
                const defaultUrls = [...uriLocations, ...getCurrencyLogoUrls(currency)]
                // console.debug("Default urls:", defaultUrls)
                if (currency instanceof WrappedTokenInfo) {
                    return [...defaultUrls, unknown]
                }
                return defaultUrls
            }
        } else {
            return [...uriLocations, unknown]
        }
    }, [currency, uriLocations])

    return <Logo srcs={srcs} width={size} height={size} alt={currency?.symbol} {...rest} />
}

export default CurrencyLogo
