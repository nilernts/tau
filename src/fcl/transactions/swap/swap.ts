import { COMMON_ADDRESS } from "../../addresses/addresses"

export function swapTransaction(token1: string, token2: string, isExactIn: boolean = true) {
    token1 = token1.toUpperCase()
    token2 = token2.toUpperCase()

    /*
        TODODODDODO: USE THIS
    */
    // const args0 = isExactIn ? "amountIn: UFix64" : "maxAmountIn: UFix64"
    // const args1 = isExactIn ? "minAmountOut: UFix64" : "amountOut: UFix64"
    // const symbol = "amountIn"
    // const amountOut = "amountOut"
    // const t0 = isExactIn ? token1 : token2
    // const tokenFrom = `${isExactIn ? "Exact" : ""}${token1 === t0 ? "Token2" : "Token1"}`
    // const tokenTo = `${isExactIn ? "" : "Exact"}${token1 === t0 ? "Token1" : "Token2"}`
    // const swapMethod = `quoteSwap${tokenFrom}For${tokenTo}`
    // const name = `${token1}_${token2}_ExchangeRouter`

    // const val = isExactIn
    //     ? `let ${symbol} = ${name}.${swapMethod}(amount: ${amountOut} * (1.0 - ${name}.getFeePercentage()))`
    //     : `let ${symbol} = ${name}.${swapMethod}(amount: ${amountOut}) / (1.0 - ${name}.getFeePercentage())`
    // // })
    // // .join("\n")

    // const checkVaultExistSnippet = `
    //             if signer.borrow<&${token2}.Vault>(from: ${token2}.vaultStoragePath) == nil {
    //                 signer.save(<-${token2}.createEmptyVault(), to: ${token2}.vaultStoragePath)

    //                 signer.link<&${token2}.Vault{FungibleToken.Receiver}>(
    //                     ${token2}.receiverPublicPath,
    //                     target: ${token2}.vaultStoragePath
    //                 )

    //                 signer.link<&${token2}.Vault{FungibleToken.Balance}>(
    //                     ${token2}.balancePublicPath,
    //                     target: ${token2}.vaultStoragePath
    //                 )
    //             }
    // `

    // // const swapSnippet = route
    // // .map(({ pair, from }, index) => {
    // // const { token0 } = pair
    // const previous = `token1Vault`
    // const _symbol = `token2Vault`
    // const _tokenFrom = "Token1"
    // const _tokenTo = "Token2"
    // const _swapMethod = `swap${_tokenFrom}For${_tokenTo}`
    // const swapSnippet = `let ${_symbol} <- ${name}.${_swapMethod}(from: <- ${previous})`
    // // })
    // // .join("\n")

    // const minInputAssertion = `assert(amountIn <= maxAmountIn, message: "Input amount too large")`
    // const finalAmountValut = `token${route.length}Vault`
    // const minOutputAssertion = `assert(${finalAmountValut}.balance >= minAmountOut, message: "Output amount too small")`

    // return `
    //     import FungibleToken from ${COMMON_ADDRESS}
    //     import ${token1} from ${COMMON_ADDRESS}
    //     import ${token2} from ${COMMON_ADDRESS}

    //     transaction(${args0}, ${args1}) {
    //         prepare(signer: AuthAccount) {
    //             ${!isExactIn ? val : ""}
    //             ${!isExactIn ? minInputAssertion : ""}

    //             let fromVaultRef = signer.borrow<&${token1}.Vault>(from: ${token1}.vaultStoragePath)
    //                 ?? panic("Could not borrow a reference to ${token1} Vault")

    //             let token1Vault <- fromVaultRef.withdraw(amount: amountIn) as! @${token1}.Vault
    //             let token2Vault <- ${name}.swapToken1ForToken2(from: <- token1Vault)

    //             ${checkVaultExistSnippet}
    //             let destVaultRef = signer.borrow<&${token2}.Vault>(from: ${token2}.vaultStoragePath)
    //                 ?? panic("Could not borrow a reference to ${token2} Vault")

    //             ${isExactIn ? minOutputAssertion : ""}

    //             destVaultRef.deposit(from: <- ${finalAmountValut})
    //         }
    //     }
    // `

    const args0 = isExactIn ? "amountIn: UFix64" : "maxAmountIn: UFix64"
    const args1 = isExactIn ? "minAmountOut: UFix64" : "amountOut: UFix64"

    const symbol = "amountIn "
    const amountOut = "amountOut"
    const t0 = isExactIn ? token1 : token2
    const tokenFrom = `${isExactIn ? "Exact" : ""}${token1 === t0 ? "Token2" : "Token1"}`
    const tokenTo = `${isExactIn ? "" : "Exact"}${token1 === t0 ? "Token1" : "Token2"}`
    const swapMethod = `quoteSwap${tokenFrom}For${tokenTo}`
    const name = `${token1}_${token2}_ExchangeRouter`

    const val = isExactIn
        ? `let ${symbol} = ${name}.${swapMethod}(amount: ${amountOut} * (1.0 - ${name}.getFeePercentage()))`
        : `let ${symbol} = ${name}.${swapMethod}(amount: ${amountOut}) / (1.0 - ${name}.getFeePercentage())`
    // })
    // .join("\n")

    const checkVaultExistSnippet = `
                if signer.borrow<&${token2}.Vault>(from: ${token2}.vaultStoragePath) == nil {
                    signer.save(<-${token2}.createEmptyVault(), to: ${token2}.vaultStoragePath)

                    signer.link<&${token2}.Vault{FungibleToken.Receiver}>(
                        ${token2}.receiverPublicPath,
                        target: ${token2}.vaultStoragePath
                    )

                    signer.link<&${token2}.Vault{FungibleToken.Balance}>(
                        ${token2}.balancePublicPath,
                        target: ${token2}.vaultStoragePath
                    )
                }
    `

    // const swapSnippet = route
    // .map(({ pair, from }, index) => {
    // const { token0 } = pair
    const previous = `token1Vault`
    const _symbol = `token2Vault`
    const _tokenFrom = "Token1"
    const _tokenTo = "Token2"
    const _swapMethod = `swap${_tokenFrom}For${_tokenTo}`
    const swapSnippet = `let ${_symbol} <- ${name}.${_swapMethod}(from: <- ${previous})`
    // })
    // .join("\n")

    const minInputAssertion = `assert(amountIn <= maxAmountIn, message: "Input amount too large")`
    const finalAmountValue = `token1Vault`
    const minOutputAssertion = `assert(${finalAmountValue}.balance >= minAmountOut, message: "Output amount too small")`

    return `
        import FungibleToken from ${COMMON_ADDRESS}
        import ${token1} from ${COMMON_ADDRESS}
        import ${token2} from ${COMMON_ADDRESS}
        
        transaction(${args0}, ${args1}) {
            prepare(signer: AuthAccount) {
                ${!isExactIn ? val : ""}
                ${!isExactIn ? minInputAssertion : ""}
            
                let fromVaultRef = signer.borrow<&${token1}.Vault>(from: ${token1}.vaultStoragePath) 
                    ?? panic("Could not borrow a reference to ${token1} Vault")
            
                let token1Vault <- fromVaultRef.withdraw(amount: amountIn) as! @${token1}.Vault
                let token2Vault <- ${name}.swapToken1ForToken2(from: <- token1Vault)
            
                ${checkVaultExistSnippet}
                let destVaultRef = signer.borrow<&${token2}.Vault>(from: ${token2}.vaultStoragePath) 
                    ?? panic("Could not borrow a reference to ${token2} Vault")
            
                ${isExactIn ? minOutputAssertion : ""}
            
                destVaultRef.deposit(from: <- ${finalAmountValue})
            }
        }
    `
        .replaceAll("0xFUNGIBLETOKENADDRESS", COMMON_ADDRESS)
        .replaceAll("0xTOKEN1ADDRESS", COMMON_ADDRESS)
        .replaceAll("0xTOKEN2ADDRESS", COMMON_ADDRESS)
        .replaceAll("0xEXCHANGEROUTERADDRESS", COMMON_ADDRESS)
        .replaceAll("TOKEN1", token1)
        .replaceAll("TOKEN2", token2)
        .replaceAll("EXCHANGEROUTER", `${token1}_${token2}_ExchangeRouter`)
}

