import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'

// Common
import PurchasesPage from './pages/PurchasesPage'
import PurchasesListPage from './pages/PurchasesListPage'
import ReceiptVoucherPage from './pages/ReceiptVoucherPage'
import PaymentVoucherPage from './pages/PaymentVoucherPage'
import CompanySettingsPage from './pages/CompanySettingsPage'

// Retail
import TradingDashboard from './pages/retail/TradingDashboard'
import ItemsPage from './pages/retail/ItemsPage'
import StockReportPage from './pages/retail/StockReportPage'
import WarehousePage from './pages/retail/WarehousePage'
import AccountsPage from './pages/retail/AccountsPage'
import AccountLedgerPage from './pages/retail/AccountLedgerPage'
import TrialBalancePage from './pages/retail/TrialBalancePage'
import JournalEntriesPage from './pages/retail/JournalEntriesPage'
import InvoicesPage from './pages/retail/InvoicesPage'
import InvoicesListPage from './pages/retail/InvoicesListPage'
import SalesReturnPage from './pages/retail/SalesReturnPage'
import PurchasesReturnPage from './pages/retail/PurchasesReturnPage'
import OrdersPage from './pages/retail/OrdersPage'
import CustomersPage from './pages/retail/CustomersPage'
import POSPage from './pages/retail/POSPage'

// Barber
import BarberDashboard from './pages/barber/BarberDashboard'
import ServicesPage from './pages/barber/ServicesPage'
import EmployeesPage from './pages/barber/EmployeesPage'
import CommissionsPage from './pages/barber/CommissionsPage'
import ReservationsPage from './pages/barber/ReservationsPage'
import SuppliesPage from './pages/barber/SuppliesPage'
import BillsPage from './pages/barber/BillsPage'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!user) return <LoginPage />

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Common */}
        <Route path="/purchases" element={<PurchasesPage />} />
        <Route path="/purchases/edit/:docId" element={<PurchasesPage />} />
        <Route path="/purchases-list" element={<PurchasesListPage />} />
        <Route path="/receipt-voucher" element={<ReceiptVoucherPage />} />
        <Route path="/payment-voucher" element={<PaymentVoucherPage />} />
        <Route path="/company-settings" element={<CompanySettingsPage />} />

        {/* Retail */}
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/invoices/edit/:docId" element={<InvoicesPage />} />
        <Route path="/invoices-list" element={<InvoicesListPage />} />
        <Route path="/sales-return" element={<SalesReturnPage />} />
        <Route path="/purchases-return" element={<PurchasesReturnPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/items" element={<ItemsPage />} />
        <Route path="/stock-report" element={<StockReportPage />} />
        <Route path="/warehouse" element={<WarehousePage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/account-ledger" element={<AccountLedgerPage />} />
        <Route path="/trial-balance" element={<TrialBalancePage />} />
        <Route path="/journal-entries" element={<JournalEntriesPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/pos" element={<POSPage />} />

        {/* Barber */}
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/commissions" element={<CommissionsPage />} />
        <Route path="/reservations" element={<ReservationsPage />} />
        <Route path="/supplies" element={<SuppliesPage />} />
        <Route path="/bills" element={<BillsPage />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
