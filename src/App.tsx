import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, BriefcaseBusiness,
  CalendarDays, CalendarRange, Check, CheckCircle2, ChevronDown, ChevronLeft,
  ChevronRight, CircleDollarSign, ClipboardList, Clock3, Command, Download,
  FileText, Filter, HardHat, LayoutDashboard, MapPin, Menu, MoreHorizontal,
  Plus, Receipt, Search, Settings2, Sparkles, UsersRound, Wrench, X,
  type LucideIcon,
} from 'lucide-react'
import './App.css'

type Project = {
  id: string; name: string; client: string; location: string; category: string
  status: 'In progress' | 'Planning' | 'At risk' | 'Completed'
  progress: number; budget: number; spent: number; start: string; due: string; manager: string
}
type Lead = { id: string; name: string; client: string; location: string; type: string; value: number; stage: string; date: string }
type Estimate = { id: string; client: string; project: string; amount: number; status: string; sent: string }
type Invoice = { id: string; client: string; project: string; amount: number; due: string; status: string }
type Store = { projects: Project[]; leads: Lead[]; estimates: Estimate[]; invoices: Invoice[] }
type Section = 'Overview' | 'Projects' | 'Leads' | 'Estimates' | 'Schedule' | 'Clients' | 'Invoices' | 'Team'
type CreateKind = 'Project' | 'Lead' | 'Estimate' | 'Invoice'

const seed: Store = {
  projects: [
    { id: 'RX-2418', name: 'Hawthorne kitchen & living', client: 'Eleanor Whitmore', location: 'Brooklyn, NY', category: 'Whole-home renovation', status: 'In progress', progress: 68, budget: 184500, spent: 126800, start: '2026-08-02', due: '2026-11-28', manager: 'Olivia Chen' },
    { id: 'RX-2416', name: 'Gowanus townhouse restoration', client: 'Martin & Co. Holdings', location: 'Brooklyn, NY', category: 'Historic restoration', status: 'At risk', progress: 42, budget: 328000, spent: 184600, start: '2026-07-17', due: '2026-12-15', manager: 'Marcus Cole' },
    { id: 'RX-2412', name: 'Fort Greene brownstone', client: 'Naomi Adler', location: 'Brooklyn, NY', category: 'Interior renovation', status: 'In progress', progress: 81, budget: 212000, spent: 169400, start: '2026-06-12', due: '2026-10-31', manager: 'Olivia Chen' },
    { id: 'RX-2409', name: 'Prospect Heights bath & suite', client: 'Devin & Sam Rivera', location: 'Brooklyn, NY', category: 'Bathroom remodel', status: 'Planning', progress: 12, budget: 86750, spent: 9800, start: '2026-10-04', due: '2027-01-08', manager: 'Ari Patel' },
    { id: 'RX-2405', name: 'Cobble Hill garden level', client: 'Clara Bennett', location: 'Brooklyn, NY', category: 'Basement conversion', status: 'In progress', progress: 54, budget: 143200, spent: 71200, start: '2026-07-09', due: '2026-11-19', manager: 'Marcus Cole' },
    { id: 'RX-2398', name: 'Carroll Gardens entry & facade', client: 'Hollis Property Group', location: 'Brooklyn, NY', category: 'Exterior renovation', status: 'Completed', progress: 100, budget: 72400, spent: 69800, start: '2026-05-01', due: '2026-09-30', manager: 'Ari Patel' },
  ],
  leads: [
    { id: 'LD-089', name: 'Park Slope duplex refresh', client: 'Gabrielle Moore', location: 'Park Slope, NY', type: 'Whole-home renovation', value: 246000, stage: 'Site visit', date: '2026-10-22' },
    { id: 'LD-087', name: 'Clinton Hill kitchen', client: 'Kendall James', location: 'Clinton Hill, NY', type: 'Kitchen remodel', value: 97500, stage: 'Estimate', date: '2026-10-24' },
    { id: 'LD-084', name: 'Brooklyn Heights parlor floor', client: 'Alder Street LLC', location: 'Brooklyn Heights, NY', type: 'Historic restoration', value: 412000, stage: 'Qualified', date: '2026-10-29' },
    { id: 'LD-082', name: 'Windsor Terrace bath', client: 'Theo Park', location: 'Windsor Terrace, NY', type: 'Bathroom remodel', value: 54800, stage: 'New inquiry', date: '2026-11-01' },
  ],
  estimates: [
    { id: 'EST-332', client: 'Kendall James', project: 'Clinton Hill kitchen', amount: 97500, status: 'Awaiting approval', sent: '2026-10-14' },
    { id: 'EST-329', client: 'Gabrielle Moore', project: 'Park Slope duplex refresh', amount: 246000, status: 'In review', sent: '2026-10-11' },
    { id: 'EST-321', client: 'Alder Street LLC', project: 'Brooklyn Heights parlor floor', amount: 412000, status: 'Draft', sent: '2026-10-08' },
    { id: 'EST-318', client: 'Theo Park', project: 'Windsor Terrace bath', amount: 54800, status: 'Approved', sent: '2026-10-02' },
  ],
  invoices: [
    { id: 'INV-1058', client: 'Eleanor Whitmore', project: 'Hawthorne kitchen & living', amount: 28200, due: '2026-10-22', status: 'Due soon' },
    { id: 'INV-1055', client: 'Martin & Co. Holdings', project: 'Gowanus townhouse restoration', amount: 41600, due: '2026-10-06', status: 'Overdue' },
    { id: 'INV-1052', client: 'Naomi Adler', project: 'Fort Greene brownstone', amount: 18750, due: '2026-11-02', status: 'Sent' },
    { id: 'INV-1048', client: 'Clara Bennett', project: 'Cobble Hill garden level', amount: 21400, due: '2026-10-07', status: 'Paid' },
  ],
}

