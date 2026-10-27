import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, Banknote, Bell,
  BriefcaseBusiness, CalendarDays, Check, CheckCircle2, CheckSquare, ChevronDown,
  CircleDollarSign, ClipboardList, Copy, Download, FileDown, FileSpreadsheet,
  FileText, Filter, HardHat, LayoutDashboard, LogOut, Menu, Package, Pencil, Plus, Printer, Receipt,
  Search, Share2, ShieldCheck, Trash2, UserCog, UsersRound, Wallet, Wrench, X, Briefcase, Sparkles, Compass, PieChart as PieIcon, type LucideIcon,
} from 'lucide-react'
import AuthScreen from './AuthScreen'
import LeadSourceTracking from './LeadSourceTracking'
import ProjectsSitesManager from './ProjectsSitesManager'
import ProjectAccount from './ProjectAccount'
import UserManagement from './UserManagement'
import EngineeringDesk from './EngineeringDesk'
import './operations.css'

type ModuleId = 'dashboard' | 'leads' | 'projects' | 'projectAccounts' | 'engineering' | 'employees' | 'payroll' | 'loans' | 'assets' | 'vendors' | 'workOrders' | 'projectExpenses' | 'officeExpenses' | 'estimates' | 'invoices' | 'profitLoss' | 'users'
type EntryModule = Exclude<ModuleId, 'dashboard' | 'projectAccounts' | 'engineering' | 'payroll' | 'loans' | 'profitLoss' | 'users'>
type AuthUser = { id: number; name: string; email: string; role: 'admin' | 'user'; permissions: Partial<Record<Exclude<ModuleId, 'users'>, { view: boolean; edit: boolean }>> }
type Entry = Record<string, unknown>
type Bootstrap = { projects: Entry[]; leads: Entry[]; employees: Entry[]; employeeLoans: Entry[]; payroll: Entry[]; assets: Entry[]; assetMaintenance: Entry[]; vendors: Entry[]; workOrders: Entry[]; expenses: Entry[]; documents: Entry[] }
type Finance = { period: { from: string; to: string }; currency: string; revenue: number; cashCollected: number; receivables: number; projectExpenses: number; generalExpenses: number; cashExpensePayments: number; payrollCost: number; payrollPaid: number; vendorPayments: number; depreciation: number; inputTax: number; outputTax: number; totalOperatingExpenses: number; profitOrLoss: number; cashNet: number; billedInPeriod: Entry[]; expenseByCategory: Entry[]; projectProfitability: Entry[] }
type Field = { key: string; label: string; required?: boolean; kind?: 'text' | 'date' | 'month' | 'number' | 'email' | 'tel' | 'textarea' | 'select'; options?: { value: string; label: string }[]; min?: number; max?: number; step?: number; hint?: string }
type LineItem = { item: string; description: string; length: string; width: string; height: string; quantity: string; nos: string; unit: string; rate: string; taxRate: string }

const navGroups: { title: string; links: { id: ModuleId; label: string; icon: LucideIcon }[] }[] = [
  { title: 'WORKSPACE', links: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'leads', label: 'Leads & Pipeline', icon: Sparkles }, { id: 'projects', label: 'Projects', icon: BriefcaseBusiness }, { id: 'projectAccounts', label: 'Project accounts', icon: Briefcase }, { id: 'engineering', label: 'Engineering', icon: Compass }] },
  { title: 'PEOPLE', links: [{ id: 'employees', label: 'Employees', icon: UsersRound }, { id: 'payroll', label: 'Payroll', icon: Banknote }, { id: 'loans', label: 'Employee loans', icon: Wallet }] },
  { title: 'OPERATIONS', links: [{ id: 'assets', label: 'Company assets', icon: Package }, { id: 'vendors', label: 'Vendors', icon: HardHat }, { id: 'workOrders', label: 'Sublet work orders', icon: ClipboardList }] },
  { title: 'ACCOUNTING', links: [{ id: 'projectExpenses', label: 'Project expenses', icon: Wrench }, { id: 'officeExpenses', label: 'Office & general', icon: Receipt }, { id: 'estimates', label: 'Estimates', icon: FileText }, { id: 'invoices', label: 'Invoices', icon: FileSpreadsheet }, { id: 'profitLoss', label: 'Profit & loss', icon: Activity }] },
  { title: 'ADMINISTRATION', links: [{ id: 'users', label: 'User access', icon: UserCog }] },
]

const labels: Record<ModuleId, { title: string; subtitle: string; add?: string }> = {
  dashboard: { title: 'Lead Source Tracking', subtitle: 'See which channels are generating construction opportunities.' },
  leads: { title: 'Lead & Opportunity register', subtitle: 'Channel sources, qualified opportunities, site visits, and proposal stages.', add: 'New lead' },
  projects: { title: 'Projects', subtitle: 'Contract records, project ownership, client, status, and delivery dates.', add: 'New project' },
  projectAccounts: { title: 'Project accounts', subtitle: 'Budgets, audited approvals, committed costs, payments, and client receipts by project.' },
  engineering: { title: 'Engineering & Technical Desk', subtitle: 'BOQ & estimates, structural material calculator, and BIM & CAD drawings archive.' },
  employees: { title: 'Employee register', subtitle: 'Employment details, monthly compensation package, tax, benefits, and loan balance.', add: 'Add employee' },
  payroll: { title: 'Payroll register', subtitle: 'Monthly gross, overtime, deductions, employer cost, and take-home pay.', add: 'Run payroll' },
  loans: { title: 'Employee loan ledger', subtitle: 'Loan principal, outstanding balance, and payroll-linked repayments.', add: 'Issue employee loan' },
  assets: { title: 'Company asset register', subtitle: 'Equipment, vehicles, tools, property, custody, warranty, and depreciation.', add: 'Register asset' },
  vendors: { title: 'Vendor directory', subtitle: 'Trade partners, subcontractors, contacts, tax IDs, and payment terms.', add: 'Add vendor' },
  workOrders: { title: 'Sublet & work orders', subtitle: 'Awarded subcontract scope, committed value, retention, and payments.', add: 'Issue work order' },
  projectExpenses: { title: 'Project expense ledger', subtitle: 'Booked site costs, tax, vendor settlement, and outstanding balances by project.', add: 'Post project cost' },
  officeExpenses: { title: 'Office & general ledger', subtitle: 'Company operating costs with posted vouchers, cash settlement, and open payables.', add: 'Post office cost' },
  estimates: { title: 'Detailed estimates', subtitle: 'PKR quotations with dimensions, quantity, unit rate, discount, and tax.', add: 'Create estimate' },
  invoices: { title: 'Client invoices', subtitle: 'Progress and final bills, line-item detail, audit notes, payments, and balance.', add: 'Create invoice' },
  profitLoss: { title: 'Profit & loss', subtitle: 'Billed income less project costs, office costs, payroll, subcontracts, and depreciation.' },
  users: { title: 'User access', subtitle: 'Create team accounts and control which CRM sections each person can view or edit.' },
}

const blankData: Bootstrap = { projects: [], leads: [], employees: [], employeeLoans: [], payroll: [], assets: [], assetMaintenance: [], vendors: [], workOrders: [], expenses: [], documents: [] }
const currentDate = new Date()
const currentYearNumber = new Date().getFullYear()
const todayISO = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
const currentPeriod = () => todayISO().slice(0, 7)
const pkr = (value: unknown) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(Number(value) || 0)
const text = (value: unknown) => value === null || value === undefined || value === '' ? '—' : String(value)
const blankLine = (): LineItem => ({ item: '', description: '', length: '', width: '', height: '', quantity: '1', nos: '1', unit: 'Each', rate: '', taxRate: '0' })

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('revoxen_token') : null
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (init?.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((val, key) => { headers[key] = val })
    } else if (Array.isArray(init.headers)) {
      for (const [k, v] of init.headers) headers[k] = v
    } else {
      Object.assign(headers, init.headers)
    }
  }
  const response = await fetch(`/api${path}`, {
    credentials: 'include',
    ...init,
    headers,
  })
  const result = await response.json().catch(() => ({})) as { error?: string } & T
  if (!response.ok) {
    if (response.status === 401 && path !== '/auth/login' && path !== '/auth/setup' && path !== '/auth/me') {
      if (typeof window !== 'undefined') localStorage.removeItem('revoxen_token')
    }
    throw new Error(result.error || `Request failed (${response.status})`)
  }
  return result
}

