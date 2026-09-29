"use client";
import { useSyncExternalStore } from "react";
const subscribe = () => () => {};
/** true na hydratie — voorkomt mismatch met localStorage-winkelwagen. */
export const useHydrated = () => useSyncExternalStore(subscribe, () => true, () => false);
