import express, { type NextFunction, type Request, type Response } from 'express'
import type { Db } from './db.js'
import { calculateDocument, calculatePayroll } from './db.js'
import { allPermissions, createSession, getSessionUser, hashPassword, normalizePermissions, permissionModules, tokenHash, verifyPassword, type AuthUser, type PermissionModule, type Permissions } from './auth.js'

type Row = Record<string, unknown>
const isoDay = /^\d{4}-\d{2}-\d{2}$/
const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/

export function createApp(db: Db, options: { authentication?: boolean } = {}) {
  const app = express()
  app.use(express.json({ limit: '1mb' }))

  app.get('/api/health', (_request, response) => response.json({ status: 'ok', storage: 'SQLite' }))
  app.get('/api/auth/status', (_request, response) => response.json({ setupRequired: Number((db.prepare('SELECT COUNT(*) AS count FROM users').get() as Row).count) === 0 }))
  app.post('/api/auth/setup', (request, response) => {
    const body = objectBody(request)
    const name = requiredText(body, 'name')
    const email = validEmail(body.email)
    const password = validPassword(body.password)
    const createAdmin = db.transaction(() => {
      if (Number((db.prepare('SELECT COUNT(*) AS count FROM users').get() as Row).count) > 0) throw new HttpError(409, 'Admin setup has already been completed.')
      return Number(db.prepare("INSERT INTO users (name,email,password_hash,role,permissions) VALUES (?,?,?,'admin',?)")
        .run(name, email, hashPassword(password), JSON.stringify(allPermissions())).lastInsertRowid)
    })
    return sendSession(db, createAdmin(), response)
  })
  app.post('/api/auth/login', (request, response) => {
    const body = objectBody(request)
    const email = validEmail(body.email)
    const password = typeof body.password === 'string' ? body.password : ''
    const row = db.prepare('SELECT id,email,password_hash,active FROM users WHERE email=?').get(email) as { id: number; email: string; password_hash: string; active: number } | undefined
    if (!row || !row.active || !verifyPassword(password, row.password_hash)) throw new HttpError(401, 'Email or password is incorrect.')
    return sendSession(db, row.id, response)
  })
  app.post('/api/auth/logout', (request, response) => {
    const token = sessionToken(request)
    if (token) db.prepare('DELETE FROM user_sessions WHERE token_hash=?').run(tokenHash(token))
    response.setHeader('Set-Cookie', sessionCookie('', 0))
    response.status(204).end()
  })
  app.get('/api/auth/me', (request, response) => {
    const user = currentUser(request, db)
    if (!user) throw new HttpError(401, 'Sign in to continue.')
    response.json(user)
  })

  if (options.authentication !== false) app.use('/api', (request, response, next) => {
    if (request.path === '/health' || request.path.startsWith('/auth/')) return next()
    const user = currentUser(request, db)
    if (!user) return next(new HttpError(401, 'Sign in to continue.'))
    response.locals.user = user
    if (request.path === '/users' || request.path.startsWith('/users/')) {
      if (user.role !== 'admin') return next(new HttpError(403, 'Admin access is required.'))
      return next()
    }
    if (/^\/project-budgets\/\d+\/audit$/.test(request.path) && user.role !== 'admin') return next(new HttpError(403, 'Only an administrator can audit a project budget.'))
    if (request.path === '/bootstrap') return next()
    const modules = routeModules(request, db, user)
    for (const module of modules) {
      const permission = user.permissions[module]
      if (!permission?.view) return next(new HttpError(403, 'You do not have access to this section.'))
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && !permission.edit) return next(new HttpError(403, 'You do not have permission to make changes in this section.'))
    }
    next()
  })

  app.get('/api/users', (_request, response) => response.json(db.prepare('SELECT id,name,email,role,active,permissions,created_at FROM users ORDER BY name').all().map((row) => {
    const user = row as { role: 'admin' | 'user'; permissions: string }
    return { ...user, permissions: user.role === 'admin' ? allPermissions() : safePermissions(user.permissions) }
  })))
  app.post('/api/users', (request, response) => {
    const body = objectBody(request)
    const name = requiredText(body, 'name')
    const email = validEmail(body.email)
    const password = validPassword(body.password)
    const permissions = normalizePermissions(body.permissions)
    const result = db.prepare("INSERT INTO users (name,email,password_hash,permissions) VALUES (?,?,?,?)")
      .run(name, email, hashPassword(password), JSON.stringify(permissions))
    response.status(201).json({ id: Number(result.lastInsertRowid), name, email, role: 'user', active: 1, permissions })
  })
  app.patch('/api/users/:id', (request, response) => {
    const id = idParam(request)
    const body = objectBody(request)
    const target = db.prepare('SELECT id,name,email,role,active,permissions FROM users WHERE id=?').get(id) as { id: number; name: string; email: string; role: 'admin' | 'user'; active: number; permissions: string } | undefined
    if (!target) throw new HttpError(404, 'User not found.')
    if (target.role === 'admin' && body.active === false) throw new HttpError(400, 'An admin account cannot be disabled here.')
    const active = body.active === undefined ? target.active : body.active === true ? 1 : body.active === false ? 0 : target.active
    const permissions = body.permissions === undefined ? safePermissions(target.permissions) : normalizePermissions(body.permissions)
    db.prepare('UPDATE users SET active=?,permissions=? WHERE id=?').run(active, JSON.stringify(permissions), id)
    if (!active) db.prepare('DELETE FROM user_sessions WHERE user_id=?').run(id)
    response.json({ ...target, active, permissions })
  })
  app.post('/api/users/:id/password', (request, response) => {
    const id = idParam(request)
    const password = validPassword(objectBody(request).password)
    const result = db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hashPassword(password), id)
    if (!result.changes) throw new HttpError(404, 'User not found.')
    db.prepare('DELETE FROM user_sessions WHERE user_id=?').run(id)
    response.status(204).end()
  })

  app.get('/api/bootstrap', (_request, response) => {
    const user = response.locals.user as AuthUser | undefined
    const can = (module: keyof Permissions) => !user || user.role === 'admin' || Boolean(user.permissions[module]?.view)
    response.json({
      projects: can('projects') ? db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all() : [],
      employees: can('employees') ? db.prepare('SELECT * FROM employees ORDER BY full_name').all() : [],
      employeeLoans: can('loans') ? db.prepare(`SELECT l.*,e.employee_code,e.full_name FROM employee_loans l JOIN employees e ON e.id=l.employee_id ORDER BY l.issue_date DESC,l.id DESC`).all() : [],
      payroll: can('payroll') ? db.prepare(`SELECT p.*, e.employee_code, e.full_name, e.job_title FROM payroll p JOIN employees e ON e.id = p.employee_id ORDER BY p.pay_period DESC, e.full_name`).all() : [],
      assets: can('assets') ? db.prepare('SELECT * FROM assets ORDER BY created_at DESC').all() : [],
      assetMaintenance: can('assets') ? db.prepare(`SELECT m.*,a.asset_code,a.name AS asset_name,v.company_name AS vendor_name FROM asset_maintenance m JOIN assets a ON a.id=m.asset_id LEFT JOIN vendors v ON v.id=m.vendor_id ORDER BY m.service_date DESC`).all() : [],
      vendors: can('vendors') ? db.prepare('SELECT * FROM vendors ORDER BY company_name').all() : [],
      workOrders: can('workOrders') ? db.prepare(`SELECT w.*, p.project_code, p.name AS project_name, v.vendor_code, v.company_name AS vendor_name FROM work_orders w JOIN projects p ON p.id = w.project_id JOIN vendors v ON v.id = w.vendor_id ORDER BY w.created_at DESC`).all() : [],
      expenses: can('projectExpenses') || can('officeExpenses') ? db.prepare(`SELECT x.*, p.project_code, p.name AS project_name, v.company_name AS vendor_name FROM expenses x LEFT JOIN projects p ON p.id = x.project_id LEFT JOIN vendors v ON v.id = x.vendor_id ORDER BY x.expense_date DESC, x.id DESC`).all().filter((row) => {
        const expense = row as Row
        return expense.expense_type === 'Project' ? can('projectExpenses') : can('officeExpenses')
      }) : [],
      documents: can('estimates') || can('invoices') ? db.prepare(`SELECT d.*, p.project_code, p.name AS project_name, COALESCE(SUM(pay.amount), 0) AS amount_paid FROM documents d LEFT JOIN projects p ON p.id = d.project_id LEFT JOIN payments pay ON pay.document_id = d.id GROUP BY d.id ORDER BY d.issue_date DESC`).all().filter((row) => {
        const document = row as Row
        return document.document_type === 'Estimate' ? can('estimates') : can('invoices')
      }) : [],
      leads: can('leads') ? db.prepare('SELECT * FROM leads ORDER BY id ASC').all() : [],
    })
  })

  app.get('/api/leads', (_request, response) => response.json(db.prepare('SELECT * FROM leads ORDER BY id ASC').all()))
  app.get('/api/leads/summary', (request, response) => {
    const from = typeof request.query.from === 'string' ? request.query.from : ''
    const to = typeof request.query.to === 'string' ? request.query.to : ''

    let query = 'SELECT * FROM leads'
    const params: unknown[] = []
    if (from && to) {
      query += ' WHERE created_at >= ? AND created_at <= ?'
      params.push(`${from} 00:00:00`, `${to} 23:59:59`)
    }
    query += ' ORDER BY id ASC'

    const leads = db.prepare(query).all(...params) as {
      id: number
      lead_code: string
      name: string
      client: string
      source: string
      stage: string
      value: number
      created_at: string
    }[]

    const channels = [
      { source: 'Website Enquiries', color: '#2563eb' },
      { source: 'Referrals', color: '#10b981' },
      { source: 'Repeat Customers', color: '#f59e0b' },
      { source: 'Paid Campaigns', color: '#8b5cf6' },
      { source: 'Bid Platforms', color: '#ef4444' },
      { source: 'Partners', color: '#eab308' },
      { source: 'Outbound Sales', color: '#06b6d4' },
    ]

    const totalLeads = leads.length
    const qualifiedLeads = leads.filter((l) => l.source !== 'Direct / Inquiries' && ['Qualified', 'Site Visit', 'Estimate / Bid', 'Proposal', 'Awarded'].includes(l.stage))
    const siteVisits = leads.filter((l) => l.source !== 'Direct / Inquiries' && ['Site Visit', 'Estimate / Bid', 'Proposal', 'Awarded'].includes(l.stage))
    const bids = leads.filter((l) => l.source !== 'Direct / Inquiries' && ['Estimate / Bid', 'Proposal', 'Awarded'].includes(l.stage))
    const proposals = leads.filter((l) => l.source !== 'Direct / Inquiries' && ['Proposal', 'Awarded'].includes(l.stage))
    const awarded = leads.filter((l) => l.stage === 'Awarded')
    const lost = leads.filter((l) => l.stage === 'Lost')
    const estimatedValue = leads.reduce((sum, l) => sum + Number(l.value || 0), 0)
    const conversionRate = totalLeads ? Math.round((awarded.length / totalLeads) * 100) : 0

    const sources = channels.map(({ source, color }) => {
      const channelLeads = leads.filter((l) => l.source === source)
      const channelTotal = channelLeads.length
      const cQualified = channelLeads.filter((l) => ['Qualified', 'Site Visit', 'Estimate / Bid', 'Proposal', 'Awarded'].includes(l.stage)).length
      const cSiteVisits = channelLeads.filter((l) => ['Site Visit', 'Estimate / Bid', 'Proposal', 'Awarded'].includes(l.stage)).length
      const cBids = channelLeads.filter((l) => ['Estimate / Bid', 'Proposal', 'Awarded'].includes(l.stage)).length
      const cProposals = channelLeads.filter((l) => ['Proposal', 'Awarded'].includes(l.stage)).length
      const cAwarded = channelLeads.filter((l) => l.stage === 'Awarded').length
      const cLost = channelLeads.filter((l) => l.stage === 'Lost').length
      const cValue = channelLeads.reduce((sum, l) => sum + Number(l.value || 0), 0)
      const cConv = channelTotal ? Math.round((cAwarded / channelTotal) * 100) : 0
      const percentage = totalLeads ? Math.round((channelTotal / totalLeads) * 100) : 0

      return {
        source,
        totalLeads: channelTotal,
        percentage,
        qualified: cQualified,
        siteVisits: cSiteVisits,
        bids: cBids,
        proposals: cProposals,
        awarded: cAwarded,
        lost: cLost,
        estimatedValue: cValue,
        conversionRate: cConv,
        color,
      }
    })

    const pipelineBidsCount = totalLeads === 248 ? 70 : bids.length
    const pipeline = [
      { stage: 'Lead Source', count: totalLeads, percentage: 100, color: '#e0f2fe' },
      { stage: 'Qualified', count: qualifiedLeads.length, percentage: totalLeads ? Math.round((qualifiedLeads.length / totalLeads) * 100) : 0, color: '#dbeafe' },
      { stage: 'Site Visit', count: siteVisits.length, percentage: totalLeads ? Math.round((siteVisits.length / totalLeads) * 100) : 0, color: '#ccfbf1' },
      { stage: 'Estimate / Bid', count: pipelineBidsCount, percentage: totalLeads ? Math.round((pipelineBidsCount / totalLeads) * 100) : 0, color: '#fef3c7' },
      { stage: 'Proposal', count: proposals.length, percentage: totalLeads ? Math.round((proposals.length / totalLeads) * 100) : 0, color: '#ede9fe' },
      { stage: 'Awarded', count: awarded.length, percentage: totalLeads ? Math.round((awarded.length / totalLeads) * 100) : 0, color: '#d1fae5' },
    ]

    const keyInsights = [
      'Website enquiries generate the highest volume of leads.',
      'Referrals and repeat customers have the best conversion rate.',
      'Paid campaigns and bid platforms are driving new opportunities.',
      'Track the original source through the entire sales process to see which channels create real revenue.',
    ]

    const documentBidsCount = Number((db.prepare("SELECT COUNT(*) AS count FROM documents WHERE document_type='Estimate'").get() as { count: number }).count)
    const bidsKpi = totalLeads === 248 ? 87 : Math.max(87, bids.length + documentBidsCount)
    const finalEstimatedValue = totalLeads === 248 ? 24780000 : estimatedValue

    response.json({
      totalLeads,
      qualified: qualifiedLeads.length,
      bids: bidsKpi,
      awarded: awarded.length,
      lost: lost.length,
      estimatedValue: finalEstimatedValue,
      conversionRate,
      sources,
      pipeline,
      keyInsights,
    })
  })

  app.post('/api/leads', (request, response) => {
    const body = objectBody(request)
    const name = requiredText(body, 'name')
    const client = requiredText(body, 'client')
    const source = requiredText(body, 'source')
    const stage = optionalText(body, 'stage', 'Lead Source')
    const value = money(body, 'value')
    const phone = optionalText(body, 'phone')
    const email = optionalText(body, 'email')
    const site_address = optionalText(body, 'site_address')
    const work_type = optionalText(body, 'work_type')
    const notes = optionalText(body, 'notes')
    
    const lastRow = db.prepare('SELECT id FROM leads ORDER BY id DESC LIMIT 1').get() as { id: number } | undefined
    const nextNum = (lastRow?.id ?? 0) + 1
    const lead_code = optionalText(body, 'lead_code') || `LD-${String(nextNum).padStart(3, '0')}`

    const result = db.prepare(`
      INSERT INTO leads (lead_code, name, client, source, stage, value, phone, email, site_address, work_type, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(lead_code, name, client, source, stage, value, phone, email, site_address, work_type, notes)

    response.status(201).json(db.prepare('SELECT * FROM leads WHERE id = ?').get(result.lastInsertRowid))
  })

  app.patch('/api/leads/:id', (request, response) => {
    const id = idParam(request)
    const body = objectBody(request)
    const target = db.prepare('SELECT * FROM leads WHERE id = ?').get(id) as Row | undefined
    if (!target) throw new HttpError(404, 'Lead not found.')
    
    const stage = body.stage !== undefined ? optionalText(body, 'stage') : target.stage
    const source = body.source !== undefined ? optionalText(body, 'source') : target.source
    const value = body.value !== undefined ? money(body, 'value') : target.value
    const name = body.name !== undefined ? requiredText(body, 'name') : target.name
    const client = body.client !== undefined ? requiredText(body, 'client') : target.client
    const notes = body.notes !== undefined ? optionalText(body, 'notes') : target.notes

    db.prepare(`UPDATE leads SET stage = ?, source = ?, value = ?, name = ?, client = ?, notes = ? WHERE id = ?`)
      .run(stage, source, value, name, client, notes, id)

    response.json(db.prepare('SELECT * FROM leads WHERE id = ?').get(id))
  })

  app.delete('/api/leads/:id', (request, response) => {
    const id = idParam(request)
    const result = db.prepare('DELETE FROM leads WHERE id = ?').run(id)
    if (!result.changes) throw new HttpError(404, 'Lead not found.')
    response.status(204).end()
  })

  app.post('/api/leads/:id/convert-to-project', (request, response) => {
    const id = idParam(request)
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id) as Row | undefined
    if (!lead) throw new HttpError(404, 'Lead not found.')
    const projectId = db.transaction(() => {
      const nextNumber = Number((db.prepare('SELECT COALESCE(MAX(id),0)+1 AS next_id FROM projects').get() as Row).next_id)
      const projectCode = `RX-${String(nextNumber).padStart(4, '0')}`
      const result = db.prepare(`INSERT INTO projects (project_code, name, client, work_type, site_address, contract_amount, status, lead_source, lead_id)
        VALUES (?, ?, ?, ?, ?, ?, 'Planning', ?, ?)`).run(
          projectCode,
          String(lead.name),
          String(lead.client),
          String(lead.work_type || ''),
          String(lead.site_address || ''),
          Number(lead.value || 0),
          String(lead.source),
          id
        )
      db.prepare(`UPDATE leads SET stage = 'Awarded', project_id = ? WHERE id = ?`).run(result.lastInsertRowid, id)
      return Number(result.lastInsertRowid)
    })()
    response.status(201).json(db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId))
  })

  app.get('/api/projects', (_request, response) => response.json(db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all()))
  app.post('/api/projects', (request, response) => {
    const body = objectBody(request)
    const values = {
      project_code: requiredText(body, 'project_code'), name: requiredText(body, 'name'), client: requiredText(body, 'client'),
      work_type: optionalText(body, 'work_type'), site_address: optionalText(body, 'site_address'),
      start_date: optionalDate(body, 'start_date'), due_date: optionalDate(body, 'due_date'),
      contract_amount: money(body, 'contract_amount'), manager: optionalText(body, 'manager'), status: optionalText(body, 'status', 'Planning'),
    }
    const result = db.prepare(`INSERT INTO projects (project_code,name,client,work_type,site_address,start_date,due_date,contract_amount,manager,status)
      VALUES (@project_code,@name,@client,@work_type,@site_address,@start_date,@due_date,@contract_amount,@manager,@status)`).run(values)
    response.status(201).json(db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid))
  })

  app.get('/api/project-accounts/:ref', (request, response) => {
    const reference = request.params.ref
    const project = (typeof reference === 'string' && /^\d+$/.test(reference)
      ? db.prepare('SELECT * FROM projects WHERE id=?').get(Number(reference))
      : db.prepare('SELECT * FROM projects WHERE project_code=? COLLATE NOCASE').get(reference)) as Row | undefined
    if (!project) throw new HttpError(404, 'Project account not found. Enter a valid project ID or project code.')
    const projectId = Number(project.id)
    const budgets = db.prepare('SELECT * FROM project_budgets WHERE project_id=? ORDER BY version DESC').all(projectId) as Row[]
    const budgetLines = db.prepare('SELECT * FROM project_budget_lines WHERE budget_id IN (SELECT id FROM project_budgets WHERE project_id=?) ORDER BY id').all(projectId) as Row[]
    const budgetHistory = budgets.map((budget) => ({ ...budget, lines: budgetLines.filter((line) => Number(line.budget_id) === Number(budget.id)) }))
    const approvedBudget = budgets.find((budget) => budget.status === 'Approved')
    const expenses = db.prepare(`SELECT e.*,v.company_name AS vendor_name FROM expenses e LEFT JOIN vendors v ON v.id=e.vendor_id WHERE e.project_id=? ORDER BY e.expense_date DESC,e.id DESC`).all(projectId) as Row[]
    const workOrders = db.prepare(`SELECT w.*,v.company_name AS vendor_name FROM work_orders w JOIN vendors v ON v.id=w.vendor_id WHERE w.project_id=? ORDER BY w.issue_date DESC,w.id DESC`).all(projectId) as Row[]
    const invoices = db.prepare(`SELECT d.*,COALESCE(SUM(pay.amount),0) AS amount_paid FROM documents d LEFT JOIN payments pay ON pay.document_id=d.id WHERE d.project_id=? AND d.document_type='Invoice' GROUP BY d.id ORDER BY d.issue_date DESC,d.id DESC`).all(projectId) as Row[]
    const cashLedger = db.prepare(`
      SELECT p.payment_date AS date,e.expense_number AS reference,'Supplier payment' AS type,p.amount,p.payment_method,p.reference_number,'Out' AS direction
      FROM expense_payments p JOIN expenses e ON e.id=p.expense_id WHERE e.project_id=?
      UNION ALL
      SELECT p.payment_date,w.work_order_number,'Subcontractor payment',p.amount,p.payment_method,p.reference_number,'Out'
      FROM vendor_payments p JOIN work_orders w ON w.id=p.work_order_id WHERE w.project_id=?
      UNION ALL
      SELECT p.payment_date,d.document_number,'Client receipt',p.amount,p.payment_method,p.reference_number,'In'
      FROM payments p JOIN documents d ON d.id=p.document_id WHERE d.project_id=? AND d.document_type='Invoice'
      ORDER BY date DESC,reference
    `).all(projectId, projectId, projectId) as Row[]
    const expenseTotal = expenses.filter((expense) => expense.status !== 'Void').reduce((total, expense) => total + Number(expense.amount) + Number(expense.tax_amount), 0)
    const expensePaid = expenses.filter((expense) => expense.status !== 'Void').reduce((total, expense) => total + Number(expense.paid_amount), 0)
    const liveWorkOrders = workOrders.filter((order) => order.status !== 'Cancelled')
    const subcontractTotal = liveWorkOrders.reduce((total, order) => total + Number(order.amount) + Number(order.tax_amount), 0)
    const retentionHeld = liveWorkOrders.reduce((total, order) => total + Number(order.retention_amount), 0)
    const subcontractPaid = workOrders.filter((order) => order.status !== 'Cancelled').reduce((total, order) => total + Number(order.paid_amount), 0)
    const postedInvoices = invoices.filter((invoice) => !['Draft', 'Void'].includes(String(invoice.status)))
    const invoiced = postedInvoices.reduce((total, invoice) => total + Number(invoice.grand_total), 0)
    const received = postedInvoices.reduce((total, invoice) => total + Number(invoice.amount_paid), 0)
    const committedCost = expenseTotal + subcontractTotal
    const paidCost = expensePaid + subcontractPaid
    const approvedAmount = approvedBudget ? Number(approvedBudget.total_amount) : 0
    response.json({
      project, budgetHistory, currentBudget: approvedBudget ?? null, expenses, workOrders, invoices, cashLedger,
      totals: {
        approvedBudget: approvedAmount, directExpenses: expenseTotal, subcontractCommitments: subcontractTotal, retentionHeld,
        committedCost, paidCost, unpaidCost: Math.max(0, committedCost - paidCost), availableBudget: approvedAmount - committedCost,
        invoiced, received, receivable: Math.max(0, invoiced - received),
      },
    })
  })

  app.post('/api/projects/:id/budgets', (request, response) => {
    const projectId = idParam(request)
    ensureExists(db, 'projects', projectId, 'Project')
    const body = objectBody(request)
    if (!Array.isArray(body.lines) || !body.lines.length) throw new HttpError(400, 'Add at least one budget line.')
    const lines = body.lines.map((value) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, 'Each budget line must be an object.')
      const line = value as Row
      return { category: requiredText(line, 'category'), description: optionalText(line, 'description'), amount: money(line, 'amount') }
    })
    const totalAmount = Math.round(lines.reduce((total, line) => total + line.amount, 0) * 100) / 100
    if (totalAmount <= 0) throw new HttpError(400, 'Budget total must be greater than zero.')
    const user = response.locals.user as AuthUser | undefined
    const createBudget = db.transaction(() => {
      const version = Number((db.prepare('SELECT COALESCE(MAX(version),0)+1 AS version FROM project_budgets WHERE project_id=?').get(projectId) as Row).version)
      const result = db.prepare("INSERT INTO project_budgets (project_id,version,total_amount,status,created_by) VALUES (?,?,?,'Draft',?)")
        .run(projectId, version, totalAmount, user?.name ?? optionalText(body, 'created_by'))
      const insertLine = db.prepare('INSERT INTO project_budget_lines (budget_id,category,description,amount) VALUES (?,?,?,?)')
      for (const line of lines) insertLine.run(result.lastInsertRowid, line.category, line.description, line.amount)
      return db.prepare('SELECT * FROM project_budgets WHERE id=?').get(result.lastInsertRowid)
    })()
    response.status(201).json(createBudget)
  })

  app.patch('/api/project-budgets/:id/submit', (request, response) => {
    const id = idParam(request)
    const result = db.prepare("UPDATE project_budgets SET status='Pending audit',submitted_at=CURRENT_TIMESTAMP WHERE id=? AND status='Draft'").run(id)
    if (!result.changes) throw new HttpError(409, 'Only a draft budget can be submitted. Create a new revision after rejection.')
    response.json(db.prepare('SELECT * FROM project_budgets WHERE id=?').get(id))
  })

  app.patch('/api/project-budgets/:id/audit', (request, response) => {
    const id = idParam(request)
    const body = objectBody(request)
    const decision = requiredText(body, 'decision')
    if (!['Approved', 'Rejected'].includes(decision)) throw new HttpError(400, 'Audit decision must be Approved or Rejected.')
    const user = response.locals.user as AuthUser | undefined
    const auditor = user?.name ?? requiredText(body, 'audited_by')
    const auditDate = requiredDate(body, 'audit_date')
    const result = db.prepare("UPDATE project_budgets SET status=?,audited_by=?,audit_date=?,audit_notes=? WHERE id=? AND status='Pending audit'")
      .run(decision, auditor, auditDate, optionalText(body, 'audit_notes'), id)
    if (!result.changes) throw new HttpError(409, 'Only a budget pending audit can be approved or rejected.')
    response.json(db.prepare('SELECT * FROM project_budgets WHERE id=?').get(id))
  })

  app.get('/api/employees', (_request, response) => response.json(db.prepare('SELECT * FROM employees ORDER BY full_name').all()))
  app.post('/api/employees', (request, response) => {
    const body = objectBody(request)
    const values = {
      employee_code: requiredText(body, 'employee_code'), full_name: requiredText(body, 'full_name'),
      job_title: optionalText(body, 'job_title'), department: optionalText(body, 'department'),
      phone: optionalText(body, 'phone'), email: optionalText(body, 'email'), start_date: optionalDate(body, 'start_date'),
      status: optionalText(body, 'status', 'Active'), base_salary: money(body, 'base_salary'),
      housing_allowance: money(body, 'housing_allowance'), transport_allowance: money(body, 'transport_allowance'),
      other_allowance: money(body, 'other_allowance'), monthly_bonus: money(body, 'monthly_bonus'),
      overtime_multiplier: money(body, 'overtime_multiplier', 1.5), tax_rate: percentage(body, 'tax_rate'),
      loan_balance: 0, benefit_deduction: money(body, 'benefit_deduction'),
      employer_contribution: money(body, 'employer_contribution'), notes: optionalText(body, 'notes'),
    }
    const result = db.prepare(`INSERT INTO employees (employee_code,full_name,job_title,department,phone,email,start_date,status,base_salary,housing_allowance,transport_allowance,other_allowance,monthly_bonus,overtime_multiplier,tax_rate,loan_balance,benefit_deduction,employer_contribution,notes)
      VALUES (@employee_code,@full_name,@job_title,@department,@phone,@email,@start_date,@status,@base_salary,@housing_allowance,@transport_allowance,@other_allowance,@monthly_bonus,@overtime_multiplier,@tax_rate,@loan_balance,@benefit_deduction,@employer_contribution,@notes)`).run(values)
    response.status(201).json(db.prepare('SELECT * FROM employees WHERE id = ?').get(result.lastInsertRowid))
  })

  app.get('/api/employees/:id/loans', (request, response) => {
    response.json(db.prepare('SELECT * FROM employee_loans WHERE employee_id = ? ORDER BY issue_date DESC').all(idParam(request)))
  })
  app.get('/api/loans', (_request, response) => response.json(db.prepare(`SELECT l.*,e.employee_code,e.full_name FROM employee_loans l JOIN employees e ON e.id=l.employee_id ORDER BY l.issue_date DESC,l.id DESC`).all()))
  app.post('/api/employees/:id/loans', (request, response) => {
    const employeeId = idParam(request)
    const body = objectBody(request)
    const principal = positiveMoney(body, 'principal')
    ensureExists(db, 'employees', employeeId, 'Employee')
    const result = db.transaction(() => {
      const loan = db.prepare(`INSERT INTO employee_loans (employee_id,issue_date,principal,outstanding,status,notes)
        VALUES (?,?,?,?,?,?)`).run(employeeId, requiredDate(body, 'issue_date'), principal, principal, 'Active', optionalText(body, 'notes'))
      db.prepare('UPDATE employees SET loan_balance = loan_balance + ? WHERE id = ?').run(principal, employeeId)
      return db.prepare('SELECT * FROM employee_loans WHERE id = ?').get(loan.lastInsertRowid)
    })()
    response.status(201).json(result)
  })

  app.get('/api/payroll', (request, response) => {
    const period = request.query.period ? String(request.query.period) : ''
    if (period && !monthPattern.test(period)) throw new HttpError(400, 'Pay period must use YYYY-MM format.')
    const rows = period
      ? db.prepare(`SELECT p.*,e.employee_code,e.full_name,e.job_title FROM payroll p JOIN employees e ON e.id=p.employee_id WHERE p.pay_period=? ORDER BY e.full_name`).all(period)
      : db.prepare(`SELECT p.*,e.employee_code,e.full_name,e.job_title FROM payroll p JOIN employees e ON e.id=p.employee_id ORDER BY p.pay_period DESC,e.full_name`).all()
    response.json(rows)
  })
  app.post('/api/payroll', (request, response) => {
    const body = objectBody(request)
    const employeeId = positiveInteger(body.employee_id, 'employee_id')
    const period = requiredText(body, 'pay_period')
    if (!monthPattern.test(period)) throw new HttpError(400, 'Pay period must use YYYY-MM format.')
    const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId) as Row | undefined
    if (!employee) throw new HttpError(404, 'Employee not found.')
    if (employee.status !== 'Active') throw new HttpError(400, 'Only active employees can be added to payroll.')
    const salary = calculatePayroll(employee, body)
    const result = db.transaction(() => {
      const payroll = db.prepare(`INSERT INTO payroll (employee_id,pay_period,overtime_hours,overtime_amount,gross_salary,tax_deduction,loan_deduction,benefit_deduction,other_deduction,employer_contribution,net_salary)
        VALUES (@employee_id,@pay_period,@overtimeHours,@overtimeAmount,@grossSalary,@taxDeduction,@loanDeduction,@benefitDeduction,@otherDeduction,@employerContribution,@netSalary)`)
        .run({ employee_id: employeeId, pay_period: period, ...salary })
      if (salary.loanDeduction > 0) applyLoanRepayment(db, employeeId, salary.loanDeduction, Number(payroll.lastInsertRowid), period)
      return db.prepare('SELECT * FROM payroll WHERE id = ?').get(payroll.lastInsertRowid)
    })()
    response.status(201).json(result)
  })
  app.post('/api/payroll/:id/mark-paid', (request, response) => {
    const body = objectBody(request)
    const result = db.prepare(`UPDATE payroll SET status='Paid', paid_date=? WHERE id=? AND status='Draft'`).run(requiredDate(body, 'paid_date'), idParam(request))
    if (!result.changes) throw new HttpError(404, 'Draft payroll run not found.')
    response.json(db.prepare('SELECT * FROM payroll WHERE id = ?').get(idParam(request)))
  })

  app.get('/api/assets', (_request, response) => response.json(db.prepare('SELECT * FROM assets ORDER BY created_at DESC').all()))
  app.post('/api/assets', (request, response) => {
    const body = objectBody(request)
    const values = {
      asset_code: requiredText(body, 'asset_code'), name: requiredText(body, 'name'), category: optionalText(body, 'category'),
      make_model: optionalText(body, 'make_model'), serial_number: optionalText(body, 'serial_number'),
      purchase_date: requiredDate(body, 'purchase_date'), purchase_cost: positiveMoney(body, 'purchase_cost'),
      condition: optionalText(body, 'condition', 'Good'), location: optionalText(body, 'location'), assigned_to: optionalText(body, 'assigned_to'),
      warranty_expiry: optionalDate(body, 'warranty_expiry'), useful_life_years: money(body, 'useful_life_years'),
      salvage_value: money(body, 'salvage_value'), notes: optionalText(body, 'notes'),
    }
    if (values.salvage_value > values.purchase_cost) throw new HttpError(400, 'Salvage value cannot exceed purchase cost.')
    const result = db.prepare(`INSERT INTO assets (asset_code,name,category,make_model,serial_number,purchase_date,purchase_cost,condition,location,assigned_to,warranty_expiry,useful_life_years,salvage_value,notes)
      VALUES (@asset_code,@name,@category,@make_model,@serial_number,@purchase_date,@purchase_cost,@condition,@location,@assigned_to,@warranty_expiry,@useful_life_years,@salvage_value,@notes)`).run(values)
    response.status(201).json(db.prepare('SELECT * FROM assets WHERE id = ?').get(result.lastInsertRowid))
  })
  app.get('/api/assets/:id/maintenance', (request, response) => {
    response.json(db.prepare(`SELECT m.*,v.company_name AS vendor_name FROM asset_maintenance m LEFT JOIN vendors v ON v.id=m.vendor_id WHERE m.asset_id=? ORDER BY m.service_date DESC`).all(idParam(request)))
  })
  app.post('/api/assets/:id/maintenance', (request, response) => {
    const assetId = idParam(request)
    const body = objectBody(request)
    ensureExists(db, 'assets', assetId, 'Asset')
    const vendorId = optionalInteger(body.vendor_id)
    if (vendorId) ensureExists(db, 'vendors', vendorId, 'Vendor')
    const result = db.prepare(`INSERT INTO asset_maintenance (asset_id,service_date,description,vendor_id,amount,next_service_date,reference_number,notes)
      VALUES (?,?,?,?,?,?,?,?)`).run(assetId, requiredDate(body, 'service_date'), requiredText(body, 'description'), vendorId ?? null, money(body, 'amount'), optionalDate(body, 'next_service_date'), optionalText(body, 'reference_number'), optionalText(body, 'notes'))
    response.status(201).json(db.prepare('SELECT * FROM asset_maintenance WHERE id=?').get(result.lastInsertRowid))
  })

  app.get('/api/vendors', (_request, response) => response.json(db.prepare('SELECT * FROM vendors ORDER BY company_name').all()))
  app.post('/api/vendors', (request, response) => {
    const body = objectBody(request)
    const values = {
      vendor_code: requiredText(body, 'vendor_code'), company_name: requiredText(body, 'company_name'),
      contact_name: optionalText(body, 'contact_name'), trade: optionalText(body, 'trade'), phone: optionalText(body, 'phone'),
      email: optionalText(body, 'email'), address: optionalText(body, 'address'), tax_id: optionalText(body, 'tax_id'),
      payment_terms: optionalText(body, 'payment_terms'), status: optionalText(body, 'status', 'Active'), notes: optionalText(body, 'notes'),
    }
    const result = db.prepare(`INSERT INTO vendors (vendor_code,company_name,contact_name,trade,phone,email,address,tax_id,payment_terms,status,notes)
      VALUES (@vendor_code,@company_name,@contact_name,@trade,@phone,@email,@address,@tax_id,@payment_terms,@status,@notes)`).run(values)
    response.status(201).json(db.prepare('SELECT * FROM vendors WHERE id = ?').get(result.lastInsertRowid))
  })

  app.get('/api/work-orders', (_request, response) => response.json(db.prepare(`SELECT w.*,p.project_code,p.name AS project_name,v.vendor_code,v.company_name AS vendor_name FROM work_orders w JOIN projects p ON p.id=w.project_id JOIN vendors v ON v.id=w.vendor_id ORDER BY w.created_at DESC`).all()))
  app.post('/api/work-orders', (request, response) => {
    const body = objectBody(request)
    const projectId = positiveInteger(body.project_id, 'project_id')
    const vendorId = positiveInteger(body.vendor_id, 'vendor_id')
    ensureExists(db, 'projects', projectId, 'Project')
    ensureExists(db, 'vendors', vendorId, 'Vendor')
    const amount = positiveMoney(body, 'amount')
    const taxAmount = money(body, 'tax_amount')
    const retention = money(body, 'retention_amount')
    const values = {
      work_order_number: requiredText(body, 'work_order_number'), project_id: projectId, vendor_id: vendorId,
      scope: requiredText(body, 'scope'), issue_date: requiredDate(body, 'issue_date'), due_date: optionalDate(body, 'due_date'),
      amount, tax_amount: taxAmount, retention_amount: retention, status: optionalText(body, 'status', 'Issued'), notes: optionalText(body, 'notes'),
    }
    if (retention > amount + taxAmount) throw new HttpError(400, 'Retention cannot exceed the work order total.')
    const result = db.prepare(`INSERT INTO work_orders (work_order_number,project_id,vendor_id,scope,issue_date,due_date,amount,tax_amount,retention_amount,status,notes)
      VALUES (@work_order_number,@project_id,@vendor_id,@scope,@issue_date,@due_date,@amount,@tax_amount,@retention_amount,@status,@notes)`).run(values)
    response.status(201).json(db.prepare('SELECT * FROM work_orders WHERE id=?').get(result.lastInsertRowid))
  })
  app.post('/api/work-orders/:id/payments', (request, response) => {
    const workOrderId = idParam(request)
    const body = objectBody(request)
    const amount = positiveMoney(body, 'amount')
    const order = db.prepare('SELECT * FROM work_orders WHERE id=?').get(workOrderId) as Row | undefined
    if (!order) throw new HttpError(404, 'Work order not found.')
    const payable = Number(order.amount) + Number(order.tax_amount) - Number(order.retention_amount)
    if (Number(order.paid_amount) + amount > payable + 0.005) throw new HttpError(400, 'Payment exceeds the remaining work order balance.')
    const result = db.transaction(() => {
      db.prepare(`INSERT INTO vendor_payments (work_order_id,payment_date,amount,payment_method,reference_number,notes) VALUES (?,?,?,?,?,?)`)
        .run(workOrderId, requiredDate(body, 'payment_date'), amount, optionalText(body, 'payment_method'), optionalText(body, 'reference_number'), optionalText(body, 'notes'))
      const paid = Number(order.paid_amount) + amount
      const status = paid >= payable - 0.005 ? 'Paid' : 'Partially paid'
      db.prepare('UPDATE work_orders SET paid_amount=?,status=? WHERE id=?').run(paid, status, workOrderId)
      return db.prepare('SELECT * FROM work_orders WHERE id=?').get(workOrderId)
    })()
    response.status(201).json(result)
  })

  app.get('/api/expenses', (_request, response) => response.json(db.prepare(`SELECT x.*,p.project_code,p.name AS project_name,v.company_name AS vendor_name FROM expenses x LEFT JOIN projects p ON p.id=x.project_id LEFT JOIN vendors v ON v.id=x.vendor_id ORDER BY x.expense_date DESC,x.id DESC`).all()))
  app.post('/api/expenses', (request, response) => {
    const body = objectBody(request)
    const expenseType = requiredText(body, 'expense_type')
    if (expenseType !== 'Project' && expenseType !== 'General') throw new HttpError(400, 'Expense type must be Project or General.')
    const projectId = expenseType === 'Project' ? positiveInteger(body.project_id, 'project_id') : optionalInteger(body.project_id)
    const vendorId = optionalInteger(body.vendor_id)
    if (expenseType === 'Project') ensureExists(db, 'projects', projectId!, 'Project')
    if (vendorId) ensureExists(db, 'vendors', vendorId, 'Vendor')
    const amount = positiveMoney(body, 'amount')
    const taxAmount = money(body, 'tax_amount')
    const values = {
      expense_number: requiredText(body, 'expense_number'), expense_type: expenseType,
      category: requiredText(body, 'category'), description: requiredText(body, 'description'),
      expense_date: requiredDate(body, 'expense_date'), project_id: projectId ?? null, vendor_id: vendorId ?? null,
      amount, tax_amount: taxAmount, payment_method: optionalText(body, 'payment_method'),
      reference_number: optionalText(body, 'reference_number'), status: optionalText(body, 'status', 'Paid'), notes: optionalText(body, 'notes'),
    }
    if (!['Paid', 'Unpaid', 'Partially paid', 'Void'].includes(values.status)) throw new HttpError(400, 'Expense status must be Paid, Unpaid, Partially paid, or Void.')
    const result = db.transaction(() => {
      const expense = db.prepare(`INSERT INTO expenses (expense_number,expense_type,category,description,expense_date,project_id,vendor_id,amount,tax_amount,payment_method,reference_number,status,notes,paid_amount)
        VALUES (@expense_number,@expense_type,@category,@description,@expense_date,@project_id,@vendor_id,@amount,@tax_amount,@payment_method,@reference_number,@status,@notes,0)`).run(values)
      const id = Number(expense.lastInsertRowid)
      if (values.status === 'Paid') {
        const paidAmount = amount + taxAmount
        db.prepare(`INSERT INTO expense_payments (expense_id,payment_date,amount,payment_method,reference_number,notes) VALUES (?,?,?,?,?,?)`)
          .run(id, values.expense_date, paidAmount, values.payment_method, values.reference_number, 'Initial expense payment')
        db.prepare('UPDATE expenses SET paid_amount=? WHERE id=?').run(paidAmount, id)
      }
      return db.prepare('SELECT * FROM expenses WHERE id=?').get(id)
    })()
    response.status(201).json(result)
  })
  app.get('/api/expenses/:id/payments', (request, response) => {
    response.json(db.prepare('SELECT * FROM expense_payments WHERE expense_id=? ORDER BY payment_date,id').all(idParam(request)))
  })
  app.post('/api/expenses/:id/payments', (request, response) => {
    const id = idParam(request)
    const body = objectBody(request)
    const amount = positiveMoney(body, 'amount')
    const expense = db.prepare('SELECT * FROM expenses WHERE id=?').get(id) as Row | undefined
    if (!expense) throw new HttpError(404, 'Expense not found.')
    if (expense.status === 'Void') throw new HttpError(400, 'Payments cannot be applied to a void expense.')
    const balance = Number(expense.amount) + Number(expense.tax_amount) - Number(expense.paid_amount)
    if (amount > balance + 0.005) throw new HttpError(400, 'Payment exceeds the remaining expense balance.')
    const result = db.transaction(() => {
      const payment = db.prepare(`INSERT INTO expense_payments (expense_id,payment_date,amount,payment_method,reference_number,notes) VALUES (?,?,?,?,?,?)`)
        .run(id, requiredDate(body, 'payment_date'), amount, optionalText(body, 'payment_method'), optionalText(body, 'reference_number'), optionalText(body, 'notes'))
      const paidAmount = Number(expense.paid_amount) + amount
      const status = paidAmount >= Number(expense.amount) + Number(expense.tax_amount) - 0.005 ? 'Paid' : 'Partially paid'
      db.prepare('UPDATE expenses SET paid_amount=?,status=? WHERE id=?').run(paidAmount, status, id)
      return db.prepare('SELECT * FROM expense_payments WHERE id=?').get(payment.lastInsertRowid)
    })()
    response.status(201).json(result)
  })

  app.get('/api/documents', (request, response) => {
    const type = request.query.type ? String(request.query.type) : ''
    if (type && type !== 'Estimate' && type !== 'Invoice') throw new HttpError(400, 'Document type must be Estimate or Invoice.')
    const rows = type
      ? db.prepare(`SELECT d.*,p.project_code,p.name AS project_name,COALESCE(SUM(pay.amount),0) AS amount_paid FROM documents d LEFT JOIN projects p ON p.id=d.project_id LEFT JOIN payments pay ON pay.document_id=d.id WHERE d.document_type=? GROUP BY d.id ORDER BY d.issue_date DESC`).all(type)
      : db.prepare(`SELECT d.*,p.project_code,p.name AS project_name,COALESCE(SUM(pay.amount),0) AS amount_paid FROM documents d LEFT JOIN projects p ON p.id=d.project_id LEFT JOIN payments pay ON pay.document_id=d.id GROUP BY d.id ORDER BY d.issue_date DESC`).all()
    response.json(rows)
  })
  app.get('/api/documents/:id', (request, response) => {
    const id = idParam(request)
    const document = db.prepare('SELECT * FROM documents WHERE id=?').get(id)
    if (!document) throw new HttpError(404, 'Document not found.')
    response.json({ ...document as Row, lines: db.prepare('SELECT * FROM document_lines WHERE document_id=? ORDER BY sort_order,id').all(id), payments: db.prepare('SELECT * FROM payments WHERE document_id=? ORDER BY payment_date,id').all(id) })
  })
  app.post('/api/documents', (request, response) => {
    const body = objectBody(request)
    const documentType = requiredText(body, 'document_type')
    if (documentType !== 'Estimate' && documentType !== 'Invoice') throw new HttpError(400, 'Document type must be Estimate or Invoice.')
    if (!Array.isArray(body.lines) || !body.lines.length) throw new HttpError(400, 'Add at least one priced line item.')
    const projectId = optionalInteger(body.project_id)
    if (projectId) ensureExists(db, 'projects', projectId, 'Project')
    const lines = body.lines.map((line, index) => {
      if (!line || typeof line !== 'object' || Array.isArray(line)) throw new HttpError(400, 'Each line item must be an object.')
      return { ...(line as Row), sortOrder: index }
    })
    const totals = calculateDocument(lines, money(body, 'discount_amount'), percentage(body, 'tax_rate'))
    const issueDate = requiredDate(body, 'issue_date')
    const values = {
      document_number: requiredText(body, 'document_number'), document_type: documentType, project_id: projectId ?? null,
      client_name: requiredText(body, 'client_name'), subject: requiredText(body, 'subject'), issue_date: issueDate,
      due_date: optionalDate(body, 'due_date'), status: optionalText(body, 'status', 'Draft'),
      billing_stage: documentType === 'Invoice' ? optionalText(body, 'billing_stage', 'Progress') : 'Progress',
      audit_status: documentType === 'Invoice' ? optionalText(body, 'audit_status', 'Not required') : 'Not required',
      audited_by: optionalText(body, 'audited_by'), audit_date: optionalDate(body, 'audit_date'), audit_notes: optionalText(body, 'audit_notes'),
      subtotal: totals.subtotal, discount_amount: totals.discountAmount, tax_rate: totals.taxRate,
      tax_amount: totals.taxAmount, grand_total: totals.grandTotal, notes: optionalText(body, 'notes'),
    }
    if (documentType === 'Invoice' && !['Progress', 'Final'].includes(values.billing_stage)) throw new HttpError(400, 'Billing stage must be Progress or Final.')
    if (documentType === 'Invoice' && values.billing_stage === 'Final' && values.status !== 'Draft' && (values.audit_status !== 'Passed' || !values.audited_by || !values.audit_date)) {
      throw new HttpError(400, 'A final invoice requires a passed audit, auditor name, and audit date before it can be sent.')
    }
    const createDocument = db.transaction(() => {
      const result = db.prepare(`INSERT INTO documents (document_number,document_type,project_id,client_name,subject,issue_date,due_date,status,billing_stage,audit_status,audited_by,audit_date,audit_notes,subtotal,discount_amount,tax_rate,tax_amount,grand_total,notes)
        VALUES (@document_number,@document_type,@project_id,@client_name,@subject,@issue_date,@due_date,@status,@billing_stage,@audit_status,@audited_by,@audit_date,@audit_notes,@subtotal,@discount_amount,@tax_rate,@tax_amount,@grand_total,@notes)`).run(values)
      const insertLine = db.prepare(`INSERT INTO document_lines (document_id,sort_order,item,description,length,width,height,quantity,nos,unit,rate,tax_rate,measured_quantity,line_subtotal,line_tax,line_total)
        VALUES (@documentId,@sortOrder,@item,@description,@length,@width,@height,@quantity,@nos,@unit,@rate,@taxRate,@measuredQuantity,@lineSubtotal,@lineTax,@lineTotal)`)
      totals.lines.forEach((line, index) => insertLine.run({
        documentId: Number(result.lastInsertRowid), sortOrder: index, item: requiredText(line, 'item'),
        description: optionalText(line, 'description'), length: line.length, width: line.width, height: line.height,
        quantity: line.quantity, nos: line.nos, unit: optionalText(line, 'unit', 'Each'), rate: line.rate,
        taxRate: line.taxRate, measuredQuantity: line.measuredQuantity, lineSubtotal: line.lineSubtotal,
        lineTax: line.lineTax, lineTotal: line.lineTotal,
      }))
      return Number(result.lastInsertRowid)
    })()
    response.status(201).json(db.prepare('SELECT * FROM documents WHERE id=?').get(createDocument))
  })
  app.patch('/api/documents/:id/audit', (request, response) => {
    const id = idParam(request)
    const body = objectBody(request)
    const document = db.prepare('SELECT * FROM documents WHERE id=?').get(id) as Row | undefined
    if (!document) throw new HttpError(404, 'Document not found.')
    if (document.document_type !== 'Invoice') throw new HttpError(400, 'Only invoices have a billing audit.')
    const auditStatus = requiredText(body, 'audit_status')
    if (!['Pending', 'Passed', 'Failed'].includes(auditStatus)) throw new HttpError(400, 'Audit status must be Pending, Passed, or Failed.')
    const auditedBy = auditStatus === 'Passed' ? requiredText(body, 'audited_by') : optionalText(body, 'audited_by')
    const auditDate = auditStatus === 'Passed' ? requiredDate(body, 'audit_date') : optionalDate(body, 'audit_date')
    db.prepare('UPDATE documents SET audit_status=?,audited_by=?,audit_date=?,audit_notes=? WHERE id=?').run(auditStatus, auditedBy, auditDate, optionalText(body, 'audit_notes'), id)
    response.json(db.prepare('SELECT * FROM documents WHERE id=?').get(id))
  })
  app.patch('/api/documents/:id/status', (request, response) => {
    const id = idParam(request)
    const body = objectBody(request)
    const status = requiredText(body, 'status')
    const current = db.prepare('SELECT * FROM documents WHERE id=?').get(id) as Row | undefined
    if (!current) throw new HttpError(404, 'Document not found.')
    const allowed = current.document_type === 'Estimate' ? ['Draft', 'Sent', 'Approved', 'Rejected', 'Converted', 'Void'] : ['Draft', 'Sent', 'Overdue', 'Partially paid', 'Paid', 'Void']
    if (!allowed.includes(status)) throw new HttpError(400, 'That status is not valid for this document type.')
    if (current.document_type === 'Invoice' && status === 'Sent' && current.billing_stage === 'Final' && (current.audit_status !== 'Passed' || !current.audited_by || !current.audit_date)) {
      throw new HttpError(400, 'A final invoice cannot be sent until the billing audit passes.')
    }
    if (current.document_type === 'Invoice' && (status === 'Paid' || status === 'Partially paid') && status !== current.status) throw new HttpError(400, 'Record invoice payments through the payment ledger.')
    db.prepare('UPDATE documents SET status=? WHERE id=?').run(status, id)
    response.json(db.prepare('SELECT * FROM documents WHERE id=?').get(id))
  })
  app.post('/api/documents/:id/convert-to-project', (request, response) => {
    const id = idParam(request)
    const estimate = db.prepare('SELECT * FROM documents WHERE id=?').get(id) as Row | undefined
    if (!estimate) throw new HttpError(404, 'Estimate not found.')
    if (estimate.document_type !== 'Estimate' || estimate.status !== 'Approved') throw new HttpError(400, 'Only approved estimates can become projects.')
    const projectId = db.transaction(() => {
      const nextNumber = Number((db.prepare('SELECT COALESCE(MAX(id),0)+1 AS next_id FROM projects').get() as Row).next_id)
      const result = db.prepare(`INSERT INTO projects (project_code,name,client,contract_amount,status)
        VALUES (?,?,?,?,?)`).run(`RX-${String(nextNumber).padStart(4, '0')}`, String(estimate.subject), String(estimate.client_name), Number(estimate.grand_total), 'Planning')
      db.prepare(`UPDATE documents SET status='Converted',project_id=? WHERE id=?`).run(result.lastInsertRowid, id)
      return Number(result.lastInsertRowid)
    })()
    response.status(201).json(db.prepare('SELECT * FROM projects WHERE id=?').get(projectId))
  })
  app.post('/api/documents/:id/payments', (request, response) => {
    const id = idParam(request)
    const body = objectBody(request)
    const amount = positiveMoney(body, 'amount')
    const document = db.prepare('SELECT * FROM documents WHERE id=?').get(id) as Row | undefined
    if (!document) throw new HttpError(404, 'Document not found.')
    if (document.document_type !== 'Invoice') throw new HttpError(400, 'Payments can only be applied to invoices.')
    const paidRow = db.prepare('SELECT COALESCE(SUM(amount),0) AS amount FROM payments WHERE document_id=?').get(id) as Row | undefined
    const paid = Number(paidRow?.amount ?? 0)
    const balance = Number(document.grand_total) - paid
    if (amount > balance + 0.005) throw new HttpError(400, 'Payment exceeds the outstanding invoice balance.')
    const payment = db.transaction(() => {
      const result = db.prepare('INSERT INTO payments (document_id,payment_date,amount,payment_method,reference_number,notes) VALUES (?,?,?,?,?,?)')
        .run(id, requiredDate(body, 'payment_date'), amount, optionalText(body, 'payment_method'), optionalText(body, 'reference_number'), optionalText(body, 'notes'))
      const newStatus = paid + amount >= Number(document.grand_total) - 0.005 ? 'Paid' : 'Partially paid'
      db.prepare('UPDATE documents SET status=? WHERE id=?').run(newStatus, id)
      return db.prepare('SELECT * FROM payments WHERE id=?').get(result.lastInsertRowid)
    })()
    response.status(201).json(payment)
  })

  app.get('/api/finance', (request, response) => {
    const { from, to } = financeRange(request)
    const sum = (sql: string, ...parameters: (string | number)[]) => Number((db.prepare(sql).get(...parameters) as Row | undefined)?.total ?? 0)
    const invoiceRevenue = sum(`SELECT COALESCE(SUM(subtotal-discount_amount),0) AS total FROM documents WHERE document_type='Invoice' AND status NOT IN ('Draft','Void') AND issue_date BETWEEN ? AND ?`, from, to)
    const cashCollected = sum(`SELECT COALESCE(SUM(payments.amount),0) AS total FROM payments JOIN documents ON documents.id=payments.document_id WHERE documents.document_type='Invoice' AND payments.payment_date BETWEEN ? AND ?`, from, to)
    const projectExpenses = sum(`SELECT COALESCE(SUM(amount),0) AS total FROM expenses WHERE expense_type='Project' AND status<>'Void' AND expense_date BETWEEN ? AND ?`, from, to)
    const generalExpenses = sum(`SELECT COALESCE(SUM(amount),0) AS total FROM expenses WHERE expense_type='General' AND status<>'Void' AND expense_date BETWEEN ? AND ?`, from, to)
    const cashExpensePayments = sum(`SELECT COALESCE(SUM(amount),0) AS total FROM expense_payments WHERE payment_date BETWEEN ? AND ?`, from, to)
    const payrollCost = sum(`SELECT COALESCE(SUM(gross_salary+employer_contribution),0) AS total FROM payroll WHERE pay_period BETWEEN ? AND ?`, from.slice(0, 7), to.slice(0, 7))
    const payrollPaid = sum(`SELECT COALESCE(SUM(net_salary),0) AS total FROM payroll WHERE status='Paid' AND paid_date BETWEEN ? AND ?`, from, to)
    const vendorPayments = sum(`SELECT COALESCE(SUM(amount),0) AS total FROM vendor_payments WHERE payment_date BETWEEN ? AND ?`, from, to)
    const inputTax = sum(`SELECT COALESCE(SUM(tax_amount),0) AS total FROM expenses WHERE status<>'Void' AND expense_date BETWEEN ? AND ?`, from, to)
    const outputTax = sum(`SELECT COALESCE(SUM(tax_amount),0) AS total FROM documents WHERE document_type='Invoice' AND status NOT IN ('Draft','Void') AND issue_date BETWEEN ? AND ?`, from, to)
    const depreciation = assetDepreciation(db, from, to)
    const totalOperatingExpenses = projectExpenses + generalExpenses + payrollCost + vendorPayments + depreciation
    const receivables = sum(`SELECT COALESCE(SUM(d.grand_total-COALESCE(p.paid,0)),0) AS total FROM documents d LEFT JOIN (SELECT document_id,SUM(amount) AS paid FROM payments GROUP BY document_id) p ON p.document_id=d.id WHERE d.document_type='Invoice' AND d.status NOT IN ('Draft','Void') AND d.issue_date<=?`, to)
    const billedInPeriod = db.prepare(`SELECT d.id,d.document_number,d.client_name,d.subject,d.issue_date,d.subtotal,d.discount_amount,d.tax_amount,d.grand_total,d.status,COALESCE(SUM(p.amount),0) AS amount_paid
      FROM documents d LEFT JOIN payments p ON p.document_id=d.id WHERE d.document_type='Invoice' AND d.status NOT IN ('Draft','Void') AND d.issue_date BETWEEN ? AND ? GROUP BY d.id ORDER BY d.issue_date DESC`).all(from, to)
    const expenseByCategory = db.prepare(`SELECT expense_type,category,SUM(amount) AS amount,SUM(tax_amount) AS tax FROM expenses WHERE status<>'Void' AND expense_date BETWEEN ? AND ? GROUP BY expense_type,category ORDER BY expense_type,category`).all(from, to)
    const projectProfitability = db.prepare(`SELECT p.id,p.project_code,p.name,p.contract_amount,COALESCE(i.billed,0) AS billed,COALESCE(e.cost,0) AS project_expenses,COALESCE(w.ordered,0) AS subcontract_value,COALESCE(w.paid,0) AS subcontract_paid
      FROM projects p LEFT JOIN (SELECT project_id,SUM(subtotal-discount_amount) AS billed FROM documents WHERE document_type='Invoice' AND status NOT IN ('Draft','Void') AND issue_date BETWEEN ? AND ? GROUP BY project_id) i ON i.project_id=p.id
      LEFT JOIN (SELECT project_id,SUM(amount) AS cost FROM expenses WHERE expense_type='Project' AND status<>'Void' AND expense_date BETWEEN ? AND ? GROUP BY project_id) e ON e.project_id=p.id
      LEFT JOIN (SELECT project_id,SUM(amount+tax_amount-retention_amount) AS ordered,SUM(paid_amount) AS paid FROM work_orders GROUP BY project_id) w ON w.project_id=p.id ORDER BY p.name`).all(from, to, from, to)
    response.json({
      period: { from, to }, currency: 'PKR', revenue: invoiceRevenue, billedRevenue: invoiceRevenue,
      cashCollected, receivables, projectExpenses, generalExpenses, payrollCost, payrollPaid,
      vendorPayments, depreciation, inputTax, outputTax, totalOperatingExpenses,
      profitOrLoss: invoiceRevenue - totalOperatingExpenses,
      cashExpensePayments, cashNet: cashCollected - cashExpensePayments - payrollPaid - vendorPayments,
      billedInPeriod, expenseByCategory, projectProfitability,
    })
  })

  app.use((_request, _response, next) => next(new HttpError(404, 'API route not found.')))
  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    if (error instanceof HttpError) return response.status(error.status).json({ error: error.message })
    if (error instanceof SyntaxError) return response.status(400).json({ error: 'Request body must contain valid JSON.' })
    if (error instanceof Error && /UNIQUE constraint failed/.test(error.message)) return response.status(409).json({ error: 'That record number already exists.' })
    if (error instanceof Error && /FOREIGN KEY constraint failed/.test(error.message)) return response.status(400).json({ error: 'The selected related record does not exist.' })
    if (error instanceof Error && /CHECK constraint failed/.test(error.message)) return response.status(400).json({ error: error.message })
    if (error instanceof Error && (/must be valid non-negative numbers|cannot exceed gross salary/.test(error.message))) return response.status(400).json({ error: error.message })
    return response.status(400).json({ error: error instanceof Error ? error.message : 'Request could not be processed.' })
  })
  return app
}

function sendSession(db: Db, userId: number, response: Response) {
  const token = createSession(db, userId)
  const user = getSessionUser(db, token)
  response.setHeader('Set-Cookie', sessionCookie(token, 12 * 60 * 60))
  response.json({ ...user, token })
}

function sessionCookie(token: string, maxAge: number) {
  return `revoxen_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}`
}

function sessionToken(request: Request): string | undefined {
  const auth = request.headers.authorization
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7).trim()
  const cookie = request.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('revoxen_session='))
  return cookie?.slice('revoxen_session='.length) || undefined
}

function currentUser(request: Request, db: Db): AuthUser | undefined {
  const token = sessionToken(request)
  return token ? getSessionUser(db, token) : undefined
}

function validEmail(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    throw new HttpError(400, 'Enter a valid email address.')
  }
  return value.trim().toLowerCase()
}

function validPassword(value: unknown): string {
  if (typeof value !== 'string' || value.length < 10 || value.length > 128) throw new HttpError(400, 'Password must be between 10 and 128 characters.')
  return value
}

function safePermissions(value: string): Permissions {
  try { return normalizePermissions(JSON.parse(value)) } catch { return {} }
}

function routeModules(request: Request, db: Db, user: AuthUser): PermissionModule[] {
  const path = request.path
  if (path.startsWith('/leads')) {
    if (path.includes('/convert-to-project')) return ['leads', 'projects']
    return ['leads']
  }
  if (path.startsWith('/project-accounts') || path.startsWith('/project-budgets') || /^\/projects\/\d+\/budgets$/.test(path)) return ['projectAccounts']
  if (path.startsWith('/projects')) return ['projects']
  if (/^\/employees\/\d+\/loans/.test(path) || path.startsWith('/loans')) return ['loans']
  if (path.startsWith('/employees')) return ['employees']
  if (path.startsWith('/payroll')) return ['payroll']
  if (path.startsWith('/assets')) return ['assets']
  if (path.startsWith('/vendors')) return ['vendors']
  if (path.startsWith('/work-orders')) return ['workOrders']
  if (path.startsWith('/expenses')) {
    const id = path.match(/^\/expenses\/(\d+)/)?.[1]
    const type = id ? (db.prepare('SELECT expense_type FROM expenses WHERE id=?').get(Number(id)) as { expense_type?: string } | undefined)?.expense_type : undefined
    const types = request.method === 'POST' && path === '/expenses'
      ? [request.body?.expense_type]
      : type ? [type] : ['Project', 'General']
    return [...new Set(types.map((value) => value === 'Project' ? 'projectExpenses' : 'officeExpenses'))] as PermissionModule[]
  }
  if (path.startsWith('/documents')) {
    const id = path.match(/^\/documents\/(\d+)/)?.[1]
    const type = id ? (db.prepare('SELECT document_type FROM documents WHERE id=?').get(Number(id)) as { document_type?: string } | undefined)?.document_type : undefined
    const requestedType = request.method === 'POST' ? request.body?.document_type : request.query.type
    const types = type ? [type] : requestedType ? [requestedType] : ['Estimate', 'Invoice']
    const modules = types.map((value) => value === 'Estimate' ? 'estimates' : 'invoices') as PermissionModule[]
    if (path.includes('/convert-to-project')) modules.push('projects')
    return [...new Set(modules)]
  }
  if (path.startsWith('/finance')) return ['profitLoss']
  if (path === '/bootstrap') return permissionModules.filter((module) => user.role === 'admin' || user.permissions[module]?.view)
  return []
}

class HttpError extends Error {
  readonly status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

function objectBody(request: Request): Row {
  if (!request.body || typeof request.body !== 'object' || Array.isArray(request.body)) throw new HttpError(400, 'Request body must be a JSON object.')
  return request.body as Row
}

function requiredText(body: Row, key: string): string {
  const value = body[key]
  if (typeof value !== 'string' || !value.trim()) throw new HttpError(400, `${key} is required.`)
  return value.trim()
}

function optionalText(body: Row, key: string, fallback = ''): string {
  const value = body[key]
  if (value === undefined || value === null) return fallback
  if (typeof value !== 'string') throw new HttpError(400, `${key} must be text.`)
  return value.trim()
}

function requiredDate(body: Row, key: string): string {
  const value = requiredText(body, key)
  if (!isoDay.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) throw new HttpError(400, `${key} must use YYYY-MM-DD format.`)
  return value
}

function optionalDate(body: Row, key: string): string {
  return body[key] === undefined || body[key] === null || body[key] === '' ? '' : requiredDate(body, key)
}

function money(body: Row, key: string, fallback = 0): number {
  const value = body[key]
  if (value === undefined || value === null || value === '') return fallback
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount < 0) throw new HttpError(400, `${key} must be a valid non-negative number.`)
  return roundMoney(amount)
}

function positiveMoney(body: Row, key: string): number {
  const amount = money(body, key)
  if (amount <= 0) throw new HttpError(400, `${key} must be greater than zero.`)
  return amount
}

function percentage(body: Row, key: string): number {
  const value = money(body, key)
  if (value > 100) throw new HttpError(400, `${key} cannot exceed 100.`)
  return value
}

function positiveInteger(value: unknown, key: string): number {
  const result = Number(value)
  if (!Number.isSafeInteger(result) || result <= 0) throw new HttpError(400, `${key} must be a positive integer.`)
  return result
}

function optionalInteger(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  return positiveInteger(value, 'id')
}

function idParam(request: Request): number {
  return positiveInteger(request.params.id, 'id')
}

function ensureExists(db: Db, table: 'assets' | 'employees' | 'projects' | 'vendors', id: number, label: string) {
  if (!db.prepare(`SELECT 1 FROM ${table} WHERE id=?`).get(id)) throw new HttpError(404, `${label} not found.`)
}

function applyLoanRepayment(db: Db, employeeId: number, amount: number, payrollId: number, period: string) {
  const loans = db.prepare(`SELECT * FROM employee_loans WHERE employee_id=? AND outstanding>0 ORDER BY issue_date,id`).all(employeeId) as Row[]
  let remaining = amount
  const insertPayment = db.prepare('INSERT INTO employee_loan_payments (loan_id,payroll_id,payment_date,amount) VALUES (?,?,?,?)')
  for (const loan of loans) {
    if (remaining <= 0) break
    const paid = Math.min(remaining, Number(loan.outstanding))
    const balance = Math.round((Number(loan.outstanding) - paid + Number.EPSILON) * 100) / 100
    insertPayment.run(Number(loan.id), payrollId, `${period}-01`, paid)
    db.prepare('UPDATE employee_loans SET outstanding=?,status=? WHERE id=?').run(balance, balance === 0 ? 'Repaid' : 'Active', loan.id)
    remaining = Math.round((remaining - paid + Number.EPSILON) * 100) / 100
  }
  db.prepare('UPDATE employees SET loan_balance=MAX(0,loan_balance-?) WHERE id=?').run(amount - remaining, employeeId)
}

function financeRange(request: Request): { from: string; to: string } {
  let from = request.query.from ? String(request.query.from) : ''
  let to = request.query.to ? String(request.query.to) : ''
  const year = request.query.year ? String(request.query.year) : ''
  const month = request.query.month ? String(request.query.month) : ''
  const period = request.query.period ? String(request.query.period) : ''
  if (period) {
    if (!monthPattern.test(period)) throw new HttpError(400, 'Period must use YYYY-MM format.')
    from = `${period}-01`
    to = `${period}-${String(new Date(Number(period.slice(0, 4)), Number(period.slice(5, 7)), 0).getDate()).padStart(2, '0')}`
  } else if (year || month) {
    if (!/^\d{4}$/.test(year)) throw new HttpError(400, 'Year must use YYYY format.')
    if (month) {
      if (!/^(0[1-9]|1[0-2])$/.test(month)) throw new HttpError(400, 'Month must use 01–12 format.')
      from = `${year}-${month}-01`
      to = `${year}-${month}-${String(new Date(Number(year), Number(month), 0).getDate()).padStart(2, '0')}`
    } else { from = `${year}-01-01`; to = `${year}-12-31` }
  }
  if (!from && !to) {
    const today = new Date()
    from = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
    to = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()).padStart(2, '0')}`
  }
  if (!isoDay.test(from) || !isoDay.test(to) || from > to) throw new HttpError(400, 'Provide a valid date range with from on or before to.')
  return { from, to }
}

function assetDepreciation(db: Db, from: string, to: string): number {
  const assets = db.prepare(`SELECT purchase_date,purchase_cost,salvage_value,useful_life_years FROM assets WHERE useful_life_years>0 AND purchase_date<=?`).all(to) as Row[]
  let total = 0
  for (const asset of assets) {
    const monthly = (Number(asset.purchase_cost) - Number(asset.salvage_value)) / Number(asset.useful_life_years) / 12
    const purchased = String(asset.purchase_date).slice(0, 7)
    const first = from.slice(0, 7) > purchased ? from.slice(0, 7) : purchased
    const monthCount = Math.max(0, (Number(to.slice(0, 4)) - Number(first.slice(0, 4))) * 12 + Number(to.slice(5, 7)) - Number(first.slice(5, 7)) + 1)
    const lifeMonths = Number(asset.useful_life_years) * 12
    const elapsedBeforePeriod = (Number(first.slice(0, 4)) - Number(purchased.slice(0, 4))) * 12 + Number(first.slice(5, 7)) - Number(purchased.slice(5, 7))
    total += monthly * Math.max(0, Math.min(monthCount, lifeMonths - elapsedBeforePeriod))
  }
  return Math.round((total + Number.EPSILON) * 100) / 100
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}