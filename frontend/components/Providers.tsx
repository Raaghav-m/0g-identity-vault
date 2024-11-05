"use client";

import { MoralisProvider } from "react-moralis";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MoralisProvider initializeOnMount={false}>{children}</MoralisProvider>
  );
}