const navigation: { label: Section; icon: LucideIcon; count?: string }[] = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Projects', icon: BriefcaseBusiness, count: '06' },
  { label: 'Leads', icon: Sparkles, count: '04' },
  { label: 'Estimates', icon: ClipboardList },
  { label: 'Schedule', icon: CalendarRange },
  { label: 'Clients', icon: UsersRound },
  { label: 'Invoices', icon: Receipt },
]
const team = [
  { name: 'Olivia Chen', role: 'Principal · Project lead', initials: 'OC', color: 'rose' },
  { name: 'Marcus Cole', role: 'Senior site manager', initials: 'MC', color: 'blue' },
  { name: 'Ari Patel', role: 'Design & estimating', initials: 'AP', color: 'green' },
  { name: 'Nina Brooks', role: 'Client experience', initials: 'NB', color: 'gold' },
]
const activities = [
  { initials: 'MC', color: 'blue', text: <><b>Marcus Cole</b> uploaded a site report</>, detail: 'Gowanus townhouse · 38 min ago', icon: FileText },
  { initials: 'NB', color: 'gold', text: <><b>Nina Brooks</b> sent an invoice to Eleanor</>, detail: 'Hawthorne kitchen · 2 hours ago', icon: Receipt },
  { initials: 'AP', color: 'green', text: <><b>Ari Patel</b> added a new project lead</>, detail: 'Windsor Terrace bath · 4 hours ago', icon: Sparkles },
]
const storeKey = 'revoxen-crm-v2'
const CURRENCIES = [
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', locale: 'ur-PK' },
  { code: 'USD', symbol: '$',  name: 'US Dollar',       locale: 'en-US' },
  { code: 'EUR', symbol: '€',  name: 'Euro',             locale: 'de-DE' },
  { code: 'GBP', symbol: '£',  name: 'British Pound',    locale: 'en-GB' },
  { code: 'AED', symbol: 'د.إ',name: 'UAE Dirham',       locale: 'ar-AE' },
  { code: 'SAR', symbol: '﷼',  name: 'Saudi Riyal',      locale: 'ar-SA' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar',  locale: 'en-CA' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar',locale: 'en-AU' },
  { code: 'JPY', symbol: '¥',  name: 'Japanese Yen',     locale: 'ja-JP' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc',      locale: 'de-CH' },
  { code: 'CNY', symbol: '¥',  name: 'Chinese Yuan',     locale: 'zh-CN' },
]
const makeCurrency = (code: string) => {
  const cfg = CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0]
  return (value: number) =>
    new Intl.NumberFormat(cfg.locale, { style: 'currency', currency: cfg.code, maximumFractionDigits: 0 }).format(value)
}
const currencySymbol = (code: string) => CURRENCIES.find((c) => c.code === code)?.symbol ?? code
const inputDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const dateAfter = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return inputDate(date)
}
const weekNumber = (date: Date) => {
  const weekDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = weekDate.getUTCDay() || 7
  weekDate.setUTCDate(weekDate.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(weekDate.getUTCFullYear(), 0, 1))
  return Math.ceil(((weekDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}
const refreshSeedDates = <T extends { id: string }>(records: T[] | undefined, defaults: T[], fields: (keyof T)[]): T[] => {
  if (!records) return defaults
  const savedIds = new Set(records.map((record) => record.id))
  return [
    ...records.map((record) => {
      const initial = defaults.find((item) => item.id === record.id)
      if (!initial) return record
      const dates = Object.fromEntries(fields.map((field) => [field, initial[field]]))
      return { ...initial, ...record, ...dates } as T
    }),
    ...defaults.filter((record) => !savedIds.has(record.id)),
  ]
}
const stored = (): Store => {
  try {
    const value = localStorage.getItem(storeKey) ?? localStorage.getItem('revoxen-crm-v1')
    if (!value) return seed
    const saved = JSON.parse(value) as Partial<Store>
    return {
      projects: refreshSeedDates(saved.projects, seed.projects, ['start', 'due']),
      leads: refreshSeedDates(saved.leads, seed.leads, ['date']),
      estimates: refreshSeedDates(saved.estimates, seed.estimates, ['sent']),
      invoices: refreshSeedDates(saved.invoices, seed.invoices, ['due']),
    }
  } catch { return seed }
}
const dateLabel = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const initials = (name: string) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()

function App() {
  const [data, setData] = useState<Store>(stored)
  const [section, setSection] = useState<Section>('Overview')
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('All projects')
  const [modal, setModal] = useState<CreateKind | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [today] = useState(() => new Date())
  const [form, setForm] = useState(() => ({ name: '', client: '', location: '', category: 'Whole-home renovation', amount: '', due: dateAfter(90), manager: 'Olivia Chen' }))
  const [toast, setToast] = useState('')
  const [noticeOpen, setNoticeOpen] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [activeCurrency, setActiveCurrency] = useState<string>(() => localStorage.getItem('revoxen-currency') ?? 'PKR')
  const currency = useMemo(() => makeCurrency(activeCurrency), [activeCurrency])
  const handleCurrencyChange = (code: string) => { setActiveCurrency(code); localStorage.setItem('revoxen-currency', code) }

  useEffect(() => { localStorage.setItem(storeKey, JSON.stringify(data)) }, [data])
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        document.getElementById('global-search')?.focus()
      }
      if (event.key === 'Escape') { setModal(null); setSelectedProject(null); setNoticeOpen(false) }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])
  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(''), 3000)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const query = search.trim().toLowerCase()
  const projects = useMemo(() => data.projects.filter((project) => {
    const matchesQuery = !query || `${project.name} ${project.client} ${project.location} ${project.category} ${project.id}`.toLowerCase().includes(query)
    const matchesStatus = projectFilter === 'All projects' || project.status === projectFilter
    return matchesQuery && matchesStatus
  }), [data.projects, projectFilter, query])
  const activeProjects = data.projects.filter((project) => project.status !== 'Completed')
  const activeValue = activeProjects.reduce((sum, project) => sum + project.budget, 0)
  const outstanding = data.invoices.filter((invoice) => invoice.status !== 'Paid').reduce((sum, invoice) => sum + invoice.amount, 0)
  const leadPipeline = data.leads.filter((lead) => lead.stage !== 'Won').reduce((sum, lead) => sum + lead.value, 0)
  const headerDate = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(today)
  const heading = section === 'Overview' ? 'Good morning, Olivia' : section
  const descriptions: Record<Section, string> = {
    Overview: 'Here’s what’s happening across your projects today.',
    Projects: 'Every job, from first site walk to final sign-off.',
    Leads: 'Build relationships. Win the right work.',
    Estimates: 'Scope, price, and follow every proposal.',
    Schedule: 'A clear view of what’s happening on site.',
    Clients: 'The people and partners behind the work.',
    Invoices: 'Keep billing visible and cash flow moving.',
    Team: 'Your people, responsibilities, and active workload.',
  }

  const notify = (message: string) => setToast(message)
  const openCreate = (kind: CreateKind) => {
    setForm({ name: '', client: '', location: '', category: 'Whole-home renovation', amount: '', due: dateAfter(90), manager: 'Olivia Chen' })
    setModal(kind)
  }
  const saveRecord = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const amount = Number(form.amount) || 0
    const projectName = form.name.trim()
    if (modal === 'Project') {
      const project: Project = { id: `RX-${2420 + data.projects.length}`, name: projectName, client: form.client.trim(), location: form.location.trim() || 'Brooklyn, NY', category: form.category, status: 'Planning', progress: 0, budget: amount, spent: 0, start: inputDate(new Date()), due: form.due, manager: form.manager }
      setData((current) => ({ ...current, projects: [project, ...current.projects] }))
      setSection('Projects')
    } else if (modal === 'Lead') {
      const lead: Lead = { id: `LD-${89 + data.leads.length}`, name: projectName, client: form.client.trim(), location: form.location.trim() || 'Brooklyn, NY', type: form.category, value: amount, stage: 'New inquiry', date: inputDate(new Date()) }
      setData((current) => ({ ...current, leads: [lead, ...current.leads] }))
      setSection('Leads')
    } else if (modal === 'Estimate') {
      const estimate: Estimate = { id: `EST-${333 + data.estimates.length}`, client: form.client.trim(), project: projectName, amount, status: 'Draft', sent: inputDate(new Date()) }
      setData((current) => ({ ...current, estimates: [estimate, ...current.estimates] }))
      setSection('Estimates')
    } else if (modal === 'Invoice') {
      const invoice: Invoice = { id: `INV-${1059 + data.invoices.length}`, client: form.client.trim(), project: projectName, amount, due: form.due, status: 'Sent' }
      setData((current) => ({ ...current, invoices: [invoice, ...current.invoices] }))
      setSection('Invoices')
    }
    setModal(null)
    notify(`${modal} added to Revoxen.`)
  }
  const advanceLead = (id: string) => {
    const stages = ['New inquiry', 'Qualified', 'Site visit', 'Estimate', 'Won']
    setData((current) => ({ ...current, leads: current.leads.map((lead) => {
      if (lead.id !== id) return lead
      return { ...lead, stage: stages[Math.min(stages.indexOf(lead.stage) + 1, stages.length - 1)] }
    }) }))
    notify('Opportunity moved to the next stage.')
  }
  const markInvoicePaid = (id: string) => {
    setData((current) => ({ ...current, invoices: current.invoices.map((invoice) => invoice.id === id ? { ...invoice, status: 'Paid' } : invoice) }))
    notify('Invoice marked as paid.')
  }
  const convertEstimate = (id: string) => {
    const estimate = data.estimates.find((item) => item.id === id)
    if (!estimate || estimate.status !== 'Approved') return
    const project: Project = { id: `RX-${2420 + data.projects.length}`, name: estimate.project, client: estimate.client, location: 'Brooklyn, NY', category: 'Whole-home renovation', status: 'Planning', progress: 0, budget: estimate.amount, spent: 0, start: inputDate(today), due: dateAfter(120), manager: 'Olivia Chen' }
    setData((current) => ({ ...current, projects: [project, ...current.projects], estimates: current.estimates.map((item) => item.id === id ? { ...item, status: 'Converted' } : item) }))
    setSection('Projects')
    notify('Approved estimate converted to a new project.')
  }
  const exportProjects = () => {
    const rows = [['ID', 'Project', 'Client', 'Location', 'Status', 'Budget', 'Spent', 'Progress'], ...data.projects.map((project) => [project.id, project.name, project.client, project.location, project.status, String(project.budget), String(project.spent), `${project.progress}%`])]
    const csv = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'revoxen-projects.csv'
    link.click()
    URL.revokeObjectURL(url)
    notify('Project report exported as CSV.')
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <img src="/logo.png" alt="Revoxen Logo" className="brand-mark-logo" />
          <div className="brand-name">revoxen<span>associates</span></div>
          <button className="icon-button sidebar-close" aria-label="Close navigation" onClick={() => setMobileNav(false)}><X size={17} /></button>
        </div>
        <button className="workspace-switch" onClick={() => notify('You are viewing Revoxen Associates.') }>
          <span className="workspace-symbol"><Building2Icon /></span>
          <span className="workspace-copy"><strong>Revoxen Associates</strong><small>Brooklyn, New York</small></span>
          <ChevronDown size={15} />
        </button>
        <div className="nav-caption">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Main navigation">
          {navigation.map(({ label, icon: Icon, count }) => {
            const badge = label === 'Projects' ? String(data.projects.length).padStart(2, '0') : label === 'Leads' ? String(data.leads.length).padStart(2, '0') : count
            return <button key={label} className={`nav-item ${section === label ? 'nav-item-active' : ''}`} onClick={() => { setSection(label); setMobileNav(false) }}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>{badge && <span className="nav-count">{badge}</span>}
            </button>
          })}
        </nav>
        <div className="nav-caption tools-caption">PEOPLE</div>
        <button className={`nav-item ${section === 'Team' ? 'nav-item-active' : ''}`} onClick={() => { setSection('Team'); setMobileNav(false) }}>
          <HardHat size={17} strokeWidth={1.8} /><span>Team</span><span className="team-mini-stack"><i>O</i><i>M</i><i>A</i></span>
        </button>
        <div className="sidebar-spacer" />
        <div className="sidebar-note">
          <div className="sidebar-note-icon"><Wrench size={17} /></div>
          <strong>Built around your craft.</strong>
          <p>One place for the work, the people, and every detail between.</p>
        </div>
        <div className="profile-row">
          <span className="avatar avatar-rose">OC</span>
          <span className="profile-copy"><strong>Olivia Chen</strong><small>Principal</small></span>
          <button className="icon-button profile-menu" aria-label="Profile settings" onClick={() => notify('Profile settings are coming soon.')}><Settings2 size={17} /></button>
        </div>
      </aside>

      {mobileNav && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}

      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Menu size={19} /></button>
            <span className="breadcrumb-muted">Revoxen</span><span className="breadcrumb-slash">/</span><span className="breadcrumb-current">{section}</span>
          </div>
          <div className="topbar-actions">
            <label className="search-box" htmlFor="global-search"><Search size={16} /><input id="global-search" placeholder="Search anything..." value={search} onChange={(event) => setSearch(event.target.value)} /><kbd><Command size={10} /> K</kbd></label>
            <label className="currency-picker" aria-label="Select currency">
              <span className="currency-picker-symbol">{currencySymbol(activeCurrency)}</span>
              <select value={activeCurrency} onChange={(e) => handleCurrencyChange(e.target.value)}>
                {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
              </select>
              <ChevronDown size={11} />
            </label>
            <div className="notification-wrap">
              <button className={`icon-button notification-button ${noticeOpen ? 'button-pressed' : ''}`} aria-label="Notifications" onClick={() => setNoticeOpen((open) => !open)}><Bell size={18} /><span /></button>
              {noticeOpen && <div className="notification-popover"><div className="popover-title"><strong>Notifications</strong><span className="unread-label">2 new</span></div><div className="notification-item"><span className="notice-dot notice-orange" /><div><b>Invoice needs attention</b><p>Gowanus townhouse · overdue invoice</p><small>Today, 9:14 AM</small></div></div><div className="notification-item"><span className="notice-dot notice-green" /><div><b>New lead received</b><p>Windsor Terrace bathroom remodel</p><small>Today, 8:42 AM</small></div></div></div>}
            </div>
            <span className="topbar-divider" />
            <button className="top-avatar" aria-label="Olivia Chen profile" onClick={() => setSection('Team')}>OC</button>
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading">
              <div><div className="eyebrow"><span className="eyebrow-line" />{headerDate.toUpperCase()} <span className="eyebrow-dot">·</span> WEEK {weekNumber(today)}</div><h1>{heading}{section === 'Overview' && <span className="heading-sun">✳</span>}</h1><p>{descriptions[section]}</p></div>
            <div className="heading-actions">
              <button className="button button-secondary hide-mobile" onClick={exportProjects}><Download size={15} /> Export</button>
              <div className="add-menu-wrap"><button className="button button-primary" onClick={() => openCreate(section === 'Leads' ? 'Lead' : section === 'Estimates' ? 'Estimate' : section === 'Invoices' ? 'Invoice' : 'Project')}><Plus size={16} /> New {section === 'Leads' ? 'lead' : section === 'Estimates' ? 'estimate' : section === 'Invoices' ? 'invoice' : 'project'}</button></div>
            </div>
          </div>

          {section === 'Overview' && <Overview data={data} activeProjects={activeProjects} activeValue={activeValue} outstanding={outstanding} leadPipeline={leadPipeline} openCreate={openCreate} setSection={setSection} openProject={setSelectedProject} currency={currency} />}
          {section === 'Projects' && <ProjectsView projects={projects} projectFilter={projectFilter} setProjectFilter={setProjectFilter} openCreate={() => openCreate('Project')} openProject={setSelectedProject} currency={currency} />}
          {section === 'Leads' && <LeadsView leads={data.leads.filter((lead) => !query || `${lead.name} ${lead.client} ${lead.location}`.toLowerCase().includes(query))} openCreate={() => openCreate('Lead')} onAdvance={advanceLead} currency={currency} />}
          {section === 'Estimates' && <EstimatesView estimates={data.estimates.filter((estimate) => !query || `${estimate.client} ${estimate.project} ${estimate.id}`.toLowerCase().includes(query))} openCreate={() => openCreate('Estimate')} onConvert={convertEstimate} currency={currency} />}
          {section === 'Schedule' && <ScheduleView projects={activeProjects} />}
          {section === 'Clients' && <ClientsView data={data} query={query} currency={currency} />}
          {section === 'Invoices' && <InvoicesView invoices={data.invoices.filter((invoice) => !query || `${invoice.client} ${invoice.project} ${invoice.id}`.toLowerCase().includes(query))} openCreate={() => openCreate('Invoice')} onMarkPaid={markInvoicePaid} currency={currency} />}
          {section === 'Team' && <TeamView projects={data.projects} onInvite={() => notify('Team invitations are coming soon.')} />}
          <footer className="page-footer"><span>© 2026 Revoxen Associates</span><span><span className="footer-status-dot" /> All project data is up to date</span></footer>
        </div>
      </main>

      {modal && <CreateModal kind={modal} form={form} setForm={setForm} onClose={() => setModal(null)} onSubmit={saveRecord} currencyCode={activeCurrency} currencySymbol={currencySymbol(activeCurrency)} />}
      {selectedProject && <ProjectDetail project={selectedProject} onClose={() => setSelectedProject(null)} currency={currency} />}
      {toast && <div className="toast-message"><CheckCircle2 size={17} />{toast}</div>}
    </div>
  )
}

