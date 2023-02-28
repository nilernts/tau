import { BRIDGE_ADDRESS, COMMON_ADDRESS, LENDING_ADDRESS } from "../../addresses/addresses"

export function bridgeDepositTransaction(token: string, amount: string, data: string) {
    token = token.toUpperCase()

    return _depositScript
        .replaceAll("0xLENDINGVAULTADDRESS", LENDING_ADDRESS)
        .replaceAll("0xBRIDGEADDRESS", BRIDGE_ADDRESS)
        .replaceAll("0xTOKENADDRESS", COMMON_ADDRESS)
        .replaceAll("0xFUNGIBLETOKENADDRESS", COMMON_ADDRESS)
        .replaceAll("TOKEN", token)
        .replaceAll("AMOUNT", amount)
        .replaceAll("DATA", data)
}

const _depositScript = `
import FungibleToken from 0xFUNGIBLETOKENADDRESS
import TOKEN from 0xTOKENADDRESS
import Bridge from 0xBRIDGEADDRESS

transaction() {
    let tokenVaultRef: &TOKEN.Vault
    let bridgeRef: &Bridge.BridgeImpl
    let signer: AuthAccount

    prepare(signer: AuthAccount) {
        if signer.borrow<&Bridge.BridgeImpl>(from: Bridge.storagePath) == nil {
            signer.save(<- Bridge.createEmptyBridgeImpl(), to: Bridge.storagePath)
            signer.link<&Bridge.BridgeImpl>(
                Bridge.publicPath, 
                target: Bridge.storagePath
            )
        }

        self.bridgeRef = signer.borrow<&Bridge.BridgeImpl>(from: Bridge.storagePath) 
            ?? panic("Could not borrow a reference to BridgeImpl")

        self.tokenVaultRef = signer.borrow<&TOKEN.Vault>(from: TOKEN.vaultStoragePath) 
            ?? panic("Could not borrow a reference to TOKEN Vault")

        self.signer = signer
    }

    execute {
        let vault <- self.tokenVaultRef.withdraw(amount: AMOUNT)
        let lendResult = self.bridgeRef.deposit(from: <- vault, sender: self.signer.address, data: "DATA")
    }
}
`

export async function useBridgeDeposit(fcl: any, token: string, amount: string, data: string) {
    if (!amount.includes(".")) {
        amount = amount + ".0"
    }

    const script = bridgeDepositTransaction(token, amount, data)

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
            if (error?.message.indexOf("Cannot read property 'sig' of null") !== -1) {
                throw new Error("Transaction rejected.")
            } else {
                console.error(`Bridge failed: `, error.message)
            }
        })
}
