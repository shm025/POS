import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import Notify from '../common/Notify'
import AIPanel from '../common/AIPanel'

export default function AppLayout() {
  return (
    <div className="app-wrapper">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <div className="page-content">
          <Outlet />
        </div>
      </div>
      <AIPanel />
      <Notify />
    </div>
  )
}