function Building2Icon() { return <span className="building-glyph">R</span> }

function Overview({ data, activeProjects, activeValue, outstanding, leadPipeline, openCreate, setSection, openProject, currency }: {
  data: Store; activeProjects: Project[]; activeValue: number; outstanding: number; leadPipeline: number
  openCreate: (kind: CreateKind) => void; setSection: (section: Section) => void; openProject: (project: Project) => void
  currency: (v: number) => string
}) {
  const openLeadCount = data.leads.filter((lead) => lead.stage !== 'Won').length
  const [nextSiteDate] = useState(() => {
    const date = new Date()
    if (date.getDay() === 6) date.setDate(date.getDate() + 2)
    if (date.getDay() === 0) date.setDate(date.getDate() + 1)
    return date
  })
  const cards = [
    { label: 'ACTIVE PROJECTS', value: String(activeProjects.length).padStart(2, '0'), note: '+2 this quarter', trend: 'up', icon: BriefcaseBusiness, tone: 'coral' },
    { label: 'CONTRACT VALUE', value: currency(activeValue), note: 'Across active work', trend: 'up', icon: CircleDollarSign, tone: 'sage' },
    { label: 'TO COLLECT', value: currency(outstanding), note: `${data.invoices.filter((invoice) => invoice.status !== 'Paid').length} invoices outstanding`, trend: 'down', icon: Receipt, tone: 'amber' },
    { label: 'LEAD PIPELINE', value: currency(leadPipeline), note: `${openLeadCount} opportunities open`, trend: 'up', icon: Activity, tone: 'blue' },
  ]
  return <>
    <section className="metric-grid" aria-label="Business overview metrics">
      {cards.map(({ label, value, note, trend, icon: Icon, tone }) => <article className="metric-card" key={label}><div className="metric-topline"><span>{label}</span><span className={`metric-icon icon-${tone}`}><Icon size={16} strokeWidth={1.8} /></span></div><strong className="metric-value">{value}</strong><div className="metric-foot"><span className={`trend-icon ${trend}`} aria-hidden="true">{trend === 'up' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}</span><span>{note}</span><span className="metric-foot-period">vs. last month</span></div></article>)}
    </section>

    <div className="dashboard-layout">
      <section className="panel project-panel">
        <div className="panel-heading"><div><span className="section-kicker">ON THE GROUND</span><h2>Active projects <span className="count-pill">{activeProjects.length}</span></h2></div><button className="text-action" onClick={() => setSection('Projects')}>All projects <ArrowRight size={14} /></button></div>
        <div className="project-table-wrap"><table className="project-table"><thead><tr><th>PROJECT</th><th>STATUS</th><th>PROGRESS</th><th>CONTRACT</th><th>DUE DATE</th><th><span className="sr-only">Open project</span></th></tr></thead><tbody>{activeProjects.slice(0, 5).map((project) => <ProjectRow project={project} key={project.id} onOpen={openProject} currency={currency} />)}</tbody></table></div>
        <button className="mobile-view-all" onClick={() => setSection('Projects')}>View all projects <ArrowRight size={14} /></button>
      </section>

      <aside className="right-column">
        <section className="panel schedule-panel"><div className="panel-heading"><div><span className="section-kicker">UP NEXT</span><h2>Site schedule</h2></div><button className="icon-button compact-icon" aria-label="Open full schedule" onClick={() => setSection('Schedule')}><ArrowUpRight size={16} /></button></div><div className="schedule-date"><span className="schedule-date-number">{String(nextSiteDate.getDate()).padStart(2, '0')}</span><div><strong>{new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long' }).format(nextSiteDate)}</strong><small>3 site visits scheduled</small></div><span className="schedule-date-month">{nextSiteDate.getFullYear()}</span></div><div className="appointment-list"><Appointment time="8:30 AM" title="Electrical rough-in" site="Hawthorne kitchen" color="coral" /><Appointment time="11:00 AM" title="Client walkthrough" site="Fort Greene brownstone" color="sage" /><Appointment time="2:15 PM" title="Subcontractor check-in" site="Gowanus townhouse" color="blue" /></div><button className="schedule-link" onClick={() => setSection('Schedule')}>Open team calendar <ArrowRight size={14} /></button></section>
        <section className="panel pipeline-panel">
          <div className="panel-heading"><div><span className="section-kicker">IN THE PIPELINE</span><h2>New opportunities</h2></div><button className="icon-button compact-icon" aria-label="View all leads" onClick={() => setSection('Leads')}><ArrowUpRight size={16} /></button></div>
          <div className="pipeline-total"><strong>{currency(leadPipeline)}</strong><span>potential value</span><div className="pipeline-bars"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></div>
          <div className="pipeline-stages">
            <span><i className="stage-dot dot-coral" />New <b>{data.leads.filter((lead) => lead.stage === 'New inquiry').length}</b></span>
            <span><i className="stage-dot dot-amber" />In review <b>{data.leads.filter((lead) => lead.stage !== 'New inquiry' && lead.stage !== 'Won').length}</b></span>
            <span><i className="stage-dot dot-green" />Won <b>{data.leads.filter((lead) => lead.stage === 'Won').length}</b></span>
          </div>
          <button className="pipeline-link" onClick={() => openCreate('Lead')}><Plus size={14} /> Add an opportunity</button>
        </section>
      </aside>
    </div>

    <div className="bottom-layout">
      <section className="panel activity-panel"><div className="panel-heading"><div><span className="section-kicker">THE LATEST</span><h2>Recent activity</h2></div><button className="text-action" onClick={() => setSection('Team')}>Team <ArrowRight size={14} /></button></div><div className="activity-list">{activities.map((item, index) => <div className="activity-item" key={item.initials}><span className={`avatar avatar-${item.color}`}>{item.initials}</span><div className="activity-copy"><span>{item.text}</span><small>{item.detail}</small></div><span className="activity-kind"><item.icon size={15} /></span>{index < activities.length - 1 && <span className="activity-connector" />}</div>)}</div></section>
      <section className="panel focus-panel"><span className="section-kicker">A GOOD PLACE TO START</span><div className="focus-mark"><Sparkles size={17} /></div><h2>Keep the details<br />moving forward.</h2><p>One clean handoff at a time makes a better build.</p><button className="button button-dark" onClick={() => openCreate('Project')}>Start a new project <ArrowRight size={15} /></button><span className="focus-number">01 <i /> 03</span></section>
    </div>
  </>
}

function ProjectRow({ project, onOpen, currency }: { project: Project; onOpen?: (project: Project) => void; currency: (v: number) => string }) {
  return <tr><td><div className="project-cell"><span className={`project-tile ${categoryColor(project.category)}`}><Wrench size={15} /></span><span className="project-name-wrap"><strong>{project.name}</strong><small>{project.id} <span>·</span> {project.client}</small></span></div></td><td><StatusBadge value={project.status} /></td><td><div className="progress-cell"><div className="progress-track"><span style={{ width: `${project.progress}%` }} /></div><small>{project.progress}%</small></div></td><td className="table-money">{currency(project.budget)}</td><td className="table-date">{dateLabel(project.due)}</td><td><button className="row-more" aria-label={`Open ${project.name}`} onClick={() => onOpen?.(project)}><MoreHorizontal size={16} /></button></td></tr>
}

function ProjectsView({ projects, projectFilter, setProjectFilter, openCreate, openProject, currency }: { projects: Project[]; projectFilter: string; setProjectFilter: (value: string) => void; openCreate: () => void; openProject: (project: Project) => void; currency: (v: number) => string }) {
  return <section className="panel full-panel list-panel"><div className="list-toolbar"><div><span className="section-kicker">YOUR PORTFOLIO</span><h2>Project portfolio <span className="count-pill">{projects.length}</span></h2></div><div className="toolbar-actions"><label className="filter-select"><Filter size={14} /><select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}><option>All projects</option><option>In progress</option><option>Planning</option><option>At risk</option><option>Completed</option></select><ChevronDown size={13} /></label><button className="button button-primary button-small" onClick={openCreate}><Plus size={15} /> New project</button></div></div><div className="project-table-wrap full-table-wrap"><table className="project-table"><thead><tr><th>PROJECT</th><th>STATUS</th><th>PROGRESS</th><th>CONTRACT</th><th>SPENT</th><th>DUE DATE</th></tr></thead><tbody>{projects.map((project) => <ProjectRow project={project} key={project.id} onOpen={openProject} currency={currency} />)}</tbody></table>{projects.length === 0 && <EmptyState title="No matching projects" text="Try a different status or search term." />}</div><div className="table-footer"><span>Showing {projects.length} projects</span><span>Project value <strong>{currency(projects.reduce((sum, project) => sum + project.budget, 0))}</strong></span></div></section>
}