function entryFields(module: EntryModule, data: Bootstrap): Field[] {
  const projectOptions = data.projects.map((project) => ({ value: String(project.id), label: `${text(project.project_code)} · ${text(project.name)}` }))
  const vendorOptions = data.vendors.map((vendor) => ({ value: String(vendor.id), label: `${text(vendor.vendor_code)} · ${text(vendor.company_name)}` }))
  const categories = ['Materials', 'Site labor', 'Subcontractor', 'Equipment rental', 'Transport', 'Fuel', 'Permit & fees', 'Utilities', 'Office supplies', 'Travel', 'Insurance', 'Maintenance', 'Professional fees', 'Other']
  switch (module) {
    case 'leads': return [
      { key: 'name', label: 'Opportunity / Project title', required: true },
      { key: 'client', label: 'Client / Company name', required: true },
      { key: 'source', label: 'Lead source channel', kind: 'select', required: true, options: ['Website Enquiries', 'Referrals', 'Repeat Customers', 'Paid Campaigns', 'Bid Platforms', 'Partners', 'Outbound Sales'].map((value) => ({ value, label: value })) },
      { key: 'stage', label: 'Pipeline stage', kind: 'select', options: ['Lead Source', 'Qualified', 'Site Visit', 'Estimate / Bid', 'Proposal', 'Awarded', 'Lost'].map((value) => ({ value, label: value })) },
      { key: 'value', label: 'Estimated opportunity value (PKR)', kind: 'number', min: 0, step: 1000 },
      { key: 'work_type', label: 'Work type', kind: 'select', options: ['Whole-home renovation', 'Commercial fit-out', 'Luxury villa construction', 'Hospitality remodel', 'Office interior', 'Industrial warehouse', 'Exterior facade & roofing', 'Residential extension', 'Other'].map((value) => ({ value, label: value })) },
      { key: 'site_address', label: 'Site location' },
      { key: 'phone', label: 'Phone', kind: 'tel' },
      { key: 'email', label: 'Email', kind: 'email' },
      { key: 'notes', label: 'Requirement notes', kind: 'textarea' },
    ]
    case 'projects': return [
      { key: 'project_code', label: 'Project code', required: true }, { key: 'name', label: 'Project name', required: true },
      { key: 'client', label: 'Client / customer', required: true }, { key: 'work_type', label: 'Work type', kind: 'select', options: ['New construction', 'Renovation', 'Interior fit-out', 'Kitchen', 'Bathroom', 'Electrical', 'Civil', 'Other'].map((value) => ({ value, label: value })) },
      { key: 'site_address', label: 'Site address', kind: 'textarea' }, { key: 'contract_amount', label: 'Contract value (PKR)', kind: 'number', min: 0, step: .01, required: true },
      { key: 'start_date', label: 'Start date', kind: 'date' }, { key: 'due_date', label: 'Target completion', kind: 'date' },
      { key: 'manager', label: 'Project manager' }, { key: 'status', label: 'Status', kind: 'select', options: ['Planning', 'In progress', 'At risk', 'Completed', 'On hold'].map((value) => ({ value, label: value })) },
    ]
    case 'employees': return [
      { key: 'employee_code', label: 'Employee ID', required: true }, { key: 'full_name', label: 'Full legal name', required: true },
      { key: 'job_title', label: 'Job title' }, { key: 'department', label: 'Department / trade' },
      { key: 'phone', label: 'Phone', kind: 'tel' }, { key: 'email', label: 'Email', kind: 'email' }, { key: 'start_date', label: 'Joining date', kind: 'date' },
      { key: 'base_salary', label: 'Base monthly salary (PKR)', kind: 'number', min: 0, step: .01, required: true },
      { key: 'housing_allowance', label: 'Housing allowance' , kind: 'number', min: 0, step: .01 }, { key: 'transport_allowance', label: 'Transport allowance', kind: 'number', min: 0, step: .01 },
      { key: 'other_allowance', label: 'Other fixed allowance', kind: 'number', min: 0, step: .01 }, { key: 'monthly_bonus', label: 'Monthly bonus / commission', kind: 'number', min: 0, step: .01 },
      { key: 'overtime_multiplier', label: 'Overtime multiplier', kind: 'number', min: 0, step: .01, hint: 'Standard monthly-hour divisor: 26 days × 8 hours.' },
      { key: 'tax_rate', label: 'Withholding tax (%)', kind: 'number', min: 0, step: .01 }, { key: 'benefit_deduction', label: 'Employee benefit deduction', kind: 'number', min: 0, step: .01 },
      { key: 'employer_contribution', label: 'Employer contribution', kind: 'number', min: 0, step: .01 }, { key: 'status', label: 'Employment status', kind: 'select', options: ['Active', 'On leave', 'Inactive'].map((value) => ({ value, label: value })) },
      { key: 'notes', label: 'HR notes', kind: 'textarea' },
    ]
    case 'assets': return [
      { key: 'asset_code', label: 'Asset tag', required: true }, { key: 'name', label: 'Asset / equipment name', required: true },
      { key: 'category', label: 'Asset category', kind: 'select', options: ['Vehicles', 'Plant & machinery', 'Power tools', 'IT equipment', 'Furniture', 'Property', 'Safety equipment', 'Other'].map((value) => ({ value, label: value })) },
      { key: 'make_model', label: 'Make / model' }, { key: 'serial_number', label: 'Serial / registration number' },
      { key: 'purchase_date', label: 'Purchase date', kind: 'date', required: true }, { key: 'purchase_cost', label: 'Purchase cost (PKR)', kind: 'number', min: 0, step: .01, required: true },
      { key: 'useful_life_years', label: 'Useful life (years)', kind: 'number', min: 0, step: .5 }, { key: 'salvage_value', label: 'Salvage value (PKR)', kind: 'number', min: 0, step: .01 },
      { key: 'condition', label: 'Condition', kind: 'select', options: ['New', 'Good', 'Fair', 'Needs repair', 'Retired'].map((value) => ({ value, label: value })) },
      { key: 'location', label: 'Current location' }, { key: 'assigned_to', label: 'Assigned employee / custodian' }, { key: 'warranty_expiry', label: 'Warranty expiry', kind: 'date' }, { key: 'notes', label: 'Condition / maintenance notes', kind: 'textarea' },
    ]
    case 'vendors': return [
      { key: 'vendor_code', label: 'Vendor ID', required: true }, { key: 'company_name', label: 'Company / vendor name', required: true },
      { key: 'contact_name', label: 'Primary contact' }, { key: 'trade', label: 'Trade / service', kind: 'select', options: ['Civil', 'Electrical', 'Plumbing', 'HVAC', 'Carpentry', 'Masonry', 'Painting', 'Flooring', 'Materials supplier', 'Equipment rental', 'Other'].map((value) => ({ value, label: value })) },
      { key: 'phone', label: 'Phone / WhatsApp', kind: 'tel' }, { key: 'email', label: 'Email', kind: 'email' },
      { key: 'tax_id', label: 'NTN / STRN / tax ID' }, { key: 'payment_terms', label: 'Payment terms', kind: 'select', options: ['Due on receipt', '7 days', '15 days', '30 days', 'Milestone based', 'Other'].map((value) => ({ value, label: value })) },
      { key: 'address', label: 'Address', kind: 'textarea' }, { key: 'status', label: 'Vendor status', kind: 'select', options: ['Active', 'On hold', 'Blacklisted'].map((value) => ({ value, label: value })) }, { key: 'notes', label: 'Scope / compliance notes', kind: 'textarea' },
    ]
    case 'workOrders': return [
      { key: 'work_order_number', label: 'Work order number', required: true }, { key: 'project_id', label: 'Project', kind: 'select', required: true, options: projectOptions },
      { key: 'vendor_id', label: 'Subcontractor / vendor', kind: 'select', required: true, options: vendorOptions }, { key: 'scope', label: 'Detailed scope of work', kind: 'textarea', required: true },
      { key: 'issue_date', label: 'Issue date', kind: 'date', required: true }, { key: 'due_date', label: 'Completion / due date', kind: 'date' },
      { key: 'amount', label: 'Awarded amount (PKR)', kind: 'number', min: 0, step: .01, required: true }, { key: 'tax_amount', label: 'Tax (PKR)', kind: 'number', min: 0, step: .01 },
      { key: 'retention_amount', label: 'Retention held (PKR)', kind: 'number', min: 0, step: .01 }, { key: 'status', label: 'Order status', kind: 'select', options: ['Draft', 'Issued', 'In progress', 'Completed', 'Partially paid', 'Paid', 'Cancelled'].map((value) => ({ value, label: value })) },
      { key: 'notes', label: 'Audit / completion notes', kind: 'textarea' },
    ]
    case 'projectExpenses':
    case 'officeExpenses': return [
      { key: 'expense_number', label: 'Voucher / reference number', required: true },
      ...(module === 'projectExpenses' ? [data.projects.length ? { key: 'project_id', label: 'Project', kind: 'select' as const, required: true, options: projectOptions } : { key: 'project_id', label: 'Project ID', kind: 'number' as const, min: 1, step: 1, required: true }] : []),
      { key: 'category', label: 'Expense category', kind: 'select', required: true, options: categories.map((value) => ({ value, label: value })) },
      { key: 'description', label: 'Description / purpose', required: true }, { key: 'expense_date', label: 'Expense date', kind: 'date', required: true },
      { key: 'vendor_id', label: 'Paid to vendor (optional)', kind: 'select', options: [{ value: '', label: 'Not linked to a vendor' }, ...vendorOptions] },
      { key: 'amount', label: 'Amount before tax (PKR)', kind: 'number', min: 0, step: .01, required: true }, { key: 'tax_amount', label: 'Tax (PKR)', kind: 'number', min: 0, step: .01 },
      { key: 'payment_method', label: 'Payment method', kind: 'select', options: ['Cash', 'Bank transfer', 'Cheque', 'Card', 'Mobile wallet', 'Credit / payable'].map((value) => ({ value, label: value })) },
      { key: 'reference_number', label: 'Bank / receipt reference' }, { key: 'status', label: 'Settlement status', kind: 'select', options: ['Paid', 'Unpaid', 'Partially paid', 'Void'].map((value) => ({ value, label: value })) }, { key: 'notes', label: 'Audit notes', kind: 'textarea' },
    ]
    case 'estimates':
    case 'invoices': return [
      { key: 'document_number', label: module === 'estimates' ? 'Estimate number' : 'Invoice number', required: true },
      { key: 'project_id', label: 'Related project (optional)', kind: 'select', options: [{ value: '', label: 'No project selected' }, ...projectOptions] },
      { key: 'client_name', label: 'Bill to / client', required: true }, { key: 'subject', label: 'Scope / billing milestone', required: true },
      { key: 'issue_date', label: 'Issue date', kind: 'date', required: true }, ...(module === 'invoices' ? [{ key: 'due_date', label: 'Payment due date', kind: 'date' as const }] : []),
      { key: 'discount_amount', label: 'Discount (PKR)', kind: 'number', min: 0, step: .01 },
      { key: 'tax_rate', label: 'Default line tax (%)', kind: 'number', min: 0, max: 100, step: .01, hint: 'Each line may have a different rate.' },
      ...(module === 'invoices' ? [
        { key: 'billing_stage', label: 'Billing stage', kind: 'select' as const, options: ['Progress', 'Final'].map((value) => ({ value, label: value })) },
        { key: 'audit_status', label: 'Final billing audit', kind: 'select' as const, options: ['Not required', 'Pending', 'Passed', 'Failed'].map((value) => ({ value, label: value })) },
        { key: 'audited_by', label: 'Audited by' }, { key: 'audit_date', label: 'Audit date', kind: 'date' as const },
        { key: 'audit_notes', label: 'Audit findings / final measurement notes', kind: 'textarea' as const },
      ] : []),
      { key: 'status', label: 'Document status', kind: 'select', options: (module === 'estimates' ? ['Draft', 'Sent'] : ['Draft', 'Sent']).map((value) => ({ value, label: value })) },
      { key: 'notes', label: 'Terms, exclusions & audit notes', kind: 'textarea' },
    ]
  }
}

function modulePayload(module: EntryModule, values: Record<string, string>, lines?: LineItem[]) {
  const body: Record<string, unknown> = { ...values }
  for (const [key, value] of Object.entries(body)) {
    if (['project_id', 'vendor_id'].includes(key)) body[key] = value ? Number(value) : null
    else if (key.endsWith('_amount') || key.endsWith('_rate') || key === 'amount' || key === 'tax_rate' || key === 'useful_life_years' || key === 'salvage_value') body[key] = value ? Number(value) : 0
  }
  if (module === 'projectExpenses') body.expense_type = 'Project'
  if (module === 'officeExpenses') { body.expense_type = 'General'; delete body.project_id }
  if (module === 'invoices') body.document_type = 'Invoice'
  if (module === 'estimates') body.document_type = 'Estimate'
  if (lines) body.lines = lines.map((line) => ({ ...line, length: Number(line.length) || 0, width: Number(line.width) || 0, height: Number(line.height) || 0, quantity: Number(line.quantity) || 0, nos: Number(line.nos) || 0, rate: Number(line.rate) || 0, taxRate: Number(line.taxRate) || 0 }))
  return body
}

