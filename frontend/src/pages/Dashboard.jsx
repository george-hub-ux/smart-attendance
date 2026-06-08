import React, { useEffect, useState } from 'react'
import api, { setAuthToken } from '../api'

export default function Dashboard(){
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [todayStatus, setTodayStatus] = useState(null);

  useEffect(()=>{
    const token = localStorage.getItem('token');
    if (token) setAuthToken(token);

    const load = async ()=>{
      try{
        const p = await api.get('/api/auth/profile');
        setProfile(p.data.user);
        const h = await api.get('/api/attendance/history');
        setHistory(h.data.history || []);

        const today = new Date().toISOString().slice(0,10);
        const todays = (h.data.history || []).find(r=>r.attendance_date === today);
        setTodayStatus(todays ? todays.status : 'Absent');
      }catch(err){
        console.error(err);
      }
    }
    load();
  },[])

  const attendancePercentage = () => {
    if (!history.length) return '0%';
    const present = history.filter(h=>h.status && h.status.toLowerCase().includes('present') || h.status === 'On Time' || h.status === 'Late').length;
    const pct = Math.round((present / history.length) * 100);
    return `${pct}%`;
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      {profile && (
        <div className="mb-4">
          <div><strong>Name:</strong> {profile.email}</div>
          <div><strong>Role:</strong> {profile.role}</div>
        </div>
      )}
      <div className="mb-4">
        <strong>Today's Status:</strong> {todayStatus}
      </div>
      <div className="mb-4">
        <strong>Attendance Percentage:</strong> {attendancePercentage()}
      </div>

      <h3 className="text-lg font-semibold mt-4 mb-2">Attendance History</h3>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b"><th>Date</th><th>Time</th><th>Status</th><th>Location Verified</th></tr>
        </thead>
        <tbody>
          {history.map(h=> (
            <tr key={h.id} className="border-b"><td>{h.attendance_date}</td><td>{new Date(h.check_in_time).toLocaleTimeString()}</td><td>{h.status}</td><td>{h.location_verified ? 'Yes' : 'No'}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