function LeadsView({ leads, openCreate, onAdvance, currency }: { leads: Lead[]; openCreate: () => void; onAdvance: (id: string) => void; currency: (v: number) => string }) {
  const stages = ['New inquiry', 'Qualified', 'Site visit', 'Estimate', 'Won']
  return <section className="lead-board"><div className="lead-board-top"><div><span className="section-kicker">RELATIONSHIPS IN MOTION</span><h2>Opportunity pipeline <span className="count-pill">{leads.length}</span></h2></div><span className="board-total">{currency(leads.filter((lead) => lead.stage !== 'Won').reduce((sum, lead) => sum + lead.value, 0))}<small>open opportunity value</small></span></div><div className="kanban-grid">{stages.map((stage, index) => { const items = leads.filter((lead) => lead.stage === stage); return <section className="kanban-column" key={stage}><div className="kanban-head"><span className={`kanban-dot kanban-${index}`} /><strong>{stage}</strong><span className="kanban-count">{items.length}</span><button className="icon-button tiny-icon" aria-label={`Add opportunity to ${stage}`} onClick={openCreate}><Plus size={15} /></button></div>{items.map((lead) => <article className="lead-card" key={lead.id}><div className="lead-card-top"><span className="lead-id">{lead.id}</span><button className="row-more" aria-label="More opportunity actions"><MoreHorizontal size={16} /></button></div><h3>{lead.name}</h3><div className="lead-client"><span className="avatar avatar-small avatar-sage">{initials(lead.client)}</span>{lead.client}</div><div className="lead-card-meta"><span><MapPin size={12} />{lead.location}</span><span><CalendarDays size={12} />{dateLabel(lead.date)}</span></div><div className="lead-card-foot"><span>{lead.type}</span><strong>{currency(lead.value)}</strong>{lead.stage !== 'Won' && <button className="lead-advance" onClick={() => onAdvance(lead.id)}>Move forward <ArrowRight size={12} /></button>}</div></article>)}{items.length === 0 && <button className="empty-column" onClick={openCreate}>No opportunities yet <span>+ Add one</span></button>}</section> })}</div></section>
}