function OperationsApp() {
  const [authMode, setAuthMode] = useState<'checking' | 'setup' | 'login' | 'authenticated'>('checking')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [data, setData] = useState<Bootstrap | null>(null)
  const [finance, setFinance] = useState<Finance | null>(null)
  const [module, setModule] = useState<ModuleId>('dashboard')
  const [period, setPeriod] = useState(currentPeriod)
  const [year, setYear] = useState(() => String(currentYearNumber))
  const [periodMode, setPeriodMode] = useState<'month' | 'year'>('month')
  const [search, setSearch] = useState('')
  const [dialog, setDialog] = useState<EntryModule | 'payroll' | 'employeeLoan' | 'assetMaintenance' | 'invoiceAudit' | 'invoicePayment' | 'workOrderPayment' | 'expensePayment' | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)

  useEffect(() => {
    let active = true
    const checkSession = async () => {
      try {
        const status = await api<{ setupRequired: boolean }>('/auth/status')
        if (!active) return
        if (status.setupRequired) { setAuthMode('setup'); return }
        try {
          const res = await api<AuthUser & { user?: AuthUser | null; authenticated?: boolean }>('/auth/me')
          if (!active) return
          const authenticatedUser = res && (res.id ? res : res.user)
          if (authenticatedUser && authenticatedUser.id) {
            setUser(authenticatedUser)
            setAuthMode('authenticated')
          } else {
            setUser(null)
            setAuthMode('login')
          }
        } catch {
          if (active) {
            setUser(null)
            setAuthMode('login')
          }
        }
      } catch {
        if (active) {
          setUser(null)
          setAuthMode('login')
        }
      }
    }
    void checkSession()
    return () => { active = false }
  }, [])

  const periodQuery = periodMode === 'month' ? `period=${period}` : `year=${year}`
  const loadData = useCallback(async (showSpinner = false) => {
    if (!user) return
    if (showSpinner) setRefreshing(true)
    try {
      const financeRequest = user.role === 'admin' || user.permissions.profitLoss?.view
        ? api<Finance>(`/finance?${periodQuery}`)
        : Promise.resolve(null)
      const [nextData, nextFinance] = await Promise.all([api<Bootstrap>('/bootstrap'), financeRequest])
      setData(nextData)
      setFinance(nextFinance)
      setError('')
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Could not connect to the Revoxen database.')
    } finally { if (showSpinner) setRefreshing(false) }
  }, [periodQuery, user])

  useEffect(() => {
    if (!user) return
    const task = window.setTimeout(() => { void loadData() }, 0)
    return () => window.clearTimeout(task)
  }, [loadData, user])
  // Track user presence and session duration in real time
  useEffect(() => {
    if (!user) return
    const interval = window.setInterval(() => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('revoxen_token') : null
      fetch('/api/auth/heartbeat', {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).then((res) => {
        if (res.status === 401) {
          localStorage.removeItem('revoxen_token')
          setUser(null)
          setAuthMode('login')
        }
      }).catch(() => {})
    }, 45000)
    return () => window.clearInterval(interval)
  }, [user])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 3500)
    return () => window.clearTimeout(timer)
  }, [toast])
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); document.getElementById('ops-search')?.focus() }
      if (event.key === 'Escape') setDialog(null)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const canView = (target: ModuleId) => target === 'users' ? user?.role === 'admin' : user?.role === 'admin' || Boolean(user?.permissions[target]?.view)
  const canEdit = (target: ModuleId) => target !== 'users' && (user?.role === 'admin' || Boolean(user?.permissions[target]?.edit))
  const hideRowActions = (!canEdit(module) && ['payroll','loans','employees','assets','invoices','workOrders','estimates','projectExpenses','officeExpenses'].includes(module)) || (module === 'employees' && !canEdit('loans'))
  const config = labels[module]
  const loading = data === null
  const companyData = data ?? blankData
  const changeModule = (next: ModuleId) => { setModule(next); setMobileNav(false); setSearch('') }
  const notify = (message: string) => setToast(message)
  const openDialog = (target: typeof dialog, id?: number) => { setSelectedId(id ?? null); setDialog(target) }

  const handleDeleteRecords = async (targetModule: ModuleId, ids: number[]) => {
    if (!ids.length) return
    const route = apiRoute(targetModule as any)
    for (const id of ids) {
      await api(`/${route}/${id}`, { method: 'DELETE' })
    }
    await loadData(true)
    notify(`Successfully deleted ${ids.length} record${ids.length === 1 ? '' : 's'}.`)
  }

  if (authMode === 'checking') return <div className="ops-loading"><span className="ops-spinner" />Checking secure sign-in…</div>
  if (authMode === 'setup' || authMode === 'login') return <AuthScreen setupRequired={authMode === 'setup'} onAuthenticated={(nextUser) => {
    if ((nextUser as unknown as { token?: string }).token) {
      localStorage.setItem('revoxen_token', (nextUser as unknown as { token?: string }).token!)
    }
    setUser(nextUser)
    const firstAllowed = nextUser.role === 'admin' ? 'dashboard' : navGroups.flatMap((group) => group.links.map((link) => link.id)).find((id) => id !== 'users' && nextUser.permissions[id]?.view)
    setModule(firstAllowed ?? 'dashboard')
    setAuthMode('authenticated')
  }} />
  if (!user) return <div className="ops-loading"><span className="ops-spinner" />Opening Revoxen CRM…</div>

  const signOut = async () => {
    try { await api('/auth/logout', { method: 'POST' }) } finally {
      localStorage.removeItem('revoxen_token')
      setUser(null)
      setData(null)
      setFinance(null)
      setAuthMode('login')
    }
  }

  return <div className={`ops-shell ${hideRowActions ? 'ops-read-only-actions' : ''}`}>
    <aside className={`ops-sidebar ${mobileNav ? 'ops-sidebar-open' : ''}`}>
      <div className="ops-brand"><img src="/logo.png" alt="Revoxen Logo" className="ops-brand-logo" /><span className="ops-brand-name">REVOXEN<small>ASSOCIATES · OPERATIONS</small></span><button className="ops-icon-button ops-mobile-close" aria-label="Close navigation" onClick={() => setMobileNav(false)}><X size={17} /></button></div>
      <div className="ops-company"><img src="/logo.png" alt="Revoxen Logo" className="ops-company-logo" /><span><strong>Revoxen Associates</strong><small>PKR · Pakistan</small></span><ChevronDown size={14} /></div>
      <nav className="ops-nav" aria-label="Company modules">{navGroups.map((group) => {
        const links = group.links.filter(({ id }) => canView(id))
        return links.length ? <div className="ops-nav-group" key={group.title}><span className="ops-nav-title">{group.title}</span>{links.map(({ id, label, icon: Icon }) => <button key={id} className={`ops-nav-link ${module === id ? 'ops-nav-active' : ''}`} onClick={() => changeModule(id)}><Icon size={16} strokeWidth={1.8} /><span>{label}</span>{id === 'invoices' && finance && finance.receivables > 0 && <i className="ops-nav-dot" />}</button>)}</div> : null
      })}</nav>
      <div className="ops-sidebar-foot"><div className="ops-storage-status"><span /> SQLite database connected</div><div className="ops-profile"><span className="ops-profile-avatar">{user.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span><span><strong>{user.name}</strong><small>{user.role === 'admin' ? 'Administrator' : 'Team member'}</small></span><button className="ops-icon-button ops-profile-logout" aria-label="Sign out" title="Sign out" onClick={() => void signOut()}><LogOut size={15} /></button></div></div>
    </aside>
    {mobileNav && <button className="ops-mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
    <main className="ops-main">
      <header className="ops-topbar"><div className="ops-crumb"><button className="ops-icon-button ops-mobile-menu" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Menu size={18} /></button><span>REVOXEN</span><i>/</i><strong>{config.title}</strong></div><div className="ops-top-actions"><label className="ops-search"><Search size={15} /><input id="ops-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search records..." /><kbd>⌘ K</kbd></label><button className="ops-icon-button ops-bell" aria-label="Notifications" onClick={() => notify('No new alerts.')}><Bell size={17} /></button><span className="ops-top-avatar">{user.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span></div></header>
      <div className="ops-content">
        {error && <div className="ops-error"><span><X size={15} />{error}</span><button onClick={() => void loadData(true)}>Retry</button></div>}
        <div className="ops-heading"><div><div className="ops-eyebrow"><span />{module === 'profitLoss' ? `${periodMode === 'month' ? period : year} · FINANCIAL CONTROL` : `${currentDate.toLocaleDateString('en-PK', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()} · REVOXEN ASSOCIATES`}</div><h1>{config.title}</h1><p>{config.subtitle}</p></div><div className="ops-heading-actions">{module !== 'profitLoss' && module !== 'users' && module !== 'engineering' && <button className="ops-outline-button" onClick={() => void loadData(true)} aria-label="Refresh records"><Activity size={15} />{refreshing ? 'Syncing...' : 'Refresh'}</button>}{config.add && module !== 'leads' && module !== 'projects' && module !== 'engineering' && canEdit(module) && <button className="ops-red-button" onClick={() => openDialog(module === 'payroll' ? 'payroll' : module === 'loans' ? 'employeeLoan' : module as EntryModule)}><Plus size={16} />{config.add}</button>}</div></div>
        {loading && <div className="ops-loading"><span className="ops-spinner" />Loading company records…</div>}
        {!loading && module === 'dashboard' && <Dashboard data={companyData} finance={finance} onNavigate={changeModule} period={period} setPeriod={setPeriod} canView={canView} canEdit={canEdit} />}
        {!loading && module === 'leads' && <LeadSourceTracking onNavigate={changeModule} leadsData={companyData.leads} canEdit={canEdit('leads')} />}
        {!loading && module === 'projects' && <ProjectsSitesManager search={search} canEdit={canEdit('projects')} />}
        {!loading && module === 'engineering' && <EngineeringDesk projects={companyData.projects} canEdit={canEdit('engineering')} />}
        {!loading && module === 'profitLoss' && <ProfitLoss finance={finance} period={period} setPeriod={setPeriod} year={year} setYear={setYear} periodMode={periodMode} setPeriodMode={setPeriodMode} />}
        {!loading && (module === 'projectExpenses' || module === 'officeExpenses') && <ExpenseControlSummary kind={module === 'projectExpenses' ? 'Project' : 'General'} expenses={companyData.expenses} />}
        {!loading && module === 'users' && user.role === 'admin' && <UserManagement />}
        {!loading && module === 'projectAccounts' && <ProjectAccount canEdit={canEdit('projectAccounts')} canEditExpenses={canEdit('projectExpenses')} canAudit={user.role === 'admin'} onNotify={notify} />}
        {!loading && !['dashboard', 'leads', 'projects', 'projectAccounts', 'engineering', 'profitLoss', 'users'].includes(module) && <ModuleTable
          module={module}
          data={companyData}
          search={search}
          editable={canEdit(module)}
          canEdit={canEdit}
          onAddNew={() => openDialog(module === 'payroll' ? 'payroll' : module === 'loans' ? 'employeeLoan' : module as EntryModule)}
          onEdit={(id) => openDialog(module === 'payroll' ? 'payroll' : module === 'loans' ? 'employeeLoan' : module as EntryModule, id)}
          onDelete={(ids) => handleDeleteRecords(module, ids)}
          onNotify={notify}
          onPayment={(type, id) => openDialog(type, id)}
          onLoan={() => openDialog('employeeLoan')}
          onAssetMaintenance={(id) => openDialog('assetMaintenance', id)}
          onInvoiceAudit={(id) => openDialog('invoiceAudit', id)}
          onExpensePayment={(id) => openDialog('expensePayment', id)}
          onLeadAdvance={async (id, currentStage) => { const stages = ['Lead Source', 'Qualified', 'Site Visit', 'Estimate / Bid', 'Proposal', 'Awarded']; const nextStage = stages[Math.min(stages.indexOf(currentStage) + 1, stages.length - 1)]; try { await api(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify({ stage: nextStage }) }); await loadData(); notify(`Lead advanced to ${nextStage}.`) } catch (err) { notify(message(err)) } }}
          onLeadConvert={async (id) => { try { await api(`/leads/${id}/convert-to-project`, { method: 'POST' }); await loadData(); notify('Lead converted to a Project!') } catch (err) { notify(message(err)) } }}
          onInvoiceSend={async (id) => { try { await api(`/documents/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'Sent' }) }); await loadData(); notify('Invoice sent to the client.') } catch (problem) { notify(message(problem)) } }}
          onPayrollPaid={async (id) => { try { await api(`/payroll/${id}/mark-paid`, { method: 'POST', body: JSON.stringify({ paid_date: todayISO() }) }); await loadData(); notify('Payroll run marked paid.') } catch (problem) { notify(message(problem)) } }}
          onEstimateApprove={async (id) => { try { await api(`/documents/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'Approved' }) }); await loadData(); notify('Estimate approved.') } catch (problem) { notify(message(problem)) } }}
          onEstimateConvert={async (id) => { try { await api(`/documents/${id}/convert-to-project`, { method: 'POST' }); await loadData(); notify('Estimate converted to a project.') } catch (problem) { notify(message(problem)) } }}
        />}
        {finance && module === 'dashboard' && <div className="ops-accounting-note"><ShieldCheck size={16} /> Financial totals are calculated from database transactions. PKR tax is shown separately from operating income.</div>}
        <footer className="ops-footer"><span>REVOXEN ASSOCIATES · OPERATIONS SYSTEM</span><span><i /> SQLite persistent storage · PKR</span></footer>
      </div>
    </main>
    {dialog && <EntryDialog key={`${dialog}-${selectedId ?? 'new'}`} target={dialog} selectedId={selectedId} data={companyData} onClose={() => setDialog(null)} onSaved={async (message) => { setDialog(null); await loadData(true); notify(message) }} />}
    {toast && <div className="ops-toast"><CheckCircle2 size={16} />{toast}</div>}
  </div>
}

