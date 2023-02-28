import { COMMON_ADDRESS } from "../../addresses/addresses"

export function addLiquidityTransaction(token1: string, token2: string) {
    token1 = token1.toUpperCase()
    token2 = token2.toUpperCase()

    return _addLiquidityScript
        .replaceAll("0xFUNGIBLETOKENADDRESS", COMMON_ADDRESS)
        .replaceAll("0xTOKEN1ADDRESS", COMMON_ADDRESS)
        .replaceAll("0xTOKEN2ADDRESS", COMMON_ADDRESS)
        .replaceAll("0xEXCHANGEROUTERADDRESS", COMMON_ADDRESS)
        .replaceAll("TOKEN1", token1)
        .replaceAll("TOKEN2", token2)
        .replaceAll("EXCHANGEROUTER", `${token1}_${token2}_ExchangeRouter`)
}

const _addLiquidityScript = `
import FungibleToken from 0xFUNGIBLETOKENADDRESS
import TOKEN1 from 0xTOKEN1ADDRESS
import TOKEN2 from 0xTOKEN2ADDRESS
import EXCHANGEROUTER from 0xEXCHANGEROUTERADDRESS

transaction(token1In: UFix64, token2In: UFix64, token1Min: UFix64, token2Min: UFix64) {
    let token1VaultRef: &TOKEN1.Vault
    let token2VaultRef: &TOKEN2.Vault

    let liquidityTokenRef: &EXCHANGEROUTER.Vault

    prepare(signer: AuthAccount) {
        self.token1VaultRef = signer.borrow<&TOKEN1.Vault>(from: TOKEN1.vaultStoragePath)
            ?? panic("Could not borrow a reference to TOKEN1 Vault")

        self.token2VaultRef = signer.borrow<&TOKEN2.Vault>(from: TOKEN2.vaultStoragePath)
            ?? panic("Could not borrow a reference to TOKEN2 Vault")

        if signer.borrow<&EXCHANGEROUTER.Vault>(from: EXCHANGEROUTER.TokenStoragePath) == nil {
            signer.save(<-EXCHANGEROUTER.createEmptyVault(), to: EXCHANGEROUTER.TokenStoragePath)

            signer.link<&EXCHANGEROUTER.Vault{FungibleToken.Receiver}>(
                EXCHANGEROUTER.TokenPublicReceiverPath,
                target: EXCHANGEROUTER.TokenStoragePath
            )

            signer.link<&EXCHANGEROUTER.Vault{FungibleToken.Balance}>(
                EXCHANGEROUTER.TokenPublicBalancePath,
                target: EXCHANGEROUTER.TokenStoragePath
            )
        }

        self.liquidityTokenRef = signer.borrow<&EXCHANGEROUTER.Vault>(from: EXCHANGEROUTER.TokenStoragePath)
            ?? panic("Could not borrow a reference to Vault")
    }

    execute {
        let poolAmounts = EXCHANGEROUTER.getPoolAmounts()

        // let token1Percentage = token1In / poolAmounts.token1Amount
        // let token2Percentage = token2In / poolAmounts.token2Amount

        // let finalPercentage = token1Percentage < token2Percentage ? token1Percentage : token2Percentage
        
        // let token1Amount = finalPercentage * poolAmounts.token1Amount
        // let token2Amount = finalPercentage * poolAmounts.token2Amount

        // assert(token1Amount > token1Min, message: "Token 1 amount too small")
        // assert(token2Amount > token2Min, message: "Token 2 amount too small")
        
        let token1Vault <- self.token1VaultRef.withdraw(amount: token1In) as! @TOKEN1.Vault
        let token2Vault <- self.token2VaultRef.withdraw(amount: token2In) as! @TOKEN2.Vault

        let tokenBundle <- EXCHANGEROUTER.createTokenBundle(fromToken1: <- token1Vault, fromToken2: <- token2Vault);
        let liquidityTokenVault <- EXCHANGEROUTER.addLiquidity(from: <- tokenBundle)

        self.liquidityTokenRef.deposit(from: <- liquidityTokenVault)
    }
}
`

export async function useFCLAddLiquidityCallback(
    fcl: any,
    token1: string,
    token2: string,
    amount1: string,
    amount2: string
) {
    if (!amount1.includes(".")) {
        amount1 = amount1 + ".0"
    }
    if (!amount2.includes(".")) {
        amount2 = amount2 + ".0"
    }
    const script = addLiquidityTransaction(token1, token2)

    return await fcl.fcl
        .send([fcl.fcl.getBlock(false)])
        .then(fcl.fcl.decode)
        .then((block: any) =>
            fcl.fcl.send([
                fcl.fcl.transaction(script),
                fcl.fcl.args([
                    fcl.fcl.arg(amount1, fcl.types.UFix64),
                    fcl.fcl.arg(amount1, fcl.types.UFix64),
                    fcl.fcl.arg(amount2, fcl.types.UFix64),
                    fcl.fcl.arg(amount2, fcl.types.UFix64),
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
            console.debug(">>>>> Add liquidity Results:", results)
            return results
        })
        .catch((error: Error) => {
            // if the user rejected the tx, pass this along
            if (error?.message.indexOf("Cannot read property 'sig' of null") !== -1) {
                throw new Error("Transaction rejected.")
            } else {
                console.error(`Add liquidity failed: `, error.message)
                // throw new Error(`Add liquidity failed: ${error.message}`)
            }
        })
}