function EstimatesView({ estimates, openCreate, onConvert, currency }: { estimates: Estimate[]; openCreate: () => void; onConvert: (id: string) => void; currency: (v: number) => string }) {
  return <section className="panel full-panel list-panel"><div className="list-toolbar"><div><span className="section-kicker">SCOPE & PRICING</span><h2>Estimates <span className="count-pill">{estimates.length}</span></h2></div><button className="button button-primary button-small" onClick={openCreate}><Plus size={15} /> New estimate</button></div><div className="record-list">{estimates.map((estimate, index) => <div className="record-row" key={estimate.id}><span className={`record-icon record-icon-${index % 4}`}><FileText size={17} /></span><div className="record-main"><strong>{estimate.project}</strong><small>{estimate.id} <span>·</span> {estimate.client}</small></div><div className="record-col record-date"><span>LAST UPDATED</span><strong>{dateLabel(estimate.sent)}</strong></div><div className="record-col"><StatusBadge value={estimate.status} /></div><div className="record-amount">{currency(estimate.amount)}</div>{estimate.status === 'Approved' && <button className="button button-light estimate-convert" onClick={() => onConvert(estimate.id)}>Make project <ArrowRight size={12} /></button>}</div>)}{estimates.length === 0 && <EmptyState title="No estimates yet" text="Create a proposal to get work moving." />}</div><div className="list-note"><Sparkles size={15} /><span>Approved estimates can be converted into active projects.</span></div></section>
}

