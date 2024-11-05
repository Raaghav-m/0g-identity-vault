import { Button } from "../ui/button";
import React from "react";
import { Wallet } from "lucide-react";

export function WalletConnection({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="text-center">
      <Button
        onClick={onConnect}
        className="bg-teal-600 hover:bg-teal-700 text-white"
      >
        <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
      </Button>
    </div>
  );
}
