const CONTRACT_ADDRESS = "0x800205fa5493534a60848c7aB1e9679187f8E6e2";

const CONTRACT_ABI = [
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "bookingId",
				"type": "string"
			},
			{
				"internalType": "address payable",
				"name": "tutor",
				"type": "address"
			}
		],
		"name": "fundSession",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "bookingId",
				"type": "string"
			}
		],
		"name": "refundLearner",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "bookingId",
				"type": "string"
			}
		],
		"name": "releasePayment",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "string",
				"name": "bookingId",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "tutor",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "SessionCompleted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "string",
				"name": "bookingId",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "learner",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "tutor",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "SessionFunded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "string",
				"name": "bookingId",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "learner",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "SessionRefunded",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "bookingId",
				"type": "string"
			}
		],
		"name": "getSession",
		"outputs": [
			{
				"internalType": "address",
				"name": "learner",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "tutor",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "enum TutoringEscrow.SessionStatus",
				"name": "status",
				"type": "uint8"
			},
			{
				"internalType": "uint256",
				"name": "deadline",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"name": "sessions",
		"outputs": [
			{
				"internalType": "address payable",
				"name": "learner",
				"type": "address"
			},
			{
				"internalType": "address payable",
				"name": "tutor",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "enum TutoringEscrow.SessionStatus",
				"name": "status",
				"type": "uint8"
			},
			{
				"internalType": "string",
				"name": "bookingId",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "deadline",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]
