import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0A0A0F' }}>
      <Navbar />
      <main className="flex-1 relative">
        <Outlet />
      </main>
    </div>
  )
}
