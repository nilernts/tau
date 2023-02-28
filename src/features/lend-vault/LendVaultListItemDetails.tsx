import { ApprovalState, useApproveCallback } from "../../hooks/useApproveCallback"
import { CurrencyAmount, Token, ZERO } from "../../sdk"
import { Disclosure, Transition } from "@headlessui/react"
import React, { useState } from "react"
import { usePendingSolar, useUserInfo } from "./hooks"
import Button from "../../components/Button"
import Dots from "../../components/Dots"
import { TAU_VAULT_ADDRESS, tokenAddressToToken } from "../../constants/addresses"
import { Input as NumericalInput } from "../../components/NumericalInput"
import { formatNumber, formatNumberScale, formatPercent } from "../../functions"
import { getAddress } from "@ethersproject/address"

import { tryParseAmount } from "../../functions/parse"
import useActiveWeb3React from "../../hooks/useActiveWeb3React"

import useMasterChef from "./useMasterChef"
import { useTransactionAdder } from "../../state/transactions/hooks"
import { isMobile } from "react-device-detect"
import Modal from "../../components/Modal"
import ModalHeader from "../../components/ModalHeader"
import Typography from "../../components/Typography"
import moment from "moment"
import { useTokenBalance } from "../../state/wallet/hooks"
import { lend, withdraw } from "../../state/web3/vaults"
import { useFlowTokenBalances } from "../../fcl/scripts/token/getTokenBalances"
import { useFCLLend } from "../../fcl/transactions/vault/lend"

