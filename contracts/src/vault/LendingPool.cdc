import FungibleToken from "../utils/FungibleToken.cdc"

pub contract LendingVault {
    pub let storagePath: StoragePath 
    pub let capabilityPath: CapabilityPath 
    pub let publicPath: PublicPath
    pub var totalSupply: UFix64

    pub let lendRate: UFix64
    pub let borrowRate: UFix64
    pub var periodBorrowed: UFix64

    pub var lendAmount: { Address: LendingVault.Amount }
    pub var lenders: { Address: Bool }
    pub var borrowAmount: { Address: LendingVault.Amount }
    pub var borrowers: { Address: Bool }
    pub var earnedInterest: UFix64

    access(contract) let vault: @Vault

    pub struct Amount {
        access(contract) var amount: UFix64
        access(contract) var start: UFix64

        init(amount: UFix64, start: UFix64) {
          self.amount = amount
          self.start = start
        }
    }

    init() {
        self.storagePath = /storage/customLendingVaultStorage
        self.capabilityPath = /private/customLendingVaultStorage
        self.publicPath = /public/customLendingVaultStorage

        self.account.save(<- create LendingPool(), to: self.storagePath)
        self.account.link<&LendingPool{ILendingPool}>(
            self.publicPath, 
            target: self.storagePath
        )

        self.totalSupply = 0.0
        self.vault <- create Vault(balance: self.totalSupply)

        self.lendRate = 30.0
        self.borrowRate = 130.0
        self.periodBorrowed = 0.0
        self.lendAmount = {}
        self.lenders = {}
        self.borrowAmount = {}
        self.borrowers = {}
        self.earnedInterest = 0.0
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
            LendingVault.totalSupply = LendingVault.totalSupply + vault.balance
            // vault.balance = 0.0
            destroy vault
        }

        destroy() {
            LendingVault.totalSupply = LendingVault.totalSupply - self.balance
        }
    }

    pub resource interface ILendingPool {
        pub fun lend(vault: @FungibleToken.Vault, sender: Address): Bool {
            pre {
                vault.balance > 0.0: "Amount must be greater than 0"
            }
        }

        pub fun borrow(amount: UFix64, sender: Address): @FungibleToken.Vault {
            pre {
                amount > 0.0: "Amount must be greater than 0"
                amount < LendingVault.totalSupply: "Insufficient liquidity"
            }
        }

        pub fun repay(vault: @FungibleToken.Vault, sender: Address): Bool {
            pre {
                vault.balance > 0.0: "Amount must be greater than 0"
            }
        }

        pub fun withdraw(sender: Address): @FungibleToken.Vault
    }


    pub resource LendingPool: ILendingPool {
        // Lend an amount; add liquidity to the pool
        pub fun lend(vault: @FungibleToken.Vault, sender: Address): Bool {
            let vaultBalance = vault.balance

            LendingVault.vault.deposit(from: <- vault)
            let old = LendingVault.lendAmount[sender]
            LendingVault.lendAmount[sender] = LendingVault.Amount(amount: old?.amount ?? 0.0 + vaultBalance, start: getCurrentBlock().timestamp)
            LendingVault.lenders[sender] = true

            return true
        }

        // Borrow assets
        pub fun borrow(amount: UFix64, sender: Address): @FungibleToken.Vault {
            // Update records first
            LendingVault.borrowers[sender] = true 
            let old = LendingVault.borrowAmount[sender]
            LendingVault.borrowAmount[sender] = LendingVault.Amount(amount: old?.amount ?? 0.0 + amount, start: getCurrentBlock().timestamp)

            return <- LendingVault.vault.withdraw(amount: amount)
        }

        // Repay borrowed loan
        pub fun repay(vault: @FungibleToken.Vault, sender: Address): Bool {
            assert(LendingVault.borrowers[sender] == true, message: "Not a borrower")

            // Calculate total amount to be paid (factoring in interest)
            let borrowAmount = LendingVault.borrowAmount[sender]
            var amount: UFix64 = (UInt64(borrowAmount?.amount as! Number) + 
                        (UInt64(borrowAmount?.amount as! Number) * 
                        ((UInt64(getCurrentBlock().timestamp) - UInt64(borrowAmount?.start as! Number)) * UInt64(LendingVault.borrowRate)) 
                        / UInt64(LendingVault.totalSupply))) as! UFix64

            assert(amount > 0.0, message: "Calculated amount cannot be 0")

            LendingVault.vault.deposit(from: <- vault)

            // Update records
            LendingVault.borrowAmount[sender] = LendingVault.Amount(amount: 0.0, start: 0.0)
            LendingVault.borrowers[sender] = false

            return true
        }

        // Withdraw lent-out asset
        pub fun withdraw(sender: Address): @FungibleToken.Vault {
            assert(LendingVault.lenders[sender] == true, message: "Not a lender")

            let old = LendingVault.lendAmount[sender]

            var amount: UFix64 = (UInt64(old?.amount as! Number) + 
                        (UInt64(old?.amount as! Number) * 
                        ((UInt64(getCurrentBlock().timestamp) - UInt64(old?.start as! Number)) * UInt64(LendingVault.lendRate)) 
                        / UInt64(LendingVault.totalSupply))) as! UFix64

            assert(amount >= LendingVault.totalSupply, message: "Insufficient contract balance")

            // Update records first
            LendingVault.lenders[sender] = false 
            LendingVault.borrowAmount[sender] = LendingVault.Amount(amount: amount, start: old?.start ?? 0.0)

            return <- LendingVault.vault.withdraw(amount: amount)
        }

        init() {
            
        }
    }


    pub fun createEmptyLendingPool() : @LendingVault.LendingPool {
        return <- create LendingVault.LendingPool()
    }
}
 