function InvoicesView({ invoices, openCreate, onMarkPaid, currency }: { invoices: Invoice[]; openCreate: () => void; onMarkPaid: (id: string) => void; currency: (v: number) => string }) {
  const totalDue = invoices.filter((invoice) => invoice.status !== 'Paid').reduce((sum, invoice) => sum + invoice.amount, 0)
  return <><div className="invoice-summary-row"><div className="invoice-summary"><span>OUTSTANDING</span><strong>{currency(totalDue)}</strong><small>{invoices.filter((invoice) => invoice.status !== 'Paid').length} invoices need attention</small></div><div className="invoice-summary invoice-summary-green"><span>COLLECTED THIS MONTH</span><strong>{currency(invoices.filter((invoice) => invoice.status === 'Paid').reduce((sum, invoice) => sum + invoice.amount, 0))}</strong><small>Payments marked as received</small></div></div><section className="panel full-panel list-panel"><div className="list-toolbar"><div><span className="section-kicker">BILLING & PAYMENTS</span><h2>Invoices <span className="count-pill">{invoices.length}</span></h2></div><button className="button button-primary button-small" onClick={openCreate}><Plus size={15} /> New invoice</button></div><div className="invoice-list">{invoices.map((invoice) => <div className="invoice-row" key={invoice.id}><span className={`invoice-mark ${invoice.status === 'Overdue' ? 'invoice-mark-alert' : invoice.status === 'Paid' ? 'invoice-mark-paid' : ''}`}>{invoice.status === 'Paid' ? <Check size={17} /> : <Receipt size={17} />}</span><div className="invoice-main"><strong>{invoice.client}</strong><small>{invoice.id} <span>·</span> {invoice.project}</small></div><div className="invoice-due"><span>DUE DATE</span><strong>{dateLabel(invoice.due)}</strong></div><StatusBadge value={invoice.status} /><strong className="invoice-amount">{currency(invoice.amount)}</strong><button className="button button-light button-pay" disabled={invoice.status === 'Paid'} onClick={() => onMarkPaid(invoice.id)}>{invoice.status === 'Paid' ? 'Paid' : 'Mark paid'}</button></div>)}{invoices.length === 0 && <EmptyState title="No invoices yet" text="Your invoices will appear here." />}</div></section></>
}

