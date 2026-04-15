import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import ItemsPage from './pages/ItemsPage'
import StockReportPage from './pages/StockReportPage'
import WarehousePage from './pages/WarehousePage'
import AccountsPage from './pages/AccountsPage'
import AccountLedgerPage from './pages/AccountLedgerPage'
import TrialBalancePage from './pages/TrialBalancePage'
import JournalEntriesPage from './pages/JournalEntriesPage'
import ReceiptVoucherPage from './pages/ReceiptVoucherPage'
import PaymentVoucherPage from './pages/PaymentVoucherPage'
import InvoicesPage from './pages/InvoicesPage'
import InvoicesListPage from './pages/InvoicesListPage'
import SalesReturnPage from './pages/SalesReturnPage'
import PurchasesPage from './pages/PurchasesPage'
import PurchasesListPage from './pages/PurchasesListPage'
import PurchasesReturnPage from './pages/PurchasesReturnPage'
import OrdersPage from './pages/OrdersPage'
import ServicesPage from './pages/ServicesPage'
import EmployeesPage from './pages/EmployeesPage'
import ReservationsPage from './pages/ReservationsPage'
import SuppliesPage from './pages/SuppliesPage'
import BillsPage from './pages/BillsPage'
import CompanySettingsPage from './pages/CompanySettingsPage'
import CustomersPage from './pages/CustomersPage'
import POSPage from './pages/POSPage'
import CommissionsPage from './pages/CommissionsPage'

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
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/invoices/edit/:docId" element={<InvoicesPage />} />
        <Route path="/invoices-list" element={<InvoicesListPage />} />
        <Route path="/sales-return" element={<SalesReturnPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/purchases" element={<PurchasesPage />} />
        <Route path="/purchases/edit/:docId" element={<PurchasesPage />} />
        <Route path="/purchases-list" element={<PurchasesListPage />} />
        <Route path="/purchases-return" element={<PurchasesReturnPage />} />
        <Route path="/items" element={<ItemsPage />} />
        <Route path="/stock-report" element={<StockReportPage />} />
        <Route path="/warehouse" element={<WarehousePage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/account-ledger" element={<AccountLedgerPage />} />
        <Route path="/trial-balance" element={<TrialBalancePage />} />
        <Route path="/journal-entries" element={<JournalEntriesPage />} />
        <Route path="/receipt-voucher" element={<ReceiptVoucherPage />} />
        <Route path="/payment-voucher" element={<PaymentVoucherPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/reservations" element={<ReservationsPage />} />
        <Route path="/supplies" element={<SuppliesPage />} />
        <Route path="/bills" element={<BillsPage />} />
        <Route path="/company-settings" element={<CompanySettingsPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/pos" element={<POSPage />} />
        <Route path="/commissions" element={<CommissionsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
