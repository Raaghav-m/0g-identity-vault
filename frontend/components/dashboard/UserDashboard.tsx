"use client";
import React, { useState, useEffect, createContext } from "react";
import { ViewerDashboard } from "./ViewerDashboard";
import { IssuerDashboard } from "./IssuerDashboard";
import { WalletConnection } from "./WalletConnection";
import DIdentity from "../abis/DIdentity.json";
import { ethers } from "ethers";
import { useMoralis, useWeb3Contract } from "react-moralis";
import {
  DIDENTITY_CONTRACT_ADDRESS,
  ISSUER_CONTRACT_ADDRESS,
} from "@/lib/constants";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (params: any) => void) => void;
      removeListener: (event: string, callback: (params: any) => void) => void;
    };
  }
}

type UserRole = "viewer" | "issuer" | null;

export function UserDashboard() {
  const { account, isAuthenticated, Moralis } = useMoralis();
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { runContractFunction } = useWeb3Contract();

  const onConnect = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        // Request account access

        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        console.log(accounts);

        // Authenticate with Moralis before making contract calls
        await Moralis.enableWeb3();

        setIsConnected(true);
        console.log("Connected account:", accounts[0]);
        const roleParams = {
          abi: DIdentity,
          contractAddress: DIDENTITY_CONTRACT_ADDRESS,
          functionName: "getRole",
          params: {
            _address: accounts[0],
          },
        };
        await runContractFunction({
          params: roleParams,
          onSuccess: (tx: unknown) => {
            console.log(tx);
            // Convert the enum number to our UserRole type
            const roleMap = {
              0: "viewer",
              1: "issuer",
            } as const;
            setUserRole(roleMap[tx as 0 | 1]);
          },
          onError: (error) => {
            console.error("Error getting role:", error);
            setUserRole(null);
          },
        });
      } catch (error) {
        console.error("Error connecting to MetaMask:", error);
      }
    } else {
      alert("MetaMask is not installed. Please install it to use this app.");
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-gray-300 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-teal-400">
          User Dashboard
        </h1>
        {!isConnected ? (
          <WalletConnection onConnect={onConnect} />
        ) : userRole === "viewer" ? (
          <ViewerDashboard />
        ) : (
          <IssuerDashboard />
        )}
      </div>
    </div>
  );
}
