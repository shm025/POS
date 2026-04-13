import { useAuth } from '../contexts/AuthContext'
import TradingDashboard from './TradingDashboard'
import BarberDashboard from './BarberDashboard'

export default function Dashboard() {
  const { company } = useAuth()
  if (company?.business_type === 'barber') return <BarberDashboard />
  return <TradingDashboard />
}
