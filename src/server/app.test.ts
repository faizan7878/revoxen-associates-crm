import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from './app.js'
import { calculateDocument, calculatePayroll, openDatabase, type Db } from './db.js'

describe('payroll and document calculations', () => {
  it('calculates gross, overtime, deductions, and net salary in PKR', () => {
    const result = calculatePayroll({
      base_salary: 52000, housing_allowance: 3000, transport_allowance: 2000,
      other_allowance: 1000, monthly_bonus: 4000, overtime_multiplier: 1.5,
      tax_rate: 10, loan_balance: 5000, benefit_deduction: 2000,
    }, { overtime_hours: 8, loan_deduction: 1000, other_deduction: 1500 })
    expect(result.overtimeAmount).toBe(3000)
    expect(result.grossSalary).toBe(65000)
    expect(result.taxDeduction).toBe(6500)
    expect(result.loanDeduction).toBe(1000)
    expect(result.netSalary).toBe(54000)
  })

  it('caps a loan deduction at the remaining employee loan balance', () => {
    const result = calculatePayroll({ base_salary: 30000, loan_balance: 2500 }, { loan_deduction: 9000 })
    expect(result.loanDeduction).toBe(2500)
    expect(result.netSalary).toBe(27500)
  })

  it('calculates dimension quantities, item tax, discount allocation, and total', () => {
    const result = calculateDocument([{ item: 'Wall tile', length: 5, width: 2, height: 0, quantity: 2, nos: 3, rate: 100, taxRate: 10 }], 600, 0)
    expect(result.subtotal).toBe(6000)
    expect(result.lines[0].measuredQuantity).toBe(60)
    expect(result.lines[0].lineTax).toBe(540)
    expect(result.grandTotal).toBe(5940)
  })
})

