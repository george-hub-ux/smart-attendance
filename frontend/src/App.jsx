import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Landing from './pages/Landing'
import VerifyMember from './pages/VerifyMember'
import Attendance from './pages/Attendance'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import SupervisorDashboard from './pages/SupervisorDashboard'
import Reports from './pages/Reports'

export default function App(){
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="p-4 bg-white shadow">
        <div className="container mx-auto flex justify-between">
          <div className="font-bold">Swahilipot Hub</div>
          <div className="space-x-4">
            <Link to="/" className="text-blue-600">Home</Link>
            <Link to="/verify-member" className="text-blue-600">Verify Member</Link>
            <Link to="/login" className="text-blue-600">Login</Link>
            <Link to="/signup" className="text-blue-600">Signup</Link>
          </div>
        </div>
      </nav>
      <main className="container mx-auto p-4">
        <Routes>
          <Route path="/" element={<Landing/>} />
          <Route path="/verify-member" element={<VerifyMember/>} />
          <Route path="/attendance" element={<Attendance/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/signup" element={<Signup/>} />
          <Route path="/dashboard" element={<Dashboard/>} />
          <Route path="/supervisor" element={<SupervisorDashboard/>} />
          <Route path="/reports" element={<Reports/>} />
        </Routes>
      </main>
    </div>
  )
}
