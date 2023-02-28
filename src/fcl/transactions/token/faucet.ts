import { useEffect, useMemo } from "react"
import { useFCL } from "../../../hooks/fcl/useFCL"
import { COMMON_ADDRESS } from "../../addresses/addresses"

export function faucetTransaction(tokens: string[], amounts: string[], address: string) {
    if (tokens.length !== amounts.length) throw new Error("Faucet transaction: length mismatch")

    tokens = tokens.map((t) => t.toUpperCase())

    const globImports: string[] = []
    const imports: string[] = []
    const prepareChecks: string[] = []
    const prepareBorrows: string[] = []
    const mints: string[] = []

    tokens
        .map((token, index) => {
            const vaultRef = `token${index}VaultRef`

            imports.push(`import ${token} from 0xTOKEN1ADDRESS`)
            globImports.push(`let ${vaultRef}: &${token}.Vault`)

            prepareChecks.push(`
                if signer.borrow<&${token}.Vault>(from: ${token}.vaultStoragePath) == nil {
                    signer.save(<- ${token}.createEmptyVault(), to: ${token}.vaultStoragePath)

                    // Create a public capability to the Vault that only exposes
                    // the deposit function through the Receiver interface
                    signer.link<&${token}.Vault{FungibleToken.Receiver}>(
                        ${token}.receiverPublicPath,
                        target: ${token}.vaultStoragePath
                    )

                    // Create a public capability to the Vault that only exposes
                    // the balance field through the Balance interface
                    signer.link<&${token}.Vault{FungibleToken.Balance}>(
                        ${token}.balancePublicPath,
                        target: ${token}.vaultStoragePath
                    )
                }
            `)

            prepareBorrows.push(`
                self.${vaultRef} = signer.borrow<&${token}.Vault>(from: ${token}.vaultStoragePath)
                    ?? panic("Could not borrow reference to ${token} Vault")
            `)

            mints.push(`
                let mintVault${index} <- self.${vaultRef}.mintTokens(amount: ${amounts[index]})
                self.${vaultRef}.deposit(from: <- mintVault${index})
            `)
        })
        .join("\n")

    return `
        import FungibleToken from 0xFUNGIBLETOKENADDRESS
        ${imports.join("\n")}


        transaction {
            let signer: AuthAccount
            ${globImports.join("\n")}

            prepare(signer: AuthAccount) {
                ${prepareChecks.join("\n")}
                ${prepareBorrows.join("\n")}

                self.signer = signer
            }

            execute {
                ${mints.join("\n")}
                log("Minted tokens!")
            }
        }
    `
        .replaceAll("0xFUNGIBLETOKENADDRESS", COMMON_ADDRESS)
        .replaceAll("0xTOKEN1ADDRESS", COMMON_ADDRESS)
        .replaceAll("0xTOKEN2ADDRESS", COMMON_ADDRESS)
        .replaceAll("0xEXCHANGEROUTERADDRESS", COMMON_ADDRESS)
    // .replaceAll("TOKEN1", token1)
    // .replaceAll("TOKEN2", token2)
    // .replaceAll("EXCHANGEROUTER", `${token1}_${token2}_ExchangeRouter`)
}

export async function useFaucetTransaction(fcl: any, tokens: string[], amounts: string[], address: string) {
    // useEffect(() => {
    //     let isSubscribed = true
    //     const callback = () => {
    //         isSubscribed = false
    //     }

    if (!address) return undefined

    const script = faucetTransaction(tokens, amounts, address)

    return await fcl.fcl
        .send([fcl.fcl.getBlock(false)])
        .then(fcl.fcl.decode)
        .then((block: any) =>
            fcl.fcl.send([
                fcl.fcl.transaction(script),
                fcl.fcl.limit(200),
                fcl.fcl.limit(200),
                fcl.fcl.proposer(fcl.authorization),
                fcl.fcl.authorizations([fcl.authorization, fcl.authorization]),
                fcl.fcl.payer(fcl.authorization),
                fcl.fcl.ref(block.id),
            ])
        )
        .then((results: any) => {
            console.debug(">>>>> Faucet Results:", results)
            return results
        })
        .catch((error: Error) => {
            // if the user rejected the tx, pass this along
            if (error?.message.indexOf("Cannot read property 'sig' of null") !== -1) {
                throw new Error("Transaction rejected.")
            } else {
                // otherwise, the error was unexpected and we need to convey that
                console.error(`Faucet failed: `, error.message)
                throw new Error(`Faucet failed: ${error.message}`)
            }
        })

    //     return callback
    // }, [tokens, address])

    // return useMemo(() => result, [result])
}
