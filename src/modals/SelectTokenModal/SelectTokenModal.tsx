import { AbstractCurrency, Currency, Token } from "../../sdk"
import React, { useCallback } from "react"

import CurrencyModalView from "./CurrencyModalView"
import { TokenList } from "./TokenList"
import Modal from "../../components/Modal"
import { IFCL_TOKEN } from "../../fcl/addresses/addresses"

interface SelectTokenModalProps {
    isOpen: boolean
    onDismiss: () => void
    selectedCurrency?: IFCL_TOKEN | null
    onCurrencySelect: (currency: IFCL_TOKEN) => void
    tokenList?: IFCL_TOKEN[]
}

function SelectTokenModal({ isOpen, onDismiss, onCurrencySelect, selectedCurrency, tokenList }: SelectTokenModalProps) {
    const handleCurrencySelect = useCallback(
        (currency: IFCL_TOKEN) => {
            onCurrencySelect(currency)
            onDismiss()
        },
        [onDismiss, onCurrencySelect]
    )

    return (
        <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={80} minHeight={80} padding={1}>
            <TokenList
                onDismiss={onDismiss}
                onCurrencySelect={handleCurrencySelect}
                selectedCurrency={selectedCurrency}
                tokenList={tokenList}
            />
        </Modal>
    )
}

SelectTokenModal.whyDidYouRender = true

export default SelectTokenModal