describe('Revoxen operational API', () => {
  let db: Db
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    db = openDatabase(':memory:')
    app = createApp(db, { authentication: false })
  })

  afterEach(() => db.close())

  it('creates an employee, records a loan, and applies payroll repayment once', async () => {
    const employee = await request(app).post('/api/employees').send({ employee_code: 'EMP-001', full_name: 'Amna Shah', base_salary: 100000, tax_rate: 10 })
    expect(employee.status).toBe(201)
    const loan = await request(app).post(`/api/employees/${employee.body.id}/loans`).send({ issue_date: '2026-10-01', principal: 12000 })
    expect(loan.status).toBe(201)
    const payroll = await request(app).post('/api/payroll').send({ employee_id: employee.body.id, pay_period: '2026-10', overtime_hours: 0, loan_deduction: 3000 })
    expect(payroll.status).toBe(201)
    expect(payroll.body.gross_salary).toBe(100000)
    expect(payroll.body.net_salary).toBe(87000)
    expect((await request(app).get(`/api/employees/${employee.body.id}/loans`)).body[0].outstanding).toBe(9000)
    expect((await request(app).post('/api/payroll').send({ employee_id: employee.body.id, pay_period: '2026-10' })).status).toBe(409)
  })

  it('records project/general costs, payroll, asset depreciation, vendor payments and invoice cash separately', async () => {
    const project = await request(app).post('/api/projects').send({ project_code: 'RX-001', name: 'Gulberg renovation', client: 'North House', contract_amount: 500000 })
    const employee = await request(app).post('/api/employees').send({ employee_code: 'EMP-002', full_name: 'Ali Khan', base_salary: 10000, employer_contribution: 1000 })
    const vendor = await request(app).post('/api/vendors').send({ vendor_code: 'V-001', company_name: 'BuildPro Electric', trade: 'Electrical' })
    const asset = await request(app).post('/api/assets').send({ asset_code: 'A-001', name: 'Site generator', purchase_date: '2026-10-01', purchase_cost: 12000, useful_life_years: 10 })
    expect([project.status, employee.status, vendor.status, asset.status]).toEqual([201, 201, 201, 201])
    const maintenance = await request(app).post(`/api/assets/${asset.body.id}/maintenance`).send({ service_date: '2026-10-09', description: 'Oil change and air filter replacement', vendor_id: vendor.body.id, amount: 500 })
    expect(maintenance.status).toBe(201)
    expect((await request(app).get('/api/bootstrap')).body.assetMaintenance[0].asset_code).toBe('A-001')

    const workOrder = await request(app).post('/api/work-orders').send({ work_order_number: 'WO-001', project_id: project.body.id, vendor_id: vendor.body.id, scope: 'Electrical rough-in', issue_date: '2026-10-02', amount: 300 })
    expect(workOrder.status).toBe(201)
    const vendorPayment = await request(app).post(`/api/work-orders/${workOrder.body.id}/payments`).send({ payment_date: '2026-10-10', amount: 150 })
    expect(vendorPayment.status).toBe(201)
    expect(vendorPayment.body.paid_amount).toBe(150)
    expect((await request(app).post(`/api/work-orders/${workOrder.body.id}/payments`).send({ payment_date: '2026-10-11', amount: 200 })).status).toBe(400)

    const projectExpense = await request(app).post('/api/expenses').send({ expense_number: 'EX-001', expense_type: 'Project', category: 'Materials', description: 'Cement', expense_date: '2026-10-03', project_id: project.body.id, amount: 200, tax_amount: 36, status: 'Unpaid' })
    const officeExpense = await request(app).post('/api/expenses').send({ expense_number: 'EX-002', expense_type: 'General', category: 'Utilities', description: 'Office electricity', expense_date: '2026-10-04', amount: 100, tax_amount: 18 })
    const expensePayment = await request(app).post(`/api/expenses/${projectExpense.body.id}/payments`).send({ payment_date: '2026-10-08', amount: 100, payment_method: 'Cash' })
    const payroll = await request(app).post('/api/payroll').send({ employee_id: employee.body.id, pay_period: '2026-10' })
    const voidExpense = await request(app).post('/api/expenses').send({ expense_number: 'EX-VOID', expense_type: 'General', category: 'Other', description: 'Cancelled duplicate', expense_date: '2026-10-06', amount: 999, status: 'Void' })
    const overpayment = await request(app).post(`/api/expenses/${projectExpense.body.id}/payments`).send({ payment_date: '2026-10-09', amount: 137 })
    const invoice = await request(app).post('/api/documents').send({
      document_number: 'INV-001', document_type: 'Invoice', client_name: 'North House', subject: 'Phase one billing', project_id: project.body.id,
      issue_date: '2026-10-05', status: 'Sent', lines: [{ item: 'Floor tile', description: 'Supply and install', length: 2, width: 3, quantity: 1, nos: 2, unit: 'sqm', rate: 100, taxRate: 5 }],
    })
    expect([projectExpense.status, officeExpense.status, expensePayment.status, payroll.status, invoice.status]).toEqual([201, 201, 201, 201, 201])
    expect(voidExpense.status).toBe(201)
    expect(overpayment.status).toBe(400)
    expect(invoice.body.grand_total).toBe(1260)
    const payment = await request(app).post(`/api/documents/${invoice.body.id}/payments`).send({ payment_date: '2026-10-12', amount: 500, payment_method: 'Bank transfer' })
    expect(payment.status).toBe(201)

    const report = await request(app).get('/api/finance?period=2026-10')
    expect(report.status).toBe(200)
    expect(report.body).toMatchObject({
      currency: 'PKR', revenue: 1200, cashCollected: 500, receivables: 760,
      projectExpenses: 200, generalExpenses: 100, payrollCost: 11000,
      vendorPayments: 150, depreciation: 100, inputTax: 54, outputTax: 60,
      cashExpensePayments: 218, cashNet: 132, totalOperatingExpenses: 11550, profitOrLoss: -10350,
    })
    expect(report.body.projectProfitability[0]).toMatchObject({ project_code: 'RX-001', billed: 1200, project_expenses: 200, subcontract_paid: 150 })
  })

  it('rejects an invoice payment larger than the remaining balance', async () => {
    const invoice = await request(app).post('/api/documents').send({
      document_number: 'INV-OVER', document_type: 'Invoice', client_name: 'Test client', subject: 'Test invoice', issue_date: '2026-10-01',
      lines: [{ item: 'Labor', quantity: 1, nos: 1, rate: 1000, taxRate: 0 }],
    })
    expect(invoice.status).toBe(201)
    const result = await request(app).post(`/api/documents/${invoice.body.id}/payments`).send({ payment_date: '2026-10-02', amount: 1001 })
    expect(result.status).toBe(400)
    expect(result.body.error).toContain('exceeds')
  })

  it('builds a project account from approved budgets, expense payments, subcontracts, and invoice receipts', async () => {
    const project = await request(app).post('/api/projects').send({ project_code: 'RX-LEDGER', name: 'Ledger test project', client: 'Ledger client', contract_amount: 1500 })
    const vendor = await request(app).post('/api/vendors').send({ vendor_code: 'V-LEDGER', company_name: 'Ledger vendor' })
    const expense = await request(app).post('/api/expenses').send({ expense_number: 'EX-LEDGER', expense_type: 'Project', category: 'Materials', description: 'Cement', expense_date: '2026-10-03', project_id: project.body.id, amount: 200, tax_amount: 36, status: 'Unpaid' })
    const expensePayment = await request(app).post(`/api/expenses/${expense.body.id}/payments`).send({ payment_date: '2026-10-04', amount: 100, payment_method: 'Bank transfer' })
    const order = await request(app).post('/api/work-orders').send({ work_order_number: 'WO-LEDGER', project_id: project.body.id, vendor_id: vendor.body.id, scope: 'Install materials', issue_date: '2026-10-03', amount: 300, tax_amount: 30, retention_amount: 20 })
    const orderPayment = await request(app).post(`/api/work-orders/${order.body.id}/payments`).send({ payment_date: '2026-10-05', amount: 50, payment_method: 'Cheque' })
    const invoice = await request(app).post('/api/documents').send({
      document_number: 'INV-LEDGER', document_type: 'Invoice', project_id: project.body.id, client_name: 'Ledger client', subject: 'Milestone one', issue_date: '2026-10-05', status: 'Sent',
      lines: [{ item: 'Construction milestone', quantity: 1, nos: 1, rate: 800, taxRate: 10 }],
    })
    const receipt = await request(app).post(`/api/documents/${invoice.body.id}/payments`).send({ payment_date: '2026-10-06', amount: 300, payment_method: 'Bank transfer' })
    expect([project.status, vendor.status, expense.status, expensePayment.status, order.status, orderPayment.status, invoice.status, receipt.status]).toEqual([201, 201, 201, 201, 201, 201, 201, 201])

    const budget = await request(app).post(`/api/projects/${project.body.id}/budgets`).send({ lines: [
      { category: 'Materials', description: 'Primary materials', amount: 500 }, { category: 'Labor', description: 'Site labor', amount: 400 },
    ] })
    expect(budget.status).toBe(201)
    expect(budget.body).toMatchObject({ version: 1, total_amount: 900, status: 'Draft' })
    const beforeApproval = await request(app).get(`/api/project-accounts/${project.body.id}`)
    expect(beforeApproval.body.currentBudget).toBeNull()
    expect(beforeApproval.body.totals).toMatchObject({ committedCost: 566, paidCost: 150, retentionHeld: 20, invoiced: 880, received: 300, receivable: 580 })

    expect((await request(app).patch(`/api/project-budgets/${budget.body.id}/audit`).send({ decision: 'Approved', audited_by: 'Auditor', audit_date: '2026-10-07' })).status).toBe(409)
    expect((await request(app).patch(`/api/project-budgets/${budget.body.id}/submit`).send({})).status).toBe(200)
    expect((await request(app).patch(`/api/project-budgets/${budget.body.id}/audit`).send({ decision: 'Approved', audited_by: 'Auditor', audit_date: '2026-10-07', audit_notes: 'Scope and rates checked.' })).body.status).toBe('Approved')
    const account = await request(app).get('/api/project-accounts/RX-LEDGER')
    expect(account.status).toBe(200)
    expect(account.body.project).toMatchObject({ project_code: 'RX-LEDGER', name: 'Ledger test project' })
    expect(account.body.currentBudget).toMatchObject({ total_amount: 900, audited_by: 'Auditor', audit_date: '2026-10-07' })
    expect(account.body.totals).toMatchObject({ approvedBudget: 900, committedCost: 566, availableBudget: 334, retentionHeld: 20 })
    expect(account.body.budgetHistory[0].lines).toHaveLength(2)
    expect(account.body.cashLedger.map((entry: { type: string; direction: string }) => [entry.type, entry.direction])).toEqual([
      ['Client receipt', 'In'], ['Subcontractor payment', 'Out'], ['Supplier payment', 'Out'],
    ])
    expect((await request(app).patch(`/api/project-budgets/${budget.body.id}/audit`).send({ decision: 'Rejected', audited_by: 'Auditor', audit_date: '2026-10-07' })).status).toBe(409)
    const revisionTwo = await request(app).post(`/api/projects/${project.body.id}/budgets`).send({ lines: [{ category: 'Materials', amount: 950 }] })
    expect(revisionTwo.body.version).toBe(2)
    expect((await request(app).patch(`/api/project-budgets/${revisionTwo.body.id}/submit`).send({})).status).toBe(200)
    expect((await request(app).patch(`/api/project-budgets/${revisionTwo.body.id}/audit`).send({ decision: 'Rejected', audited_by: 'Auditor', audit_date: '2026-10-08', audit_notes: 'Add labor detail.' })).body.status).toBe('Rejected')
    expect((await request(app).patch(`/api/project-budgets/${revisionTwo.body.id}/submit`).send({})).status).toBe(409)
    expect((await request(app).get(`/api/project-accounts/${project.body.id}`)).body.currentBudget.total_amount).toBe(900)
  })

  it('rejects malformed pay periods and invalid expense types', async () => {
    const period = await request(app).get('/api/payroll?period=October')
    const expense = await request(app).post('/api/expenses').send({ expense_number: 'EX-BAD', expense_type: 'Personal', category: 'Other', description: 'Bad type', expense_date: '2026-10-01', amount: 1 })
    expect(period.status).toBe(400)
    expect(expense.status).toBe(400)
  })

  it('requires a passed named audit before a final invoice can be sent', async () => {
    const invoice = await request(app).post('/api/documents').send({
      document_number: 'INV-FINAL', document_type: 'Invoice', client_name: 'Final client', subject: 'Final account',
      issue_date: '2026-10-15', billing_stage: 'Final', audit_status: 'Pending', status: 'Draft',
      lines: [{ item: 'Completion milestone', quantity: 1, nos: 1, rate: 250000, taxRate: 0 }],
    })
    expect(invoice.status).toBe(201)
    const blocked = await request(app).patch(`/api/documents/${invoice.body.id}/status`).send({ status: 'Sent' })
    expect(blocked.status).toBe(400)
    const audit = await request(app).patch(`/api/documents/${invoice.body.id}/audit`).send({ audit_status: 'Passed', audited_by: 'Project auditor', audit_date: '2026-10-16', audit_notes: 'Measured and verified.' })
    expect(audit.status).toBe(200)
    const sent = await request(app).patch(`/api/documents/${invoice.body.id}/status`).send({ status: 'Sent' })
    expect(sent.status).toBe(200)
    expect(sent.body.status).toBe('Sent')
  })

  it('converts an approved detailed estimate into a linked budgeted project', async () => {
    const estimate = await request(app).post('/api/documents').send({
      document_number: 'EST-CONVERT', document_type: 'Estimate', client_name: 'Estimate client', subject: 'Kitchen fit-out', issue_date: '2026-10-01',
      status: 'Approved', lines: [{ item: 'Joinery package', quantity: 1, nos: 1, rate: 400000, taxRate: 0 }],
    })
    expect(estimate.status).toBe(201)
    const converted = await request(app).post(`/api/documents/${estimate.body.id}/convert-to-project`)
    expect(converted.status).toBe(201)
    expect(converted.body).toMatchObject({ name: 'Kitchen fit-out', client: 'Estimate client', contract_amount: 400000, status: 'Planning' })
    expect((await request(app).get(`/api/documents/${estimate.body.id}`)).body.status).toBe('Converted')
  })
})

