// import { keccak256, pack } from '@ethersproject/solidity'
// import { INIT_CODE_HASH } from '../constants'
// import { getCreate2Address } from '@ethersproject/address'
import { Token, ZERO_ADDRESS } from "../sdk"

export function getTokensFromPairAddress(pairAddress: string) {
    // getDeployedAddresses()

    let token = `${ZERO_ADDRESS}-${ZERO_ADDRESS}`

    switch (pairAddress) {
        case "0xB5399CB5A75dDb18e0ae5EB677426Cb0227b7d85": {
            token = "0xa2E25078B7DA3Eb08305d88b3F99070214060Ed8-0x7F9E26CFDC5Dfa90999Fac735AF4BbfD5e7538e8"
            break
        }
        case "0xB5399CB5A75dDb18e0ae5EB677426Cb0227b7d85": {
            token = "0x7F9E26CFDC5Dfa90999Fac735AF4BbfD5e7538e8-0xa2E25078B7DA3Eb08305d88b3F99070214060Ed8"
            break
        }
        case "0x59b9E0c57593428e4c4B3453be8b51714aEAC826": {
            token = "0xa2E25078B7DA3Eb08305d88b3F99070214060Ed8-0x409B323F11Bc02434d31015C3dAF4f5AD65acB7e"
            break
        }
        case "0x59b9E0c57593428e4c4B3453be8b51714aEAC826": {
            token = "0x409B323F11Bc02434d31015C3dAF4f5AD65acB7e-0xa2E25078B7DA3Eb08305d88b3F99070214060Ed8"
            break
        }
        case "0xCCB6a346238A2f1965FDECCCbf6e31Bf15486236": {
            token = "0xa2E25078B7DA3Eb08305d88b3F99070214060Ed8-0xb04f0a71412aC452E1969F48Ee4DafC4AE8797cE"
            break
        }
        case "0xCCB6a346238A2f1965FDECCCbf6e31Bf15486236": {
            token = "0xb04f0a71412aC452E1969F48Ee4DafC4AE8797cE-0xa2E25078B7DA3Eb08305d88b3F99070214060Ed8"
            break
        }
        case "0x7291Cf59709B229627f86b78149851c6Da22B3F5": {
            token = "0x7F9E26CFDC5Dfa90999Fac735AF4BbfD5e7538e8-0x7704E6C9d3b41E5A32804C52e8Ab030410DFa59E"
            break
        }
        case "0x7291Cf59709B229627f86b78149851c6Da22B3F5": {
            token = "0x7704E6C9d3b41E5A32804C52e8Ab030410DFa59E-0x7F9E26CFDC5Dfa90999Fac735AF4BbfD5e7538e8"
            break
        }
        case "0x5745A37EC850419BaA043f1CfCdE29491C9DFe18": {
            token = "0x7F9E26CFDC5Dfa90999Fac735AF4BbfD5e7538e8-0x409B323F11Bc02434d31015C3dAF4f5AD65acB7e"
            break
        }
        case "0x5745A37EC850419BaA043f1CfCdE29491C9DFe18": {
            token = "0x409B323F11Bc02434d31015C3dAF4f5AD65acB7e-0x7F9E26CFDC5Dfa90999Fac735AF4BbfD5e7538e8"
            break
        }
        case "0x29f4D96b4d0CEdCBe57FDE86952D6C79E8FA2DaF": {
            token = "0x7F9E26CFDC5Dfa90999Fac735AF4BbfD5e7538e8-0xb04f0a71412aC452E1969F48Ee4DafC4AE8797cE"
            break
        }
        case "0x29f4D96b4d0CEdCBe57FDE86952D6C79E8FA2DaF": {
            token = "0xb04f0a71412aC452E1969F48Ee4DafC4AE8797cE-0x7F9E26CFDC5Dfa90999Fac735AF4BbfD5e7538e8"
            break
        }
        case "0x5C36135a73F0b232192bA345Bef99049D0F21245": {
            token = "0x7704E6C9d3b41E5A32804C52e8Ab030410DFa59E-0xb04f0a71412aC452E1969F48Ee4DafC4AE8797cE"
            break
        }
        case "0x5C36135a73F0b232192bA345Bef99049D0F21245": {
            token = "0xb04f0a71412aC452E1969F48Ee4DafC4AE8797cE-0x7704E6C9d3b41E5A32804C52e8Ab030410DFa59E"
            break
        }
        case "0x16623630E2fF68954fd7B1c2598A897b31502e45": {
            token = "0x409B323F11Bc02434d31015C3dAF4f5AD65acB7e-0xb04f0a71412aC452E1969F48Ee4DafC4AE8797cE"
            break
        }
        case "0x16623630E2fF68954fd7B1c2598A897b31502e45": {
            token = "0xb04f0a71412aC452E1969F48Ee4DafC4AE8797cE-0x409B323F11Bc02434d31015C3dAF4f5AD65acB7e"
            break
        }
    }

    return token.split("-")
}