function ScheduleView({ projects }: { projects: Project[] }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [today] = useState(() => new Date())
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  if (today.getDay() === 0 || today.getDay() === 6) weekStart.setDate(weekStart.getDate() + 7)
  weekStart.setDate(weekStart.getDate() + weekOffset * 7)
  const eventPlans = [
    ['Hawthorne · Electrical rough-in', 'Gowanus · Framing inspection'],
    ['Fort Greene · Cabinet install'],
    ['Cobble Hill · Plumbing rough-in', 'Hawthorne · Client check-in'],
    ['Gowanus · Structural review'],
    ['Hawthorne · Electrical rough-in', 'Fort Greene · Client walkthrough', 'Gowanus · Subcontractor check-in'],
  ]
  const days = eventPlans.map((events, index) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + index)
    return { day: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date).toUpperCase(), date: date.getDate(), iso: inputDate(date), events }
  })
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 4)
  const weekLabel = `${dateLabel(inputDate(weekStart))} – ${dateLabel(inputDate(weekEnd))}, ${weekEnd.getFullYear()}`
  const activityCount = eventPlans.reduce((total, events) => total + events.length, 0)
  return <><section className="schedule-banner"><div><span className="section-kicker">TEAM CALENDAR</span><h2>Week of {weekLabel}</h2><p>{projects.length} active projects · {activityCount} scheduled site activities</p></div><div className="calendar-switcher"><button className="icon-button" aria-label="Previous week" onClick={() => setWeekOffset((offset) => offset - 1)}><ChevronLeft size={17} /></button><span>{weekOffset === 0 ? (today.getDay() === 0 || today.getDay() === 6 ? 'NEXT WEEK' : 'THIS WEEK') : weekOffset > 0 ? 'NEXT WEEKS' : 'PAST WEEKS'}</span><button className="icon-button" aria-label="Next week" onClick={() => setWeekOffset((offset) => offset + 1)}><ChevronRight size={17} /></button></div></section><section className="week-grid">{days.map((day, index) => <article className={`week-day ${day.iso === inputDate(today) ? 'week-day-today' : ''}`} key={day.iso}><div className="week-day-head"><span>{day.day}</span><strong>{String(day.date).padStart(2, '0')}</strong></div><div className="week-events">{day.events.map((event, eventIndex) => <div className={`week-event event-${(index + eventIndex) % 3}`} key={event}><span className="event-time">{['8:30', '11:00', '2:15'][eventIndex % 3]}</span><strong>{event.split(' · ')[0]}</strong><span>{event.split(' · ')[1]}</span></div>)}{day.events.length === 0 && <div className="week-empty">No site visits</div>}</div></article>)}</section><section className="panel upcoming-panel"><div className="panel-heading"><div><span className="section-kicker">PROJECT MILESTONES</span><h2>Upcoming deadlines</h2></div><span className="subtle-label">NEXT 90 DAYS</span></div><div className="milestone-list">{projects.slice(0, 5).sort((a, b) => a.due.localeCompare(b.due)).map((project) => <div className="milestone-row" key={project.id}><span className="milestone-calendar"><CalendarDays size={16} /></span><div><strong>{project.name}</strong><small>{project.id} · {project.client}</small></div><StatusBadge value={project.status} /><time>{dateLabel(project.due)}, {new Date(`${project.due}T12:00:00`).getFullYear()}</time></div>)}</div></section></>
}

function ClientsView({ data, query, currency }: { data: Store; query: string; currency: (v: number) => string }) {
  const clientMap = new Map<string, { client: string; projects: string[]; total: number }>()
  data.projects.forEach((project) => { const item = clientMap.get(project.client) ?? { client: project.client, projects: [], total: 0 }; item.projects.push(project.name); item.total += project.budget; clientMap.set(project.client, item) })
  data.leads.forEach((lead) => { if (!clientMap.has(lead.client)) clientMap.set(lead.client, { client: lead.client, projects: [lead.name], total: lead.value }) })
  const clients = [...clientMap.values()].filter((client) => !query || `${client.client} ${client.projects.join(' ')}`.toLowerCase().includes(query))
  return <section className="panel full-panel list-panel"><div className="list-toolbar"><div><span className="section-kicker">CLIENT RELATIONSHIPS</span><h2>Clients <span className="count-pill">{clients.length}</span></h2></div><span className="subtle-label">{clients.length} CLIENTS IN YOUR BOOK</span></div><div className="client-grid">{clients.map((client, index) => <article className="client-card" key={client.client}><div className="client-card-top"><span className={`client-monogram monogram-${index % 4}`}>{initials(client.client)}</span><button className="row-more" aria-label={`More actions for ${client.client}`}><MoreHorizontal size={17} /></button></div><h3>{client.client}</h3><p>{client.projects.length} {client.projects.length === 1 ? 'project' : 'projects'} with Revoxen</p><div className="client-card-bottom"><span>CONTRACT VALUE</span><strong>{currency(client.total)}</strong></div><div className="client-project-name"><BriefcaseBusiness size={13} />{client.projects[0]}</div></article>)}</div>{clients.length === 0 && <EmptyState title="No clients found" text="Try a different search term." />}</section>
}

function TeamView({ projects, onInvite }: { projects: Project[]; onInvite: () => void }) {
  return <section className="panel full-panel team-panel"><div className="list-toolbar"><div><span className="section-kicker">YOUR PEOPLE</span><h2>Studio team <span className="count-pill">04</span></h2></div><button className="button button-secondary button-small" onClick={onInvite}><Plus size={15} /> Invite teammate</button></div><div className="team-grid">{team.map((member) => { const assigned = projects.filter((project) => project.manager === member.name); return <article className="team-card" key={member.name}><div className="team-card-head"><span className={`avatar avatar-large avatar-${member.color}`}>{member.initials}</span><span className="online-dot" /><button className="row-more" aria-label={`More actions for ${member.name}`}><MoreHorizontal size={17} /></button></div><h3>{member.name}</h3><p>{member.role}</p><div className="team-workload"><span>ACTIVE WORKLOAD</span><strong>{assigned.length} <small>{assigned.length === 1 ? 'project' : 'projects'}</small></strong></div><div className="team-assigned">{assigned.slice(0, 2).map((project) => <span key={project.id}><i />{project.name}</span>)}{assigned.length === 0 && <span className="team-unassigned">Available for new work</span>}</div></article> })}</div></section>
}

