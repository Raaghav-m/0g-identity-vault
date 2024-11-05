"use client";

import { MoralisProvider } from "react-moralis";

export function MoralisWrapper({ children }: { children: React.ReactNode }) {
  return (
    <MoralisProvider initializeOnMount={false}>{children}</MoralisProvider>
  );
}
