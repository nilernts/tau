import { atom } from "jotai"
import { atomWithStorage, createJSONStorage } from "jotai/utils"

export const accountAtom = atomWithStorage<string>("account", "")
