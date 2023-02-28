import { Currency } from "../../sdk"
import React, { useCallback, useEffect, useRef } from "react"

import AutoSizer from "react-virtualized-auto-sizer"
import Column from "../../components/Column"
import CurrencyList from "./CurrencyList"
import { FixedSizeList } from "react-window"
import ModalHeader from "../../components/ModalHeader"
import styled from "styled-components"

import { useOnClickOutside } from "../../hooks/useOnClickOutside"
import useToggle from "../../hooks/useToggle"
import { IFCL_TOKEN } from "../../fcl/addresses/addresses"

const ContentWrapper = styled(Column)`
    height: 100%;
    width: 100%;
    flex: 1 1;
    position: relative;
`

interface TokenListProps {
    onDismiss: () => void
    selectedCurrency?: IFCL_TOKEN | null
    onCurrencySelect: (currency: IFCL_TOKEN) => void
    tokenList?: IFCL_TOKEN[]
}

export function TokenList({ selectedCurrency, onCurrencySelect, onDismiss, tokenList }: TokenListProps) {
    // refs for fixed size lists
    const fixedList = useRef<FixedSizeList>()

    useEffect(() => {
        console.debug("This is my tokenlist:", tokenList)
    }, [])

    const handleCurrencySelect = useCallback(
        (currency: IFCL_TOKEN) => {
            onCurrencySelect(currency)
            onDismiss()
        },
        [onDismiss, onCurrencySelect]
    )

    // menu ui
    const [open, toggle] = useToggle(false)
    const node = useRef<HTMLDivElement>()
    useOnClickOutside(node, open ? toggle : undefined)

    return (
        <ContentWrapper>
            <ModalHeader onClose={onDismiss} title={`Select a token`} />
            {tokenList?.length > 0 ? (
                <div className="flex-1 h-full">
                    <AutoSizer disableWidth>
                        {({ height }) => (
                            <CurrencyList
                                height={height}
                                currencies={tokenList}
                                onCurrencySelect={handleCurrencySelect}
                                selectedCurrency={selectedCurrency}
                                fixedListRef={fixedList}
                            />
                        )}
                    </AutoSizer>
                </div>
            ) : (
                <Column style={{ padding: "20px", height: "100%" }}>
                    <div className="mb-8 text-center">{`No results found`}</div>
                </Column>
            )}
        </ContentWrapper>
    )
}
