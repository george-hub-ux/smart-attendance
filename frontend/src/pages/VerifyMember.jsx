import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function VerifyMember(){
  const [form, setForm] = useState({ full_name:'', email:'', phone_number:'', token: '' });
  const [result, setResult] = useState(null);

  useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) setForm(f=> ({ ...f, token }));
  },[]);

  const submit = async (e)=>{
    e.preventDefault();
    try{
      const res = await axios.post('/api/members/verify', form);
      setResult({ success: true, member: res.data.member });
      // Optionally redirect to login
    }catch(err){
      const msg = err.response?.data?.message || 'Verification failed';
      setResult({ success: false, message: msg });
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Verify Membership</h2>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full p-2 border rounded" placeholder="Full name" value={form.full_name} onChange={e=>setForm({...form, full_name:e.target.value})} />
        <input className="w-full p-2 border rounded" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
        <input className="w-full p-2 border rounded" placeholder="Phone" value={form.phone_number} onChange={e=>setForm({...form, phone_number:e.target.value})} />
        <input type="hidden" value={form.token} />
        <button className="px-4 py-2 bg-blue-600 text-white rounded">Verify</button>
      </form>

      {result && (
        <div className="mt-4">
          {result.success ? (
            <div className="text-green-600">Access Granted. Redirecting to login...</div>
          ) : (
            <div className="text-red-600">{result.message}</div>
          )}
        </div>
      )}
    </div>
  )
}
