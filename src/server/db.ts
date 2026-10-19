import Database from 'better-sqlite3'
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

export type Db = Database.Database

export function openDatabase(filename?: string): Db {
  let dbPath: string
  if (filename) {
    dbPath = filename
  } else if (process.env.DB_FILE) {
    dbPath = resolve(process.env.DB_FILE)
  } else if (process.env.VERCEL) {
    dbPath = '/tmp/revoxen.sqlite'
    if (!existsSync(dbPath)) {
      mkdirSync(dirname(dbPath), { recursive: true })
      const bundled = resolve(process.cwd(), 'data/revoxen.sqlite')
      if (existsSync(bundled)) {
        copyFileSync(bundled, dbPath)
      }
    }
  } else {
    dbPath = resolve('data/revoxen.sqlite')
  }

  if (dbPath !== ':memory:') mkdirSync(dirname(dbPath), { recursive: true })
  const db = new Database(dbPath)
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
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY,
      lead_code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      client TEXT NOT NULL,
      source TEXT NOT NULL,
      stage TEXT NOT NULL DEFAULT 'Lead Source',
      value REAL NOT NULL DEFAULT 0,
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      site_address TEXT NOT NULL DEFAULT '',
      work_type TEXT NOT NULL DEFAULT '',
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      estimate_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_payroll_period ON payroll(pay_period);
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
    CREATE INDEX IF NOT EXISTS idx_documents_date ON documents(document_type, issue_date);
    CREATE INDEX IF NOT EXISTS idx_work_orders_project ON work_orders(project_id);
    CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
    CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
    CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);
  `)
  ensureColumn(db, 'documents', 'billing_stage', "TEXT NOT NULL DEFAULT 'Progress'")
  ensureColumn(db, 'documents', 'audit_status', "TEXT NOT NULL DEFAULT 'Not required'")
  ensureColumn(db, 'documents', 'audited_by', "TEXT NOT NULL DEFAULT ''")
  ensureColumn(db, 'documents', 'audit_date', "TEXT NOT NULL DEFAULT ''")
  ensureColumn(db, 'documents', 'audit_notes', "TEXT NOT NULL DEFAULT ''")
  ensureColumn(db, 'documents', 'lead_source', "TEXT NOT NULL DEFAULT ''")
  ensureColumn(db, 'documents', 'lead_id', 'INTEGER REFERENCES leads(id) ON DELETE SET NULL')
  ensureColumn(db, 'projects', 'lead_source', "TEXT NOT NULL DEFAULT 'Website Enquiries'")
  ensureColumn(db, 'projects', 'lead_id', 'INTEGER REFERENCES leads(id) ON DELETE SET NULL')
  ensureColumn(db, 'expenses', 'paid_amount', 'REAL NOT NULL DEFAULT 0')
  ensureColumn(db, 'users', 'google_id', "TEXT NOT NULL DEFAULT ''")

  if (dbPath !== ':memory:') {
    seedLeadsIfEmpty(db)
  }
  return db
}

export function seedLeadsIfEmpty(db: Db) {
  const existing = Number((db.prepare('SELECT COUNT(*) as count FROM leads').get() as { count: number }).count)
  if (existing >= 248) return
  if (existing > 0) {
    db.prepare('DELETE FROM leads').run()
  }

  const channels = [
    {
      source: 'Website Enquiries',
      stages: { 'Lead Source': 19, 'Qualified': 12, 'Site Visit': 6, 'Estimate / Bid': 8, 'Proposal': 6, 'Awarded': 8, 'Lost': 10 },
      totalValue: 6850000,
    },
    {
      source: 'Referrals',
      stages: { 'Lead Source': 11, 'Qualified': 8, 'Site Visit': 4, 'Estimate / Bid': 6, 'Proposal': 3, 'Awarded': 7, 'Lost': 6 },
      totalValue: 5420000,
    },
    {
      source: 'Repeat Customers',
      stages: { 'Lead Source': 10, 'Qualified': 4, 'Site Visit': 4, 'Estimate / Bid': 5, 'Proposal': 4, 'Awarded': 5, 'Lost': 5 },
      totalValue: 4180000,
    },
    {
      source: 'Paid Campaigns',
      stages: { 'Lead Source': 8, 'Qualified': 6, 'Site Visit': 2, 'Estimate / Bid': 4, 'Proposal': 2, 'Awarded': 4, 'Lost': 4 },
      totalValue: 2960000,
    },
    {
      source: 'Bid Platforms',
      stages: { 'Lead Source': 7, 'Qualified': 4, 'Site Visit': 2, 'Estimate / Bid': 4, 'Proposal': 2, 'Awarded': 2, 'Lost': 4 },
      totalValue: 1850000,
    },
    {
      source: 'Partners',
      stages: { 'Lead Source': 5, 'Qualified': 4, 'Site Visit': 2, 'Estimate / Bid': 2, 'Proposal': 1, 'Awarded': 3, 'Lost': 3 },
      totalValue: 2140000,
    },
    {
      source: 'Outbound Sales',
      stages: { 'Lead Source': 7, 'Qualified': 2, 'Site Visit': 2, 'Estimate / Bid': 2, 'Proposal': 0, 'Awarded': 2, 'Lost': 2 },
      totalValue: 1420000,
    },
  ]

  const insert = db.prepare(`
    INSERT INTO leads (lead_code, name, client, source, stage, value, phone, email, site_address, work_type, project_id, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const clients = [
    'Eleanor Whitmore', 'Martin & Co. Holdings', 'Naomi Adler', 'Devin & Sam Rivera',
    'Clara Bennett', 'Hollis Property Group', 'Alder Street LLC', 'Kendall James',
    'Gabrielle Moore', 'Theo Park', 'Crescent Developers', 'Al-Falah Properties',
    'Packages Group', 'Prime Residency', 'Horizon Towers', 'Vertex Healthcare',
    'Metropolitan Retail', 'Engro Logistics', 'Nishat Apparel', 'Habib Metro',
    'Silver Oaks Estate', 'Highland Heights', 'Sapphire Mills', 'Beaconhouse Campus',
    'Shalamar Trust', 'Kohinoor Textile', 'Gulberg Galleria', 'Askari Estates',
  ]

  const workTypes = [
    'Whole-home renovation', 'Commercial fit-out', 'Luxury villa construction',
    'Hospitality remodel', 'Office interior', 'Industrial warehouse',
    'Exterior facade & roofing', 'Residential extension', 'Healthcare clinic buildout',
  ]

  const locations = [
    'Lahore (DHA Phase 6)', 'Islamabad (Sector F-7)', 'Rawalpindi (Bahria Town)',
    'Karachi (Clifton Block 4)', 'Taxila (Industrial Zone)', 'Faisalabad (Canal Road)',
    'Gujranwala (Model Town)', 'Peshawar (Hayatabad)', 'Multan (Cantt)',
  ]

  const projectRow = db.prepare('SELECT id FROM projects ORDER BY id ASC LIMIT 1').get() as { id: number } | undefined
  const defaultProjectId = projectRow?.id ?? null

  db.transaction(() => {
    let globalIndex = 1
    for (const channel of channels) {
      const stageList: string[] = []
      for (const [stage, count] of Object.entries(channel.stages)) {
        for (let i = 0; i < count; i++) {
          stageList.push(stage)
        }
      }

      const count = stageList.length
      const weights = stageList.map((stage) => {
        if (stage === 'Awarded') return 2.2
        if (stage === 'Proposal') return 1.8
        if (stage === 'Estimate / Bid') return 1.5
        if (stage === 'Site Visit') return 1.2
        if (stage === 'Qualified') return 1.0
        if (stage === 'Lost') return 0.9
        return 0.8
      })
      const sumWeight = weights.reduce((a, b) => a + b, 0)
      
      let runningValue = 0
      for (let i = 0; i < count; i++) {
        const stage = stageList[i]
        const code = `LD-${String(globalIndex).padStart(3, '0')}`
        const client = clients[(globalIndex - 1) % clients.length]
        const workType = workTypes[(globalIndex - 1) % workTypes.length]
        const location = locations[(globalIndex - 1) % locations.length]
        const name = `${client} · ${workType}`
        
        let leadValue: number
        if (i === count - 1) {
          leadValue = Math.round(channel.totalValue - runningValue)
        } else {
          const raw = (weights[i] / sumWeight) * channel.totalValue
          leadValue = Math.round(raw / 1000) * 1000
          runningValue += leadValue
        }

        const dayOffset = Math.floor(((globalIndex * 13) % 270)) + 3
        const date = new Date(Date.UTC(2026, 0, dayOffset))
        const dateStr = date.toISOString().slice(0, 10)
        const timeStr = '10:00:00'
        const createdAt = `${dateStr} ${timeStr}`

        const linkedProjectId = (stage === 'Awarded' && globalIndex === 1 && defaultProjectId) ? defaultProjectId : null

        insert.run(
          code,
          name,
          client,
          channel.source,
          stage,
          leadValue,
          `+92 300 ${(globalIndex * 111111) % 900000 + 100000}`,
          `contact${globalIndex}@example.com`,
          location,
          workType,
          linkedProjectId,
          `Source channel: ${channel.source}. Stage: ${stage}.`,
          createdAt
        )
        globalIndex++
      }
    }

    // 5 direct walk-in / incoming inquiries bringing total leads to exactly 248 (1 awarded, 4 lost)
    const directLeads = [
      { code: 'LD-244', name: 'Al-Haram Heights · Luxury villa construction', client: 'Eleanor Whitmore', source: 'Direct / Inquiries', stage: 'Awarded', value: 0, statusDesc: 'Direct client award' },
      { code: 'LD-245', name: 'Apex Complex · Commercial fit-out', client: 'Martin & Co. Holdings', source: 'Direct / Inquiries', stage: 'Lost', value: 0, statusDesc: 'Client opted for in-house execution' },
      { code: 'LD-246', name: 'Civic Center Suite · Office interior', client: 'Naomi Adler', source: 'Direct / Inquiries', stage: 'Lost', value: 0, statusDesc: 'Budget realignment' },
      { code: 'LD-247', name: 'Park View Villa · Whole-home renovation', client: 'Devin & Sam Rivera', source: 'Direct / Inquiries', stage: 'Lost', value: 0, statusDesc: 'Project postponed' },
      { code: 'LD-248', name: 'Boulevard Residence · Residential extension', client: 'Clara Bennett', source: 'Direct / Inquiries', stage: 'Lost', value: 0, statusDesc: 'Permit restrictions' },
    ]

    for (const lead of directLeads) {
      insert.run(
        lead.code,
        lead.name,
        lead.client,
        lead.source,
        lead.stage,
        lead.value,
        '+92 300 5550199',
        'info@revoxenassociates.com',
        'Islamabad (Sector F-7)',
        'Architecture & Construction',
        null,
        lead.statusDesc,
        '2026-05-15 11:00:00'
      )
    }
  })()
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