export async function useFCLSwapCallback(
    fcl: any,
    token1: string,
    token2: string,
    amountIn: string,
    minAmountOut: string,
    isExactIn: boolean = true
) {
    if (!amountIn.includes(".")) {
        amountIn = amountIn + ".0"
    }
    if (!minAmountOut.includes(".")) {
        minAmountOut = minAmountOut + ".0"
    }
    console.debug("Calling us lol:", amountIn)
    const script = swapTransaction(token1, token2, isExactIn)

    return await fcl.fcl
        .send([fcl.fcl.getBlock(false)])
        .then(fcl.fcl.decode)
        .then((block: any) =>
            fcl.fcl.send([
                fcl.fcl.transaction(script),
                fcl.fcl.args([
                    fcl.fcl.arg(amountIn, fcl.types.UFix64), // amountIn
                    fcl.fcl.arg(minAmountOut, fcl.types.UFix64), // amountIn
                ]),
                fcl.fcl.limit(200),
                fcl.fcl.limit(200),
                fcl.fcl.proposer(fcl.authorization),
                fcl.fcl.authorizations([fcl.authorization, fcl.authorization]),
                fcl.fcl.payer(fcl.authorization),
                fcl.fcl.ref(block.id),
            ])
        )
        .then((results: any) => {
            console.debug(">>>>> Swap Results:", results)
            return results
        })
        .catch((error: Error) => {
            // if the user rejected the tx, pass this along
            if (error?.message.indexOf("Cannot read property 'sig' of null") !== -1) {
                throw new Error("Transaction rejected.")
            } else {
                console.error(`Swap failed: `, error.message)
                throw new Error(`Swap failed: ${error.message}`)
            }
        })
}
