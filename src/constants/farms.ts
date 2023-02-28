import { ChainId } from "../sdk"

export type TokenInfo = {
    id: string
    name: string
    symbol: string
    decimals?: number
}

type PairInfo = {
    id: number
    token0: TokenInfo
    token1?: TokenInfo
    name?: string
    symbol?: string
}

type AddressMap = {
    [chainId: number]: {
        [address: string]: PairInfo
    }
}

export const POOLS: AddressMap = {
    [ChainId.XDC_APOTHEM]: {
        "0xB5399CB5A75dDb18e0ae5EB677426Cb0227b7d85": {
            id: 0,
            token0: {
                name: "Doggy Coin Token",
                id: "0x7F9E26CFDC5Dfa90999Fac735AF4BbfD5e7538e8",
                symbol: "DCT",
                decimals: 18,
            },
            token1: {
                name: "Wrapped XDC",
                id: "0xa2E25078B7DA3Eb08305d88b3F99070214060Ed8",
                symbol: "wXDC",
                decimals: 18,
            },
            name: "Tau LP",
            symbol: "TLP",
        },
        "0x59b9E0c57593428e4c4B3453be8b51714aEAC826": {
            id: 1,
            token0: {
                name: "Wallaroo Token",
                id: "0x409B323F11Bc02434d31015C3dAF4f5AD65acB7e",
                symbol: "WLR",
                decimals: 18,
            },
            token1: {
                name: "Wrapped XDC",
                id: "0xa2E25078B7DA3Eb08305d88b3F99070214060Ed8",
                symbol: "wXDC",
                decimals: 18,
            },
            name: "Tau LP",
            symbol: "TLP",
        },
        "0xCCB6a346238A2f1965FDECCCbf6e31Bf15486236": {
            id: 2,
            token0: {
                name: "Maverick Token",
                id: "0xb04f0a71412aC452E1969F48Ee4DafC4AE8797cE",
                symbol: "MAV",
                decimals: 18,
            },
            token1: {
                name: "Wrapped XDC",
                id: "0xa2E25078B7DA3Eb08305d88b3F99070214060Ed8",
                symbol: "wXDC",
                decimals: 18,
            },
            name: "Tau LP",
            symbol: "TLP",
        },
        "0x7291Cf59709B229627f86b78149851c6Da22B3F5": {
            id: 3,
            token0: {
                name: "Dibs Token",
                id: "0x7704E6C9d3b41E5A32804C52e8Ab030410DFa59E",
                symbol: "DIB",
                decimals: 18,
            },
            token1: {
                name: "Doggy Coin Token",
                id: "0x7F9E26CFDC5Dfa90999Fac735AF4BbfD5e7538e8",
                symbol: "DCT",
                decimals: 18,
            },
            name: "Tau LP",
            symbol: "TLP",
        },
        "0x5745A37EC850419BaA043f1CfCdE29491C9DFe18": {
            id: 4,
            token0: {
                name: "Wallaroo Token",
                id: "0x409B323F11Bc02434d31015C3dAF4f5AD65acB7e",
                symbol: "WLR",
                decimals: 18,
            },
            token1: {
                name: "Doggy Coin Token",
                id: "0x7F9E26CFDC5Dfa90999Fac735AF4BbfD5e7538e8",
                symbol: "DCT",
                decimals: 18,
            },
            name: "Tau LP",
            symbol: "TLP",
        },
        "0x29f4D96b4d0CEdCBe57FDE86952D6C79E8FA2DaF": {
            id: 5,
            token0: {
                name: "Maverick Token",
                id: "0xb04f0a71412aC452E1969F48Ee4DafC4AE8797cE",
                symbol: "MAV",
                decimals: 18,
            },
            token1: {
                name: "Doggy Coin Token",
                id: "0x7F9E26CFDC5Dfa90999Fac735AF4BbfD5e7538e8",
                symbol: "DCT",
                decimals: 18,
            },
            name: "Tau LP",
            symbol: "TLP",
        },
        "0x5C36135a73F0b232192bA345Bef99049D0F21245": {
            id: 6,
            token0: {
                name: "Maverick Token",
                id: "0xb04f0a71412aC452E1969F48Ee4DafC4AE8797cE",
                symbol: "MAV",
                decimals: 18,
            },
            token1: {
                name: "Dibs Token",
                id: "0x7704E6C9d3b41E5A32804C52e8Ab030410DFa59E",
                symbol: "DIB",
                decimals: 18,
            },
            name: "Tau LP",
            symbol: "TLP",
        },
        "0x16623630E2fF68954fd7B1c2598A897b31502e45": {
            id: 7,
            token0: {
                name: "Maverick Token",
                id: "0xb04f0a71412aC452E1969F48Ee4DafC4AE8797cE",
                symbol: "MAV",
                decimals: 18,
            },
            token1: {
                name: "Wallaroo Token",
                id: "0x409B323F11Bc02434d31015C3dAF4f5AD65acB7e",
                symbol: "WLR",
                decimals: 18,
            },
            name: "Tau LP",
            symbol: "TLP",
        },
    },
}
