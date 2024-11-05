"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Check, X } from "lucide-react";
import { useMoralis, useWeb3Contract } from "react-moralis";
import { DIDENTITY_CONTRACT_ADDRESS } from "@/lib/constants";
import DIdentity from "@/components/abis/DIdentity.json";
import { ethers } from "ethers";
import { uploadDetails } from "@/utils/UploadDetails";

interface Request {
  requester: string;
  field: string;
  newValue: string;
  existingValue: string;
}

export function IssuerDashboard() {
  const [requests, setRequests] = useState<Request[]>([]);
  const { Moralis, isWeb3Enabled, account } = useMoralis();
  const { runContractFunction } = useWeb3Contract();
  const [showFullAddress, setShowFullAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const decodeBytes = (bytesString: string | null): string => {
    try {
      if (!bytesString) return "";
      return ethers.decodeBytes32String(bytesString);
    } catch (error) {
      console.error("Error decoding bytes:", error);
      return bytesString; // Return original if decoding fails
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const fetchRequestHistory = async () => {
    try {
      if (!isWeb3Enabled || !account) {
        console.log("Enabling Web3...");
        await Moralis.enableWeb3();
      }

      if (!account) {
        console.error("No account available");
        setRequests([]);
        return;
      }

      // First check if the account is an issuer
      const roleParams = {
        contractAddress: DIDENTITY_CONTRACT_ADDRESS,
        abi: DIdentity,
        functionName: "getRole",
        params: {
          _address: account,
        },
      };

      const role = await runContractFunction({
        params: roleParams,
        onError: (error) => {
          console.error("Error checking role:", error);
          return null;
        },
      });

      console.log("Current role:", role);

      if (role !== 1) {
        // 1 corresponds to Roles.Issuer
        console.log("Account is not an issuer");
        setRequests([]);
        return;
      }

      // Check if issuer has a contract deployed
      const params = {
        contractAddress: DIDENTITY_CONTRACT_ADDRESS,
        abi: DIdentity,
        functionName: "getRequestHistory",
        params: {
          _approver: account,
        },
      };

      console.log("Fetching requests with params:", params);

      let result;
      try {
        result = await runContractFunction({
          params,
          onSuccess: (res) => {
            console.log("Request history success:", res);
          },
          onError: (error) => {
            console.error("Contract call error:", error);
            throw error;
          },
        });
      } catch (error) {
        console.error("Failed to fetch requests:", error);
        setRequests([]);
        return;
      }

      if (!result || !Array.isArray(result)) {
        console.log("No requests found");
        setRequests([]);
        return;
      }

      const decodedRequests = result
        .filter((request) => request && typeof request === "object")
        .map((request) => ({
          requester: request.requester || "",
          field: decodeBytes(request.property),
          newValue: decodeBytes(request.val),
          existingValue: decodeBytes(request.currentVal),
        }));

      console.log("Decoded requests:", decodedRequests);
      setRequests(decodedRequests);
    } catch (error) {
      console.error("Error in fetchRequestHistory:", error);
      setRequests([]);
    }
  };

  // Add useEffect to fetch requests when component mounts
  useEffect(() => {
    if (isWeb3Enabled && account) {
      fetchRequestHistory();
    }
  }, [isWeb3Enabled, account]);

  const handleApprove = async (request: Request) => {
    setIsLoading(true);
    try {
      // First verify there are pending requests
      const pendingRequestsParams = {
        contractAddress: DIDENTITY_CONTRACT_ADDRESS,
        abi: DIdentity,
        functionName: "getRequestHistory",
        params: {
          _approver: account,
        },
      };

      const pendingRequests = await runContractFunction({
        params: pendingRequestsParams,
        onError: (error) => {
          console.error("Error checking pending requests:", error);
          throw error;
        },
      });

      console.log("Pending requests:", pendingRequests);

      if (
        !pendingRequests ||
        !Array.isArray(pendingRequests) ||
        pendingRequests.length === 0
      ) {
        throw new Error("No pending requests to approve");
      }

      // Upload details to API first
      console.log("Getting root hash for requester:", request.requester);
      const previousHash = await getRootHash(request.requester);

      const uploadResult = await uploadDetails({
        field: request.field,
        newValue: request.newValue,
        previousHash:
          previousHash ||
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        walletAddress: request.requester,
      });

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Failed to upload details");
      }

      console.log("Upload successful:", uploadResult);

      // Update root hash in contract
      const updateRootHashParams = {
        contractAddress: DIDENTITY_CONTRACT_ADDRESS,
        abi: DIdentity,
        functionName: "updateRootHash",
        params: {
          _requester: request.requester,
          _rootHash: uploadResult.newRootHash,
        },
      };

      await runContractFunction({
        params: updateRootHashParams,
        onSuccess: (result) => {
          console.log("Root hash update success:", result);
        },
        onError: (error) => {
          console.error("Root hash update error:", error);
          throw error;
        },
      });

      // Now approve the request
      const approveParams = {
        contractAddress: DIDENTITY_CONTRACT_ADDRESS,
        abi: DIdentity,
        functionName: "approveRequest",
        params: {
          _approver: account,
        },
        gas: 500000, // Add manual gas limit
      };

      console.log("Approving with params:", approveParams);

      await runContractFunction({
        params: approveParams,
        onSuccess: (result) => {
          console.log("Approve success:", result);
        },
        onError: (error) => {
          console.error("Approve error:", error);
          throw error;
        },
      });

      // Wait a bit before refreshing
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await fetchRequestHistory();
    } catch (error) {
      console.error("Error approving request:", error);
      alert(error.message || "Failed to approve request");
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function to check if a request exists
  const verifyRequestExists = async (request: Request): Promise<boolean> => {
    try {
      const pendingRequests = await runContractFunction({
        params: {
          contractAddress: DIDENTITY_CONTRACT_ADDRESS,
          abi: DIdentity,
          functionName: "getRequestHistory",
          params: {
            _approver: account,
          },
        },
      });

      if (!pendingRequests || !Array.isArray(pendingRequests)) {
        return false;
      }

      // Check if the request exists in the pending requests
      return pendingRequests.some(
        (pr) =>
          pr.requester === request.requester &&
          decodeBytes(pr.property) === request.field &&
          decodeBytes(pr.val) === request.newValue
      );
    } catch (error) {
      console.error("Error verifying request:", error);
      return false;
    }
  };

  const handleDecline = async (request: Request) => {
    setIsLoading(true);
    try {
      const params = {
        contractAddress: DIDENTITY_CONTRACT_ADDRESS,
        abi: DIdentity,
        functionName: "declineRequest",
        params: {
          _approver: account, // Current issuer declines their own requests
        },
      };

      console.log("Declining request with params:", params);

      const tx = await runContractFunction({
        params,
        onSuccess: (result) => {
          console.log("Decline success:", result);
        },
        onError: (error) => {
          console.error("Decline error:", error);
          throw error;
        },
      });

      console.log("Decline transaction:", tx);
      await fetchRequestHistory();
    } catch (error) {
      console.error("Error declining request:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRootHash = async (address: string): Promise<string> => {
    try {
      console.log("Getting root hash for address:", address);

      const params = {
        contractAddress: DIDENTITY_CONTRACT_ADDRESS,
        abi: DIdentity,
        functionName: "getRootHash(address)", // Specify the exact function signature
        params: {
          _user: address,
        },
      };

      const result = await runContractFunction({
        params,
        onSuccess: (res) => {
          console.log("Root hash success:", res);
        },
        onError: (error) => {
          console.error("Root hash error:", error);
          throw error;
        },
      });

      if (!result) {
        throw new Error("No root hash found for address: " + address);
      }

      return result as string;
    } catch (error) {
      console.error("Error getting root hash:", error);
      throw error;
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-cyan-400">Issuer Dashboard</h2>

      <Button
        onClick={fetchRequestHistory}
        className="mt-4 bg-teal-600 hover:bg-teal-700"
      >
        Fetch Request History
      </Button>

      <h3 className="text-xl font-semibold text-teal-400">Pending Changes</h3>
      {requests.length > 0 ? (
        requests.map((request, index) => (
          <div
            key={index}
            className="bg-[#1e1e1e] p-4 rounded-lg flex justify-between items-center"
          >
            <div>
              <p>
                <span
                  className="text-teal-300 cursor-pointer relative"
                  onClick={() =>
                    setShowFullAddress(
                      showFullAddress === request.requester
                        ? null
                        : request.requester
                    )
                  }
                >
                  {shortenAddress(request.requester)}
                  {showFullAddress === request.requester && (
                    <div className="absolute z-50 bg-black/90 text-white px-4 py-2 rounded-md -bottom-8 left-0 text-sm">
                      {request.requester}
                    </div>
                  )}
                </span>
                <span className="text-gray-400"> wants to change their </span>
                <span className="text-cyan-300">{request.field} </span>
                <span className="text-gray-400">from </span>
                <span className="text-cyan-300">{request.existingValue}</span>
                <span className="text-gray-400"> to: </span>
                <span className="text-teal-300">{request.newValue}</span>
              </p>
            </div>
            <div className="space-x-2">
              <Button
                onClick={() => handleApprove(request)}
                className="bg-teal-600 hover:bg-teal-700 text-white"
                disabled={isLoading}
              >
                <Check className="mr-2 h-4 w-4" />
                {isLoading ? "Processing..." : "Approve"}
              </Button>
              <Button
                onClick={() => handleDecline(request)}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={isLoading}
              >
                <X className="mr-2 h-4 w-4" />
                {isLoading ? "Processing..." : "Decline"}
              </Button>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-400">No requests found</p>
      )}
    </div>
  );
}
