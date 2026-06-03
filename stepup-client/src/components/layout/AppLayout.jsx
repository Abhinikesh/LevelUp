import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AppLayout() {
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: '#0A0A0F' }}
    >
      {/* Persistent collapsible sidebar */}
      <Sidebar />

      {/* Main content area — scrolls independently */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <Outlet />
      </main>
    </div>
  )
}
