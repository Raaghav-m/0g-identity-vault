const { ethers } = require("ethers");
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
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

async function AssignIssuer() {
  const dIdentity = new ethers.Contract(
    "0xeEC15Bd2346DD7b570F71161934f1f8735Bb1999",
    dIdentityAbi,
    signer
  );
  const tx = await dIdentity.assignIssuer(process.env.ISSUER_ADDRESS);
  console.log("Transaction:", tx);
}
AssignIssuer()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
