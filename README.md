# Revoxen Associates Operations System

A PKR-based construction and renovation operations app. Employee, payroll, asset, vendor, project, cost, estimate, invoice, payment, and financial-report records are stored in a persistent SQLite database.

## Run locally

```sh
npm install
npm run dev
```

Open the Vite URL printed in the terminal. The dev command starts both the React UI and the Express API; the UI proxies `/api` requests to the API on port `3001`.

```sh
npm run build
npm run lint
npm test
```

## Modules

- **Dashboard:** registered project value, current-period payroll, receivables, billed income, operating costs, and quick entry.
- **Projects:** client, jobsite, scope, manager, contract value, status, and dates.
- **Employees:** employment details, base salary, fixed allowances, bonus, overtime multiplier, withholding rate, employee benefit deduction, employer contribution, and outstanding loan balance.
- **Payroll:** monthly overtime calculation, gross salary, tax, benefit/loan/other deductions, employer cost, net pay, draft/paid status, and duplicate-period protection.
- **Employee loans:** principal and balance tracking, with payroll repayments applied against outstanding loans in issue-date order.
- **Company assets:** tag, category, serial/model, cost, location, assigned custodian, warranty, condition, useful life, salvage value, and service history.
- **Vendors & sublet work orders:** vendor tax/contact/payment terms, awarded scope, work-order tax and retention, dated partial payments, and remaining payable.
- **Project expenses / Office & general:** separate ledgers for project costs and daily company overhead, with voucher, category, date, vendor, tax, payment method, and reference fields.
- **Estimates & invoices:** itemized PKR documents with description, length, width, height, quantity, nos, unit, rate, per-line tax, discount, and calculated totals. Approved estimates convert into projects. Final invoices cannot be sent until an audit passes and records the auditor and date.
- **Profit & loss:** monthly or yearly billed income less project expenses, general expenses, gross payroll/employer contributions, subcontractor payments, and straight-line asset depreciation. Cash collection, receivables, and input/output tax are reported separately.

## Database and calculations

The default database is `data/revoxen.sqlite`. The SQLite file and its WAL sidecars are excluded from source control. To use a different path, start the API with `DB_FILE=/absolute/path/to/company.sqlite`; set `API_PORT` to change its port. API records are validated server-side and financial payments are append-only ledger entries.

Payroll calculates overtime as `base monthly salary ÷ 26 ÷ 8 × overtime multiplier × overtime hours`; configurable fixed allowances and bonus are added to gross. Net pay subtracts percentage withholding, benefits, approved loan recovery, and other deductions. Pakistani statutory payroll/tax rules vary by employee and jurisdiction; have the company accountant confirm settings before paying staff.

Dimensional billing multiplies entered non-zero dimensions, quantity, nos, and unit rate. Line taxes are allocated after document-level discount. P&L excludes output tax from operating income and records vendor settlements in the period they are paid.

## Production boundary

This local version has persistent SQLite storage but no user accounts, role permissions, remote backup, multi-device hosting, payment gateway, or document attachment storage. It listens on localhost for development. Do not expose it to the public internet or use it as the sole statutory payroll/tax record until authentication, backups, access controls, and jurisdiction-specific accounting review are added.
<!-- vercel redeploy -->
