import FungibleToken from "../utils/FungibleToken.cdc"

pub contract Bridge {
    pub let storagePath: StoragePath 
    pub let capabilityPath: CapabilityPath 
    pub let publicPath: PublicPath

    pub var totalSupply: UFix64

    access(contract) let vault: @Vault

    pub event Deposit(amount: UFix64, who: Address, data: String)
    pub event Withdraw(amount: UFix64, who: Address, data: String)

    init() {
        self.storagePath = /storage/customBridgeStorage
        self.capabilityPath = /private/customBridgeStorage
        self.publicPath = /public/customBridgeStorage

        self.account.save(<- create BridgeImpl(), to: self.storagePath)
        self.account.link<&BridgeImpl>(
            self.publicPath, 
            target: self.storagePath
        )

        self.vault <- create Vault(balance: 0.0)
        self.totalSupply = 0.0
    }


    pub resource Vault: FungibleToken.Provider, FungibleToken.Receiver, FungibleToken.Balance {
        pub var balance: UFix64

        init(balance: UFix64) {
            self.balance = balance
        }

        // withdraw
        pub fun withdraw(amount: UFix64): @FungibleToken.Vault {
            self.balance = self.balance - amount

            return <-(create Vault(balance: amount) as! @FungibleToken.Vault)
        }

        // deposit
        pub fun deposit(from: @FungibleToken.Vault) {
            let vault <- from
            self.balance = self.balance + vault.balance
            Bridge.totalSupply = Bridge.totalSupply + vault.balance
            destroy vault
        }

        destroy() {
            Bridge.totalSupply = Bridge.totalSupply - self.balance
        }
    }

    pub resource BridgeImpl {
        pub fun withdraw(amount: UFix64, sender: Address, data: String): @FungibleToken.Vault {
            let vault <- Bridge.vault.withdraw(amount: amount)
            emit Withdraw(amount: amount, who: sender, data: data)

            return <- vault
        }

        // deposit
        pub fun deposit(from: @FungibleToken.Vault, sender: Address, data: String) {
            let balance = from.balance
            Bridge.vault.deposit(from: <- from)
            emit Deposit(amount: balance, who: sender, data: data)
        }
    }

    pub fun createEmptyBridgeImpl() : @Bridge.BridgeImpl {
        return <- create BridgeImpl()
    }
}
 