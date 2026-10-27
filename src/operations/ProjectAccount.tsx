import { useState, type FormEvent } from 'react'
import { Banknote, CalendarDays, Check, ChevronRight, CircleDollarSign, FileCheck2, Plus, RefreshCw, Search, ShieldCheck, X } from 'lucide-react'

type Row = Record<string, unknown>
type BudgetLine = { category: string; description: string; amount: string }
type Account = {
  project: Row
  budgetHistory: (Row & { lines: Row[] })[]
  currentBudget: Row | null
  expenses: (Row & { payments?: Row[] })[]
  workOrders: (Row & { payments?: Row[] })[]
  invoices: (Row & { payments?: Row[] })[]
  cashLedger: Row[]
  totals: { approvedBudget: number; directExpenses: number; subcontractCommitments: number; committedCost: number; paidCost: number; unpaidCost: number; availableBudget: number; invoiced: number; received: number; receivable: number }
}

const expenseCategories = ['Materials', 'Site labor', 'Equipment rental', 'Transport', 'Fuel', 'Permit & fees', 'Utilities', 'Maintenance', 'Professional fees', 'Other']
const blankBudgetLine = (): BudgetLine => ({ category: 'Materials', description: '', amount: '' })
const today = () => new Date().toISOString().slice(0, 10)
const money = (value: unknown) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(Number(value) || 0)
const value = (input: unknown) => input === null || input === undefined || input === '' ? '—' : String(input)

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
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`)
  return result
}

export default function ProjectAccount({ canEdit, canEditExpenses, canAudit, onNotify }: { canEdit: boolean; canEditExpenses: boolean; canAudit: boolean; onNotify: (message: string) => void }) {
  const [reference, setReference] = useState('')
  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [budgetOpen, setBudgetOpen] = useState(false)
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([blankBudgetLine()])
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [expenseValues, setExpenseValues] = useState({ expense_number: '', category: 'Materials', description: '', expense_date: today(), amount: '', tax_amount: '0', vendor_id: '', notes: '' })
  const [paymentExpense, setPaymentExpense] = useState<Row | null>(null)
  const [paymentValues, setPaymentValues] = useState({ payment_date: today(), amount: '', payment_method: 'Bank transfer', reference_number: '', notes: '' })
  const [auditBudget, setAuditBudget] = useState<Row | null>(null)
  const [auditDecision, setAuditDecision] = useState<'Approved' | 'Rejected'>('Approved')
  const [auditValues, setAuditValues] = useState({ audit_date: today(), audit_notes: '' })
  const [saving, setSaving] = useState(false)

  const openAccount = async (event?: FormEvent<HTMLFormElement>, target = reference) => {
    event?.preventDefault()
    if (!target.trim()) { setError('Enter a project ID or project code.'); return }
    setLoading(true)
    setError('')
    try {
      const result = await api<Account>(`/project-accounts/${encodeURIComponent(target.trim())}`)
      setAccount(result)
      setReference(String(result.project.project_code))
    } catch (problem) {
      setAccount(null)
      setError(problem instanceof Error ? problem.message : 'Could not open the project account.')
    } finally { setLoading(false) }
  }

  const reload = () => openAccount(undefined, String(account?.project.id ?? reference))
  const addBudgetLine = () => setBudgetLines((lines) => [...lines, blankBudgetLine()])
  const updateBudgetLine = (index: number, key: keyof BudgetLine, next: string) => setBudgetLines((lines) => lines.map((line, position) => position === index ? { ...line, [key]: next } : line))
  const budgetTotal = budgetLines.reduce((total, line) => total + (Number(line.amount) || 0), 0)

  const saveBudget = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!account) return
    setSaving(true)
    setError('')
    try {
      await api(`/projects/${account.project.id}/budgets`, { method: 'POST', body: JSON.stringify({ lines: budgetLines.map((line) => ({ ...line, amount: Number(line.amount) || 0 })) }) })
      setBudgetOpen(false)
      setBudgetLines([blankBudgetLine()])
      await reload()
      onNotify('Budget revision saved as a draft.')
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'Could not save budget.') }
    finally { setSaving(false) }
  }

  const submitBudget = async (id: number) => {
    setError('')
    try {
      await api(`/project-budgets/${id}/submit`, { method: 'PATCH', body: JSON.stringify({}) })
      await reload()
      onNotify('Budget sent to the administrator for audit.')
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'Could not submit budget.') }
  }

  const saveAudit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!auditBudget) return
    setSaving(true)
    setError('')
    try {
      await api(`/project-budgets/${auditBudget.id}/audit`, { method: 'PATCH', body: JSON.stringify({ decision: auditDecision, ...auditValues }) })
      setAuditBudget(null)
      await reload()
      onNotify(`Budget ${auditDecision.toLowerCase()} after audit.`)
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'Could not record audit decision.') }
    finally { setSaving(false) }
  }

  const saveExpense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!account) return
    setSaving(true)
    setError('')
    try {
      await api('/expenses', { method: 'POST', body: JSON.stringify({ ...expenseValues, expense_type: 'Project', project_id: Number(account.project.id), vendor_id: expenseValues.vendor_id ? Number(expenseValues.vendor_id) : null, amount: Number(expenseValues.amount), tax_amount: Number(expenseValues.tax_amount) || 0, status: 'Unpaid' }) })
      setExpenseOpen(false)
      setExpenseValues({ expense_number: '', category: 'Materials', description: '', expense_date: today(), amount: '', tax_amount: '0', vendor_id: '', notes: '' })
      await reload()
      onNotify('Project cost posted. Record its settlement from the account ledger.')
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'Could not post project expense.') }
    finally { setSaving(false) }
  }

  const savePayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!paymentExpense) return
    setSaving(true)
    setError('')
    try {
      await api(`/expenses/${paymentExpense.id}/payments`, { method: 'POST', body: JSON.stringify({ ...paymentValues, amount: Number(paymentValues.amount) }) })
      setPaymentExpense(null)
      await reload()
      onNotify('Payment recorded in the project ledger.')
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'Could not record payment.') }
    finally { setSaving(false) }
  }

  const totalCards = account ? [
    { label: 'AUDITED FINAL BUDGET', amount: account.totals.approvedBudget, icon: FileCheck2, tone: 'red' },
    { label: 'COST COMMITTED', amount: account.totals.committedCost, icon: CircleDollarSign, tone: 'dark' },
    { label: 'COST PAID', amount: account.totals.paidCost, icon: Banknote, tone: 'green' },
    { label: 'BUDGET AVAILABLE', amount: account.totals.availableBudget, icon: ShieldCheck, tone: account.totals.availableBudget < 0 ? 'red' : 'gray' },
    { label: 'CLIENT INVOICED', amount: account.totals.invoiced, icon: FileCheck2, tone: 'gray' },
    { label: 'CLIENT RECEIVABLE', amount: account.totals.receivable, icon: CalendarDays, tone: 'dark' },
  ] : []

  return <div className="project-account">
    <section className="ops-panel project-lookup"><div className="project-lookup-copy"><span className="ops-section-label">PROJECT SUBLEDGER</span><h2>Open a project account</h2><p>Enter the database project ID or the project code.</p></div><form className="project-lookup-form" onSubmit={(event) => void openAccount(event)}><label><Search size={15} /><input aria-label="Project ID or code" placeholder="e.g. 12 or RX-0012" value={reference} onChange={(event) => setReference(event.target.value)} /></label><button className="ops-red-button" disabled={loading}><ChevronRight size={15} />{loading ? 'Opening…' : 'Open account'}</button></form></section>
    {error && !budgetOpen && !expenseOpen && !paymentExpense && !auditBudget && <div className="ops-error"><span><X size={15} />{error}</span><button onClick={() => setError('')}>Dismiss</button></div>}
    {!account && <section className="ops-empty project-account-empty"><CircleDollarSign size={22} /><span>Project account ledger</span><small>Open a project to review its final budget, costs, settlements, and client receipts.</small></section>}
    {account && <>
      <section className="project-account-heading"><div><span className="ops-section-label">{value(account.project.project_code)} · ACCOUNT #{value(account.project.id)}</span><h2>{value(account.project.name)}</h2><p>{value(account.project.client)}{account.project.site_address ? ` · ${value(account.project.site_address)}` : ''}</p></div><div className="project-account-heading-actions"><button className="ops-outline-button" onClick={() => void reload()} aria-label="Refresh project account"><RefreshCw size={14} />Refresh</button>{canEdit && <button className="ops-outline-button" onClick={() => { setBudgetLines([blankBudgetLine()]); setBudgetOpen(true); setError('') }}><Plus size={14} />Budget revision</button>}{canEditExpenses && <button className="ops-red-button" onClick={() => { setExpenseOpen(true); setError('') }}><Plus size={14} />Post expense</button>}</div></section>
      <section className="ops-metric-grid project-account-metrics">{totalCards.map(({ label, amount, icon: Icon, tone }) => <article className="ops-metric" key={label}><div className="ops-metric-head"><span>{label}</span><i className={`ops-metric-icon metric-${tone}`}><Icon size={15} /></i></div><strong className={label === 'BUDGET AVAILABLE' && amount < 0 ? 'project-over-budget' : ''}>{money(amount)}</strong><small>{label === 'COST COMMITTED' ? 'Booked expenses + subcontract award' : label === 'COST PAID' ? 'Expense and subcontract settlements' : label === 'BUDGET AVAILABLE' ? 'Final budget less committed costs' : label === 'CLIENT RECEIVABLE' ? 'Invoices less recorded receipts' : label === 'CLIENT INVOICED' ? 'Sent and approved invoices' : account.currentBudget ? `Revision ${value(account.currentBudget.version)} · audited ${value(account.currentBudget.audit_date)}` : 'No approved budget yet'}</small></article>)}</section>

      <section className="ops-panel project-budget-panel"><div className="ops-panel-head"><div><span className="ops-section-label">CONTROLLED BUDGET</span><h2>Budget revisions & audit trail</h2></div><span className={`ops-status ${account.currentBudget ? 'ops-status-approved' : 'ops-status-draft'}`}><i />{account.currentBudget ? `Final · Rev ${value(account.currentBudget.version)}` : 'No final budget'}</span></div>
        <div className="project-budget-history">{account.budgetHistory.length ? account.budgetHistory.map((budget) => <article className="project-budget-revision" key={String(budget.id)}><div className="project-budget-revision-head"><div><strong>Revision {value(budget.version)}</strong><small>{value(budget.created_by)} · {value(budget.created_at)}</small></div><span className={`ops-status ops-status-${String(budget.status).toLowerCase().replaceAll(/[^a-z]+/g, '-')}`}><i />{value(budget.status)}</span><b>{money(budget.total_amount)}</b></div><div className="project-budget-lines">{budget.lines.map((line) => <div key={String(line.id)}><span>{value(line.category)}<small>{value(line.description)}</small></span><strong>{money(line.amount)}</strong></div>)}</div>{budget.status === 'Approved' && <div className="project-audit-stamp"><ShieldCheck size={13} /> Audited by {value(budget.audited_by)} · {value(budget.audit_date)}{budget.audit_notes ? ` · ${value(budget.audit_notes)}` : ''}</div>}{canEdit && budget.status === 'Draft' ? <button className="ops-row-action" onClick={() => void submitBudget(Number(budget.id))}>Submit for audit</button> : null}{canAudit && budget.status === 'Pending audit' && <button className="ops-row-action" onClick={() => { setAuditBudget(budget); setAuditDecision('Approved'); setAuditValues({ audit_date: today(), audit_notes: '' }); setError('') }}>Review &amp; audit</button>}</article>) : <div className="project-ledger-empty">No budget revision yet. Create a draft, then submit it for an administrator audit.</div>}</div>
      </section>

      <section className="ops-panel project-ledger-panel"><div className="ops-panel-head"><div><span className="ops-section-label">DIRECT COST LEDGER</span><h2>Project expenses</h2></div><span className="ops-action-chip">{account.expenses.length} vouchers</span></div><div className="ops-table-wrap"><table className="ops-table project-ledger-table"><thead><tr><th>VOUCHER / DATE</th><th>CATEGORY &amp; DETAIL</th><th>VENDOR</th><th>BOOKED</th><th>PAID</th><th>BALANCE</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{account.expenses.map((expense) => { const gross = Number(expense.amount) + Number(expense.tax_amount); const balance = Math.max(0, gross - Number(expense.paid_amount)); return <tr key={String(expense.id)}><td><strong>{value(expense.expense_number)}</strong><small>{value(expense.expense_date)}</small></td><td>{value(expense.category)}<small>{value(expense.description)}</small></td><td>{value(expense.vendor_name)}</td><td>{money(gross)}</td><td>{money(expense.paid_amount)}</td><td>{money(balance)}</td><td><span className={`ops-status ops-status-${String(expense.status).toLowerCase().replaceAll(/[^a-z]+/g, '-')}`}><i />{value(expense.status)}</span></td><td>{canEditExpenses && balance > 0 && expense.status !== 'Void' ? <button className="ops-row-action" onClick={() => { setPaymentExpense(expense); setPaymentValues({ payment_date: today(), amount: String(balance), payment_method: 'Bank transfer', reference_number: '', notes: '' }); setError('') }}>Record payment</button> : '—'}</td></tr> })}</tbody></table>{!account.expenses.length && <div className="project-ledger-empty">No project costs have been posted.</div>}</div>
      </section>

      <div className="project-account-grid"><section className="ops-panel"><div className="ops-panel-head"><div><span className="ops-section-label">SUBCONTRACT COMMITMENTS</span><h2>Work orders</h2></div></div><div className="project-compact-list">{account.workOrders.map((order) => <div key={String(order.id)}><span><strong>{value(order.work_order_number)} · {value(order.vendor_name)}</strong><small>{value(order.scope)} · {value(order.status)}</small></span><b>{money(Number(order.amount) + Number(order.tax_amount))}<small>{money(order.paid_amount)} paid · {money(order.retention_amount)} retained</small></b></div>)}{!account.workOrders.length && <div className="project-ledger-empty">No subcontract commitments recorded.</div>}</div></section>
        <section className="ops-panel"><div className="ops-panel-head"><div><span className="ops-section-label">CLIENT ACCOUNT</span><h2>Invoices &amp; receipts</h2></div></div><div className="project-compact-list">{account.invoices.map((invoice) => <div key={String(invoice.id)}><span><strong>{value(invoice.document_number)} · {value(invoice.client_name)}</strong><small>{value(invoice.issue_date)} · {value(invoice.status)}</small></span><b>{money(invoice.grand_total)}<small>{money(invoice.amount_paid)} received</small></b></div>)}{!account.invoices.length && <div className="project-ledger-empty">No invoices linked to this project.</div>}</div></section></div>
      <section className="ops-panel project-cashbook"><div className="ops-panel-head"><div><span className="ops-section-label">CASH &amp; BANK CONTROL</span><h2>Project payment ledger</h2></div><span className="ops-action-chip">{account.cashLedger.length} transactions</span></div><div className="ops-table-wrap"><table className="ops-table project-ledger-table"><thead><tr><th>DATE</th><th>REFERENCE</th><th>TRANSACTION</th><th>METHOD</th><th>BANK / RECEIPT REF.</th><th>DIRECTION</th><th>AMOUNT</th></tr></thead><tbody>{account.cashLedger.map((entry, index) => <tr key={`${String(entry.reference)}-${String(entry.date)}-${index}`}><td>{value(entry.date)}</td><td>{value(entry.reference)}</td><td>{value(entry.type)}</td><td>{value(entry.payment_method)}</td><td>{value(entry.reference_number)}</td><td><span className={`project-cash-direction ${entry.direction === 'In' ? 'cash-in' : 'cash-out'}`}>{entry.direction === 'In' ? 'Money in' : 'Money out'}</span></td><td><strong className={entry.direction === 'In' ? 'project-money-in' : ''}>{money(entry.amount)}</strong></td></tr>)}</tbody></table>{!account.cashLedger.length && <div className="project-ledger-empty">No cash or bank transactions have been recorded for this project.</div>}</div></section>
      <p className="project-account-footnote"><ShieldCheck size={13} />Committed cost includes posted project expenses and gross subcontract awards, including retained amounts. Record subcontractor bills in work orders, not again as project expenses.</p>
    </>}

    {budgetOpen && <div className="ops-modal-backdrop"><section className="ops-modal project-account-modal" role="dialog" aria-modal="true" aria-labelledby="budget-title"><div className="ops-modal-head"><span className="ops-section-label">PROJECT #{value(account?.project.id)}</span><h2 id="budget-title">Create budget revision</h2><p>Enter the planned cost categories. The total becomes final only after an administrator audits and approves it.</p><button className="ops-icon-button" onClick={() => setBudgetOpen(false)} aria-label="Close"><X size={16} /></button></div><form className="ops-form" onSubmit={(event) => void saveBudget(event)}><div className="project-budget-entry">{budgetLines.map((line, index) => <div className="project-budget-entry-row" key={index}><label className="ops-field"><span>Category <i>*</i></span><select value={line.category} onChange={(event) => updateBudgetLine(index, 'category', event.target.value)}>{expenseCategories.map((category) => <option key={category}>{category}</option>)}</select></label><label className="ops-field"><span>Description</span><input value={line.description} onChange={(event) => updateBudgetLine(index, 'description', event.target.value)} /></label><label className="ops-field"><span>Budget (PKR) <i>*</i></span><input type="number" min="0" step="0.01" value={line.amount} onChange={(event) => updateBudgetLine(index, 'amount', event.target.value)} required /></label><button className="ops-icon-button" type="button" disabled={budgetLines.length === 1} onClick={() => setBudgetLines((items) => items.filter((_, position) => position !== index))} aria-label="Remove budget line"><X size={14} /></button></div>)}</div><button className="ops-outline-button" type="button" onClick={addBudgetLine}><Plus size={14} />Add budget line</button><div className="project-budget-total"><span>Draft total</span><strong>{money(budgetTotal)}</strong></div>{error && <div className="ops-error">{error}</div>}<div className="ops-form-actions"><button className="ops-outline-button" type="button" onClick={() => setBudgetOpen(false)}>Cancel</button><button className="ops-red-button" disabled={saving || budgetTotal <= 0}><Check size={14} />{saving ? 'Saving…' : 'Save draft'}</button></div></form></section></div>}

    {expenseOpen && <div className="ops-modal-backdrop"><section className="ops-modal project-account-modal" role="dialog" aria-modal="true" aria-labelledby="expense-title"><div className="ops-modal-head"><span className="ops-section-label">PROJECT #{value(account?.project.id)} · DIRECT COST</span><h2 id="expense-title">Post project expense</h2><p>This creates a booked cost. Record cash or bank settlement separately in the account ledger.</p><button className="ops-icon-button" onClick={() => setExpenseOpen(false)} aria-label="Close"><X size={16} /></button></div><form className="ops-form" onSubmit={(event) => void saveExpense(event)}><div className="ops-form-grid"><label className="ops-field"><span>Voucher number <i>*</i></span><input value={expenseValues.expense_number} onChange={(event) => setExpenseValues({ ...expenseValues, expense_number: event.target.value })} required /></label><label className="ops-field"><span>Date <i>*</i></span><input type="date" value={expenseValues.expense_date} onChange={(event) => setExpenseValues({ ...expenseValues, expense_date: event.target.value })} required /></label><label className="ops-field"><span>Category <i>*</i></span><select value={expenseValues.category} onChange={(event) => setExpenseValues({ ...expenseValues, category: event.target.value })}>{expenseCategories.map((category) => <option key={category}>{category}</option>)}</select></label><label className="ops-field"><span>Amount before tax (PKR) <i>*</i></span><input type="number" min="0.01" step="0.01" value={expenseValues.amount} onChange={(event) => setExpenseValues({ ...expenseValues, amount: event.target.value })} required /></label><label className="ops-field"><span>Tax (PKR)</span><input type="number" min="0" step="0.01" value={expenseValues.tax_amount} onChange={(event) => setExpenseValues({ ...expenseValues, tax_amount: event.target.value })} /></label><label className="ops-field field-full"><span>Description <i>*</i></span><input value={expenseValues.description} onChange={(event) => setExpenseValues({ ...expenseValues, description: event.target.value })} required /></label><label className="ops-field field-full"><span>Vendor / supplier name</span><input value={expenseValues.vendor_id} onChange={(event) => setExpenseValues({ ...expenseValues, vendor_id: event.target.value })} placeholder="Enter vendor directory ID if available" /></label><label className="ops-field field-full"><span>Receipt / audit notes</span><textarea value={expenseValues.notes} onChange={(event) => setExpenseValues({ ...expenseValues, notes: event.target.value })} rows={2} /></label></div>{error && <div className="ops-error">{error}</div>}<div className="ops-form-actions"><button className="ops-outline-button" type="button" onClick={() => setExpenseOpen(false)}>Cancel</button><button className="ops-red-button" disabled={saving}><Plus size={14} />{saving ? 'Posting…' : 'Post unpaid cost'}</button></div></form></section></div>}

    {paymentExpense && <div className="ops-modal-backdrop"><section className="ops-modal project-account-modal" role="dialog" aria-modal="true" aria-labelledby="payment-title"><div className="ops-modal-head"><span className="ops-section-label">{value(paymentExpense.expense_number)} · OUTSTANDING {money(Number(paymentExpense.amount) + Number(paymentExpense.tax_amount) - Number(paymentExpense.paid_amount))}</span><h2 id="payment-title">Record settlement</h2><p>Each payment is retained as a separate ledger transaction.</p><button className="ops-icon-button" onClick={() => setPaymentExpense(null)} aria-label="Close"><X size={16} /></button></div><form className="ops-form" onSubmit={(event) => void savePayment(event)}><div className="ops-form-grid"><label className="ops-field"><span>Payment date <i>*</i></span><input type="date" value={paymentValues.payment_date} onChange={(event) => setPaymentValues({ ...paymentValues, payment_date: event.target.value })} required /></label><label className="ops-field"><span>Amount (PKR) <i>*</i></span><input type="number" min="0.01" max={Number(paymentExpense.amount) + Number(paymentExpense.tax_amount) - Number(paymentExpense.paid_amount)} step="0.01" value={paymentValues.amount} onChange={(event) => setPaymentValues({ ...paymentValues, amount: event.target.value })} required /></label><label className="ops-field"><span>Payment method</span><select value={paymentValues.payment_method} onChange={(event) => setPaymentValues({ ...paymentValues, payment_method: event.target.value })}>{['Bank transfer', 'Cheque', 'Cash', 'Card', 'Mobile wallet'].map((method) => <option key={method}>{method}</option>)}</select></label><label className="ops-field"><span>Bank / receipt reference</span><input value={paymentValues.reference_number} onChange={(event) => setPaymentValues({ ...paymentValues, reference_number: event.target.value })} /></label></div>{error && <div className="ops-error">{error}</div>}<div className="ops-form-actions"><button className="ops-outline-button" type="button" onClick={() => setPaymentExpense(null)}>Cancel</button><button className="ops-red-button" disabled={saving}><Banknote size={14} />{saving ? 'Saving…' : 'Record payment'}</button></div></form></section></div>}

    {auditBudget && <div className="ops-modal-backdrop"><section className="ops-modal project-account-modal" role="dialog" aria-modal="true" aria-labelledby="audit-title"><div className="ops-modal-head"><span className="ops-section-label">REVISION {value(auditBudget.version)} · {money(auditBudget.total_amount)}</span><h2 id="audit-title">Audit budget revision</h2><p>Approval locks this revision as the final project budget.</p><button className="ops-icon-button" onClick={() => setAuditBudget(null)} aria-label="Close"><X size={16} /></button></div><form className="ops-form" onSubmit={(event) => void saveAudit(event)}><div className="ops-form-grid"><label className="ops-field"><span>Decision <i>*</i></span><select value={auditDecision} onChange={(event) => setAuditDecision(event.target.value as 'Approved' | 'Rejected')}><option>Approved</option><option>Rejected</option></select></label><label className="ops-field"><span>Audit date <i>*</i></span><input type="date" value={auditValues.audit_date} onChange={(event) => setAuditValues({ ...auditValues, audit_date: event.target.value })} required /></label><label className="ops-field field-full"><span>Audit notes</span><textarea value={auditValues.audit_notes} onChange={(event) => setAuditValues({ ...auditValues, audit_notes: event.target.value })} rows={3} /></label></div>{error && <div className="ops-error">{error}</div>}<div className="ops-form-actions"><button className="ops-outline-button" type="button" onClick={() => setAuditBudget(null)}>Cancel</button><button className="ops-red-button" disabled={saving}><ShieldCheck size={14} />{saving ? 'Saving…' : `Record ${auditDecision.toLowerCase()}`}</button></div></form></section></div>}
  </div>
}