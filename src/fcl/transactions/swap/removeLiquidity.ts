import { COMMON_ADDRESS } from "../../addresses/addresses"

export function removeLiquidityTransaction(token1: string, token2: string) {
    token1 = token1.toUpperCase()
    token2 = token2.toUpperCase()

    return _removeLiquidityScript
        .replaceAll("0xFUNGIBLETOKENADDRESS", COMMON_ADDRESS)
        .replaceAll("0xTOKEN1ADDRESS", COMMON_ADDRESS)
        .replaceAll("0xTOKEN2ADDRESS", COMMON_ADDRESS)
        .replaceAll("0xEXCHANGEROUTERADDRESS", COMMON_ADDRESS)
        .replaceAll("TOKEN1", token1)
        .replaceAll("TOKEN2", token2)
        .replaceAll("EXCHANGEROUTER", `${token1}_${token2}_ExchangeRouter`)
}

const _removeLiquidityScript = `
import TOKEN1 from 0xTOKEN1ADDRESS
import TOKEN2 from 0xTOKEN2ADDRESS
import EXCHANGEROUTER from 0xEXCHANGEROUTERADDRESS

transaction(amount: UFix64) {
    // The Vault reference for liquidity tokens
    let liquidityTokenRef: &EXCHANGEROUTER.Vault

    // The Vault references that holds the tokens that are being transferred
    let token1VaultRef: &TOKEN1.Vault
    let token2VaultRef: &TOKEN2.Vault

    prepare(signer: AuthAccount) {
        self.liquidityTokenRef = signer.borrow<&EXCHANGEROUTER.Vault>(from: EXCHANGEROUTER.TokenStoragePath)
        ?? panic("Could not borrow a reference to Vault")

        self.token1VaultRef = signer.borrow<&TOKEN1.Vault>(from: /storage/flowTokenVault)
        ?? panic("Could not borrow a reference to TOKEN1 Vault")

        self.token2VaultRef = signer.borrow<&TOKEN2.Vault>(from: /storage/teleportedTetherTokenVault)
        ?? panic("Could not borrow a reference to TOKEN2 Vault")
    }

    execute {
        // Withdraw liquidity provider tokens
        let liquidityTokenVault <- self.liquidityTokenRef.withdraw(amount: amount) as! @EXCHANGEROUTER.Vault

        // Take back liquidity
        let tokenBundle <- EXCHANGEROUTER.removeLiquidity(from: <-liquidityTokenVault)

        // Deposit liquidity tokens
        self.token1VaultRef.deposit(from: <- tokenBundle.withdrawToken1())
        self.token2VaultRef.deposit(from: <- tokenBundle.withdrawToken2())

        destroy tokenBundle
    }
}
`