const LendVaultListItem = ({ farm, fcl }) => {
    const [pendingTx, setPendingTx] = useState(false)
    const [depositValue, setDepositValue] = useState("")
    const [withdrawValue, setWithdrawValue] = useState("")

    const addTransaction = useTransactionAdder()

    const deposits = +farm.deposits
    const balance = +farm.balance

    const typedDepositValue = depositValue
    const typedWithdrawValue = withdrawValue

    // const [approvalState, approve] = useApproveCallback(typedDepositValue, TAU_VAULT_ADDRESS[chainId])

    // const { deposit, withdraw: hello, harvest } = useMasterChef()

    return (
        <>
            <Transition
                show={true}
                enter="transition-opacity duration-0"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition-opacity duration-150"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
            >
                <Disclosure.Panel className="flex flex-col w-full border-t-0 rounded rounded-t-none bg-dark-800" static>
                    <div className="grid grid-cols-2 gap-4 p-4">
                        <div className="col-span-2 text-center md:col-span-1">
                            {/* {farm.depositFeeBP && (
                                <div className="pr-4 mb-2 text-left cursor-pointer text-red">{`${`Deposit Fee`}: ${formatPercent(
                                    farm.depositFeeBP / 100
                                )}`}</div>
                            )} */}
                            {fcl.account && (
                                <div className="pr-4 mb-2 text-left cursor-pointer text-secondary">
                                    {`Available`}: {formatNumberScale(balance?.toFixed(2) ?? 0, false, 4)}
                                </div>
                            )}
                            <div className="relative flex items-center w-full mb-4">
                                <NumericalInput
                                    className="w-full px-4 py-4 pr-20 rounded bg-dark-700 focus:ring focus:ring-dark-purple"
                                    value={depositValue}
                                    onUserInput={setDepositValue}
                                />
                                {fcl.account && (
                                    <Button
                                        variant="outlined"
                                        color="light-green"
                                        size="xs"
                                        onClick={() => {
                                            if (balance > 0) {
                                                setDepositValue(balance.toFixed(3))
                                            }
                                        }}
                                        className="absolute border-0 right-4 focus:ring focus:ring-light-purple"
                                    >
                                        {`MAX`}
                                    </Button>
                                )}
                            </div>
                            {/* {approvalState === ApprovalState.NOT_APPROVED || approvalState === ApprovalState.PENDING ? (
                                <Button
                                    className="w-full"
                                    size="sm"
                                    variant="outlined"
                                    color="gradient"
                                    disabled={approvalState === ApprovalState.PENDING}
                                    onClick={approve}
                                >
                                    {approvalState === ApprovalState.PENDING ? <Dots>Approving </Dots> : `Approve`}
                                </Button>
                            ) : ( */}
                            <Button
                                className="w-full"
                                size="sm"
                                variant="outlined"
                                color="gradient"
                                disabled={pendingTx || !typedDepositValue || balance < +depositValue}
                                onClick={async () => {
                                    setPendingTx(true)
                                    const tx = await useFCLLend(fcl, farm.symbol, typedDepositValue)

                                    addTransaction(
                                        { hash: tx.transactionId, ...tx },
                                        {
                                            summary: `${`Deposit`} ${farm.symbol}`,
                                        }
                                    )

                                    setPendingTx(false)
                                }}
                            >
                                {`Deposit`}
                            </Button>
                            {/* )} */}
                        </div>

                        <div className="col-span-2 text-center md:col-span-1">
                            {/* {farm.depositFeeBP && !isMobile && (
                                <div
                                    className="pr-4 mb-2 text-left cursor-pointer text-secondary"
                                    style={{ height: "24px" }}
                                />
                            )} */}

                            {fcl.account && (
                                <div className="pr-4 mb-2 text-left cursor-pointer text-secondary">
                                    {`Total Withdrawable`}: {formatNumberScale(deposits?.toFixed(2)) ?? 0}
                                </div>
                            )}

                            <div className="relative flex items-center w-full mb-4">
                                <NumericalInput
                                    className="w-full px-4 py-4 pr-20 rounded bg-dark-700 focus:ring focus:ring-dark-purple"
                                    value={withdrawValue}
                                    onUserInput={setWithdrawValue}
                                />
                                {fcl.account && (
                                    <Button
                                        variant="outlined"
                                        color="light-green"
                                        size="xs"
                                        onClick={() => {
                                            if (deposits !== 0) {
                                                setWithdrawValue(deposits.toFixed(3))
                                            }
                                        }}
                                        className="absolute border-0 right-4 focus:ring focus:ring-light-purple"
                                    >
                                        {`MAX`}
                                    </Button>
                                )}
                            </div>
                            <Button
                                className="w-full"
                                size="sm"
                                variant="outlined"
                                color="gradient"
                                disabled={
                                    pendingTx || !typedWithdrawValue || deposits < +withdrawValue
                                    // borrowBalance.lessThan(typedWithdrawValue) ||
                                    // (amount && !amount.equalTo(ZERO) &&
                                    //     farm?.lockupDuration > 0 &&
                                    //     moment.unix(userLockedUntil / 1000).isAfter(new Date()))
                                }
                                onClick={async () => {
                                    setPendingTx(true)
                                    // try {
                                    //     const tx = await withdraw(account, farm?.asset, withdrawValue.toBigNumber(18))
                                    //     addTransaction(
                                    //         { hash: tx.transactionHash, ...tx },
                                    //         {
                                    //             summary: `${`Withdraw`} ${
                                    //                 farm.symbol
                                    //             }`,
                                    //         }
                                    //     )
                                    // } catch (error) {
                                    //     console.error(error)
                                    // }

                                    setPendingTx(false)
                                }}
                            >
                                {`Withdraw`}
                            </Button>
                        </div>
                    </div>

                    {/* {pendingTau && pendingTau.greaterThan(ZERO) && (
                        <div className="px-4 pb-4">
                            <Button
                                color="gradient"
                                className="w-full"
                                variant={!!nextHarvestUntil && nextHarvestUntil > Date.now() ? "outlined" : "filled"}
                                disabled={!!nextHarvestUntil && nextHarvestUntil > Date.now()}
                                onClick={async () => {
                                    const fn = async () => {
                                        setPendingTx(true)
                                        try {
                                            const tx = await harvest(farm.id)
                                            addTransaction(tx, {
                                                summary: `${`Harvest`} ${
                                                    farm.pair.token1
                                                        ? `${farm.pair.token0.symbol}/${farm.pair.token1.symbol}`
                                                        : farm.pair.token0.symbol
                                                }`,
                                            })
                                        } catch (error) {
                                            console.error(error)
                                        }
                                        setPendingTx(false)
                                    }

                                    if (farm?.lockupDuration == 0) {
                                        fn()
                                    } else {
                                        setCurrentAction({
                                            action: "harvest",
                                            lockup: `${farm?.lockupDuration / 86400} days`,
                                            callback: fn,
                                        })
                                        setShowConfirmation(true)
                                    }
                                }}
                            >
                                {`Harvest ${formatNumber(pendingTau.toFixed(18))} SOLAR`}
                            </Button>
                        </div>
                    )} */}
                </Disclosure.Panel>
            </Transition>
        </>
    )
}

export default LendVaultListItem
