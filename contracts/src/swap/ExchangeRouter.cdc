import FungibleToken from "../utils/FungibleToken.cdc"
import DCT from "../token/FlowToken.cdc"
import MAV from "../token/FlowToken.cdc"

// Exchange pair between DCT and MAV
// Token1: DCT
// Token2: MAV
pub contract DCT_MAV_ExchangeRouter: FungibleToken {
    // Frozen flag controlled by Admin
    pub var isFrozen: Bool

    // Total supply of the liquidity token
    pub var totalSupply: UFix64

    // Fee charged when performing swap
    pub var feePercentage: UFix64

    access(contract) let token1Vault: @DCT.Vault
    access(contract) let token2Vault: @MAV.Vault

    // Defines token vault storage path
    pub let TokenStoragePath: StoragePath
    // Defines token vault public balance path
    pub let TokenPublicBalancePath: PublicPath
    // Defines token vault public receiver path
    pub let TokenPublicReceiverPath: PublicPath

    /*
        Events
    */
    // Emitted when the contract is created
    pub event TokensInitialized(initialSupply: UFix64)
    // Emitted when tokens are withdrawn from a Vault
    pub event TokensWithdrawn(amount: UFix64, from: Address?)
    // Emitted when tokens are deposited to a Vault
    pub event TokensDeposited(amount: UFix64, to: Address?)
    // Emitted when new tokens are minted
    pub event TokensMinted(amount: UFix64)
    // Emitted when tokens are destroyed
    pub event TokensBurned(amount: UFix64)
    // Emitted when trading fee is updated
    pub event FeeUpdated(feePercentage: UFix64)
    // Emitted when a swap takes place
    // Side 1: from token1 to token2
    // Side 2: from token2 to token1
    pub event Trade(
        token1Amount: UFix64, 
        token2Amount: UFix64, 
        side: UInt8
    )


    // Vault
    //
    // Each user stores an instance of only the Vault in their storage
    // The functions in the Vault and governed by the pre and post conditions
    // in FlowSwapExchange when they are called.
    // The checks happen at runtime whenever a function is called.
    //
    // Resources can only be created in the context of the contract that they
    // are defined in, so there is no way for a malicious user to create Vaults
    // out of thin air. A special Minter resource needs to be defined to mint
    // new tokens.
    //
    pub resource Vault: FungibleToken.Provider, FungibleToken.Receiver, FungibleToken.Balance {
        // holds the balance of a users tokens
        pub var balance: UFix64

        // initialize the balance at resource creation time
        init(balance: UFix64) {
            self.balance = balance
        }

        // Withdraw
        //
        // Withdraws an amount
        // It creates a new temporary Vault that is used to hold
        // the money that is being transferred. It returns the newly
        // created Vault to the context that called so it can be deposited
        // elsewhere.
        //
        pub fun withdraw(amount: UFix64): @FungibleToken.Vault {
            self.balance = self.balance - amount
            emit TokensWithdrawn(amount: amount, from: self.owner?.address)
            return <-create Vault(balance: amount)
        }

        // deposit
        //
        // Function that takes a Vault object as an argument and adds
        // its balance to the balance of the owners Vault.
        // It is allowed to destroy the sent Vault because the Vault
        // was a temporary holder of the tokens. The Vault's balance has
        // been consumed and therefore can be destroyed.
        pub fun deposit(from: @FungibleToken.Vault) {
            let vault <- from as! @DCT_MAV_ExchangeRouter.Vault
            self.balance = self.balance + vault.balance
            emit TokensDeposited(amount: vault.balance, to: self.owner?.address)
            vault.balance = 0.0
            destroy vault
        }

        destroy() {
            DCT_MAV_ExchangeRouter.totalSupply = DCT_MAV_ExchangeRouter.totalSupply - self.balance
        }
    }


    // createEmptyVault
    //
    // Function that creates a new Vault with a balance of zero
    // and returns it to the calling context. A user must call this function
    // and store the returned Vault in their storage in order to allow their
    // account to be able to receive deposits of this token type.
    //
    pub fun createEmptyVault(): @FungibleToken.Vault {
        return <-create Vault(balance: 0.0)
    }


    pub resource TokenBundle {
        pub var token1: @DCT.Vault
        pub var token2: @MAV.Vault

        // initialize the vault bundle
        init(
            fromToken1: @DCT.Vault, 
            fromToken2: @MAV.Vault
        ) {
            self.token1 <- fromToken1
            self.token2 <- fromToken2
        }

        pub fun depositToken1(from: @DCT.Vault) {
            self.token1.deposit(from: <- from)
        }

        pub fun depositToken2(from: @MAV.Vault) {
            self.token2.deposit(from: <- from)
        }

        pub fun withdrawToken1(): @DCT.Vault {
            var vault <- DCT.createEmptyVault() as! @DCT.Vault
            vault <-> self.token1
            return <- vault
        }

        pub fun withdrawToken2(): @MAV.Vault {
            var vault <- MAV.createEmptyVault() as! @MAV.Vault
            vault <-> self.token2
            return <- vault
        } 

        destroy() {
            destroy self.token1
            destroy self.token2
        }
    }

    // createEmptyBundle
    //
    pub fun createEmptyTokenBundle(): @DCT_MAV_ExchangeRouter.TokenBundle {
        return <- create TokenBundle(
            fromToken1: <- (DCT.createEmptyVault() as! @DCT.Vault),
            fromToken2: <- (MAV.createEmptyVault() as! @MAV.Vault)
        )
    }

    // createTokenBundle
    //
    pub fun createTokenBundle(
        fromToken1: @DCT.Vault, 
        fromToken2: @MAV.Vault
    ): @DCT_MAV_ExchangeRouter.TokenBundle {
        return <- create TokenBundle(fromToken1: <- fromToken1, fromToken2: <- fromToken2)
    }

    // mintTokens
    //
    // Function that mints new tokens, adds them to the total supply,
    // and returns them to the calling context.
    //
    // Return an unspent vault
    access(contract) fun mintTokens(amount: UFix64): @DCT_MAV_ExchangeRouter.Vault {
        pre {
            amount > 0.0: "Amount minted must be greater than zero"
        }

        DCT_MAV_ExchangeRouter.totalSupply = DCT_MAV_ExchangeRouter.totalSupply + amount
        emit TokensMinted(amount: amount)
        return <-create Vault(balance: amount)
    }

    // burnTokens
    //
    // Function that destroys a Vault instance, effectively burning the tokens.
    //
    // Note: the burned tokens are automatically subtracted from the 
    // total supply in the Vault destructor.
    //
    // Spend a vault
    access(contract) fun burnTokens(from: @DCT_MAV_ExchangeRouter.Vault) {
        let vault <- from
        let amount = vault.balance
        destroy vault
        emit TokensBurned(amount: amount)
    }


    pub resource SwapProxy {
        pub fun swapToken1ForToken2(from: @DCT.Vault): @MAV.Vault {
            return <- DCT_MAV_ExchangeRouter._swapToken1ForToken2(from: <-from)
        }

        pub fun swapToken2ForToken1(from: @MAV.Vault): @DCT.Vault {
            return <- DCT_MAV_ExchangeRouter._swapToken2ForToken1(from: <-from)
        }

        pub fun addLiquidity(from: @DCT_MAV_ExchangeRouter.TokenBundle): @DCT_MAV_ExchangeRouter.Vault {
            return <- DCT_MAV_ExchangeRouter._addLiquidity(from: <-from)
        }

        pub fun removeLiquidity(from: @DCT_MAV_ExchangeRouter.Vault): @DCT_MAV_ExchangeRouter.TokenBundle {
            return <- DCT_MAV_ExchangeRouter._removeLiquidity(from: <-from)
        }
    }


    pub resource Admin {
        pub fun freeze() {
            DCT_MAV_ExchangeRouter.isFrozen = true
        }

        pub fun unfreeze() {
            DCT_MAV_ExchangeRouter.isFrozen = false
        }

        pub fun setProxyOnly(proxyOnly: Bool) {
            DCT_MAV_ExchangeRouter.account.load<Bool>(from: /storage/DCT_MAV_ProxyOnly)
            DCT_MAV_ExchangeRouter.account.save(proxyOnly, to: /storage/DCT_MAV_ProxyOnly)
        }

        pub fun addInitialLiquidity(from: @DCT_MAV_ExchangeRouter.TokenBundle): @DCT_MAV_ExchangeRouter.Vault {
            pre {
                DCT_MAV_ExchangeRouter.totalSupply == 0.0: "DCT_MAV_ExchangeRouter already initialized"
            }

            let token1Vault <- from.withdrawToken1()
            let token2Vault <- from.withdrawToken2()

            assert(token1Vault.balance > 0.0, message: "Token1 vault is empty")
            assert(token2Vault.balance > 0.0, message: "Token2 vault is empty")

            DCT_MAV_ExchangeRouter.token1Vault.deposit(from: <- token1Vault)
            DCT_MAV_ExchangeRouter.token2Vault.deposit(from: <- token2Vault)

            destroy from

            // Create initial tokens
            return <- DCT_MAV_ExchangeRouter.mintTokens(amount: 1.0)
        }


        pub fun updateFeePercentage(feePercentage: UFix64) {
            DCT_MAV_ExchangeRouter.feePercentage = feePercentage
            emit FeeUpdated(feePercentage: feePercentage)
        }


        pub fun createSwapProxy(): @DCT_MAV_ExchangeRouter.SwapProxy {
            return <- create DCT_MAV_ExchangeRouter.SwapProxy()
        }
    }


    pub struct PoolAmounts {
        pub let token1Amount: UFix64
        pub let token2Amount: UFix64

        init(token1Amount: UFix64, token2Amount: UFix64) {
            self.token1Amount = token1Amount
            self.token2Amount = token2Amount
        }
    }


    pub fun proxyOnly(): Bool {
        return self.account.copy<Bool>(from: /storage/DCT_MAV_ProxyOnly) ?? false
    }


    pub fun getFeePercentage(): UFix64 {
        return self.feePercentage
    }


    // Check current pool amounts
    pub fun getPoolAmounts(): PoolAmounts {
        return PoolAmounts(token1Amount: DCT_MAV_ExchangeRouter.token1Vault.balance, token2Amount: DCT_MAV_ExchangeRouter.token2Vault.balance)
    }


    // Get quote for Token1 (given) -> Token2
    pub fun quoteSwapExactToken1ForToken2(amount: UFix64): UFix64 {
        let poolAmounts = self.getPoolAmounts()
        // token1Amount * token2Amount = token1Amount' * token2Amount' = (token1Amount + amount) * (token2Amount - quote)
        let quote = poolAmounts.token2Amount * amount / (poolAmounts.token1Amount + amount);

        return quote
    }


    // Get quote for Token1 -> Token2 (given)
    pub fun quoteSwapToken1ForExactToken2(amount: UFix64): UFix64 {
        let poolAmounts = self.getPoolAmounts()

        assert(poolAmounts.token2Amount > amount, message: "Not enough Token2 in the pool")

        // token1Amount * token2Amount = token1Amount' * token2Amount' = (token1Amount + quote) * (token2Amount - amount)
        let quote = poolAmounts.token1Amount * amount / (poolAmounts.token2Amount - amount);

        return quote
    }


    // Get quote for Token2 (given) -> Token1
    pub fun quoteSwapExactToken2ForToken1(amount: UFix64): UFix64 {
        let poolAmounts = self.getPoolAmounts()

        // token1Amount * token2Amount = token1Amount' * token2Amount' = (token2Amount + amount) * (token1Amount - quote)
        let quote = poolAmounts.token1Amount * amount / (poolAmounts.token2Amount + amount);

        return quote
    }


    // Get quote for Token2 -> Token1 (given)
    pub fun quoteSwapToken2ForExactToken1(amount: UFix64): UFix64 {
        let poolAmounts = self.getPoolAmounts()

        assert(poolAmounts.token1Amount > amount, message: "Not enough Token1 in the pool")

        // token1Amount * token2Amount = token1Amount' * token2Amount' = (token2Amount + quote) * (token1Amount - amount)
        let quote = poolAmounts.token2Amount * amount / (poolAmounts.token1Amount - amount);

        return quote
    }


    // Swaps Token1 (DCT) -> Token2 (MAV)
    access(contract) fun _swapToken1ForToken2(from: @DCT.Vault): @MAV.Vault {
        pre {
            !DCT_MAV_ExchangeRouter.isFrozen: "DCT_MAV_ExchangeRouter is frozen"
            from.balance > 0.0: "Empty token vault"
        }

        // Calculate amount from pricing curve
        // A fee portion is taken from the final amount
        let token1Amount = from.balance * (1.0 - self.feePercentage)
        let token2Amount = self.quoteSwapExactToken1ForToken2(amount: token1Amount)

        assert(token2Amount > 0.0, message: "Exchanged amount too small")

        self.token1Vault.deposit(from: <- from)
        emit Trade(token1Amount: token1Amount, token2Amount: token2Amount, side: 1)

        return <- (self.token2Vault.withdraw(amount: token2Amount) as! @MAV.Vault)
    }


    pub fun swapToken1ForToken2(from: @DCT.Vault): @MAV.Vault {
        pre {
            !DCT_MAV_ExchangeRouter.proxyOnly(): "DCT_MAV_ExchangeRouter is proxyOnly"
        }

        return <- DCT_MAV_ExchangeRouter._swapToken1ForToken2(from: <-from)
    }


    // Swap Token2 (MAV) -> Token1 (DCT)
    access(contract) fun _swapToken2ForToken1(from: @MAV.Vault): @DCT.Vault {
        pre {
            !DCT_MAV_ExchangeRouter.isFrozen: "DCT_MAV_ExchangeRouter is frozen"
            from.balance > 0.0: "Empty token vault"
        }

        // Calculate amount from pricing curve
        // A fee portion is taken from the final amount
        let token2Amount = from.balance * (1.0 - self.feePercentage)
        let token1Amount = self.quoteSwapExactToken2ForToken1(amount: token2Amount)

        assert(token1Amount > 0.0, message: "Exchanged amount too small")

        self.token2Vault.deposit(from: <- from)
        emit Trade(token1Amount: token1Amount, token2Amount: token2Amount, side: 2)

        return <- (self.token1Vault.withdraw(amount: token1Amount) as! @DCT.Vault)
    }


    pub fun swapToken2ForToken1(from: @MAV.Vault): @DCT.Vault {
        pre {
            !DCT_MAV_ExchangeRouter.proxyOnly(): "DCT_MAV_ExchangeRouter is proxyOnly"
        }

        return <- DCT_MAV_ExchangeRouter._swapToken2ForToken1(from: <-from)
    }


    // Add liquidity without minting new liquidity tokens
    pub fun donateLiquidity(from: @DCT_MAV_ExchangeRouter.TokenBundle) {
        let token1Vault <- from.withdrawToken1()
        let token2Vault <- from.withdrawToken2()

        DCT_MAV_ExchangeRouter.token1Vault.deposit(from: <- token1Vault)
        DCT_MAV_ExchangeRouter.token2Vault.deposit(from: <- token2Vault)

        destroy from
    }


    access(contract) fun _addLiquidity(from: @DCT_MAV_ExchangeRouter.TokenBundle): @DCT_MAV_ExchangeRouter.Vault {
        pre {
            self.totalSupply > 0.0: "DCT_MAV_ExchangeRouter must be initialized by admin first"
        }

        let token1Vault <- from.withdrawToken1()
        let token2Vault <- from.withdrawToken2()

        assert(token1Vault.balance > 0.0, message: "Empty token1 vault")
        assert(token2Vault.balance > 0.0, message: "Empty token2 vault")

        // shift decimal 4 places to avoid truncation error
        let token1Percentage: UFix64 = (token1Vault.balance * 10000.0) / DCT_MAV_ExchangeRouter.token1Vault.balance
        let token2Percentage: UFix64 = (token2Vault.balance * 10000.0) / DCT_MAV_ExchangeRouter.token2Vault.balance

        // final liquidity token minted is the smaller between token1Liquidity and token2Liquidity
        // to maximize profit, user should add liquidity propotional to current liquidity
        let liquidityPercentage = token1Percentage < token2Percentage ? token1Percentage : token2Percentage;

        assert(liquidityPercentage > 0.0, message: "Liquidity too small")

        DCT_MAV_ExchangeRouter.token1Vault.deposit(from: <- token1Vault)
        DCT_MAV_ExchangeRouter.token2Vault.deposit(from: <- token2Vault)

        let liquidityTokenVault <- DCT_MAV_ExchangeRouter.mintTokens(amount: (DCT_MAV_ExchangeRouter.totalSupply * liquidityPercentage) / 10000.0)

        destroy from
        return <- liquidityTokenVault
    }


    pub fun addLiquidity(from: @DCT_MAV_ExchangeRouter.TokenBundle): @DCT_MAV_ExchangeRouter.Vault {
        pre {
            !DCT_MAV_ExchangeRouter.proxyOnly(): "DCT_MAV_ExchangeRouter is proxyOnly"
        }

        return <- DCT_MAV_ExchangeRouter._addLiquidity(from: <-from)
    }


    access(contract) fun _removeLiquidity(from: @DCT_MAV_ExchangeRouter.Vault): @DCT_MAV_ExchangeRouter.TokenBundle {
        pre {
            from.balance > 0.0: "Empty liquidity token vault"
            from.balance < DCT_MAV_ExchangeRouter.totalSupply: "Cannot remove all liquidity"
        }

        // shift decimal 4 places to avoid truncation error
        let liquidityPercentage = (from.balance * 10000.0) / DCT_MAV_ExchangeRouter.totalSupply

        assert(liquidityPercentage > 0.0, message: "Liquidity too small")

        // Burn liquidity tokens and withdraw
        DCT_MAV_ExchangeRouter.burnTokens(from: <- from)

        let token1Vault <- DCT_MAV_ExchangeRouter.token1Vault.withdraw(
            amount: (DCT_MAV_ExchangeRouter.token1Vault.balance * liquidityPercentage) / 10000.0
        ) as! @DCT.Vault
        let token2Vault <- DCT_MAV_ExchangeRouter.token2Vault.withdraw(
            amount: (DCT_MAV_ExchangeRouter.token2Vault.balance * liquidityPercentage) / 10000.0
        ) as! @MAV.Vault

        let tokenBundle <- DCT_MAV_ExchangeRouter.createTokenBundle(
            fromToken1: <- token1Vault, 
            fromToken2: <- token2Vault
        )
        return <- tokenBundle
    }


    pub fun removeLiquidity(from: @DCT_MAV_ExchangeRouter.Vault): @DCT_MAV_ExchangeRouter.TokenBundle {
        pre {
            !DCT_MAV_ExchangeRouter.proxyOnly(): "DCT_MAV_ExchangeRouter is proxyOnly"
        }

        return <- DCT_MAV_ExchangeRouter._removeLiquidity(from: <-from)
    }


    init() {
        self.isFrozen = false // unfrozen until admin freezes
        self.totalSupply = 0.0
        self.feePercentage = 0.003 // 0.3%
        self.TokenStoragePath = /storage/DCT_MAV_LpVault
        self.TokenPublicBalancePath = /public/DCT_MAV_LpBalance
        self.TokenPublicReceiverPath = /public/DCT_MAV_LpReceiver

        // Setup internal DCT vault
        self.token1Vault <- DCT.createEmptyVault() as! @DCT.Vault

        // Setup internal MAV vault
        self.token2Vault <- MAV.createEmptyVault() as! @MAV.Vault

        let admin <- create Admin()
        self.account.save(<-admin, to: /storage/DCT_MAV_DCT_MAV_ExchangeRouterAdmin)

        // Emit an event that shows that the contract was initialized
        emit TokensInitialized(initialSupply: self.totalSupply)
    }
}
 