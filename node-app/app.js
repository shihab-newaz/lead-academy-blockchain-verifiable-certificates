const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
const CryptoJS = require('crypto-js');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3999;

app.use(cors());
app.use(express.json());

// Initialize contract and provider
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const API_URL = process.env.PROVIDER_RPC_URL;

const provider = new ethers.JsonRpcProvider(API_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

const CONTRACT_ABI = require('./artifacts/contracts/CertificateContract.sol/CertificateContract.json').abi;
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

// Routes
app.post('/issue-certificate', async (req, res) => {
  try {
    const { fileCid, studentAddress } = req.body;

    // Encrypt the fileCid
    const encryptedData = CryptoJS.AES.encrypt(fileCid, process.env.AES_SECRET_KEY).toString();
    const dataHash = ethers.keccak256(ethers.toUtf8Bytes(encryptedData));
    const signature = await signer.signMessage(ethers.getBytes(dataHash));
    console.log(dataHash);
    
    // Issue certificate on the blockchain
    const tx = await contract.issueCertificate(
      studentAddress,
      encryptedData,
      dataHash,
      signature
    );

    // Wait for the transaction to be mined
    const receipt = await tx.wait();

    res.json({
      success: true,
      message: 'Certificate issued successfully',
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber
    });
  } catch (error) {
    console.error('Error issuing certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to issue certificate',
      error: error.message
    });
  }
});

// ... (rest of the code remains the same)

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});