"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Eye, PenSquare } from "lucide-react";
import { getDetails } from "@/utils/GetDetails";
import { useMoralis, useWeb3Contract } from "react-moralis";
import DIdentity from "@/components/abis/DIdentity.json";
import { DIDENTITY_CONTRACT_ADDRESS } from "@/lib/constants";
import { ethers } from "ethers";

export function ViewerDashboard() {
  const { account, isAuthenticated, Moralis } = useMoralis();
  const [showDetails, setShowDetails] = useState(false);
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [userDetails, setUserDetails] = useState({
    name: "",
    dob: "",
    sex: "",
    maritalStatus: "",
    phoneNumber: "",
    email: "",
    disabled: "",
    address: "",
    nationality: "",
    walletAddress: "",
    previousHash: "",
  });
  const [changeField, setChangeField] = useState<
    "name" | "phoneNumber" | "email" | "address" | ""
  >("");
  const [newValue, setNewValue] = useState("");
  const [accounts, setAccounts] = useState<string[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const { runContractFunction } = useWeb3Contract();
  const [isInfoRetrieved, setIsInfoRetrieved] = useState(false);
  const [changeDetails, setChangeDetails] = useState({
    requester: "", // Your wallet address
    approver: "", // Issuer's address
    property: "", // The field to change
    value: "", // New value
    currentVal: "", // Current value of the field
  });
  const [showChangePopup, setShowChangePopup] = useState(false);

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== "undefined") {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        setAccounts(accounts);
        setSelectedAccount(accounts[0]);

        window.ethereum.on("accountsChanged", (newAccounts: string[]) => {
          setAccounts(newAccounts);
          setSelectedAccount(newAccounts[0]);
        });
      } else {
        console.error("Please install MetaMask!");
        alert("Please install MetaMask to use this feature");
      }
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
    }
  };

  useEffect(() => {
    connectWallet();
  }, []);

  const handleRetrieveInfo = async () => {
    try {
      if (!selectedAccount) {
        alert("Please connect your wallet first");
        return;
      }

      await Moralis.enableWeb3();

      console.log("Selected Account:", selectedAccount);
      console.log("Contract Address:", DIDENTITY_CONTRACT_ADDRESS);

      const params = {
        abi: DIdentity,
        contractAddress: DIDENTITY_CONTRACT_ADDRESS,
        functionName: "getRootHash()",
      };

      const rootHash = await runContractFunction({
        params: params,
        onSuccess: (result) => {
          console.log("Success! Root hash:", result);
        },
        onError: (error) => {
          console.error("Contract call error:", error);
          throw error;
        },
      });

      if (!rootHash) {
        alert("No root hash found for this address");
        return;
      }

      const data = await getDetails(rootHash.toString());
      console.log(data);

      setUserDetails({
        name: data.Name || "Not Available",
        dob: data.DOB || "Not Available",
        sex: data.Sex || "Not Available",
        maritalStatus: data.MaritalStatus || "Not Available",
        phoneNumber: data.PhoneNumber || "Not Available",
        email: data.Email || "Not Available",
        disabled: data.Disabled?.toString() || "Not Available",
        address: data.Address
          ? `${data.Address.Street}, ${data.Address.City}, ${data.Address.State} ${data.Address.Zip}`
          : "Not Available",
        nationality: data.Nationality || "Not Available",
        walletAddress: data.WalletAddress || "Not Available",
        previousHash: data.PreviousHash || "Not Available",
      });
      setIsInfoRetrieved(true);
    } catch (error) {
      console.error("Error retrieving information:", error);
      alert("Error retrieving information");
    }
  };

  const handleSuggestChange = async () => {
    try {
      if (
        !changeDetails.approver ||
        !changeDetails.property ||
        !changeDetails.value
      ) {
        alert("Please fill in all fields");
        return;
      }

      // Get current value from userDetails
      const propertyMap: { [key: string]: keyof typeof userDetails } = {
        Name: "name",
        DOB: "dob",
        PhoneNumber: "phoneNumber",
        Email: "email",
        Address: "address",
        Nationality: "nationality",
      };

      const currentVal = userDetails[propertyMap[changeDetails.property]];

      console.log("Transaction params:", {
        requester: accounts[0],
        approver: changeDetails.approver,
        property: changeDetails.property,
        value: changeDetails.value,
        currentVal: currentVal,
      });

      const params = {
        abi: DIdentity,
        contractAddress: DIDENTITY_CONTRACT_ADDRESS,
        functionName: "updateDetails",
        params: {
          _requester: accounts[0],
          _approver: changeDetails.approver,
          _property: ethers.encodeBytes32String(changeDetails.property),
          _val: ethers.encodeBytes32String(changeDetails.value),
          _currentVal: ethers.encodeBytes32String(currentVal),
        },
        msgValue: 0,
        gasLimit: "100000000",
      };

      await runContractFunction({
        params: params,
        onSuccess: (tx: any) => {
          alert("Change request submitted successfully!");
          setShowChangePopup(false);
        },
        onError: (error: any) => {
          console.error("Full error:", error);
          if (error?.code === "UNPREDICTABLE_GAS_LIMIT") {
            alert(
              "Transaction would fail. Please verify:\n- Approver address is correct\n- You have the right permissions\n- Input values are valid"
            );
          } else if (error.data?.message) {
            alert(`Contract error: ${error.data.message}`);
          } else {
            console.log(error.code);
            alert(`Error: ${error.message || "Unknown error"}`);
          }
        },
      });
      // ... existing code ...
    } catch (error) {
      console.error("Error:", error);
      alert("Error processing request");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-cyan-400">Viewer Dashboard</h2>

      <div className="flex gap-4">
        <Button
          onClick={() => setShowDetails(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white"
          disabled={!isInfoRetrieved}
        >
          <Eye className="mr-2 h-4 w-4" /> View Details
        </Button>
        <Button
          onClick={handleRetrieveInfo}
          className="bg-teal-600 hover:bg-teal-700 text-white"
          disabled={isInfoRetrieved}
        >
          <Eye className="mr-2 h-4 w-4" /> Retrieve Info
        </Button>
        <Button
          onClick={() => setShowChangePopup(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white"
          disabled={!isInfoRetrieved}
        >
          <PenSquare className="mr-2 h-4 w-4" /> Suggest Changes
        </Button>
      </div>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="bg-[#1e1e1e] text-gray-300 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-teal-400">User Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
            {[
              { label: "Name", value: userDetails.name },
              { label: "Date of Birth", value: userDetails.dob },
              { label: "Sex", value: userDetails.sex },
              { label: "Marital Status", value: userDetails.maritalStatus },
              { label: "Phone Number", value: userDetails.phoneNumber },
              { label: "Email", value: userDetails.email },
              { label: "Disabled", value: userDetails.disabled },
              { label: "Address", value: userDetails.address },
              { label: "Nationality", value: userDetails.nationality },
              { label: "Wallet Address", value: userDetails.walletAddress },
              { label: "Previous Hash", value: userDetails.previousHash },
            ].map((field) => (
              <div
                key={field.label}
                className="grid grid-cols-4 items-center gap-4"
              >
                <Label
                  htmlFor={field.label.toLowerCase()}
                  className="text-right text-cyan-300"
                >
                  {field.label}
                </Label>
                <Input
                  id={field.label.toLowerCase()}
                  value={field.value}
                  className="col-span-3 bg-gray-800 text-gray-300"
                  readOnly
                />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {showChangePopup && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1e1e1e] p-8 rounded-xl w-[480px] shadow-2xl border border-gray-800">
            <h3 className="text-2xl font-semibold mb-6 text-cyan-400">
              Suggest Changes
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Approver Address
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200 
                             focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  value={changeDetails.approver}
                  onChange={(e) =>
                    setChangeDetails((prev) => ({
                      ...prev,
                      approver: e.target.value,
                    }))
                  }
                  placeholder="0x..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Property to Change
                </label>
                <select
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200
                             focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  value={changeDetails.property}
                  onChange={(e) =>
                    setChangeDetails((prev) => ({
                      ...prev,
                      property: e.target.value,
                    }))
                  }
                >
                  <option value="" className="bg-gray-800">
                    Select property
                  </option>
                  <option value="Name" className="bg-gray-800">
                    Name
                  </option>
                  <option value="DOB" className="bg-gray-800">
                    Date of Birth
                  </option>
                  <option value="PhoneNumber" className="bg-gray-800">
                    Phone Number
                  </option>
                  <option value="Email" className="bg-gray-800">
                    Email
                  </option>
                  <option value="Address" className="bg-gray-800">
                    Address
                  </option>
                  <option value="Nationality" className="bg-gray-800">
                    Nationality
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Value
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200
                             focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  value={changeDetails.value}
                  onChange={(e) =>
                    setChangeDetails((prev) => ({
                      ...prev,
                      value: e.target.value,
                    }))
                  }
                  placeholder="New value"
                />
              </div>
              <div className="flex justify-end space-x-4 mt-8">
                <button
                  onClick={() => setShowChangePopup(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md
                             transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSuggestChange}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md
                             transition-colors duration-200"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (params: any) => void) => void;
      removeListener: (event: string, callback: (params: any) => void) => void;
    };
  }
}
