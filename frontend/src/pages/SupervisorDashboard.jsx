import React, { useEffect, useState } from 'react'
import api from '../api'

export default function SupervisorDashboard(){
  const [members, setMembers] = useState([]);
  const [query, setQuery] = useState('');
  const [newMember, setNewMember] = useState({ full_name:'', email:'', phone_number:'', institution:'', department:'', role:'attachee', membership_status:'active' });
  const [auditLogs, setAuditLogs] = useState([]);
  const [bulkCsv, setBulkCsv] = useState('');
  const [qrData, setQrData] = useState(null);
  const [qrExpires, setQrExpires] = useState(600);

  const load = async ()=>{
    try{
      const m = await api.get('/api/members');
      setMembers(m.data.members || []);
      const a = await api.get('/api/admin/audit-logs');
      setAuditLogs(a.data.logs || []);
    }catch(err){ console.error(err); }
  }

  useEffect(()=>{ load(); },[]);

  const filtered = members.filter(m=> m.full_name.toLowerCase().includes(query.toLowerCase()) || m.email.toLowerCase().includes(query.toLowerCase()) || (m.department || '').toLowerCase().includes(query.toLowerCase()));

  const create = async (e)=>{
    e.preventDefault();
    try{
      await api.post('/api/members', newMember);
      setNewMember({ full_name:'', email:'', phone_number:'', institution:'', department:'', role:'attachee', membership_status:'active' });
      load();
    }catch(err){ console.error(err); }
  }

  const remove = async (id)=>{
    if(!confirm('Delete member?')) return;
    await api.delete(`/api/members/${id}`);
    load();
  }

  const uploadBulk = async ()=>{
    try{
      // try CSV first, backend accepts csv text
      const res = await api.post('/api/members/bulk', { csv: bulkCsv });
      alert(`Created ${res.data.createdCount} members`);
      setBulkCsv('');
      load();
    }catch(err){
      alert(err.response?.data?.message || 'Bulk upload failed');
    }
  }

  const generateTokenQr = async () => {
    try{
      const res = await api.get('/api/members/qrcode/token', { params: { expires: qrExpires } });
      setQrData(res.data);
      load();
    }catch(err){
      alert(err.response?.data?.message || 'QR generation failed');
    }
  }

  return (
    <div className="max-w-5xl mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Supervisor Dashboard</h2>

      <section className="mb-6">
        <h3 className="font-semibold">Members</h3>
        <div className="my-2"><input placeholder="Search" value={query} onChange={e=>setQuery(e.target.value)} className="p-2 border rounded w-64"/></div>
        <table className="w-full text-left border-collapse mb-4">
          <thead><tr className="border-b"><th>Name</th><th>Email</th><th>Role</th><th>Dept</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(m=> (
              <tr key={m.member_id} className="border-b"><td>{m.full_name}</td><td>{m.email}</td><td>{m.role}</td><td>{m.department}</td><td>{m.membership_status}</td><td><button onClick={()=>remove(m.member_id)} className="text-red-600">Delete</button></td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-6">
        <h3 className="font-semibold">Add Member</h3>
        <form onSubmit={create} className="grid grid-cols-2 gap-2 mt-2">
          <input className="p-2 border" placeholder="Full name" value={newMember.full_name} onChange={e=>setNewMember({...newMember, full_name:e.target.value})} />
          <input className="p-2 border" placeholder="Email" value={newMember.email} onChange={e=>setNewMember({...newMember, email:e.target.value})} />
          <input className="p-2 border" placeholder="Phone" value={newMember.phone_number} onChange={e=>setNewMember({...newMember, phone_number:e.target.value})} />
          <input className="p-2 border" placeholder="Institution" value={newMember.institution} onChange={e=>setNewMember({...newMember, institution:e.target.value})} />
          <input className="p-2 border" placeholder="Department" value={newMember.department} onChange={e=>setNewMember({...newMember, department:e.target.value})} />
          <select className="p-2 border" value={newMember.role} onChange={e=>setNewMember({...newMember, role:e.target.value})}><option value="attachee">Attachee</option><option value="staff">Staff</option><option value="volunteer">Volunteer</option><option value="supervisor">Supervisor</option></select>
          <div className="col-span-2"><button className="px-4 py-2 bg-blue-600 text-white rounded">Create Member</button></div>
        </form>
      </section>

      <section className="mb-6">
        <h3 className="font-semibold">Bulk Upload (CSV)</h3>
        <p className="text-sm text-gray-600">CSV header should match keys: full_name,email,phone_number,institution,department,role,membership_status</p>
        <textarea className="w-full p-2 border mt-2" rows={6} value={bulkCsv} onChange={e=>setBulkCsv(e.target.value)} />
        <div className="mt-2"><button className="px-4 py-2 bg-green-600 text-white rounded" onClick={uploadBulk}>Upload CSV</button></div>
      </section>

      <section className="mb-6">
        <h3 className="font-semibold">Tokenized QR (for events)</h3>
        <div className="flex items-center gap-2 mt-2">
          <input type="number" className="p-2 border w-32" value={qrExpires} onChange={e=>setQrExpires(Number(e.target.value))} />
          <div className="text-sm text-gray-600">seconds expiry</div>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={generateTokenQr}>Generate Token QR</button>
        </div>
        {qrData && (
          <div className="mt-3">
            <div className="mb-2">Expires in: {qrData.expires} seconds</div>
            <img src={qrData.qrcode} alt="token-qr" className="w-48 h-48" />
            <div className="mt-2">
              <a href={qrData.url} target="_blank" rel="noreferrer" className="mr-2 text-blue-600">Open Link</a>
              <a href={qrData.qrcode} download={`swahilipot-qr-${Date.now()}.png`} className="text-green-600">Download QR</a>
            </div>
          </div>
        )}
      </section>

      <section>
        <h3 className="font-semibold">Audit Logs</h3>
        <div className="mt-2 max-h-48 overflow-auto text-sm border p-2">
          {auditLogs.map(l=> (
            <div key={l.id} className="border-b py-1"><strong>{l.access_time}</strong> — {l.user_name} — {l.access_status} — {l.reason}</div>
          ))}
        </div>
      </section>
    </div>
  )
}