function Dashboard({ data, finance, onNavigate, period, setPeriod, canView, canEdit }: { data: Bootstrap; finance: Finance | null; onNavigate: (id: ModuleId) => void; period: string; setPeriod: (value: string) => void; canView: (id: ModuleId) => boolean; canEdit: (id: ModuleId) => boolean }) {
  const [dashboardView, setDashboardView] = useState<'leadSource' | 'operational'>('leadSource')

  if (!canView('dashboard') && !canView('leads') && !canView('projects') && !canView('employees') && !canView('payroll') && !canView('loans') && !canView('assets') && !canView('vendors') && !canView('workOrders') && !canView('projectExpenses') && !canView('officeExpenses') && !canView('estimates') && !canView('invoices') && !canView('profitLoss')) {
    return <section className="ops-no-access"><ShieldCheck size={21} /><h2>No sections assigned</h2><p>Ask your administrator to enable the CRM sections you need.</p></section>
  }

  if (dashboardView === 'leadSource') {
    return (
      <LeadSourceTracking
        onNavigate={onNavigate}
        onSwitchToOperations={() => setDashboardView('operational')}
        leadsData={data.leads}
        canEdit={canEdit('leads')}
      />
    )
  }

  const metrics = [
    { module: 'projects' as const, label: 'ACTIVE PROJECTS', value: data.projects.filter((project) => project.status !== 'Completed').length, detail: `${data.projects.length} total projects`, icon: BriefcaseBusiness, tone: 'red' },
    { module: 'projects' as const, label: 'MONTHLY CONTRACTS', value: pkr(data.projects.reduce((sum, project) => sum + Number(project.contract_amount || 0), 0)), detail: 'Recorded project value', icon: CircleDollarSign, tone: 'gray' },
    { module: 'payroll' as const, label: 'EMPLOYEE PAYROLL', value: pkr(data.payroll.filter((run) => run.pay_period === period).reduce((sum, run) => sum + Number(run.gross_salary || 0), 0)), detail: `${data.employees.length} registered employees`, icon: UsersRound, tone: 'black' },
    { module: 'profitLoss' as const, label: 'INVOICE RECEIVABLES', value: pkr(finance?.receivables ?? 0), detail: 'Outstanding client balance', icon: Receipt, tone: 'light' },
  ].filter(({ module }) => canView(module))

  return <>
    <div className="lst-sub-banner" style={{ marginBottom: 14 }}>
      <span>Showing Financial &amp; Operations Overview</span>
      <button onClick={() => setDashboardView('leadSource')}>
        <PieIcon size={14} /> Back to Lead Source Tracking
      </button>
    </div>
    {canView('profitLoss') && <div className="ops-period-strip"><CalendarDays size={15} /><span>Period view</span><input aria-label="Dashboard month" type="month" value={period} onChange={(event) => setPeriod(event.target.value)} /><button onClick={() => onNavigate('profitLoss')}>Open period P&L <ArrowRight size={13} /></button></div>}
    <section className="ops-metric-grid">{metrics.map(({ label, value, detail, icon: Icon, tone }) => <article className="ops-metric" key={label}><div className="ops-metric-head"><span>{label}</span><i className={`ops-metric-icon metric-${tone}`}><Icon size={16} /></i></div><strong>{value}</strong><small>{detail}</small></article>)}</section>
    <div className="ops-overview-grid">{canView('profitLoss') && <section className="ops-panel ops-pnl-panel"><div className="ops-panel-head"><div><span className="ops-section-label">MONTH-TO-DATE</span><h2>Income & expenditure</h2></div><button className="ops-text-link" onClick={() => onNavigate('profitLoss')}>Full statement <ArrowRight size={14} /></button></div><div className="ops-pnl-summary"><div><span>INVOICED INCOME</span><strong>{pkr(finance?.revenue)}</strong></div><div><span>OPERATING COSTS</span><strong>{pkr(finance?.totalOperatingExpenses)}</strong></div><div className={(finance?.profitOrLoss ?? 0) < 0 ? 'pnl-loss' : 'pnl-profit'}><span>NET PROFIT / (LOSS)</span><strong>{pkr(finance?.profitOrLoss)}</strong></div></div><div className="ops-mini-bars">{[0.58, 0.82, 0.47, 0.92, 0.68, 0.38, 0.75, 0.56, 1, 0.63, 0.44, 0.81].map((height, index) => <div key={index}><i style={{ height: `${height * 100}%` }} /><span>{['J','F','M','A','M','J','J','A','S','O','N','D'][index]}</span></div>)}</div></section>}
      {canEdit('projectExpenses') || canEdit('officeExpenses') || canEdit('invoices') || canEdit('employees') || canEdit('assets') ? <section className="ops-panel ops-quick-panel"><div className="ops-panel-head"><div><span className="ops-section-label">DAILY ENTRY</span><h2>Quick actions</h2></div><span className="ops-action-chip">PKR</span></div><div className="ops-quick-list">{[['Project expense', 'projectExpenses', Receipt], ['Office expense', 'officeExpenses', Banknote], ['New invoice', 'invoices', FileSpreadsheet], ['Add employee', 'employees', UsersRound], ['Register asset', 'assets', Package]].filter(([, id]) => canEdit(id as ModuleId)).map(([label, id, icon]) => { const Icon = icon as LucideIcon; return <button key={String(id)} onClick={() => onNavigate(id as ModuleId)}><Icon size={15} /><span>{String(label)}</span><ArrowRight size={13} /></button> })}</div></section> : null}</div>
    {(canView('projects') || canView('profitLoss')) && <div className="ops-overview-grid ops-overview-bottom">{canView('projects') && <section className="ops-panel"><div className="ops-panel-head"><div><span className="ops-section-label">PROJECT DELIVERY</span><h2>Active jobs</h2></div><button className="ops-text-link" onClick={() => onNavigate('projects')}>All projects <ArrowRight size={14} /></button></div><DataTable rows={data.projects.filter((project) => project.status !== 'Completed').slice(0, 5)} columns={[[ 'project_code','CODE'],['name','PROJECT'],['client','CLIENT'],['contract_amount','CONTRACT'],['status','STATUS']]} /></section>}{canView('profitLoss') && <section className="ops-panel"><div className="ops-panel-head"><div><span className="ops-section-label">CASH CONTROL</span><h2>Where the money goes</h2></div><button className="ops-text-link" onClick={() => onNavigate('profitLoss')}>P&amp;L <ArrowRight size={14} /></button></div><div className="ops-money-list">{[['Project expenses', finance?.projectExpenses], ['Office & general', finance?.generalExpenses], ['Gross payroll cost', finance?.payrollCost], ['Subcontractor payments', finance?.vendorPayments], ['Monthly depreciation', finance?.depreciation]].map(([label, amount]) => <div key={String(label)}><span>{String(label)}</span><strong>{pkr(amount)}</strong></div>)}</div></section>}</div>}
  </>
}

function ExpenseControlSummary({ kind, expenses }: { kind: 'Project' | 'General'; expenses: Entry[] }) {
  const records = expenses.filter((expense) => expense.expense_type === kind)
  const posted = records.filter((expense) => expense.status !== 'Void')
  const booked = posted.reduce((sum, expense) => sum + Number(expense.amount || 0) + Number(expense.tax_amount || 0), 0)
  const settled = posted.reduce((sum, expense) => sum + Number(expense.paid_amount || 0), 0)
  const outstanding = Math.max(0, booked - settled)
  const metrics = [
    { label: 'VOUCHERS', value: String(posted.length), detail: `${records.filter((expense) => expense.status === 'Void').length} voided`, tone: 'gray' },
    { label: 'TOTAL BOOKED', value: pkr(booked), detail: 'Amount including tax', tone: 'dark' },
    { label: 'CASH SETTLED', value: pkr(settled), detail: 'Recorded payments only', tone: 'green' },
    { label: 'OPEN PAYABLE', value: pkr(outstanding), detail: 'Remaining settlement balance', tone: outstanding > 0 ? 'red' : 'gray' },
  ]
  return <section className="ops-metric-grid expense-control-summary">{metrics.map(({ label, value, detail, tone }) => <article className="ops-metric" key={label}><div className="ops-metric-head"><span>{label}</span><i className={`ops-metric-icon metric-${tone}`}><CircleDollarSign size={15} /></i></div><strong>{value}</strong><small>{detail}</small></article>)}</section>
}

