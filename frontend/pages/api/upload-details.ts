import { ZgFile, Indexer, getFlowContract } from "@0glabs/0g-ts-sdk";
import { ethers } from "ethers";
import type { NextApiRequest, NextApiResponse } from "next";
import { writeFile } from "fs/promises";
import { unlink } from "fs/promises";
import path from "path";

interface ApiResponse {
  success: boolean;
  transaction?: any;
  newRootHash?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  const tempInputPath = path.join("/tmp", `input-${Date.now()}.json`);

  try {
    const { field, newValue, previousHash, walletAddress } = req.body;

    if (!field || !newValue || !walletAddress) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    const evmRpc = process.env.EVM_RPC || "https://evmrpc-testnet.0g.ai";
    const privateKey = process.env.PRIVATE_KEY;
    const flowAddr =
      process.env.FLOW_ADDR || "0x0460aA47b41a66694c0a73f667a1b795A5ED3556";
    const indRpc =
      process.env.IND_RPC || "https://indexer-storage-testnet-standard.0g.ai";

    if (!privateKey) {
      return res.status(500).json({
        success: false,
        error: "Server configuration error",
      });
    }

    const provider = new ethers.JsonRpcProvider(evmRpc);
    const indexer = new Indexer(indRpc);
    const signer = new ethers.Wallet(privateKey, provider);
    const flowContract = getFlowContract(flowAddr, signer);
    let previousDetails;

    let currentDetails = {};

    if (
      previousHash &&
      previousHash !==
        "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      try {
        console.log("Fetching previous hash:", previousHash);
        previousDetails = await indexer.download(
          previousHash,
          tempInputPath,
          false
        );
        if (previousDetails) {
          currentDetails = JSON.parse(previousDetails.toString());
        }
      } catch (e) {
        console.warn("Could not fetch or parse previous details:", e);
      }
    }

    const jsonData: { [key: string]: any } = {};
    const details = previousDetails || {};
    jsonData["Name"] = details.Name;
    jsonData["DOB"] = details.DOB;
    jsonData["Sex"] = details.Sex;
    jsonData["MaritalStatus"] = details.MaritalStatus;
    jsonData["PhoneNumber"] = details.PhoneNumber;
    jsonData["Email"] = details.Email;
    jsonData["Disabled"] = details.Disabled;
    jsonData["Address"] = details.Address;
    jsonData["Nationality"] = details.Nationality;
    jsonData["WalletAddress"] = details.WalletAddress;
    jsonData["PreviousHash"] = previousHash;
    jsonData[field] = newValue;

    console.log("Preparing to upload data:", jsonData);

    // Write data to temporary file
    await writeFile(tempInputPath, JSON.stringify(jsonData, null, 2));

    // Create ZgFile from the temporary file
    const file = await ZgFile.fromFilePath(tempInputPath);

    // Get the Merkle tree and root hash before upload
    const [tree, treeErr] = await file.merkleTree();
    if (treeErr) {
      throw new Error(`Failed to generate Merkle tree: ${treeErr}`);
    }

    const newRootHash = tree.rootHash();
    console.log("New root hash:", newRootHash);

    // Before upload, check if data with this root hash already exists
    const [tx, err] = await indexer.upload(file, 0, evmRpc, flowContract);

    if (err?.message?.includes("Data already exists")) {
      return res.status(200).json({
        success: true,
        newRootHash: newRootHash,
        message: "Data was already uploaded",
      });
    }
    if (err) {
      console.error("Upload error:", err);
      return res.status(400).json({
        success: false,
        error: err.toString() || JSON.stringify(err) || "Unknown upload error",
      });
    }

    // Clean up temporary file
    // await unlink(tempInputPath);

    return res.status(200).json({
      success: true,
      transaction: tx,
      newRootHash: newRootHash, // Include the new root hash in response
    });
  } catch (error) {
    console.error("Server error:", error);
    // Clean up temporary file in case of error
    try {
      await unlink(tempInputPath);
    } catch (e) {
      // Ignore cleanup errors
    }
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
}
