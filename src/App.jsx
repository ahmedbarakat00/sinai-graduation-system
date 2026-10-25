import { useState } from 'react'
import './App.css'
import AppShell from './layouts/AppShell'
import StudentPortal from './pages/student/StudentPortal'
import DoctorDashboard from './pages/doctor/DoctorDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'

export default function App() {
  const [mode, setMode] = useState('student')
  return <AppShell mode={mode} setMode={setMode}>
    {mode === 'student' && <StudentPortal />}
    {mode === 'doctor' && <DoctorDashboard />}
    {mode === 'admin' && <AdminDashboard />}
  </AppShell>
}
