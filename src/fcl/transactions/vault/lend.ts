import { COMMON_ADDRESS, LENDING_ADDRESS } from "../../addresses/addresses"

export function lendTransaction(token: string, amount: string) {
    token = token.toUpperCase()

    return _lendScript
        .replaceAll("0xLENDINGVAULTADDRESS", LENDING_ADDRESS)
        .replaceAll("0xFUNGIBLETOKENADDRESS", COMMON_ADDRESS)
        .replaceAll("0xTOKENADDRESS", COMMON_ADDRESS)
        .replaceAll("TOKEN", token)
        .replaceAll("AMOUNT", amount)
}

const _lendScript = `
import FungibleToken from 0xFUNGIBLETOKENADDRESS
import TOKEN from 0xTOKENADDRESS
import LendingVault from 0xLENDINGVAULTADDRESS

transaction() {
    let tokenVaultRef: &TOKEN.Vault
    let lendingVaultRef: &LendingVault.LendingPool
    let signer: AuthAccount

    prepare(signer: AuthAccount) {
        if signer.borrow<&LendingVault.LendingPool>(from: LendingVault.storagePath) == nil {
            signer.save(<- LendingVault.createEmptyLendingPool(), to: LendingVault.storagePath)
        }

        self.lendingVaultRef = signer.borrow<&LendingVault.LendingPool>(from: LendingVault.storagePath)
            ?? panic("Could not borrow a reference to LendingVault")

        self.tokenVaultRef = signer.borrow<&TOKEN.Vault>(from: TOKEN.vaultStoragePath) 
            ?? panic("Could not borrow a reference to TOKEN Vault")

        self.signer = signer
    }

    execute {
        let vault <- self.tokenVaultRef.withdraw(amount: AMOUNT)
        let lendResult = self.lendingVaultRef.lend(vault: <- vault, sender: self.signer.address)
        log(lendResult)
    }
}
`

export async function useFCLLend(fcl: any, token: string, amount: string) {
    if (!amount.includes(".")) {
        amount = amount + ".0"
    }
    const script = lendTransaction(token, amount)

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
            console.debug(">>>>> Lend Results:", results)
            return results
        })
        .catch((error: Error) => {
            // if the user rejected the tx, pass this along
            if (error?.message.indexOf("Cannot read property 'sig' of null") !== -1) {
                throw new Error("Transaction rejected.")
            } else {
                console.error(`Lend failed: `, error.message)
                // throw new Error(`Lend failed: ${error.message}`)
            }
        })
}
