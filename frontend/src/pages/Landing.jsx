import React, {useEffect, useState} from 'react'
import axios from 'axios'

export default function Landing(){
  const [qr, setQr] = useState(null);

  useEffect(()=>{
    const fetchQr = async ()=>{
      try{
        const res = await axios.get('/api/members/qrcode');
        setQr(res.data.qrcode);
      }catch(e){
        console.error(e);
      }
    }
    fetchQr();
  },[])

  return (
    <div className="bg-white p-8 rounded shadow max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Swahilipot Hub Foundation</h1>
      <p className="mb-4">Welcome to the Attachees Attendance System.</p>
      <div className="flex gap-6">
        <div className="w-1/2">
          <a href="/attendance" className="px-4 py-2 bg-green-600 text-white rounded inline-block">Mark Attendance</a>
          <a href="/verify-member" className="ml-2 px-4 py-2 border rounded inline-block">Verify Membership</a>
        </div>
        <div className="w-1/2">
          <h3 className="font-semibold mb-2">Scan QR to verify</h3>
          {qr ? <img src={qr} alt="qr" className="w-48 h-48"/> : <div>Loading QR...</div>}
        </div>
      </div>
    </div>
  )
}
