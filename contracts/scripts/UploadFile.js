const ethers = require("ethers");
const { ZgFile, getFlowContract, Indexer } = require("@0glabs/0g-ts-sdk");
const fs = require("fs");

const evmRpc = "https://evmrpc-testnet.0g.ai";
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const ISSUER_ADDRESS = process.env.ISSUER_ADDRESS;
const VIEWER_ADDRESS = process.env.VIEWER_ADDRESS;
const ISSUER_PRIVATE_KEY = process.env.ISSUER_PRIVATE_KEY;
//standard
const flowAddr = "0x0460aA47b41a66694c0a73f667a1b795A5ED3556";
const indRpc = "https://indexer-storage-testnet-standard.0g.ai";

//sepolia

const s_provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
const s_signer = new ethers.Wallet(ISSUER_PRIVATE_KEY, s_provider);

//0g
const provider = new ethers.JsonRpcProvider(evmRpc);
const signer = new ethers.Wallet(ISSUER_PRIVATE_KEY, provider);
const flowContract = getFlowContract(flowAddr, signer);
const indexer = new Indexer(indRpc);
const dIdentityAbi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "requester",
        type: "address",
      },
    ],
    name: "NotIssuer",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "requester",
        type: "address",
      },
    ],
    name: "NotOwner",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "requester",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "approver",
        type: "address",
      },
    ],
    name: "RequestSubmitted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "requester",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "rH",
        type: "string",
      },
    ],
    name: "UpdatedInformationEvent",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_approver",
        type: "address",
      },
    ],
    name: "approveRequest",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_requester",
        type: "address",
      },
    ],
    name: "assignIssuer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_approver",
        type: "address",
      },
    ],
    name: "declineRequest",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_approver",
        type: "address",
      },
    ],
    name: "getRequestHistory",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "requester",
            type: "address",
          },
          {
            internalType: "bytes32",
            name: "property",
            type: "bytes32",
          },
          {
            internalType: "bytes32",
            name: "val",
            type: "bytes32",
          },
          {
            internalType: "bytes32",
            name: "currentVal",
            type: "bytes32",
          },
        ],
        internalType: "struct Issuer.Details[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_address",
        type: "address",
      },
    ],
    name: "getRole",
    outputs: [
      {
        internalType: "enum DIdentity.Roles",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_user",
        type: "address",
      },
    ],
    name: "getRootHash",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getRootHash",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "roles",
    outputs: [
      {
        internalType: "enum DIdentity.Roles",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_requester",
        type: "address",
      },
      {
        internalType: "address",
        name: "_approver",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "_currentVal",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "_property",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "_val",
        type: "bytes32",
      },
    ],
    name: "updateDetails",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_requester",
        type: "address",
      },
      {
        internalType: "string",
        name: "_rootHash",
        type: "string",
      },
    ],
    name: "updateRootHash",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

async function createFileObjectAndGetMerkleTree(filePath) {
  try {
    const file = await ZgFile.fromFilePath(filePath);
    // Get the merkle root directly from the file
    const [tree, err] = await file.merkleTree();
    console.log("File Root Hash: ", tree.rootHash());
    await file.close();
    return tree.rootHash();
  } catch (err) {
    console.error("Error getting Merkle root: ", err);
    return null;
  }
}

// Define the JSON data with the required fields
const userData = {
  Name: "John Harvard",
  DOB: "1990-01-01",
  Sex: "Male",
  MaritalStatus: "Single",
  PhoneNumber: "123-456-7890",
  Email: "john.harvard@example.com",
  Disabled: false,
  Address: {
    Street: "123 Main St",
    City: "Anytown",
    State: "CA",
    Zip: "12345",
  },
  Nationality: "American",
  WalletAddress: "0x5d0655b8D44A7FA3a8fc7ff3846d971397eA21B1",
  PreviousHash: "--",
};

// Function to write JSON data to a file
function createJsonFile(filename, data) {
  console.log("hello");
  fs.writeFile(filename, JSON.stringify(data, null, 2), (err) => {
    if (err) {
      console.error("Error writing JSON file:", err);
    } else {
      console.log("JSON file has been saved.");
    }
  });
}

async function uploadFile(filePath) {
  const file = await ZgFile.fromFilePath(filePath);
  // Upload the file directly without trying to access merkleTree
  const [tx, err] = await indexer.upload(file, 0, evmRpc, flowContract);
  if (err === null) {
    console.log("File uploaded successfully");
    await file.close();
    return true;
  } else {
    console.error("Error uploading file:", err);
    await file.close();
    return false;
  }
}

async function main() {
  try {
    // Create the JSON file
    await createJsonFile("userData.json", userData);
    console.log("JSON file created successfully");

    // Get the root hash
    const rootHash = await createFileObjectAndGetMerkleTree("userData.json");
    console.log(rootHash);
    if (!rootHash) {
      console.error("Failed to get root hash");
      return;
    }

    // Upload the file
    const uploadSuccess = await uploadFile("userData.json");

    // Update the contract
    const dIdentity = new ethers.Contract(
      "0xeEC15Bd2346DD7b570F71161934f1f8735Bb1999",
      dIdentityAbi,
      s_signer
    );

    const tx = await dIdentity.updateRootHash(
      process.env.VIEWER_ADDRESS,
      rootHash.toString()
    );
    console.log("Transaction:", tx);
  } catch (error) {
    console.error("Error in main:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