export const computePairAddress = ({
    factoryAddress,
    tokenA,
    tokenB,
}: {
    factoryAddress: string
    tokenA: Token
    tokenB: Token
}): string => {
    const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA] // does safety checks

    // const pairs = DEPLOYMENTS

    const mixedAddress = `${token0.address}-${token1.address}`
    let address = ZERO_ADDRESS
    // try {
    //     address = pairs[mixedAddress]
    // } catch(err) { }

    // console.debug("Found pair address:", address)

    switch (mixedAddress) {
        case "0xa2E25078B7DA3Eb08305d88b3F99070214060Ed8-0x7F9E26CFDC5Dfa90999Fac735AF4BbfD5e7538e8": {
            address = "0xB5399CB5A75dDb18e0ae5EB677426Cb0227b7d85"
            break
        }
        case "0x7F9E26CFDC5Dfa90999Fac735AF4BbfD5e7538e8-0xa2E25078B7DA3Eb08305d88b3F99070214060Ed8": {
            address = "0xB5399CB5A75dDb18e0ae5EB677426Cb0227b7d85"
            break
        }
        case "0xa2E25078B7DA3Eb08305d88b3F99070214060Ed8-0x409B323F11Bc02434d31015C3dAF4f5AD65acB7e": {
            address = "0x59b9E0c57593428e4c4B3453be8b51714aEAC826"
            break
        }
        case "0x409B323F11Bc02434d31015C3dAF4f5AD65acB7e-0xa2E25078B7DA3Eb08305d88b3F99070214060Ed8": {
            address = "0x59b9E0c57593428e4c4B3453be8b51714aEAC826"
            break
        }
        case "0xa2E25078B7DA3Eb08305d88b3F99070214060Ed8-0xb04f0a71412aC452E1969F48Ee4DafC4AE8797cE": {
            address = "0xCCB6a346238A2f1965FDECCCbf6e31Bf15486236"
            break
        }
        case "0xb04f0a71412aC452E1969F48Ee4DafC4AE8797cE-0xa2E25078B7DA3Eb08305d88b3F99070214060Ed8": {
            address = "0xCCB6a346238A2f1965FDECCCbf6e31Bf15486236"
            break
        }
        case "0x7F9E26CFDC5Dfa90999Fac735AF4BbfD5e7538e8-0x7704E6C9d3b41E5A32804C52e8Ab030410DFa59E": {
            address = "0x7291Cf59709B229627f86b78149851c6Da22B3F5"
            break
        }
        case "0x7704E6C9d3b41E5A32804C52e8Ab030410DFa59E-0x7F9E26CFDC5Dfa90999Fac735AF4BbfD5e7538e8": {
            address = "0x7291Cf59709B229627f86b78149851c6Da22B3F5"
            break
        }
        case "0x7F9E26CFDC5Dfa90999Fac735AF4BbfD5e7538e8-0x409B323F11Bc02434d31015C3dAF4f5AD65acB7e": {
            address = "0x5745A37EC850419BaA043f1CfCdE29491C9DFe18"
            break
        }
        case "0x409B323F11Bc02434d31015C3dAF4f5AD65acB7e-0x7F9E26CFDC5Dfa90999Fac735AF4BbfD5e7538e8": {
            address = "0x5745A37EC850419BaA043f1CfCdE29491C9DFe18"
            break
        }
        case "0x7F9E26CFDC5Dfa90999Fac735AF4BbfD5e7538e8-0xb04f0a71412aC452E1969F48Ee4DafC4AE8797cE": {
            address = "0x29f4D96b4d0CEdCBe57FDE86952D6C79E8FA2DaF"
            break
        }
        case "0xb04f0a71412aC452E1969F48Ee4DafC4AE8797cE-0x7F9E26CFDC5Dfa90999Fac735AF4BbfD5e7538e8": {
            address = "0x29f4D96b4d0CEdCBe57FDE86952D6C79E8FA2DaF"
            break
        }
        case "0x7704E6C9d3b41E5A32804C52e8Ab030410DFa59E-0xb04f0a71412aC452E1969F48Ee4DafC4AE8797cE": {
            address = "0x5C36135a73F0b232192bA345Bef99049D0F21245"
            break
        }
        case "0xb04f0a71412aC452E1969F48Ee4DafC4AE8797cE-0x7704E6C9d3b41E5A32804C52e8Ab030410DFa59E": {
            address = "0x5C36135a73F0b232192bA345Bef99049D0F21245"
            break
        }
        case "0x409B323F11Bc02434d31015C3dAF4f5AD65acB7e-0xb04f0a71412aC452E1969F48Ee4DafC4AE8797cE": {
            address = "0x16623630E2fF68954fd7B1c2598A897b31502e45"
            break
        }
        case "0xb04f0a71412aC452E1969F48Ee4DafC4AE8797cE-0x409B323F11Bc02434d31015C3dAF4f5AD65acB7e": {
            address = "0x16623630E2fF68954fd7B1c2598A897b31502e45"
            break
        }
    }

    return address
    // const [token0, token1] = tokenA.sortsBefore(tokenB)
    //     ? [tokenA, tokenB]
    //     : [tokenB, tokenA] // does safety checks
    // return getCreate2Address(
    //     factoryAddress,
    //     keccak256(
    //         ['bytes'],
    //         [pack(['address', 'address'], [token0.address, token1.address])]
    //     ),
    //     INIT_CODE_HASH
    // )
}
