import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

export type Db = Database.Database

export function openDatabase(filename = resolve('data/revoxen.sqlite')): Db {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true })
  const db = new Database(filename)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY, project_code TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
      client TEXT NOT NULL, work_type TEXT NOT NULL DEFAULT '', site_address TEXT NOT NULL DEFAULT '',
      start_date TEXT NOT NULL DEFAULT '', due_date TEXT NOT NULL DEFAULT '',
      contract_amount REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'Planning',
      manager TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS project_budgets (
      id INTEGER PRIMARY KEY, project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
      version INTEGER NOT NULL, total_amount REAL NOT NULL CHECK(total_amount > 0),
      status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft','Pending audit','Approved','Rejected')),
      created_by TEXT NOT NULL DEFAULT '', submitted_at TEXT NOT NULL DEFAULT '', audited_by TEXT NOT NULL DEFAULT '',
      audit_date TEXT NOT NULL DEFAULT '', audit_notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(project_id,version)
    );
    CREATE TABLE IF NOT EXISTS project_budget_lines (
      id INTEGER PRIMARY KEY, budget_id INTEGER NOT NULL REFERENCES project_budgets(id) ON DELETE CASCADE,
      category TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', amount REAL NOT NULL CHECK(amount >= 0)
    );
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY, employee_code TEXT NOT NULL UNIQUE, full_name TEXT NOT NULL,
      job_title TEXT NOT NULL DEFAULT '', department TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', start_date TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Active', base_salary REAL NOT NULL DEFAULT 0,
      housing_allowance REAL NOT NULL DEFAULT 0, transport_allowance REAL NOT NULL DEFAULT 0,
      other_allowance REAL NOT NULL DEFAULT 0, monthly_bonus REAL NOT NULL DEFAULT 0,
      overtime_multiplier REAL NOT NULL DEFAULT 1.5, tax_rate REAL NOT NULL DEFAULT 0,
      loan_balance REAL NOT NULL DEFAULT 0, benefit_deduction REAL NOT NULL DEFAULT 0,
      employer_contribution REAL NOT NULL DEFAULT 0, notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS payroll (
      id INTEGER PRIMARY KEY, employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
      pay_period TEXT NOT NULL, overtime_hours REAL NOT NULL DEFAULT 0, overtime_amount REAL NOT NULL DEFAULT 0,
      gross_salary REAL NOT NULL, tax_deduction REAL NOT NULL DEFAULT 0, loan_deduction REAL NOT NULL DEFAULT 0,
      benefit_deduction REAL NOT NULL DEFAULT 0, other_deduction REAL NOT NULL DEFAULT 0,
      employer_contribution REAL NOT NULL DEFAULT 0, net_salary REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Draft', paid_date TEXT NOT NULL DEFAULT '',
      UNIQUE(employee_id, pay_period)
    );
    CREATE TABLE IF NOT EXISTS employee_loans (
      id INTEGER PRIMARY KEY, employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
      issue_date TEXT NOT NULL, principal REAL NOT NULL CHECK(principal > 0),
      outstanding REAL NOT NULL CHECK(outstanding >= 0), status TEXT NOT NULL DEFAULT 'Active',
      notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS employee_loan_payments (
      id INTEGER PRIMARY KEY, loan_id INTEGER NOT NULL REFERENCES employee_loans(id) ON DELETE RESTRICT,
      payroll_id INTEGER NOT NULL REFERENCES payroll(id) ON DELETE RESTRICT,
      payment_date TEXT NOT NULL, amount REAL NOT NULL CHECK(amount > 0)
    );
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY, asset_code TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT '', make_model TEXT NOT NULL DEFAULT '', serial_number TEXT NOT NULL DEFAULT '',
      purchase_date TEXT NOT NULL DEFAULT '', purchase_cost REAL NOT NULL DEFAULT 0,
      condition TEXT NOT NULL DEFAULT 'Good', location TEXT NOT NULL DEFAULT '',
      assigned_to TEXT NOT NULL DEFAULT '', warranty_expiry TEXT NOT NULL DEFAULT '',
      useful_life_years REAL NOT NULL DEFAULT 0, salvage_value REAL NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS vendors (
      id INTEGER PRIMARY KEY, vendor_code TEXT NOT NULL UNIQUE, company_name TEXT NOT NULL,
      contact_name TEXT NOT NULL DEFAULT '', trade TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '', address TEXT NOT NULL DEFAULT '', tax_id TEXT NOT NULL DEFAULT '',
      payment_terms TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'Active',
      notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS work_orders (
      id INTEGER PRIMARY KEY, work_order_number TEXT NOT NULL UNIQUE,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
      vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
      scope TEXT NOT NULL, issue_date TEXT NOT NULL DEFAULT '', due_date TEXT NOT NULL DEFAULT '',
      amount REAL NOT NULL DEFAULT 0, tax_amount REAL NOT NULL DEFAULT 0,
      retention_amount REAL NOT NULL DEFAULT 0, paid_amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Draft', notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS asset_maintenance (
      id INTEGER PRIMARY KEY, asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
      service_date TEXT NOT NULL, description TEXT NOT NULL, vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
      amount REAL NOT NULL DEFAULT 0, next_service_date TEXT NOT NULL DEFAULT '', reference_number TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY, expense_number TEXT NOT NULL UNIQUE,
      expense_type TEXT NOT NULL CHECK(expense_type IN ('Project','General')),
      category TEXT NOT NULL, description TEXT NOT NULL, expense_date TEXT NOT NULL,
      project_id INTEGER REFERENCES projects(id) ON DELETE RESTRICT,
      vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
      amount REAL NOT NULL, tax_amount REAL NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL DEFAULT '', reference_number TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Paid', notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS expense_payments (
      id INTEGER PRIMARY KEY, expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE RESTRICT,
      payment_date TEXT NOT NULL, amount REAL NOT NULL CHECK(amount > 0),
      payment_method TEXT NOT NULL DEFAULT '', reference_number TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS vendor_payments (
      id INTEGER PRIMARY KEY, work_order_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE RESTRICT,
      payment_date TEXT NOT NULL, amount REAL NOT NULL CHECK(amount > 0),
      payment_method TEXT NOT NULL DEFAULT '', reference_number TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY, document_number TEXT NOT NULL UNIQUE,
      document_type TEXT NOT NULL CHECK(document_type IN ('Estimate','Invoice')),
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      client_name TEXT NOT NULL, subject TEXT NOT NULL, issue_date TEXT NOT NULL,
      due_date TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'Draft',
      billing_stage TEXT NOT NULL DEFAULT 'Progress', audit_status TEXT NOT NULL DEFAULT 'Not required',
      audited_by TEXT NOT NULL DEFAULT '', audit_date TEXT NOT NULL DEFAULT '', audit_notes TEXT NOT NULL DEFAULT '',
      subtotal REAL NOT NULL DEFAULT 0, discount_amount REAL NOT NULL DEFAULT 0,
      tax_rate REAL NOT NULL DEFAULT 0, tax_amount REAL NOT NULL DEFAULT 0,
      grand_total REAL NOT NULL DEFAULT 0, notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS document_lines (
      id INTEGER PRIMARY KEY, document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL DEFAULT 0, item TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
      length REAL NOT NULL DEFAULT 0, width REAL NOT NULL DEFAULT 0, height REAL NOT NULL DEFAULT 0,
      quantity REAL NOT NULL DEFAULT 1, nos REAL NOT NULL DEFAULT 1, unit TEXT NOT NULL DEFAULT 'Each',
      rate REAL NOT NULL DEFAULT 0, tax_rate REAL NOT NULL DEFAULT 0,
      measured_quantity REAL NOT NULL DEFAULT 0, line_subtotal REAL NOT NULL DEFAULT 0,
      line_tax REAL NOT NULL DEFAULT 0, line_total REAL NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY, document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      payment_date TEXT NOT NULL, amount REAL NOT NULL CHECK(amount > 0),
      payment_method TEXT NOT NULL DEFAULT '', reference_number TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin','user')),
      active INTEGER NOT NULL DEFAULT 1, permissions TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS user_sessions (
      token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_payroll_period ON payroll(pay_period);
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
    CREATE INDEX IF NOT EXISTS idx_documents_date ON documents(document_type, issue_date);
    CREATE INDEX IF NOT EXISTS idx_work_orders_project ON work_orders(project_id);
  `)
  ensureColumn(db, 'documents', 'billing_stage', "TEXT NOT NULL DEFAULT 'Progress'")
  ensureColumn(db, 'documents', 'audit_status', "TEXT NOT NULL DEFAULT 'Not required'")
  ensureColumn(db, 'documents', 'audited_by', "TEXT NOT NULL DEFAULT ''")
  ensureColumn(db, 'documents', 'audit_date', "TEXT NOT NULL DEFAULT ''")
  ensureColumn(db, 'documents', 'audit_notes', "TEXT NOT NULL DEFAULT ''")
  ensureColumn(db, 'expenses', 'paid_amount', 'REAL NOT NULL DEFAULT 0')
  return db
}

function ensureColumn(db: Db, table: string, column: string, definition: string) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]
  if (!columns.some((item) => item.name === column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
}

export function calculateDocument(lines: Record<string, unknown>[], discountAmount: number, taxRate: number) {
  const prepared = lines.map((line) => {
    const length = numberValue(line.length)
    const width = numberValue(line.width)
    const height = numberValue(line.height)
    const dimensions = [length, width, height].filter((dimension) => dimension > 0)
    const measuredQuantity = dimensions.length ? dimensions.reduce((total, dimension) => total * dimension, 1) : 1
    const quantity = numberValue(line.quantity, 1)
    const nos = numberValue(line.nos, 1)
    const rate = numberValue(line.rate)
    const ratePercent = numberValue(line.taxRate, taxRate)
    const billableQuantity = measuredQuantity * quantity * nos
    const lineSubtotal = roundMoney(billableQuantity * rate)
    const lineTax = roundMoney(lineSubtotal * ratePercent / 100)
    return { ...line, length, width, height, quantity, nos, rate, taxRate: ratePercent, measuredQuantity: billableQuantity, lineSubtotal, lineTax, lineTotal: roundMoney(lineSubtotal + lineTax) }
  })
  const subtotal = roundMoney(prepared.reduce((total, line) => total + line.lineSubtotal, 0))
  const discount = Math.min(roundMoney(Math.max(0, discountAmount)), subtotal)
  const taxBase = Math.max(0, subtotal - discount)
  let allocatedDiscount = 0
  const taxedLines = prepared.map((line, index) => {
    const discountShare = index === prepared.length - 1
      ? roundMoney(discount - allocatedDiscount)
      : subtotal === 0 ? 0 : roundMoney(discount * line.lineSubtotal / subtotal)
    allocatedDiscount += discountShare
    const taxableAmount = Math.max(0, line.lineSubtotal - discountShare)
    const lineTax = roundMoney(taxableAmount * line.taxRate / 100)
    return { ...line, lineTax, lineTotal: roundMoney(taxableAmount + lineTax) }
  })
  const taxAmount = roundMoney(taxedLines.reduce((total, line) => total + line.lineTax, 0))
  return { lines: taxedLines, subtotal, discountAmount: discount, taxRate, taxAmount, grandTotal: roundMoney(taxBase + taxAmount) }
}

export function calculatePayroll(employee: Record<string, unknown>, input: Record<string, unknown>) {
  const baseSalary = numberValue(employee.base_salary)
  const allowances = numberValue(employee.housing_allowance) + numberValue(employee.transport_allowance) + numberValue(employee.other_allowance)
  const bonus = numberValue(employee.monthly_bonus)
  const hours = numberValue(input.overtime_hours)
  const overtimeRate = baseSalary / 26 / 8 * numberValue(employee.overtime_multiplier, 1.5)
  const overtimeAmount = roundMoney(hours * overtimeRate)
  const grossSalary = roundMoney(baseSalary + allowances + bonus + overtimeAmount)
  const taxDeduction = roundMoney(grossSalary * numberValue(employee.tax_rate) / 100)
  const requestedLoanDeduction = Math.max(0, numberValue(input.loan_deduction))
  const loanDeduction = roundMoney(Math.min(requestedLoanDeduction, numberValue(employee.loan_balance)))
  const benefitDeduction = numberValue(employee.benefit_deduction)
  const otherDeduction = Math.max(0, numberValue(input.other_deduction))
  const netSalary = roundMoney(grossSalary - taxDeduction - loanDeduction - benefitDeduction - otherDeduction)
  if (netSalary < 0) throw new Error('Deductions cannot exceed gross salary.')
  return { overtimeHours: hours, overtimeAmount, grossSalary, taxDeduction, loanDeduction, benefitDeduction, otherDeduction, employerContribution: numberValue(employee.employer_contribution), netSalary }
}

function numberValue(value: unknown, fallback = 0): number {
  if (value === undefined || value === null || value === '') return fallback
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0) throw new Error('Amounts and quantities must be valid non-negative numbers.')
  return number
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}