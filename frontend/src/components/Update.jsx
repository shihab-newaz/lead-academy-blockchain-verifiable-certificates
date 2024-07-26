import React, { useState, useRef } from 'react';
import { createIPFSclient } from '../utils/IPFS';
import { generateStudentCredentials } from '../utils/GenerateCredentials';
import axios from 'axios';
import '../css/Issue.css';

function IssueCertificateComponent() {
  const [studentName, setStudentName] = useState('');
  const [roll, setRoll] = useState('');
  const [degreeName, setDegreeName] = useState('');
  const [subject, setSubject] = useState('');
  const [expiry, setExpiry] = useState('');
  const [studentAddress, setStudentAddress] = useState('');
  const [issueResult, setIssueResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedAddresses, setGeneratedAddresses] = useState([]);
  const fileInput = useRef(null);

  async function handleUploadToIPFS() {
    const file = fileInput.current.files[0];
    if (!file) {
      console.log('No file selected');
      return null;
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const fileData = reader.result;
          const issueTimestamp = Math.floor(Date.now() / 1000);
          const expiration = Number(expiry);

          const certificateData = { studentName, roll, degreeName, subject, studentAddress, issueTimestamp, expiration };
          const dataToUpload = JSON.stringify({ certificateData, fileData: Array.from(new Uint8Array(fileData)) });
          const client = createIPFSclient();
          const { cid } = await client.add(dataToUpload);
          console.log(cid.toString());
          resolve(cid.toString());
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  const issueCertificate = async () => {
    setIsLoading(true);
    try {
      const cidString = await handleUploadToIPFS();
      if (!cidString) {
        throw new Error('Failed to upload to IPFS');
      }

      // Send data to Laravel backend
      const response = await axios.post('/api/issue-certificate', {
        fileCid: cidString
      });

      if (response.data.success) {
        setIssueResult('Certificate issued successfully!');
      } else {
        throw new Error(response.data.message || 'Failed to issue certificate');
      }
    } catch (error) {
      console.error('Error issuing certificate:', error);
      setIssueResult(error.response?.data?.error || error.message || 'Failed to issue certificate');
    }
    setIsLoading(false);
  };

  return (
    <div className='issue-certificate-container'>
      <h1>Issue Certificate</h1>
      <input id='issue' type="text" placeholder="Student Name" onChange={(e) => setStudentName(e.target.value)} />
      <input id='issue' type="text" placeholder="Roll Number" onChange={(e) => setRoll(e.target.value)} />
      <input id='issue' type="text" placeholder="Degree Name" onChange={(e) => setDegreeName(e.target.value)} />
      <input id='issue' type="text" placeholder="Subject" onChange={(e) => setSubject(e.target.value)} />
      <input id='issue' type="text" placeholder="Expiration (in days)" onChange={(e) => setExpiry(e.target.value)} />

      <input type="file" ref={fileInput} />

      <button id='btn' onClick={() => generateStudentCredentials(generatedAddresses, setStudentAddress, setGeneratedAddresses)}>
        Generate Student Credentials
      </button>
      {studentAddress !== '' && <div> Student Address: {studentAddress}</div>}

      <button id='btn' onClick={issueCertificate}>Issue Certificate</button> <br />
      {isLoading && (
        <>
          <div className="spinner"></div>
          <p>Uploading to IPFS and issuing certificate...</p>
        </>
      )}
      <p>{issueResult}</p><br />
    </div>
  );
}

export default IssueCertificateComponent;