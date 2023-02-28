export const COMMON_ADDRESS = process.env.REACT_APP_COMMON_ADDRESS
export const LENDING_ADDRESS = process.env.REACT_APP_LENDING_ADDRESS
export const BRIDGE_ADDRESS = LENDING_ADDRESS

export const FUNGIBLE_TOKEN = COMMON_ADDRESS
export const DCT_FT_TOKEN = COMMON_ADDRESS
export const MAV_FT_TOKEN = COMMON_ADDRESS
export const PRT_FT_TOKEN = COMMON_ADDRESS

export interface IFCL_TOKEN {
    id: string
    name: string
    address: string
    symbol: string
    logoURI: string
}

export const FCL_TOKENS: IFCL_TOKEN[] = [
    {
        id: "0",
        name: "Doggy Coin Token",
        address: COMMON_ADDRESS,
        symbol: "DCT",
        logoURI: "https://i.ibb.co/R2pCkRq/dct.png",
    },
    {
        id: "1",
        name: "Maverick Token",
        address: COMMON_ADDRESS,
        symbol: "MAV",
        logoURI: "https://i.ibb.co/q5c5NxL/mav.png",
    },
    {
        id: "2",
        name: "Parrot Token",
        address: COMMON_ADDRESS,
        symbol: "PRT",
        logoURI: "https://i.ibb.co/3RVSsfs/dib.png",
    },
]

export const FCL_TO_MUMBAI = {
    DCT: process.env.REACT_APP_MUMBAI_DCT,
    MAV: process.env.REACT_APP_MUMBAI_MAV,
    PRT: process.env.REACT_APP_MUMBAI_PRT,
}