describe('authentication and access control', () => {
  let db: Db
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    db = openDatabase(':memory:')
    app = createApp(db)
  })

  afterEach(() => db.close())

  it('creates the first admin once and enforces assigned module permissions', async () => {
    expect((await request(app).get('/api/auth/status')).body.setupRequired).toBe(true)
    expect((await request(app).get('/api/bootstrap')).status).toBe(401)

    const admin = request.agent(app)
    const setup = await admin.post('/api/auth/setup').send({ name: 'Revoxen Admin', email: 'ADMIN@example.com', password: 'secure-admin-pass' })
    expect(setup.status).toBe(200)
    expect(setup.body).toMatchObject({ email: 'admin@example.com', role: 'admin' })
    expect(setup.headers['set-cookie'][0]).toContain('HttpOnly')
    expect((await request(app).post('/api/auth/setup').send({ name: 'Other', email: 'other@example.com', password: 'secure-other-pass' })).status).toBe(409)

    const created = await admin.post('/api/users').send({
      name: 'Project Viewer', email: 'viewer@example.com', password: 'secure-viewer-pass',
      permissions: { projects: { view: true, edit: false }, payroll: { view: true, edit: true }, unknown: { view: true, edit: true } },
    })
    expect(created.status).toBe(201)
    expect(created.body.permissions).toEqual({ projects: { view: true, edit: false }, payroll: { view: true, edit: true } })

    const viewer = request.agent(app)
    expect((await viewer.post('/api/auth/login').send({ email: 'viewer@example.com', password: 'secure-viewer-pass' })).status).toBe(200)
    expect((await viewer.get('/api/projects')).status).toBe(200)
    expect((await viewer.post('/api/projects').send({ project_code: 'RX-1', name: 'Blocked edit', client: 'Client' })).status).toBe(403)
    expect((await viewer.get('/api/project-accounts/1')).status).toBe(403)
    expect((await viewer.patch('/api/project-budgets/1/audit').send({ decision: 'Approved', audit_date: '2026-10-01' })).status).toBe(403)
    expect((await viewer.get('/api/payroll')).status).toBe(200)
    expect((await viewer.get('/api/users')).status).toBe(403)
    expect((await viewer.get('/api/bootstrap')).body.projects).toEqual([])
    expect((await viewer.get('/api/bootstrap')).body.employees).toEqual([])

    expect((await admin.post(`/api/users/${created.body.id}/password`).send({ password: 'reset-viewer-pass' })).status).toBe(204)
    expect((await viewer.get('/api/projects')).status).toBe(401)
    const signedInAgain = request.agent(app)
    expect((await signedInAgain.post('/api/auth/login').send({ email: 'viewer@example.com', password: 'secure-viewer-pass' })).status).toBe(401)
    expect((await signedInAgain.post('/api/auth/login').send({ email: 'viewer@example.com', password: 'reset-viewer-pass' })).status).toBe(200)
    expect((await admin.patch(`/api/users/${created.body.id}`).send({ active: false })).status).toBe(200)
    expect((await signedInAgain.get('/api/projects')).status).toBe(401)
  })

  it('rejects invalid credentials and enforces password length', async () => {
    expect((await request(app).post('/api/auth/setup').send({ name: 'Admin', email: 'admin@example.com', password: 'short' })).status).toBe(400)
    await request(app).post('/api/auth/setup').send({ name: 'Admin', email: 'admin@example.com', password: 'secure-admin-pass' })
    expect((await request(app).post('/api/auth/login').send({ email: 'admin@example.com', password: 'wrong-password' })).status).toBe(401)
  })

  it('allows password recovery via primary email, recovery email, or phone', async () => {
    await request(app).post('/api/auth/setup').send({ name: 'Admin', email: 'admin@example.com', password: 'secure-admin-pass' })
    db.prepare(`UPDATE users SET phone = '+92 300 5550199', recovery_email = 'backup@example.com' WHERE email = 'admin@example.com'`).run()

    // 1. Recover via primary email
    const req1 = await request(app).post('/api/auth/forgot-password').send({ identifier: 'admin@example.com' })
    expect(req1.status).toBe(200)
    expect(req1.body.code).toMatch(/^\d{6}$/)
    expect(req1.body.destination).toContain('@example.com')

    // 2. Recover via recovery email
    const req2 = await request(app).post('/api/auth/forgot-password').send({ identifier: 'backup@example.com' })
    expect(req2.status).toBe(200)
    expect(req2.body.code).toMatch(/^\d{6}$/)

    // 3. Recover via phone number
    const req3 = await request(app).post('/api/auth/forgot-password').send({ identifier: '03005550199' })
    expect(req3.status).toBe(200)
    expect(req3.body.code).toMatch(/^\d{6}$/)

    // 4. Reset password using the code
    const resetRes = await request(app).post('/api/auth/reset-password').send({
      identifier: '03005550199',
      code: req3.body.code,
      newPassword: 'new-secure-password-2026',
    })
    expect(resetRes.status).toBe(200)
    expect(resetRes.body.email).toBe('admin@example.com')

    // 5. Login with new password
    const loginRes = await request(app).post('/api/auth/login').send({ email: 'admin@example.com', password: 'new-secure-password-2026' })
    expect(loginRes.status).toBe(200)
  })

  it('allows user login via phone or name and logs working activities with session details', async () => {
    const admin = request.agent(app)
    await admin.post('/api/auth/setup').send({ name: 'Revoxen Admin', email: 'admin@example.com', password: 'admin-password-123' })

    // Create user with phone and lead permissions
    const createRes = await admin.post('/api/users').send({
      name: 'Faizan Staff',
      email: 'staff@example.com',
      phone: '+92 321 9876543',
      password: 'staff-secure-password',
      permissions: { leads: { view: true, edit: true } },
    })
    expect(createRes.status).toBe(201)
    const staffId = createRes.body.id

    // User logs in using phone number from a mobile device user-agent
    const staffClient = request.agent(app)
    const phoneLogin = await staffClient.post('/api/auth/login')
      .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')
      .send({ identifier: '03219876543', password: 'staff-secure-password' })
    expect(phoneLogin.status).toBe(200)
    expect(phoneLogin.body.name).toBe('Faizan Staff')

    // User performs an action: creates a lead
    const leadRes = await staffClient.post('/api/leads')
      .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')
      .send({
        name: 'Luxury Residence Villa',
        client: 'Tariq Mehmood',
        source: 'Website Enquiries',
        stage: 'Qualified',
        value: 12500000,
      })
    expect(leadRes.status).toBe(201)

    // Send heartbeat to touch session
    const heartbeat = await staffClient.post('/api/auth/heartbeat')
    expect(heartbeat.status).toBe(200)

    // Admin checks user activity endpoint
    const activityRes = await admin.get(`/api/users/${staffId}/activity`)
    expect(activityRes.status).toBe(200)
    expect(activityRes.body.user.name).toBe('Faizan Staff')
    expect(activityRes.body.isOnline).toBe(true)
    expect(activityRes.body.currentDevice).toContain('iPhone')
    expect(activityRes.body.activities.length).toBeGreaterThanOrEqual(2) // Sign In + Created Lead

    const leadActivity = activityRes.body.activities.find((a: any) => a.action === 'Created Lead')
    expect(leadActivity).toBeDefined()
    expect(leadActivity.module).toBe('Leads')
    expect(leadActivity.description).toContain('Luxury Residence Villa')
    expect(leadActivity.device).toContain('iPhone')
  })
})