function CreateModal({ kind, form, setForm, onClose, onSubmit, currencySymbol: symb }: { kind: CreateKind; form: { name: string; client: string; location: string; category: string; amount: string; due: string; manager: string }; setForm: (form: { name: string; client: string; location: string; category: string; amount: string; due: string; manager: string }) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; currencyCode: string; currencySymbol: string }) {
  const noun = kind === 'Lead' ? 'opportunity' : kind.toLowerCase()
  const isProjectOrLead = kind === 'Project' || kind === 'Lead'
  const titlePlaceholder = kind === 'Project' ? 'e.g. Boerum Hill kitchen & living' : kind === 'Lead' ? 'e.g. Park Slope duplex refresh' : kind === 'Estimate' ? 'e.g. Kitchen renovation proposal' : 'e.g. Progress payment · phase two'
  const valueLabel = kind === 'Project' ? 'Contract value' : kind === 'Lead' ? 'Opportunity value' : kind === 'Estimate' ? 'Estimate total' : 'Invoice total'
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="create-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-heading"><div className="modal-symbol"><Plus size={18} /></div><button className="icon-button modal-close" aria-label="Close dialog" onClick={onClose}><X size={18} /></button><span className="section-kicker">REVOXEN ASSOCIATES</span><h2 id="modal-title">New {noun}</h2><p>Bring the next piece of work into focus.</p></div>
      <form onSubmit={onSubmit} className="modal-form">
        <label className="form-field form-span"><span>{kind === 'Invoice' ? 'Invoice description' : kind === 'Estimate' ? 'Estimate name' : kind === 'Lead' ? 'Opportunity name' : 'Project name'} <i>*</i></span><input autoFocus required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder={titlePlaceholder} /></label>
        <label className="form-field"><span>Client name <i>*</i></span><input required value={form.client} onChange={(event) => setForm({ ...form, client: event.target.value })} placeholder="Client or organization" /></label>
        <label className="form-field"><span>{isProjectOrLead ? 'Site location' : 'Project location'}</span><input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Brooklyn, NY" /></label>
        {isProjectOrLead ? <label className="form-field"><span>Work type</span><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>Whole-home renovation</option><option>Kitchen remodel</option><option>Bathroom remodel</option><option>Historic restoration</option><option>Interior renovation</option><option>Basement conversion</option><option>Exterior renovation</option></select></label> : <label className="form-field"><span>{valueLabel} <i>*</i></span><div className="amount-input"><span className="amount-currency-sym">{symb}</span><input required type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="0.00" /></div></label>}
        {isProjectOrLead && <label className="form-field"><span>{valueLabel} <i>*</i></span><div className="amount-input"><span className="amount-currency-sym">{symb}</span><input required type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="0.00" /></div></label>}
        {(kind === 'Project' || kind === 'Invoice') && <label className="form-field"><span>{kind === 'Project' ? 'Target completion' : 'Payment due'}</span><input type="date" value={form.due} onChange={(event) => setForm({ ...form, due: event.target.value })} /></label>}
        {kind === 'Project' && <label className="form-field"><span>Project manager</span><select value={form.manager} onChange={(event) => setForm({ ...form, manager: event.target.value })}><option>Olivia Chen</option><option>Marcus Cole</option><option>Ari Patel</option><option>Nina Brooks</option></select></label>}
        <div className="modal-footer"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary"><Plus size={15} /> Create {noun}</button></div>
      </form>
    </section>
  </div>
}

function ProjectDetail({ project, onClose, currency }: { project: Project; onClose: () => void; currency: (v: number) => string }) {
  const remaining = project.budget - project.spent
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="project-detail-modal" role="dialog" aria-modal="true" aria-labelledby="project-detail-title"><div className="detail-cover"><button className="icon-button detail-close" aria-label="Close project details" onClick={onClose}><X size={18} /></button><span className={`project-tile detail-tile ${categoryColor(project.category)}`}><Wrench size={18} /></span><span className="section-kicker">{project.id} <i>·</i> {project.category.toUpperCase()}</span><h2 id="project-detail-title">{project.name}</h2><div className="detail-client"><UsersRound size={14} />{project.client}<span>·</span><MapPin size={14} />{project.location}</div></div><div className="detail-body"><div className="detail-status-row"><StatusBadge value={project.status} /><span>Project manager <strong>{project.manager}</strong></span></div><div className="detail-progress"><div><span>PROJECT COMPLETION</span><strong>{project.progress}%</strong></div><div className="detail-progress-track"><span style={{ width: `${project.progress}%` }} /></div><p>{project.progress === 100 ? 'All planned work is complete.' : `${project.progress}% complete · target completion ${dateLabel(project.due)}, 2026`}</p></div><div className="detail-finances"><div><span>CONTRACT VALUE</span><strong>{currency(project.budget)}</strong></div><div><span>SPENT TO DATE</span><strong>{currency(project.spent)}</strong></div><div><span>REMAINING</span><strong>{currency(remaining)}</strong></div></div><div className="detail-milestones"><span className="section-kicker">PROJECT CHECKPOINTS</span><div className="detail-milestone"><CheckCircle2 size={16} /><span>Contract & scope confirmed</span><small>Complete</small></div><div className="detail-milestone"><CheckCircle2 size={16} /><span>Materials and trade schedule</span><small>{project.progress > 20 ? 'Complete' : 'Upcoming'}</small></div><div className="detail-milestone"><Clock3 size={16} /><span>Final walkthrough & handoff</span><small>{dateLabel(project.due)}, 2026</small></div></div><div className="detail-footer"><span><CalendarDays size={14} /> Started {dateLabel(project.start)}, 2026</span><button className="button button-secondary" onClick={onClose}>Close details</button></div></div></section></div>
}

function Appointment({ time, title, site, color }: { time: string; title: string; site: string; color: string }) {
  return <div className="appointment"><time>{time}</time><span className={`appointment-marker marker-${color}`} /><div><strong>{title}</strong><small>{site}</small></div><ChevronRight size={14} /></div>
}

function StatusBadge({ value }: { value: string }) {
  const tone = value.toLowerCase().includes('overdue') || value.toLowerCase().includes('risk') ? 'status-red' : value.toLowerCase().includes('progress') || value.toLowerCase().includes('review') || value.toLowerCase().includes('soon') ? 'status-amber' : value.toLowerCase().includes('paid') || value.toLowerCase().includes('approved') || value.toLowerCase().includes('completed') ? 'status-green' : 'status-neutral'
  return <span className={`status-badge ${tone}`}><i />{value}</span>
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty-state"><span><Search size={17} /></span><strong>{title}</strong><p>{text}</p></div>
}

function categoryColor(category: string) {
  if (category.toLowerCase().includes('kitchen')) return 'tile-terracotta'
  if (category.toLowerCase().includes('bath')) return 'tile-blue'
  if (category.toLowerCase().includes('historic') || category.toLowerCase().includes('exterior')) return 'tile-sage'
  return 'tile-gold'
}

export default App