function ModuleTable({
  module,
  data,
  search,
  editable,
  canEdit,
  onAddNew,
  onEdit,
  onDelete,
  onNotify,
  onPayment,
  onPayrollPaid,
  onEstimateApprove,
  onEstimateConvert,
  onLoan,
  onAssetMaintenance,
  onInvoiceAudit,
  onExpensePayment,
  onInvoiceSend,
  onLeadAdvance,
  onLeadConvert,
}: {
  module: ModuleId
  data: Bootstrap
  search: string
  editable: boolean
  canEdit: (id: ModuleId) => boolean
  onAddNew?: () => void
  onEdit?: (id: number) => void
  onDelete?: (ids: number[]) => Promise<void>
  onNotify?: (message: string) => void
  onPayment: (type: 'invoicePayment' | 'workOrderPayment', id: number) => void
  onPayrollPaid: (id: number) => void
  onEstimateApprove: (id: number) => void
  onEstimateConvert: (id: number) => void
  onLoan: () => void
  onAssetMaintenance: (id: number) => void
  onInvoiceAudit: (id: number) => void
  onExpensePayment: (id: number) => void
  onInvoiceSend: (id: number) => void
  onLeadAdvance?: (id: number, currentStage: string) => void
  onLeadConvert?: (id: number) => void
}) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [confirmDeleteIds, setConfirmDeleteIds] = useState<number[] | null>(null)
  const [deleting, setDeleting] = useState(false)
  const headerCheckboxRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSelectedIds(new Set())
  }, [module, search])

  const filtered = (rows: Entry[]) => rows.filter((row) => !search || Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(search.toLowerCase())))
  let rows: Entry[] = []
  let columns: [string, string][] = []
  switch (module) {
    case 'leads': rows = filtered(data.leads || []); columns = [['lead_code','LEAD ID'],['name','OPPORTUNITY'],['client','CLIENT'],['source','SOURCE CHANNEL'],['stage','STAGE'],['value','VALUE · PKR'],['site_address','LOCATION'],['created_at','DATE']]; break
    case 'projects': rows = filtered(data.projects); columns = [['project_code','PROJECT ID'],['name','PROJECT'],['client','CLIENT'],['site_address','SITE'],['contract_amount','CONTRACT · PKR'],['status','STATUS'],['due_date','TARGET']]; break
    case 'employees': rows = filtered(data.employees.map((employee) => ({ ...employee, total_package: Number(employee.base_salary || 0) + Number(employee.housing_allowance || 0) + Number(employee.transport_allowance || 0) + Number(employee.other_allowance || 0) + Number(employee.monthly_bonus || 0) }))); columns = [['employee_code','EMPLOYEE ID'],['full_name','EMPLOYEE'],['job_title','ROLE / TRADE'],['department','DEPARTMENT'],['base_salary','BASE'],['total_package','GROSS PACKAGE'],['loan_balance','LOAN BALANCE'],['status','STATUS']]; break
    case 'payroll': rows = filtered(data.payroll); columns = [['pay_period','PAY PERIOD'],['employee_code','ID'],['full_name','EMPLOYEE'],['overtime_amount','OVERTIME'],['gross_salary','GROSS'],['tax_deduction','TAX'],['loan_deduction','LOAN'],['net_salary','NET PAY'],['status','STATUS']]; break
    case 'loans': rows = filtered(data.employeeLoans); columns = [['employee_code','EMPLOYEE ID'],['full_name','EMPLOYEE'],['issue_date','ISSUED'],['principal','ORIGINAL LOAN'],['outstanding','OUTSTANDING'],['status','STATUS'],['notes','NOTES']]; break
    case 'assets': rows = filtered(data.assets.map((asset) => ({ ...asset, last_service: data.assetMaintenance.find((log) => Number(log.asset_id) === Number(asset.id))?.service_date ?? '—', maintenance_spend: data.assetMaintenance.filter((log) => Number(log.asset_id) === Number(asset.id)).reduce((sum, log) => sum + Number(log.amount || 0), 0) }))); columns = [['asset_code','ASSET TAG'],['name','ASSET'],['category','CATEGORY'],['make_model','MAKE / MODEL'],['purchase_cost','PURCHASE COST'],['assigned_to','CUSTODIAN'],['condition','CONDITION'],['last_service','LAST SERVICE'],['maintenance_spend','SERVICE COST']]; break
    case 'vendors': rows = filtered(data.vendors); columns = [['vendor_code','VENDOR ID'],['company_name','VENDOR'],['trade','TRADE'],['contact_name','CONTACT'],['phone','PHONE'],['tax_id','TAX ID'],['payment_terms','TERMS'],['status','STATUS']]; break
    case 'workOrders': rows = filtered(data.workOrders); columns = [['work_order_number','WORK ORDER'],['project_code','PROJECT'],['vendor_name','SUBCONTRACTOR'],['scope','SCOPE'],['amount','AWARDED'],['paid_amount','PAID'],['status','STATUS']]; break
    case 'projectExpenses': rows = filtered(data.expenses.filter((expense) => expense.expense_type === 'Project')); columns = [['expense_number','VOUCHER'],['expense_date','DATE'],['project_code','PROJECT'],['category','CATEGORY'],['description','DETAIL'],['vendor_name','PAID TO'],['amount','AMOUNT'],['tax_amount','TAX'],['paid_amount','SETTLED'],['status','STATUS'],['payment_method','METHOD']]; break
    case 'officeExpenses': rows = filtered(data.expenses.filter((expense) => expense.expense_type === 'General')); columns = [['expense_number','VOUCHER'],['expense_date','DATE'],['category','CATEGORY'],['description','DETAIL'],['vendor_name','PAID TO'],['amount','AMOUNT'],['tax_amount','TAX'],['paid_amount','SETTLED'],['status','STATUS'],['payment_method','METHOD']]; break
    case 'estimates': rows = filtered(data.documents.filter((document) => document.document_type === 'Estimate')); columns = [['document_number','ESTIMATE'],['issue_date','DATE'],['client_name','CLIENT'],['subject','SCOPE'],['subtotal','SUBTOTAL'],['discount_amount','DISCOUNT'],['tax_amount','TAX'],['grand_total','TOTAL · PKR'],['status','STATUS']]; break
    case 'invoices': rows = filtered(data.documents.filter((document) => document.document_type === 'Invoice')); columns = [['document_number','INVOICE'],['billing_stage','BILLING STAGE'],['issue_date','ISSUED'],['due_date','DUE'],['client_name','CLIENT'],['subject','BILLING MILESTONE'],['grand_total','TOTAL'],['amount_paid','RECEIVED'],['audit_status','AUDIT'],['status','STATUS']]; break
  }

  const isAllSelected = rows.length > 0 && rows.every((r) => selectedIds.has(Number(r.id)))
  const isSomeSelected = rows.some((r) => selectedIds.has(Number(r.id))) && !isAllSelected

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isSomeSelected
    }
  }, [isSomeSelected])

  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(rows.map((r) => Number(r.id))))
    }
  }

  const toggleOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const getEffectiveRows = () => {
    if (selectedIds.size > 0) {
      return rows.filter((r) => selectedIds.has(Number(r.id)))
    }
    return rows
  }

  const handleCopy = async () => {
    const targetRows = getEffectiveRows()
    if (!targetRows.length) { onNotify?.('No records to copy.'); return }
    const headerLine = columns.map(([, label]) => label).join('\t')
    const lines = targetRows.map((row) => columns.map(([key]) => String(row[key] ?? '')).join('\t'))
    const tsv = [headerLine, ...lines].join('\n')
    try {
      await navigator.clipboard.writeText(tsv)
      onNotify?.(`Copied ${targetRows.length} record${targetRows.length === 1 ? '' : 's'} to clipboard.`)
    } catch {
      onNotify?.('Clipboard access denied.')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleShare = async () => {
    const targetRows = getEffectiveRows()
    const summary = `Revoxen Associates - ${labels[module]?.title || module}: ${targetRows.length} records. URL: ${window.location.href}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Revoxen - ${labels[module]?.title || module}`,
          text: summary,
          url: window.location.href,
        })
        onNotify?.('Shared successfully.')
      } catch {
        // user aborted share
      }
    } else {
      try {
        await navigator.clipboard.writeText(summary)
        onNotify?.('Share summary copied to clipboard.')
      } catch {
        onNotify?.('Could not copy share text.')
      }
    }
  }

  const handleDownloadPdf = () => {
    const origTitle = document.title
    document.title = `Revoxen_${labels[module]?.title.replace(/\s+/g, '_') || module}_${todayISO()}`
    window.print()
    setTimeout(() => { document.title = origTitle }, 1200)
    onNotify?.('Print dialog opened. Select "Save as PDF" to download.')
  }

  const handleSaveCsv = () => {
    const targetRows = getEffectiveRows()
    if (!targetRows.length) { onNotify?.('No records to export.'); return }
    const escapeCsv = (val: unknown) => {
      const s = String(val ?? '').replace(/"/g, '""')
      return `"${s}"`
    }
    const headerLine = columns.map(([, label]) => escapeCsv(label)).join(',')
    const dataLines = targetRows.map((row) => columns.map(([key]) => escapeCsv(row[key])).join(','))
    const csv = '\uFEFF' + [headerLine, ...dataLines].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Revoxen_${labels[module]?.title.replace(/\s+/g, '_') || module}_${todayISO()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    onNotify?.(`Saved ${targetRows.length} record${targetRows.length === 1 ? '' : 's'} as CSV file.`)
  }

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteIds || !confirmDeleteIds.length || !onDelete) return
    setDeleting(true)
    try {
      await onDelete(confirmDeleteIds)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        confirmDeleteIds.forEach((id) => next.delete(id))
        return next
      })
      setConfirmDeleteIds(null)
    } finally {
      setDeleting(false)
    }
  }

  const hasAction = editable && canEdit(module)

  return (
    <section className="ops-panel ops-table-panel">
      {/* Print-only branding banner */}
      <div className="ops-print-header">
        <div className="ops-print-brand">
          <img src="/logo.png" alt="Revoxen Logo" className="ops-print-logo" />
          <div>
            <h2>REVOXEN ASSOCIATES</h2>
            <p>Architecture · Interior · Construction Management · Operations</p>
          </div>
        </div>
        <div className="ops-print-meta">
          <div><strong>Module:</strong> {labels[module]?.title || module}</div>
          <div><strong>Date:</strong> {currentDate.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          <div><strong>Records:</strong> {getEffectiveRows().length}</div>
        </div>
      </div>

      <div className="ops-panel-head">
        <div>
          <span className="ops-section-label">{module.toUpperCase().replaceAll(/([A-Z])/g, ' $1')}</span>
          <h2>{rows.length} {rows.length === 1 ? 'record' : 'records'}</h2>
        </div>
        <div className="ops-table-tools">
          {module === 'payroll' && <span className="ops-action-chip">Gross includes overtime</span>}
          <button className="ops-icon-button" aria-label="Filter records"><Filter size={15} /></button>
        </div>
      </div>

      {/* Global Module Actions Toolbar (Add new, Edit, Delete, Select All, Copy, Print, Share, Download PDF, Save) */}
      <div className="ops-table-actions-toolbar">
        <div className="ops-toolbar-group">
          {editable && onAddNew && (
            <button
              type="button"
              className="ops-tool-btn ops-tool-btn-primary"
              onClick={onAddNew}
              title={`Add new ${labels[module]?.title.replace(/s$/, '') || 'record'}`}
            >
              <Plus size={14} />
              <span>Add New</span>
            </button>
          )}
          {editable && onEdit && (
            <button
              type="button"
              className="ops-tool-btn"
              disabled={selectedIds.size !== 1}
              onClick={() => {
                const id = Array.from(selectedIds)[0]
                onEdit(id)
              }}
              title={selectedIds.size === 1 ? 'Edit selected record' : 'Select 1 record to edit'}
            >
              <Pencil size={14} />
              <span>Edit</span>
            </button>
          )}
          {editable && onDelete && (
            <button
              type="button"
              className="ops-tool-btn ops-tool-btn-danger"
              disabled={selectedIds.size === 0}
              onClick={() => setConfirmDeleteIds(Array.from(selectedIds))}
              title={selectedIds.size > 0 ? `Delete ${selectedIds.size} selected record(s)` : 'Select records to delete'}
            >
              <Trash2 size={14} />
              <span>Delete {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}</span>
            </button>
          )}
        </div>

        <div className="ops-toolbar-divider" />

        <div className="ops-toolbar-group">
          <button
            type="button"
            className={`ops-tool-btn ${isAllSelected ? 'ops-tool-btn-active' : ''}`}
            onClick={toggleAll}
            title={isAllSelected ? 'Deselect all rows' : 'Select all visible rows'}
          >
            <CheckSquare size={14} />
            <span>{isAllSelected ? 'Deselect All' : 'Select All'}</span>
          </button>
          {selectedIds.size > 0 && (
            <span className="ops-selection-badge">{selectedIds.size} selected</span>
          )}
        </div>

        <div className="ops-toolbar-divider" />

        <div className="ops-toolbar-group ops-toolbar-right">
          <button
            type="button"
            className="ops-tool-btn"
            onClick={handleCopy}
            title="Copy selected or visible rows to clipboard"
          >
            <Copy size={14} />
            <span>Copy</span>
          </button>
          <button
            type="button"
            className="ops-tool-btn"
            onClick={handlePrint}
            title="Print table view"
          >
            <Printer size={14} />
            <span>Print</span>
          </button>
          <button
            type="button"
            className="ops-tool-btn"
            onClick={handleShare}
            title="Share summary link"
          >
            <Share2 size={14} />
            <span>Share</span>
          </button>
          <button
            type="button"
            className="ops-tool-btn"
            onClick={handleDownloadPdf}
            title="Download clean PDF document"
          >
            <FileDown size={14} />
            <span>Download PDF</span>
          </button>
          <button
            type="button"
            className="ops-tool-btn ops-tool-btn-save"
            onClick={handleSaveCsv}
            title="Save and download as Excel CSV"
          >
            <Download size={14} />
            <span>Save</span>
          </button>
        </div>
      </div>

      <div className="ops-table-wrap">
        <table className="ops-table">
          <thead>
            <tr>
              <th className="ops-checkbox-th">
                <input
                  ref={headerCheckboxRef}
                  type="checkbox"
                  className="ops-row-checkbox"
                  checked={isAllSelected}
                  onChange={toggleAll}
                  aria-label="Select all rows"
                />
              </th>
              {columns.map(([key, label]) => (
                <th key={key}>{label}</th>
              ))}
              {hasAction && <th>ACTION</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rowId = Number(row.id)
              const isSelected = selectedIds.has(rowId)
              return (
                <tr key={String(row.id)} className={isSelected ? 'ops-row-selected' : ''}>
                  <td className="ops-checkbox-td" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="ops-row-checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(rowId)}
                      aria-label={`Select row ${rowId}`}
                    />
                  </td>
                  {columns.map(([key]) => (
                    <td key={key}>{renderValue(key, row[key], row)}</td>
                  ))}
                  {hasAction && (
                    <td className="ops-actions-cell">
                      <div className="ops-row-actions-group">
                        {onEdit && (
                          <button
                            type="button"
                            className="ops-row-icon-btn"
                            title="Edit record"
                            onClick={() => onEdit(rowId)}
                          >
                            <Pencil size={12} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            className="ops-row-icon-btn ops-row-icon-danger"
                            title="Delete record"
                            onClick={() => setConfirmDeleteIds([rowId])}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                        {module === 'leads' && (
                          <>
                            {row.stage !== 'Awarded' && row.stage !== 'Lost' && onLeadAdvance && (
                              <button className="ops-row-action" onClick={() => onLeadAdvance(rowId, String(row.stage))}>Advance stage</button>
                            )}
                            {row.stage === 'Awarded' && !row.project_id && onLeadConvert && (
                              <button className="ops-row-action" onClick={() => onLeadConvert(rowId)}>Create project</button>
                            )}
                            {Boolean(row.project_id) && <span className="ops-action-chip">Project linked</span>}
                          </>
                        )}
                        {module === 'payroll' && (
                          <>
                            {row.status === 'Draft' && <button className="ops-row-action" onClick={() => onPayrollPaid(rowId)}>Mark paid</button>}
                          </>
                        )}
                        {module === 'employees' && (
                          <button className="ops-row-action" onClick={onLoan}>Issue loan</button>
                        )}
                        {module === 'loans' && (
                          <span>{row.status === 'Active' ? 'Repay through payroll' : '—'}</span>
                        )}
                        {module === 'assets' && (
                          <button className="ops-row-action" onClick={() => onAssetMaintenance(rowId)}>Log maintenance</button>
                        )}
                        {['projectExpenses','officeExpenses'].includes(module) && (
                          <>
                            {Number(row.amount || 0) + Number(row.tax_amount || 0) > Number(row.paid_amount || 0) && row.status !== 'Void' ? (
                              <button className="ops-row-action" onClick={() => onExpensePayment(rowId)}>Settle balance</button>
                            ) : 'Paid'}
                          </>
                        )}
                        {module === 'invoices' && (
                          <>
                            {row.billing_stage === 'Final' && row.audit_status !== 'Passed' && (
                              <button className="ops-row-action" onClick={() => onInvoiceAudit(rowId)}>Complete audit</button>
                            )}
                            {row.status === 'Draft' && (row.billing_stage !== 'Final' || row.audit_status === 'Passed') && (
                              <button className="ops-row-action" onClick={() => onInvoiceSend(rowId)}>Send invoice</button>
                            )}
                            {Number(row.grand_total || 0) > Number(row.amount_paid || 0) && row.status !== 'Void' && row.status !== 'Draft' && (
                              <button className="ops-row-action" onClick={() => onPayment('invoicePayment', rowId)}>Record payment</button>
                            )}
                          </>
                        )}
                        {module === 'workOrders' && (
                          <>
                            {Number(row.amount || 0) + Number(row.tax_amount || 0) - Number(row.retention_amount || 0) > Number(row.paid_amount || 0) && (
                              <button className="ops-row-action" onClick={() => onPayment('workOrderPayment', rowId)}>Record payment</button>
                            )}
                          </>
                        )}
                        {module === 'estimates' && (
                          <>
                            {row.status === 'Draft' || row.status === 'Sent' ? (
                              <button className="ops-row-action" onClick={() => onEstimateApprove(rowId)}>Approve</button>
                            ) : row.status === 'Approved' ? (
                              <button className="ops-row-action" onClick={() => onEstimateConvert(rowId)}>Create project</button>
                            ) : '—'}
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="ops-empty">
            <span><Search size={18} /></span>
            <strong>{search ? 'No matching records' : 'No records entered yet'}</strong>
            <p>{search ? 'Try a different search.' : 'Use the action above to add the first record.'}</p>
          </div>
        )}
      </div>

      <div className="ops-table-foot">
        <span>Financial values displayed in Pakistani rupees (PKR).</span>
        <span>{rows.length} total</span>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteIds && (
        <div className="ops-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !deleting) setConfirmDeleteIds(null) }}>
          <div className="ops-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-delete-title">
            <div className="ops-confirm-icon">
              <AlertTriangle size={24} />
            </div>
            <h3 id="confirm-delete-title">Delete {confirmDeleteIds.length} Record{confirmDeleteIds.length === 1 ? '' : 's'}?</h3>
            <p>
              Are you sure you want to permanently delete {confirmDeleteIds.length === 1 ? 'this record' : `these ${confirmDeleteIds.length} records`} from the <strong>{labels[module]?.title || module}</strong> module? Linked records and audit history will be updated accordingly. This operation cannot be reversed.
            </p>
            <div className="ops-confirm-actions">
              <button type="button" className="ops-outline-button" onClick={() => setConfirmDeleteIds(null)} disabled={deleting}>
                Cancel
              </button>
              <button type="button" className="ops-red-button" onClick={handleDeleteConfirm} disabled={deleting}>
                {deleting ? 'Deleting…' : <><Trash2 size={14} /> Delete Record{confirmDeleteIds.length === 1 ? '' : 's'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function renderValue(key: string, value: unknown, row: Entry) {
  if (key === 'status' || key === 'stage') return <span className={`ops-status ops-status-${String(value).toLowerCase().replaceAll(/[^a-z]+/g, '-')}`}><i />{text(value)}</span>
  if (key === 'source') return <span className="ops-action-chip" style={{ background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}>{text(value)}</span>
  if (['value','amount','contract_amount','base_salary','gross_salary','net_salary','tax_deduction','loan_deduction','overtime_amount','housing_allowance','purchase_cost','paid_amount','grand_total','subtotal','discount_amount','tax_amount','amount_paid'].includes(key)) return <strong className="ops-money">{pkr(value)}</strong>
  if (key === 'scope' || key === 'description' || key === 'subject') return <span className="ops-wrap-cell" title={text(value)}>{text(value)}</span>
  if (key === 'full_name' || key === 'name' || key === 'company_name') return <span className="ops-primary-cell">{text(value)}{Boolean(row.job_title) && key === 'full_name' && <small>{text(row.job_title)}</small>}</span>
  return text(value)
}

function ProfitLoss({ finance, period, setPeriod, year, setYear, periodMode, setPeriodMode }: { finance: Finance | null; period: string; setPeriod: (value: string) => void; year: string; setYear: (value: string) => void; periodMode: 'month' | 'year'; setPeriodMode: (value: 'month' | 'year') => void }) {
  if (!finance) return <div className="ops-empty">Waiting for financial data…</div>
  const lines: [string, number, string][] = [
    ['INCOME', finance.revenue, 'positive'], ['Client invoices billed (before tax)', finance.revenue, 'indent'],
    ['PROJECT & DIRECT COSTS', -finance.projectExpenses, 'negative'], ['Project materials, labor & direct costs', -finance.projectExpenses, 'indent'],
    ['GENERAL & OFFICE COSTS', -finance.generalExpenses, 'negative'], ['Office and company operations', -finance.generalExpenses, 'indent'],
    ['PAYROLL & EMPLOYER COST', -finance.payrollCost, 'negative'], ['Gross salaries + employer contributions', -finance.payrollCost, 'indent'],
    ['SUBCONTRACTOR PAYMENTS', -finance.vendorPayments, 'negative'], ['Sublet work orders paid in period', -finance.vendorPayments, 'indent'],
    ['ASSET DEPRECIATION', -finance.depreciation, 'negative'], ['Straight-line depreciation', -finance.depreciation, 'indent'],
  ]
  return <>
    <div className="ops-period-strip ops-finance-filters"><CalendarDays size={15} /><div className="ops-segmented"><button className={periodMode === 'month' ? 'selected' : ''} onClick={() => setPeriodMode('month')}>Monthly</button><button className={periodMode === 'year' ? 'selected' : ''} onClick={() => setPeriodMode('year')}>Yearly</button></div>{periodMode === 'month' ? <input aria-label="P&L month" type="month" value={period} onChange={(event) => setPeriod(event.target.value)} /> : <select aria-label="P&L year" value={year} onChange={(event) => setYear(event.target.value)}>{Array.from({ length: 8 }, (_, index) => String(currentYearNumber - index)).map((value) => <option key={value}>{value}</option>)}</select>}<span>{finance.period.from} — {finance.period.to}</span></div>
    <section className="ops-metric-grid ops-finance-metrics"><MoneyMetric label="INVOICED REVENUE" value={finance.revenue} icon={ArrowUpRight} /><MoneyMetric label="CASH COLLECTED" value={finance.cashCollected} icon={Banknote} /><MoneyMetric label="OPERATING EXPENSES" value={finance.totalOperatingExpenses} icon={ArrowDownRight} /><MoneyMetric label="ACCOUNTS RECEIVABLE" value={finance.receivables} icon={Receipt} /></section>
    <div className="ops-finance-grid"><section className="ops-panel ops-income-statement"><div className="ops-panel-head"><div><span className="ops-section-label">PKR · EXCLUDING OUTPUT TAX FROM PROFIT</span><h2>Income statement</h2></div><span className="ops-period-badge">{periodMode === 'month' ? period : year}</span></div><div className="ops-statement-lines">{lines.map(([label, amount, kind], index) => <div key={`${label}-${index}`} className={`ops-statement-line statement-${kind}`}><span>{label}</span><strong>{kind === 'indent' ? (amount < 0 ? `(${pkr(Math.abs(amount))})` : pkr(amount)) : index === 0 || kind === 'negative' ? '' : ''}</strong></div>)}<div className={`ops-statement-result ${finance.profitOrLoss < 0 ? 'result-loss' : 'result-profit'}`}><span>NET PROFIT / (LOSS)</span><strong>{pkr(finance.profitOrLoss)}</strong></div></div><div className="ops-panel-note">Payroll is recognized at gross salary plus employer contributions. Revenue excludes sales tax. Asset cost is depreciated across useful life.</div></section>
      <section className="ops-panel ops-tax-panel"><div className="ops-panel-head"><div><span className="ops-section-label">CASH & TAX CONTROL</span><h2>Reconciliation</h2></div><ShieldCheck size={16} /></div><div className="ops-reconcile-list"><div><span>Expense cash paid</span><strong>{pkr(finance.cashExpensePayments)}</strong></div><div><span>Project expense tax</span><strong>{pkr(finance.inputTax)}</strong></div><div><span>Invoice tax billed</span><strong>{pkr(finance.outputTax)}</strong></div><div><span>Net cash movement¹</span><strong className={finance.cashNet < 0 ? 'loss-text' : 'profit-text'}>{pkr(finance.cashNet)}</strong></div><div><span>Payroll paid out</span><strong>{pkr(finance.payrollPaid)}</strong></div></div><p className="ops-footnote">¹ Collected invoice cash minus expense payments, paid payroll, and vendor payments. Tax is shown for reconciliation and excluded from operating profit.</p></section></div>
    <section className="ops-panel ops-report-table"><div className="ops-panel-head"><div><span className="ops-section-label">JOB COST REVIEW</span><h2>Project profitability</h2></div><span className="ops-action-chip">{finance.projectProfitability.length} projects</span></div><DataTable rows={finance.projectProfitability} columns={[['project_code','CODE'],['name','PROJECT'],['contract_amount','CONTRACT'],['billed','BILLED THIS PERIOD'],['project_expenses','JOB COSTS'],['subcontract_paid','SUBLET PAID']]} /></section>
    <section className="ops-panel ops-report-table"><div className="ops-panel-head"><div><span className="ops-section-label">COST BREAKDOWN</span><h2>Expense by module & category</h2></div></div><DataTable rows={finance.expenseByCategory} columns={[['expense_type','LEDGER'],['category','CATEGORY'],['amount','NET AMOUNT'],['tax','TAX']]}/>{finance.billedInPeriod.length > 0 && <div className="ops-report-billed"><strong>Invoices billed in this period</strong><span>{finance.billedInPeriod.length} invoice records included in recognized revenue.</span></div>}</section>
  </>
}

function MoneyMetric({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return <article className="ops-metric"><div className="ops-metric-head"><span>{label}</span><i className="ops-metric-icon metric-red"><Icon size={16} /></i></div><strong>{pkr(value)}</strong><small>Selected report period</small></article>
}

function DataTable({ rows, columns }: { rows: Entry[]; columns: [string, string][] }) {
  return (
    <div className="ops-table-wrap">
      <table className="ops-table">
        <thead><tr>{columns.map(([key, heading]) => <th key={key}>{heading}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={String(row.id ?? `${row.project_code}-${row.category}-${index}`)}>
              {columns.map(([key]) => <td key={key}>{renderValue(key, row[key], row)}</td>)}
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={columns.length}><div className="ops-inline-empty">No transactions in this period yet.</div></td></tr>}
        </tbody>
      </table>
    </div>
  )
}

function EntryDialog({ target, selectedId, data, onClose, onSaved }: { target: EntryModule | 'payroll' | 'employeeLoan' | 'assetMaintenance' | 'invoiceAudit' | 'invoicePayment' | 'workOrderPayment' | 'expensePayment'; selectedId: number | null; data: Bootstrap; onClose: () => void; onSaved: (message: string) => Promise<void> }) {
  const documentModule = target === 'estimates' || target === 'invoices'
  const isPayment = target === 'invoicePayment' || target === 'workOrderPayment' || target === 'expensePayment'
  const isInvoiceAudit = target === 'invoiceAudit'
  const isEdit = Boolean(selectedId && !isPayment && !isInvoiceAudit && target !== 'assetMaintenance')

  const existingRecord = useMemo(() => {
    if (!isEdit || !selectedId) return null
    if (target === 'payroll') return data.payroll.find((r) => Number(r.id) === selectedId)
    if (target === 'employeeLoan') return data.employeeLoans.find((r) => Number(r.id) === selectedId)
    if (target === 'leads') return data.leads.find((r) => Number(r.id) === selectedId)
    if (target === 'projects') return data.projects.find((r) => Number(r.id) === selectedId)
    if (target === 'employees') return data.employees.find((r) => Number(r.id) === selectedId)
    if (target === 'assets') return data.assets.find((r) => Number(r.id) === selectedId)
    if (target === 'vendors') return data.vendors.find((r) => Number(r.id) === selectedId)
    if (target === 'workOrders') return data.workOrders.find((r) => Number(r.id) === selectedId)
    if (target === 'projectExpenses' || target === 'officeExpenses') return data.expenses.find((r) => Number(r.id) === selectedId)
    if (target === 'estimates' || target === 'invoices') return data.documents.find((r) => Number(r.id) === selectedId)
    return null
  }, [isEdit, selectedId, target, data])

  const [values, setValues] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {
      issue_date: todayISO(),
      expense_date: todayISO(),
      start_date: todayISO(),
      purchase_date: todayISO(),
      pay_period: currentPeriod(),
      paid_date: todayISO(),
      payment_date: todayISO(),
      audit_date: todayISO(),
      status: target === 'projects' ? 'Planning' : target === 'employees' || target === 'vendors' ? 'Active' : target === 'assets' ? 'Good' : target === 'workOrders' ? 'Issued' : target === 'projectExpenses' || target === 'officeExpenses' ? 'Paid' : 'Draft',
      audit_status: 'Pending',
      billing_stage: 'Progress',
      tax_rate: '0',
      overtime_multiplier: '1.5',
      unit: 'Each',
    }
    if (existingRecord) {
      for (const [k, v] of Object.entries(existingRecord)) {
        if (v !== null && v !== undefined) defaults[k] = String(v)
      }
    }
    return defaults
  })

  const [lines, setLines] = useState<LineItem[]>([blankLine()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!documentModule || !isEdit || !selectedId) return
    let active = true
    api<{ document: Entry; lines: any[] }>(`/documents/${selectedId}`).then((res) => {
      if (!active) return
      if (res && Array.isArray(res.lines) && res.lines.length > 0) {
        setLines(res.lines.map((l) => ({
          item: String(l.item || ''),
          description: String(l.description || ''),
          length: l.length ? String(l.length) : '',
          width: l.width ? String(l.width) : '',
          height: l.height ? String(l.height) : '',
          quantity: l.quantity ? String(l.quantity) : '1',
          nos: l.nos ? String(l.nos) : '1',
          unit: String(l.unit || 'Each'),
          rate: l.rate ? String(l.rate) : '',
          taxRate: l.taxRate ? String(l.taxRate) : '0',
        })))
      }
    }).catch(() => {})
    return () => { active = false }
  }, [documentModule, isEdit, selectedId])

  const fields: Field[] = target === 'payroll' ? [
    { key: 'employee_id', label: 'Employee', kind: 'select', required: true, options: data.employees.filter((employee) => employee.status === 'Active').map((employee) => ({ value: String(employee.id), label: `${text(employee.employee_code)} · ${text(employee.full_name)}` })) },
    { key: 'pay_period', label: 'Pay period', kind: 'month' as Field['kind'] },
    { key: 'overtime_hours', label: 'Overtime hours', kind: 'number', min: 0, step: .25 },
    { key: 'loan_deduction', label: 'Loan repayment this month (PKR)', kind: 'number', min: 0, step: .01 },
    { key: 'other_deduction', label: 'Other deduction (PKR)', kind: 'number', min: 0, step: .01 },
  ] : target === 'employeeLoan' ? [
    { key: 'employee_id', label: 'Employee receiving the loan', kind: 'select', required: true, options: data.employees.map((employee) => ({ value: String(employee.id), label: `${text(employee.employee_code)} · ${text(employee.full_name)}` })) },
    { key: 'issue_date', label: 'Issue date', kind: 'date', required: true }, { key: 'principal', label: 'Loan principal (PKR)', kind: 'number', min: .01, step: .01, required: true }, { key: 'notes', label: 'Reason / repayment agreement', kind: 'textarea' },
  ] : target === 'assetMaintenance' ? [
    { key: 'service_date', label: 'Service date', kind: 'date', required: true }, { key: 'description', label: 'Work completed / parts replaced', required: true },
    { key: 'vendor_id', label: 'Service provider', kind: 'select', options: [{ value: '', label: 'Internal / not linked to vendor' }, ...data.vendors.map((vendor) => ({ value: String(vendor.id), label: `${text(vendor.vendor_code)} · ${text(vendor.company_name)}` }))] },
    { key: 'amount', label: 'Service cost (PKR)', kind: 'number', min: 0, step: .01 }, { key: 'next_service_date', label: 'Next service due', kind: 'date' },
    { key: 'reference_number', label: 'Invoice / service reference' }, { key: 'notes', label: 'Service notes', kind: 'textarea' },
  ] : isInvoiceAudit ? [
    { key: 'audit_status', label: 'Audit outcome', kind: 'select', required: true, options: ['Pending', 'Passed', 'Failed'].map((value) => ({ value, label: value })) },
    { key: 'audited_by', label: 'Auditor / approver', required: values.audit_status === 'Passed' }, { key: 'audit_date', label: 'Audit date', kind: 'date', required: values.audit_status === 'Passed' },
    { key: 'audit_notes', label: 'Measured quantities, variation, and audit findings', kind: 'textarea' },
  ] : isPayment ? [
    { key: 'payment_date', label: 'Payment date', kind: 'date', required: true }, { key: 'amount', label: 'Payment amount (PKR)', kind: 'number', min: .01, step: .01, required: true },
    { key: 'payment_method', label: 'Payment method', kind: 'select', options: ['Bank transfer', 'Cheque', 'Cash', 'Mobile wallet'].map((value) => ({ value, label: value })) }, { key: 'reference_number', label: 'Transaction / cheque reference' }, { key: 'notes', label: 'Payment notes' },
  ] : entryFields(target as EntryModule, data)

  const selectedEmployee = data.employees.find((employee) => String(employee.id) === values.employee_id)
  const payrollGross = selectedEmployee ? Number(selectedEmployee.base_salary || 0) + Number(selectedEmployee.housing_allowance || 0) + Number(selectedEmployee.transport_allowance || 0) + Number(selectedEmployee.other_allowance || 0) + Number(selectedEmployee.monthly_bonus || 0) + (Number(values.overtime_hours || 0) * Number(selectedEmployee.base_salary || 0) / 208 * Number(selectedEmployee.overtime_multiplier || 1.5)) : 0
  const documentSubtotal = lines.reduce((sum, line) => sum + ((Number(line.length) > 0 || Number(line.width) > 0 || Number(line.height) > 0 ? (Number(line.length) || 1) * (Number(line.width) || 1) * (Number(line.height) || 1) : 1) * Number(line.quantity || 0) * Number(line.nos || 0) * Number(line.rate || 0)), 0)
  const documentTax = lines.reduce((sum, line) => sum + ((Number(line.length) > 0 || Number(line.width) > 0 || Number(line.height) > 0 ? (Number(line.length) || 1) * (Number(line.width) || 1) * (Number(line.height) || 1) : 1) * Number(line.quantity || 0) * Number(line.nos || 0) * Number(line.rate || 0) * Number(line.taxRate || 0) / 100), 0)
  const discount = Math.min(Number(values.discount_amount || 0), documentSubtotal)
  const previewTotal = Math.max(0, documentSubtotal - discount) + Math.max(0, documentTax - documentTax * (documentSubtotal ? discount / documentSubtotal : 0))

  const setField = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }))
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (isEdit) {
        if (target === 'payroll') {
          await api(`/payroll/${selectedId}`, { method: 'PUT', body: JSON.stringify({ ...values, employee_id: Number(values.employee_id), overtime_hours: Number(values.overtime_hours || 0), loan_deduction: Number(values.loan_deduction || 0), other_deduction: Number(values.other_deduction || 0) }) })
          await onSaved('Payroll record updated.')
        } else if (target === 'employeeLoan') {
          await api(`/loans/${selectedId}`, { method: 'PUT', body: JSON.stringify({ ...values, principal: Number(values.principal) }) })
          await onSaved('Employee loan record updated.')
        } else {
          const route = apiRoute(target as EntryModule)
          await api(`/${route}/${selectedId}`, {
            method: 'PUT',
            body: JSON.stringify(modulePayload(target as EntryModule, values, documentModule ? lines : undefined)),
          })
          await onSaved(`${labels[target as EntryModule]?.title.replace(/s$/, '') || 'Record'} updated successfully.`)
        }
      } else if (target === 'payroll') {
        await api('/payroll', { method: 'POST', body: JSON.stringify({ ...values, employee_id: Number(values.employee_id), overtime_hours: Number(values.overtime_hours || 0), loan_deduction: Number(values.loan_deduction || 0), other_deduction: Number(values.other_deduction || 0) }) })
        await onSaved('Payroll calculated and saved. Check gross and net before marking paid.')
      } else if (target === 'employeeLoan') {
        await api(`/employees/${values.employee_id}/loans`, { method: 'POST', body: JSON.stringify({ ...values, principal: Number(values.principal) }) })
        await onSaved('Employee loan recorded. Future payroll can deduct repayments.')
      } else if (target === 'assetMaintenance') {
        await api(`/assets/${selectedId}/maintenance`, { method: 'POST', body: JSON.stringify({ ...values, vendor_id: values.vendor_id ? Number(values.vendor_id) : null, amount: Number(values.amount || 0) }) })
        await onSaved('Asset maintenance history saved.')
      } else if (isInvoiceAudit) {
        await api(`/documents/${selectedId}/audit`, { method: 'PATCH', body: JSON.stringify(values) })
        await onSaved('Invoice audit record updated.')
      } else if (isPayment) {
        const paymentPath = target === 'invoicePayment' ? `/documents/${selectedId}/payments` : target === 'workOrderPayment' ? `/work-orders/${selectedId}/payments` : `/expenses/${selectedId}/payments`
        await api(paymentPath, { method: 'POST', body: JSON.stringify({ ...values, amount: Number(values.amount) }) })
        await onSaved('Payment recorded in the transaction ledger.')
      } else {
        const result = await api(`/` + apiRoute(target as EntryModule), { method: 'POST', body: JSON.stringify(modulePayload(target as EntryModule, values, documentModule ? lines : undefined)) })
        if (target === 'estimates' && result && typeof result === 'object' && 'document_number' in result) await onSaved('Detailed estimate saved.')
        else await onSaved(`${labels[target as EntryModule]?.title.replace(/s$/, '') || 'Record'} saved to SQLite.`)
      }
    } catch (problem) { setError(message(problem)); setSaving(false) }
  }

  const targetLabel = target === 'payroll' ? 'Payroll' : target === 'employeeLoan' ? 'Employee loan' : (labels[target as EntryModule]?.title.replace(/s$/, '') || target)
  const title = isEdit
    ? `Edit ${targetLabel.toLowerCase()}`
    : target === 'payroll'
      ? 'Run monthly payroll'
      : target === 'employeeLoan'
        ? 'Issue employee loan'
        : target === 'assetMaintenance'
          ? 'Log asset maintenance'
          : isInvoiceAudit
            ? 'Record final billing audit'
            : isPayment
              ? target === 'invoicePayment'
                ? 'Record client payment'
                : target === 'workOrderPayment'
                  ? 'Record subcontractor payment'
                  : 'Record expense settlement'
              : `New ${labels[target as EntryModule]?.title.replace(/s$/, '').toLowerCase() || 'record'}`

  return (
    <div className="ops-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className={`ops-modal ${documentModule ? 'ops-modal-document' : ''}`} role="dialog" aria-modal="true" aria-labelledby="entry-dialog-title">
        <header className="ops-modal-head">
          <span className="ops-modal-icon">
            {documentModule ? <FileSpreadsheet size={18} /> : target === 'payroll' ? <Banknote size={18} /> : isPayment ? <Receipt size={18} /> : isEdit ? <Pencil size={18} /> : <Plus size={18} />}
          </span>
          <button type="button" className="ops-icon-button" aria-label="Close form" onClick={onClose}><X size={18} /></button>
          <span className="ops-section-label">REVOXEN ASSOCIATES · PKR</span>
          <h2 id="entry-dialog-title">{title}</h2>
          <p>{documentModule ? 'Add every measured item, set each unit and tax rate, then verify the calculated total.' : isPayment ? 'Add a dated payment entry; the remaining balance will be recalculated automatically.' : isEdit ? 'Update existing operational details and commit changes to SQLite.' : 'Enter the operational details. Monetary values are stored as PKR.'}</p>
        </header>
        <form className="ops-form" onSubmit={submit}>
          <div className="ops-form-grid">
            {fields.map((field) => (
              <FormField key={field.key} field={field} value={values[field.key] ?? ''} onChange={(value) => setField(field.key, value)} />
            ))}
          </div>
          {documentModule && (
            <>
              <div className="ops-line-items-head">
                <div><span className="ops-section-label">ITEMIZED SCOPE</span><h3>Estimate / invoice lines</h3></div>
                <button type="button" className="ops-outline-button" onClick={() => setLines((current) => [...current, blankLine()])}><Plus size={14} />Add line</button>
              </div>
              <div className="ops-line-scroll">
                <table className="ops-line-table">
                  <thead>
                    <tr><th>ITEM / SCOPE</th><th>LENGTH</th><th>WIDTH</th><th>HEIGHT</th><th>QTY</th><th>NOS</th><th>UNIT</th><th>RATE · PKR</th><th>TAX %</th><th>LINE TOTAL</th><th /></tr>
                  </thead>
                  <tbody>
                    {lines.map((line, index) => {
                      const measured = Number(line.length) > 0 || Number(line.width) > 0 || Number(line.height) > 0
                        ? (Number(line.length) || 1) * (Number(line.width) || 1) * (Number(line.height) || 1)
                        : 1
                      const lineTotal = measured * Number(line.quantity || 0) * Number(line.nos || 0) * Number(line.rate || 0)
                      return (
                        <Fragment key={`line-group-${index}`}>
                          <tr key={`line-${index}`}>
                            {(['item','length','width','height','quantity','nos','unit','rate','taxRate'] as const).map((key) => (
                              <td key={key}>
                                <input
                                  aria-label={`${index === 0 ? 'First' : `Line ${index + 1}`} ${key}`}
                                  required={key === 'item' || key === 'rate'}
                                  type={['length','width','height','quantity','nos','rate','taxRate'].includes(key) ? 'number' : 'text'}
                                  min="0"
                                  step="any"
                                  value={line[key]}
                                  onChange={(event) => setLines((current) => current.map((currentLine, lineIndex) => lineIndex === index ? { ...currentLine, [key]: event.target.value } : currentLine))}
                                  placeholder={key === 'unit' ? 'Each' : key === 'quantity' || key === 'nos' ? '1' : key === 'taxRate' ? '0' : ''}
                                />
                              </td>
                            ))}
                            <td><strong>{pkr(lineTotal)}</strong></td>
                            <td>
                              <button
                                className="ops-remove-line"
                                aria-label="Remove line"
                                type="button"
                                disabled={lines.length === 1}
                                onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))}
                              >
                                <X size={14} />
                              </button>
                            </td>
                          </tr>
                          <tr key={`description-${index}`} className="ops-line-description">
                            <td colSpan={11}>
                              <input
                                aria-label={`Line ${index + 1} description`}
                                placeholder="Describe material, finish, grade, dimensions or labor scope…"
                                value={line.description}
                                onChange={(event) => setLines((current) => current.map((currentLine, lineIndex) => lineIndex === index ? { ...currentLine, description: event.target.value } : currentLine))}
                              />
                            </td>
                          </tr>
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="ops-total-preview">
                <span><small>SUBTOTAL</small><strong>{pkr(documentSubtotal)}</strong></span>
                <span><small>DISCOUNT</small><strong>− {pkr(discount)}</strong></span>
                <span><small>LINE TAX</small><strong>{pkr(documentTax - documentTax * (documentSubtotal ? discount / documentSubtotal : 0))}</strong></span>
                <span><small>GRAND TOTAL</small><strong>{pkr(previewTotal)}</strong></span>
              </div>
            </>
          )}
          {target === 'payroll' && selectedEmployee && (
            <div className="ops-payroll-preview">
              <span>ESTIMATED GROSS PAY <strong>{pkr(payrollGross)}</strong></span>
              <small>Final gross and deductions will be calculated by the payroll service before saving.</small>
            </div>
          )}
          {error && <div className="ops-form-error">{error}</div>}
          <div className="ops-modal-actions">
            <button type="button" className="ops-outline-button" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="ops-red-button" disabled={saving}>
              {saving ? (isEdit ? 'Updating…' : 'Saving…') : <><Check size={15} />{isEdit ? 'Update record' : 'Save to company database'}</>}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function FormField({ field, value, onChange }: { field: Field; value: string; onChange: (value: string) => void }) {
  const className = `ops-field ${field.kind === 'textarea' ? 'field-full' : ''}`
  return <label className={className}><span>{field.label}{field.required && <i> *</i>}</span>{field.kind === 'textarea' ? <textarea required={field.required} value={value} onChange={(event) => onChange(event.target.value)} rows={2} /> : field.kind === 'select' ? <select required={field.required} value={value} onChange={(event) => onChange(event.target.value)}><option value="">Choose…</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input required={field.required} type={field.kind === 'month' ? 'month' : field.kind ?? 'text'} min={field.min} max={field.max} step={field.step} value={value} onChange={(event) => onChange(event.target.value)} />}{field.hint && <small>{field.hint}</small>}</label>
}

function apiRoute(module: string): string {
  const routes: Record<string, string> = {
    leads: 'leads',
    projects: 'projects',
    employees: 'employees',
    payroll: 'payroll',
    loans: 'loans',
    employeeLoan: 'loans',
    assets: 'assets',
    vendors: 'vendors',
    workOrders: 'work-orders',
    projectExpenses: 'expenses',
    officeExpenses: 'expenses',
    estimates: 'documents',
    invoices: 'documents',
  }
  return routes[module] || module
}

function message(error: unknown) { return error instanceof Error ? error.message : 'The operation could not be completed.' }

export default OperationsApp