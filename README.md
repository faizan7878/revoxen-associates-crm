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
- **Projects:** database-backed portfolio, searchable project profile, client/contract/scope/team/timeline details, site-report history, linked estimates/invoices, and project-account navigation.
- **Project drawings:** the Engineering archive and each project profile share one private, revision-aware drawing register keyed by numeric project ID. Original files are stored under `data/project-drawings/<projectId>/`; metadata and estimate-to-revision links are stored in SQLite. Uploads accept PDF, DWG, DXF, JPG/JPEG, PNG, TIFF, IFC, ZIP, and RVT, with a default 100 MB per-file limit. Set `PROJECT_DRAWINGS_DIR` or `PROJECT_DRAWING_MAX_MB` to change storage or size limit. Back up the drawing directory together with the SQLite database.
- **Employees:** employment details, base salary, fixed allowances, bonus, overtime multiplier, withholding rate, employee benefit deduction, employer contribution, and outstanding loan balance.
- **Payroll:** monthly overtime calculation, gross salary, tax, benefit/loan/other deductions, employer cost, net pay, draft/paid status, and duplicate-period protection.
- **Employee loans:** principal and balance tracking, with payroll repayments applied against outstanding loans in issue-date order.
- **Company assets:** tag, category, serial/model, cost, location, assigned custodian, warranty, condition, useful life, salvage value, and service history.
- **Vendors & sublet work orders:** vendor tax/contact/payment terms, awarded scope, work-order tax and retention, dated partial payments, and remaining payable.
- **Project expenses / Office & general:** separate ledgers for project costs and daily company overhead, with voucher, category, date, vendor, tax, payment method, and reference fields.
- **Estimates & invoices:** itemized PKR documents with description, length, width, height, quantity, nos, unit, rate, per-line tax, discount, and calculated totals. Estimates may link selected drawing revisions from their selected project; cross-project drawing links are rejected. Approved estimates convert into projects. Final invoices cannot be sent until an audit passes and records the auditor and date.
- **Profit & loss:** monthly or yearly billed income less project expenses, general expenses, gross payroll/employer contributions, subcontractor payments, and straight-line asset depreciation. Cash collection, receivables, and input/output tax are reported separately.

## Database and calculations

The default database is `data/revoxen.sqlite`. The SQLite file and its WAL sidecars are excluded from source control. To use a different path, start the API with `DB_FILE=/absolute/path/to/company.sqlite`; set `API_PORT` to change its port. API records are validated server-side and financial payments are append-only ledger entries. Drawing files are private filesystem objects, never public URLs; archive actions preserve the source file and estimate links.

Payroll calculates overtime as `base monthly salary ÷ 26 ÷ 8 × overtime multiplier × overtime hours`; configurable fixed allowances and bonus are added to gross. Net pay subtracts percentage withholding, benefits, approved loan recovery, and other deductions. Pakistani statutory payroll/tax rules vary by employee and jurisdiction; have the company accountant confirm settings before paying staff.

Dimensional billing multiplies entered non-zero dimensions, quantity, nos, and unit rate. Line taxes are allocated after document-level discount. P&L excludes output tax from operating income and records vendor settlements in the period they are paid.

## Production boundary

This local version supports an administrator account, team accounts, per-module view/edit permissions, session revocation, SQLite storage, and private project drawing uploads. Roles are currently administrator/team-member with permission grants; the listed construction job titles are not separate built-in roles. Configure remote backup and secure multi-device hosting before deployment. There is no built-in DWG/DXF/IFC renderer, CAD conversion service, OCR, or automatic quantity extraction; unsupported drawing formats download unchanged, and no structural quantities are fabricated. Do not expose the development server directly to the public internet or use it as the sole statutory payroll/tax record without operational security and accounting review.
<!-- vercel redeploy -->
