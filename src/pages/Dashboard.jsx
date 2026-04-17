import { useAuth } from '../contexts/AuthContext'
import TradingDashboard from './retail/TradingDashboard'
import BarberDashboard from './barber/BarberDashboard'

export default function Dashboard() {
  const { company } = useAuth()
  if (company?.business_type === 'barber') return <BarberDashboard />
  return <TradingDashboard />
}
