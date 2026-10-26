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
  ensureColumn(db, 'users', 'phone', "TEXT NOT NULL DEFAULT ''")
  ensureColumn(db, 'users', 'recovery_email', "TEXT NOT NULL DEFAULT ''")
  ensureColumn(db, 'users', 'reset_code', "TEXT NOT NULL DEFAULT ''")
  ensureColumn(db, 'users', 'reset_expires', "TEXT NOT NULL DEFAULT ''")
  ensureColumn(db, 'user_sessions', 'last_active_at', "TEXT NOT NULL DEFAULT ''")
  ensureColumn(db, 'user_sessions', 'ip_address', "TEXT NOT NULL DEFAULT ''")
  ensureColumn(db, 'user_sessions', 'device', "TEXT NOT NULL DEFAULT ''")
  ensureColumn(db, 'user_sessions', 'duration_seconds', "INTEGER NOT NULL DEFAULT 0")

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_name TEXT NOT NULL DEFAULT '',
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      description TEXT NOT NULL,
      device TEXT NOT NULL DEFAULT '',
      ip_address TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activity_logs(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_activity_created ON user_activity_logs(created_at);

    CREATE TABLE IF NOT EXISTS daily_site_reports (
      id INTEGER PRIMARY KEY,
      report_number TEXT NOT NULL UNIQUE,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
      report_date TEXT NOT NULL,
      weather TEXT NOT NULL DEFAULT 'Sunny',
      temperature TEXT NOT NULL DEFAULT '',
      supervisor_name TEXT NOT NULL,
      work_completed TEXT NOT NULL,
      labor_count INTEGER NOT NULL DEFAULT 0,
      machinery_active TEXT NOT NULL DEFAULT '',
      materials_received TEXT NOT NULL DEFAULT '',
      delays_issues TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft','Submitted','Approved')),
      approved_by TEXT NOT NULL DEFAULT '',
      approval_date TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_site_reports_project ON daily_site_reports(project_id);
    CREATE INDEX IF NOT EXISTS idx_site_reports_date ON daily_site_reports(report_date);

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY,
      material_code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      unit_cost REAL NOT NULL DEFAULT 0,
      current_stock REAL NOT NULL DEFAULT 0,
      reorder_level REAL NOT NULL DEFAULT 0,
      supplier_vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);

    CREATE TABLE IF NOT EXISTS material_requisitions (
      id INTEGER PRIMARY KEY,
      requisition_number TEXT NOT NULL UNIQUE,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
      material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
      quantity REAL NOT NULL CHECK(quantity > 0),
      required_date TEXT NOT NULL,
      urgency TEXT NOT NULL DEFAULT 'Normal' CHECK(urgency IN ('Normal','Urgent','Emergency')),
      requested_by TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Approved','Delivered','Cancelled')),
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_requisitions_project ON material_requisitions(project_id);

    CREATE TABLE IF NOT EXISTS material_issues (
      id INTEGER PRIMARY KEY,
      issue_number TEXT NOT NULL UNIQUE,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
      material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
      quantity REAL NOT NULL CHECK(quantity > 0),
      issue_date TEXT NOT NULL,
      issued_to TEXT NOT NULL,
      purpose TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_issues_project ON material_issues(project_id);

    CREATE TABLE IF NOT EXISTS daily_labor_attendance (
      id INTEGER PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
      work_date TEXT NOT NULL,
      worker_name TEXT NOT NULL,
      trade TEXT NOT NULL,
      attendance_status TEXT NOT NULL DEFAULT 'Present' CHECK(attendance_status IN ('Present','Half day','Overtime','Absent')),
      daily_rate REAL NOT NULL DEFAULT 0,
      overtime_hours REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK(payment_status IN ('Pending','Paid')),
      paid_date TEXT NOT NULL DEFAULT '',
      payment_method TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_labor_project_date ON daily_labor_attendance(project_id, work_date);

    CREATE TABLE IF NOT EXISTS site_inspections (
      id INTEGER PRIMARY KEY,
      inspection_number TEXT NOT NULL UNIQUE,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
      inspection_type TEXT NOT NULL,
      inspection_date TEXT NOT NULL,
      inspector_name TEXT NOT NULL,
      result TEXT NOT NULL DEFAULT 'Passed' CHECK(result IN ('Passed','Passed with comments','Failed / Rework required')),
      comments TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_inspections_project ON site_inspections(project_id);

    CREATE TABLE IF NOT EXISTS site_snags (
      id INTEGER PRIMARY KEY,
      snag_number TEXT NOT NULL UNIQUE,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
      location TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'Medium' CHECK(severity IN ('Low','Medium','High','Critical')),
      assigned_vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
      due_date TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open','In Progress','Fixed','Closed')),
      resolution_notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_snags_project ON site_snags(project_id);

    CREATE TABLE IF NOT EXISTS project_milestones (
      id INTEGER PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
      title TEXT NOT NULL,
      stage_name TEXT NOT NULL,
      target_start_date TEXT NOT NULL DEFAULT '',
      target_end_date TEXT NOT NULL DEFAULT '',
      actual_end_date TEXT NOT NULL DEFAULT '',
      progress_percent REAL NOT NULL DEFAULT 0 CHECK(progress_percent >= 0 AND progress_percent <= 100),
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','In progress','Completed','Delayed')),
      weightage_percent REAL NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_milestones_project ON project_milestones(project_id);
  `)

  db.prepare(`UPDATE users SET phone = '+92 300 5550199', recovery_email = 'faizeawan123@gmail.com' WHERE id = 1 AND (phone = '' OR recovery_email = '')`).run()

  if (dbPath !== ':memory:') {
    seedLeadsIfEmpty(db)
    seedConstructionData(db)
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

export function seedConstructionData(db: Db) {
  const materialsCount = Number((db.prepare('SELECT COUNT(*) as count FROM materials').get() as { count: number }).count)
  if (materialsCount === 0) {
    const insertMat = db.prepare(`
      INSERT INTO materials (material_code, name, category, unit, unit_cost, current_stock, reorder_level, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const items = [
      ['MAT-001', 'DG Cement Ordinary Portland', 'Cement', 'Bags', 1350, 450, 100, 'Grade 42.5 OPC for RCC structural casting'],
      ['MAT-002', 'Mughal Steel Deformed Rebar 60-Grade', 'Steel & Rebar', 'Tonnes', 265000, 14.5, 5, 'High-yield deformed bars #4, #6 & #8'],
      ['MAT-003', 'Chenab River Sand (Screened)', 'Aggregates & Sand', 'Cft', 75, 1800, 500, 'Fine river sand for plaster & masonry mortar'],
      ['MAT-004', 'Margalla Crushed Stone 3/4" (Bajri)', 'Aggregates & Sand', 'Cft', 110, 1200, 400, 'Graded aggregate for 1:2:4 concrete mix'],
      ['MAT-005', 'First Class Red Clay Kiln Bricks', 'Bricks & Blocks', 'Nos', 15, 18500, 5000, 'Standard 9x4.5x3 inch solid burnt clay bricks'],
      ['MAT-006', 'Fast Cables 7/0.029 Single Core Copper', 'Electrical', 'Coils', 14800, 32, 10, 'Pure copper concealed conduit wiring'],
      ['MAT-007', 'Master PPRC Water Pipes 25mm', 'Plumbing', 'Lengths', 950, 85, 25, 'PN-20 hot & cold pressure pipes (13ft)'],
      ['MAT-008', 'Berger Elegance Interior Emulsion', 'Paint & Finishes', 'Gallons', 5200, 24, 15, 'Matt finish architectural interior paint'],
      ['MAT-009', 'RAK Full-Body Porcelain Tiles 60x60cm', 'Flooring', 'Boxes', 3400, 65, 30, 'Vitrified rectified floor tiles (4 pcs/box)'],
    ]
    for (const item of items) {
      insertMat.run(item[0], item[1], item[2], item[3], item[4], item[5], item[6], item[7])
    }
  }

  let project = db.prepare('SELECT id, project_code, name FROM projects ORDER BY id ASC LIMIT 1').get() as { id: number; project_code: string; name: string } | undefined
  if (!project) {
    const res = db.prepare(`
      INSERT INTO projects (project_code, name, client, work_type, site_address, start_date, due_date, contract_amount, status, manager)
      VALUES ('RX-101', 'Al-Haram Executive Residence & Commercial Plinth', 'Al-Haram Builders & Developers', 'New construction', 'Plot 42, Sector F-7/2, Islamabad', '2026-06-01', '2027-03-31', 45000000, 'In progress', 'Engr. Bilal Khan')
    `).run()
    project = { id: Number(res.lastInsertRowid), project_code: 'RX-101', name: 'Al-Haram Executive Residence & Commercial Plinth' }
  }
  const projectId = project.id

  const siteReportsCount = Number((db.prepare('SELECT COUNT(*) as count FROM daily_site_reports').get() as { count: number }).count)
  if (siteReportsCount === 0) {
    const insertReport = db.prepare(`
      INSERT INTO daily_site_reports (report_number, project_id, report_date, weather, temperature, supervisor_name, work_completed, labor_count, machinery_active, materials_received, delays_issues, status, approved_by, approval_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    insertReport.run(
      'DSR-001', projectId, '2026-10-18', 'Sunny', '28°C', 'Engr. Hamza Tariq',
      'Completed 2nd floor RCC column shuttering and rebar binding (Columns C1 to C8). Poured lean concrete for basement ramp extension. Internal brickwork started on 1st floor northern block.',
      18, 'Concrete Mixer 1-bag (6 hrs), Mechanical Needle Vibrator (4 hrs), 25kVA Standby Generator (8 hrs)',
      '200 bags DG Cement (Challan #4481), 4.2 Tons Mughal Rebar (Gate Pass #1092)',
      'Minor 45-min power outage handled with standby site generator. All safety PPE inspected.',
      'Approved', 'Engr. Bilal Khan (PM)', '2026-10-18'
    )
    insertReport.run(
      'DSR-002', projectId, '2026-10-19', 'Clear', '30°C', 'Engr. Hamza Tariq',
      'Formwork alignment and props tightening for 2nd floor beam & slab casting. Electrician conduit piping embedded in slab bottom mesh. Water curing maintained for 1st floor columns (twice daily).',
      22, 'Tower Crane / Material Hoist (5 hrs), 2 Plate Compactors, Water Pump',
      '1 Dumper Chenab Sand (600 Cft)',
      'None. Site work progressing smoothly according to milestone schedule.',
      'Submitted', '', ''
    )
  }

  const mat1 = db.prepare('SELECT id FROM materials WHERE material_code = ?').get('MAT-001') as { id: number } | undefined
  const mat2 = db.prepare('SELECT id FROM materials WHERE material_code = ?').get('MAT-002') as { id: number } | undefined
  const mat5 = db.prepare('SELECT id FROM materials WHERE material_code = ?').get('MAT-005') as { id: number } | undefined
  const mat7 = db.prepare('SELECT id FROM materials WHERE material_code = ?').get('MAT-007') as { id: number } | undefined

  const reqCount = Number((db.prepare('SELECT COUNT(*) as count FROM material_requisitions').get() as { count: number }).count)
  if (reqCount === 0 && mat1 && mat2 && mat7) {
    const insertReq = db.prepare(`
      INSERT INTO material_requisitions (requisition_number, project_id, material_id, quantity, required_date, urgency, requested_by, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    insertReq.run('REQ-001', projectId, mat1.id, 200, '2026-10-22', 'Urgent', 'Engr. Hamza Tariq', 'Delivered', 'Required for 2nd floor slab concrete casting.')
    insertReq.run('REQ-002', projectId, mat2.id, 3.5, '2026-10-25', 'Normal', 'Engr. Hamza Tariq', 'Approved', 'Beams reinforcement #4 and #6 bars.')
    insertReq.run('REQ-003', projectId, mat7.id, 30, '2026-10-28', 'Normal', 'M. Zubair (Plumbing Lead)', 'Pending', 'Washroom internal piping rough-in.')
  }

  const issuesCount = Number((db.prepare('SELECT COUNT(*) as count FROM material_issues').get() as { count: number }).count)
  if (issuesCount === 0 && mat1 && mat5) {
    const insertIss = db.prepare(`
      INSERT INTO material_issues (issue_number, project_id, material_id, quantity, issue_date, issued_to, purpose)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    insertIss.run('ISS-001', projectId, mat1.id, 150, '2026-10-18', 'Mistry Tariq (Civil Contractor)', 'Ground floor boundary wall & column encasement.')
    insertIss.run('ISS-002', projectId, mat5.id, 3000, '2026-10-19', 'Subcontractor Al-Rehman Builders', '1st floor partition brick masonry.')
  }

  const laborCount = Number((db.prepare('SELECT COUNT(*) as count FROM daily_labor_attendance').get() as { count: number }).count)
  if (laborCount === 0) {
    const insertLabor = db.prepare(`
      INSERT INTO daily_labor_attendance (project_id, work_date, worker_name, trade, attendance_status, daily_rate, overtime_hours, total_amount, payment_status, paid_date, payment_method)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const workers = [
      ['Tariq Mehmood', 'Mason (Raj Mistry)', 'Present', 2800, 2, 3500, 'Pending', '', ''],
      ['Muhammad Aslam', 'Mason (Raj Mistry)', 'Present', 2800, 0, 2800, 'Pending', '', ''],
      ['Rashid Minhas', 'Shuttering Carpenter', 'Present', 3000, 3, 4125, 'Pending', '', ''],
      ['Naveed Akhtar', 'Shuttering Carpenter', 'Present', 3000, 0, 3000, 'Pending', '', ''],
      ['Zubair Ahmed', 'Steel Fixer (Bar Bender)', 'Present', 2900, 2, 3625, 'Pending', '', ''],
      ['Muhammad Akram', 'Helper / Mazdoor', 'Present', 1600, 2, 2000, 'Pending', '', ''],
      ['Bilal Hussain', 'Helper / Mazdoor', 'Present', 1600, 0, 1600, 'Pending', '', ''],
      ['Imran Ali', 'Helper / Mazdoor', 'Half day', 1600, 0, 800, 'Pending', '', ''],
      ['Sajjad Malik', 'Plumber', 'Present', 2700, 0, 2700, 'Paid', '2026-10-19', 'Cash'],
      ['Arshad Khan', 'Electrician', 'Present', 2700, 1, 3038, 'Paid', '2026-10-19', 'Cash'],
    ]
    for (const w of workers) {
      insertLabor.run(projectId, '2026-10-19', w[0], w[1], w[2], w[3], w[4], w[5], w[6], w[7], w[8])
    }
  }

  const inspCount = Number((db.prepare('SELECT COUNT(*) as count FROM site_inspections').get() as { count: number }).count)
  if (inspCount === 0) {
    const insertInsp = db.prepare(`
      INSERT INTO site_inspections (inspection_number, project_id, inspection_type, inspection_date, inspector_name, result, comments)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    insertInsp.run('INS-001', projectId, 'Steel & Shuttering Pre-Pour', '2026-10-18', 'Engr. Bilal Khan', 'Passed', 'Column C1 to C8 rebar cover spacers 40mm installed, tie wire tightened, vertical plumb verified within 3mm tolerance.')
    insertInsp.run('INS-002', projectId, 'Concrete Slump & Cube Test', '2026-10-15', 'PCSIR Material Lab', 'Passed', 'Slump test measured 105mm (target 100±25mm). 7-day compressive strength achieved 21.4 MPa.')
    insertInsp.run('INS-003', projectId, 'Plumbing Pressure Test', '2026-10-12', 'Engr. Hamza Tariq', 'Passed with comments', 'Water line held 10 bar pressure for 4 hours without drop. Joint 4 in shaft B had minor weeping, tightened and re-tested.')
  }

  const snagCount = Number((db.prepare('SELECT COUNT(*) as count FROM site_snags').get() as { count: number }).count)
  if (snagCount === 0) {
    const insertSnag = db.prepare(`
      INSERT INTO site_snags (snag_number, project_id, location, description, severity, due_date, status, resolution_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    insertSnag.run('SNG-001', projectId, '1st Floor Shaft B', 'PPRC pipe clip bracket missing on riser pipe.', 'Medium', '2026-10-25', 'In Progress', 'Vendor notified, clamp bracket will be installed today.')
    insertSnag.run('SNG-002', projectId, 'Basement Parking Beam B-2', 'Minor surface honeycombing at beam bottom after shuttering strip.', 'High', '2026-10-22', 'Fixed', 'Cleaned with wire brush and patched with non-shrink structural epoxy mortar.')
    insertSnag.run('SNG-003', projectId, 'Ground Floor Main Corridor', 'Mortar drops on aluminum window sub-frame sill.', 'Low', '2026-10-28', 'Open', 'Requires scraper and solvent cleaning before glass glazing.')
  }

  const milesCount = Number((db.prepare('SELECT COUNT(*) as count FROM project_milestones').get() as { count: number }).count)
  if (milesCount === 0) {
    const insertMile = db.prepare(`
      INSERT INTO project_milestones (project_id, title, stage_name, target_start_date, target_end_date, actual_end_date, progress_percent, status, weightage_percent, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const milestones = [
      ['Mobilization & Site Layout Survey', 'Substructure & Excavation', '2026-06-01', '2026-06-15', '2026-06-14', 100, 'Completed', 5, 'Boundary demarcation and site office setup.'],
      ['Foundation Excavation & Lean Concrete', 'Substructure & Excavation', '2026-06-16', '2026-07-10', '2026-07-08', 100, 'Completed', 15, 'Raft excavation up to 12ft depth.'],
      ['Substructure Raft & Plinth Beam', 'Substructure & Excavation', '2026-07-12', '2026-08-15', '2026-08-14', 100, 'Completed', 20, 'Termite treatment and DPC membrane laid.'],
      ['Ground & 1st Floor RCC Frame Structure', 'RCC Structure', '2026-08-16', '2026-10-30', '', 85, 'In progress', 25, '2nd floor slab casting scheduled for next week.'],
      ['Brickwork Masonry & Internal Plaster', 'Masonry & Plaster', '2026-10-01', '2026-12-15', '', 40, 'In progress', 15, 'Ground floor masonry completed; 1st floor under way.'],
      ['Concealed MEP (Electrical & Plumbing)', 'MEP Services', '2026-10-15', '2026-12-30', '', 25, 'In progress', 10, 'Conduit piping embedded in slabs.'],
      ['Flooring, Wall Tiles & False Ceiling', 'Flooring & Finishes', '2027-01-01', '2027-02-28', '', 0, 'Pending', 7, 'Procurement of porcelain tiles finalized.'],
      ['Testing, Snagging & Final Client Handover', 'Testing & Handover', '2027-03-01', '2027-03-25', '', 0, 'Pending', 3, 'Final audit and completion certificate.'],
    ]
    for (const m of milestones) {
      insertMile.run(projectId, m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8])
    }
  }
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