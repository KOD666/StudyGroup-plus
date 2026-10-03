"use client";

import { createContext, useContext } from "react";
import { InCallChatContextValue } from "./types";

export const InCallChatContext = createContext<InCallChatContextValue | null>(
  null
);

export function useInCallChat() {
  const context = useContext(InCallChatContext);
  if (!context) {
    throw new Error("useInCallChat must be used within an InCallChatProvider");
  }
  return context;
}
