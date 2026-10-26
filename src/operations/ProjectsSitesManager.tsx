import { useState, useMemo, type FormEvent } from 'react'
import {
  BriefcaseBusiness, HardHat, FileText, CheckSquare,
  Calculator, ShieldAlert, Award, ArrowRightLeft, Plus,
  Check, AlertTriangle, AlertCircle, RefreshCw, XCircle
} from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

export type ProjectSiteTab =
  | 'portfolio'  // 1. Projects Portfolio
  | 'site'       // 2. Site Management
  | 'dpr'        // 3. Daily Progress Reports (DPR)
  | 'tasks'      // 4. Tasks & Work Orders
  | 'boq'        // 5. BOQ & Estimates
  | 'hse'        // 6. Quality & Safety (HSE/QA)
  | 'handover'   // 7. Snag List & Handover

export interface ProjectPortfolioItem {
  id: string
  name: string
  client: string
  budget: number
  spent: number
  status: 'Planning' | 'In Progress' | 'Delayed' | 'Completed'
}

export interface SiteAllocationItem {
  id: string
  projectId: string
  supervisor: string
  currentMachinery: string
  materialAllocated: string
}

export interface DprLogItem {
  id: string
  date: string
  activity: string
  progressPct: number
  weather: string
  blockers: string
}

export interface WorkOrderItem {
  taskId: string
  title: string
  assignee: string
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  deadline: string
  status: 'To-Do' | 'In-Progress' | 'Done'
}

export interface BoqMasterItem {
  itemCode: string
  description: string
  unit: string
  qty: number
  rate: number
}

export interface HseIncidentItem {
  id: string
  date: string
  issue: string
  location: string
  severity: 'Low' | 'Med' | 'High'
}

export interface SnagItem {
  defectId: string
  projectId: string
  description: string
  rectificationStatus: 'Open' | 'Resolved'
}

// ============================================================================
// Seed Data
// ============================================================================

const initialProjects: ProjectPortfolioItem[] = [
  { id: 'PRJ-101', name: 'Gulberg Executive Tower (G+18)', client: 'Al-Ghurair Real Estate', budget: 85000000, spent: 52000000, status: 'In Progress' },
  { id: 'PRJ-102', name: 'DHA Commercial Complex Ring Road', client: 'Frontier Developers', budget: 140000000, spent: 110000000, status: 'In Progress' },
  { id: 'PRJ-103', name: 'Multan Industrial Logistics Warehouse', client: 'Fast Logistics Group', budget: 65000000, spent: 61000000, status: 'Delayed' },
  { id: 'PRJ-104', name: 'Lake City Luxury Residential Villas', client: 'Lake City Holdings', budget: 45000000, spent: 44500000, status: 'Completed' },
  { id: 'PRJ-105', name: 'Bahria Town Medical Complex Wing C', client: 'Bahria Health Foundation', budget: 120000000, spent: 48000000, status: 'Planning' },
]

const initialSiteAllocations: SiteAllocationItem[] = [
  { id: 'SA-1', projectId: 'PRJ-101', supervisor: 'Engr. Zafar Iqbal (PE)', currentMachinery: 'CAT 320D Excavator (x2), Tower Crane 50m', materialAllocated: 'Steel Grade 60: 45 Tons, Cement: 1,200 Bags' },
  { id: 'SA-2', projectId: 'PRJ-102', supervisor: 'Engr. Haroon Rasheed', currentMachinery: 'Concrete Transit Mixer 8m³ (x3), JCB Backhoe', materialAllocated: 'ReadyMix Class A: 320 m³, Crush: 150 Tons' },
  { id: 'SA-3', projectId: 'PRJ-103', supervisor: 'Engr. Usman Tariq', currentMachinery: 'Compactor Roller 10T, Grader 140H', materialAllocated: 'Sub-base aggregate: 500 m³, Asphalt: 20 Drums' },
  { id: 'SA-4', projectId: 'PRJ-105', supervisor: 'Engr. Salman Farooq', currentMachinery: 'Piling Rig Bauer BG25, Mobile Crane 25T', materialAllocated: 'Bentonite Slurry: 15 Tons, Casing 1000mm' },
]

const initialDprLogs: DprLogItem[] = [
  { id: 'DPR-01', date: '2026-10-25', activity: '5th Floor slab rebar tying and conduit electrical rough-in', progressPct: 68, weather: 'Clear 28°C', blockers: '' },
  { id: 'DPR-02', date: '2026-10-24', activity: 'Basement 2 retaining wall waterproofing & protective plaster', progressPct: 54, weather: 'Sunny 30°C', blockers: 'Delayed cement trailer arrival from Hattar Factory' },
  { id: 'DPR-03', date: '2026-10-23', activity: 'Raft foundation concrete pouring cube sampling (7 & 28-day)', progressPct: 42, weather: 'Overcast 24°C', blockers: '' },
]

const initialWorkOrders: WorkOrderItem[] = [
  { taskId: 'TSK-301', title: 'MEP Chilled Water Pipe Hydrostatic Pressure Testing', assignee: 'Engr. Tariq Qureshi', priority: 'High', deadline: '2026-10-28', status: 'In-Progress' },
  { taskId: 'TSK-302', title: 'Fire Suppression Sprinkler Head Installation (Zone 2)', assignee: 'SafeFlow MEP Team', priority: 'Urgent', deadline: '2026-10-27', status: 'To-Do' },
  { taskId: 'TSK-303', title: 'Elevator Shaft Concrete Plumb Line Laser Survey', assignee: 'Chief Surveyor Noman', priority: 'Medium', deadline: '2026-10-29', status: 'Done' },
  { taskId: 'TSK-304', title: 'Substation Transformer Pad Pouring & 14-Day Water Curing', assignee: 'Al-Hadeed Civil Works', priority: 'High', deadline: '2026-10-30', status: 'To-Do' },
]

const initialBoqMaster: BoqMasterItem[] = [
  { itemCode: 'BOQ-01', description: 'Excavation in all types of soil including disposal within 5km', unit: 'm³', qty: 12500, rate: 450 },
  { itemCode: 'BOQ-02', description: 'Reinforced cement concrete Class A (1:2:4) in foundation rafts', unit: 'm³', qty: 3800, rate: 16500 },
  { itemCode: 'BOQ-03', description: 'Deformed Steel Reinforcement Grade 60 (ASTM A615)', unit: 'Ton', qty: 420, rate: 265000 },
  { itemCode: 'BOQ-04', description: 'Solid burnt clay brick masonry in 1:4 cement sand mortar', unit: 'm³', qty: 1100, rate: 14200 },
]

const initialHseIncidents: HseIncidentItem[] = [
  { id: 'HSE-1', date: '2026-10-22', issue: 'Missing safety harness during edge beam formwork at height', location: 'Tower B Floor 8', severity: 'High' },
  { id: 'HSE-2', date: '2026-10-20', issue: 'Debris blocking emergency exit stairwell pathway', location: 'Basement 1 West', severity: 'Low' },
  { id: 'HSE-3', date: '2026-10-18', issue: 'Damaged electrical insulation on submersible dewatering pump', location: 'Raft Sump Pit', severity: 'Med' },
]

const initialSnagList: SnagItem[] = [
  { defectId: 'SNG-101', projectId: 'PRJ-104', description: 'Hairline plaster settlement cracks near corridor beam', rectificationStatus: 'Resolved' },
  { defectId: 'SNG-102', projectId: 'PRJ-104', description: 'HVAC diffuser paint overspray on ceiling acoustic tiles', rectificationStatus: 'Resolved' },
  { defectId: 'SNG-103', projectId: 'PRJ-104', description: 'Fire rated door closer friction latch adjustment required', rectificationStatus: 'Open' },
  { defectId: 'SNG-104', projectId: 'PRJ-104', description: 'Silicon sealant missing around exterior curtain wall mullion', rectificationStatus: 'Open' },
]

const defaultDateISO = '2026-10-26'

interface ProjectsSitesManagerProps {
  search?: string
  canEdit?: boolean
}

export default function ProjectsSitesManager({ search = '', canEdit = true }: ProjectsSitesManagerProps) {
  // Navigation
  const [activeTab, setActiveTab] = useState<ProjectSiteTab>('portfolio')

  // 1. Projects Portfolio State & Module 1 Alerts
  const [projectsArray] = useState<ProjectPortfolioItem[]>(initialProjects)
  const [criticalAlerts, setCriticalAlerts] = useState<string[]>([
    'Delayed cement trailer arrival reported on Basements.',
  ])

  // 2. Site Allocation State
  const [siteAllocations, setSiteAllocations] = useState<SiteAllocationItem[]>(initialSiteAllocations)
  const [reallocTarget, setReallocTarget] = useState<Record<string, string>>({})

  // 3. DPR Logs State & Form
  const [dprLogs, setDprLogs] = useState<DprLogItem[]>(initialDprLogs)
  const [dprForm, setDprForm] = useState({
    date: defaultDateISO,
    activity: '',
    progressPct: 50,
    weather: 'Clear 28°C',
    blockers: '',
  })

  // 4. Tasks & Work Orders State
  const [workOrders, setWorkOrders] = useState<WorkOrderItem[]>(initialWorkOrders)

  // 5. BOQ Master State & Form
  const [boqMaster, setBoqMaster] = useState<BoqMasterItem[]>(initialBoqMaster)
  const [boqForm, setBoqForm] = useState({
    itemCode: '',
    description: '',
    unit: 'm³',
    qty: '',
    rate: '',
  })

  // 6. Quality & Safety (HSE/QA) State
  const [hseIncidents] = useState<HseIncidentItem[]>(initialHseIncidents)
  const [ppeCompliance, setPpeCompliance] = useState({
    hardHats: true,
    safetyBoots: true,
    hiVisVests: true,
    eyeProtection: false, // Default one false to demonstrate Warning trigger
    fallHarness: true,
  })

  // 7. Snag List & Handover State
  const [snagList, setSnagList] = useState<SnagItem[]>(initialSnagList)
  const [handoverApproved, setHandoverApproved] = useState(false)

  // ==========================================================================
  // 1. Logic: Projects Portfolio (Search Filtering + Variance Calculation)
  // ==========================================================================
  const filteredProjects = useMemo(() => {
    if (!search.trim()) return projectsArray
    const q = search.toLowerCase()
    return projectsArray.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.client.toLowerCase().includes(q)
    )
  }, [projectsArray, search])

  // Absolute calculator block: TotalBudget - TotalSpent
  const portfolioVariance = useMemo(() => {
    const totalBudget = projectsArray.reduce((sum, p) => sum + p.budget, 0)
    const totalSpent = projectsArray.reduce((sum, p) => sum + p.spent, 0)
    const variance = totalBudget - totalSpent
    return { totalBudget, totalSpent, variance }
  }, [projectsArray])

  // ==========================================================================
  // 2. Logic: Site Management Resource Migration
  // ==========================================================================
  const reallocateResource = (allocationId: string) => {
    const targetProject = reallocTarget[allocationId]
    if (!targetProject) return
    setSiteAllocations((prev) =>
      prev.map((row) => (row.id === allocationId ? { ...row, projectId: targetProject } : row))
    )
  }

  // ==========================================================================
  // 3. Logic: DPR Form Submission + Emergency Trigger on Blockers
  // ==========================================================================
  const handleDprSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!dprForm.activity.trim()) return

    const newLog: DprLogItem = {
      id: `DPR-${Date.now().toString().slice(-4)}`,
      date: dprForm.date,
      activity: dprForm.activity.trim(),
      progressPct: Number(dprForm.progressPct) || 0,
      weather: dprForm.weather,
      blockers: dprForm.blockers.trim(),
    }

    // Append to logs timeline state
    setDprLogs((prev) => [newLog, ...prev])

    // Emergency trigger: If blockers text is entered, append alert to Module 1
    if (dprForm.blockers.trim()) {
      const alertMsg = `[CRITICAL SITE BLOCKER - ${dprForm.date}]: ${dprForm.blockers.trim()}`
      setCriticalAlerts((prev) => [alertMsg, ...prev])
    }

    // Reset form
    setDprForm({
      date: new Date().toISOString().slice(0, 10),
      activity: '',
      progressPct: 50,
      weather: 'Clear 28°C',
      blockers: '',
    })
  }

  // ==========================================================================
  // 4. Logic: Tasks Quick Status-Updater & Dynamic Completed Counter
  // ==========================================================================
  const updateTaskStatus = (id: string, newStatus: 'To-Do' | 'In-Progress' | 'Done') => {
    setWorkOrders((prev) =>
      prev.map((task) => (task.taskId === id ? { ...task, status: newStatus } : task))
    )
  }

  const tasksCompletedCount = useMemo(() => {
    return workOrders.filter((t) => t.status === 'Done').length
  }, [workOrders])

  // ==========================================================================
  // 5. Logic: BOQ Line Cost Loop (Qty * Rate) & Reduce Total Sum
  // ==========================================================================
  const boqCalculations = useMemo(() => {
    const itemsWithCost = boqMaster.map((item) => ({
      ...item,
      lineCost: Number(item.qty) * Number(item.rate),
    }))
    const totalBoqSum = itemsWithCost.reduce((sum, item) => sum + item.lineCost, 0)
    return { itemsWithCost, totalBoqSum }
  }, [boqMaster])

  const handleBoqSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!boqForm.itemCode || !boqForm.description || !boqForm.qty || !boqForm.rate) return
    const newItem: BoqMasterItem = {
      itemCode: boqForm.itemCode.trim(),
      description: boqForm.description.trim(),
      unit: boqForm.unit,
      qty: Number(boqForm.qty) || 0,
      rate: Number(boqForm.rate) || 0,
    }
    setBoqMaster((prev) => [...prev, newItem])
    setBoqForm({ itemCode: '', description: '', unit: 'm³', qty: '', rate: '' })
  }

  // ==========================================================================
  // 6. Logic: HSE/QA PPE Audit Validation & Health Indicator ("Warning")
  // ==========================================================================
  const projectHealthStatus = useMemo(() => {
    const allPpeCompliant = Object.values(ppeCompliance).every(Boolean)
    return allPpeCompliant ? 'Compliant / Normal' : 'Warning'
  }, [ppeCompliance])

  const togglePpeCheck = (key: keyof typeof ppeCompliance) => {
    setPpeCompliance((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // ==========================================================================
  // 7. Logic: Snag List Rectification & Handover Dynamic Checker
  // ==========================================================================
  const isHandoverEligible = useMemo(() => {
    return snagList.length > 0 && snagList.every((item) => item.rectificationStatus === 'Resolved')
  }, [snagList])

  const toggleSnagStatus = (defectId: string) => {
    setSnagList((prev) =>
      prev.map((item) =>
        item.defectId === defectId
          ? {
              ...item,
              rectificationStatus: item.rectificationStatus === 'Resolved' ? 'Open' : 'Resolved',
            }
          : item
      )
    )
  }

  // Currency helper
  const fmtPKR = (v: number) => `₨ ${new Intl.NumberFormat('en-PK').format(v)}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Dynamic Sub-Navigation Bar for the 7 Links */}
      <nav className="lst-subnav-container" aria-label="Projects and Sites Modules">
        <div className="lst-subnav-tabs">
          <button
            type="button"
            className={`lst-subnav-tab ${activeTab === 'portfolio' ? 'active' : ''}`}
            onClick={() => setActiveTab('portfolio')}
          >
            <BriefcaseBusiness size={14} />
            <span>1. Projects Portfolio</span>
            <span className="lst-tab-badge">{projectsArray.length}</span>
          </button>

          <button
            type="button"
            className={`lst-subnav-tab ${activeTab === 'site' ? 'active' : ''}`}
            onClick={() => setActiveTab('site')}
          >
            <HardHat size={14} />
            <span>2. Site Management</span>
            <span className="lst-tab-badge">{siteAllocations.length}</span>
          </button>

          <button
            type="button"
            className={`lst-subnav-tab ${activeTab === 'dpr' ? 'active' : ''}`}
            onClick={() => setActiveTab('dpr')}
          >
            <FileText size={14} />
            <span>3. Daily Progress Reports</span>
            <span className="lst-tab-badge">{dprLogs.length}</span>
          </button>

          <button
            type="button"
            className={`lst-subnav-tab ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            <CheckSquare size={14} />
            <span>4. Tasks &amp; Work Orders</span>
            <span className="lst-tab-badge">{tasksCompletedCount}/{workOrders.length}</span>
          </button>

          <button
            type="button"
            className={`lst-subnav-tab ${activeTab === 'boq' ? 'active' : ''}`}
            onClick={() => setActiveTab('boq')}
          >
            <Calculator size={14} />
            <span>5. BOQ &amp; Estimates</span>
            <span className="lst-tab-badge">{boqMaster.length}</span>
          </button>

          <button
            type="button"
            className={`lst-subnav-tab ${activeTab === 'hse' ? 'active' : ''}`}
            onClick={() => setActiveTab('hse')}
          >
            <ShieldAlert size={14} />
            <span>6. Quality &amp; Safety</span>
            <span
              className="lst-tab-badge"
              style={{
                color: projectHealthStatus === 'Warning' ? '#b91c1c' : '#15803d',
                borderColor: projectHealthStatus === 'Warning' ? '#fca5a5' : '#86efac',
                background: projectHealthStatus === 'Warning' ? '#fef2f2' : '#f0fdf4',
              }}
            >
              {projectHealthStatus}
            </span>
          </button>

          <button
            type="button"
            className={`lst-subnav-tab ${activeTab === 'handover' ? 'active' : ''}`}
            onClick={() => setActiveTab('handover')}
          >
            <Award size={14} />
            <span>7. Snag List &amp; Handover</span>
            <span className="lst-tab-badge">
              {isHandoverEligible ? 'Ready' : 'Pending'}
            </span>
          </button>
        </div>
      </nav>

      {/* ================================================================== */}
      {/* SUB-MODULE 1: Projects Portfolio                                   */}
      {/* ================================================================== */}
      {activeTab === 'portfolio' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Critical Alerts Banner triggered by DPR blockers */}
          {criticalAlerts.length > 0 && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '6px',
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                color: '#9f1239',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                <AlertCircle size={16} />
                <span>Critical Alerts Flagged for Portfolio Management:</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '22px', fontSize: '12px' }}>
                {criticalAlerts.map((alert, idx) => (
                  <li key={idx}>{alert}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Absolute Calculator Block: TotalBudget - TotalSpent */}
          <div className="lst-formula-widget">
            <div className="lst-formula-header">
              <span className="lst-formula-title">
                <Calculator size={15} color="#2563eb" />
                Portfolio Dynamic Cost Variance Calculator
              </span>
              <span className="lst-formula-badge">
                Cost Variance = Total Budget − Total Spent
              </span>
            </div>
            <div className="lst-formula-grid">
              <div className="lst-formula-item">
                <span className="lst-formula-lbl">Total Contract Budget</span>
                <strong className="lst-formula-val">{fmtPKR(portfolioVariance.totalBudget)}</strong>
              </div>
              <div className="lst-formula-item">
                <span className="lst-formula-lbl">Total Costs Spent to Date</span>
                <strong className="lst-formula-val" style={{ color: '#b91c1c' }}>
                  {fmtPKR(portfolioVariance.totalSpent)}
                </strong>
              </div>
              <div className="lst-formula-item">
                <span className="lst-formula-lbl">Total Cost Variance (Savings)</span>
                <strong
                  className="lst-formula-val"
                  style={{
                    color: portfolioVariance.variance >= 0 ? '#15803d' : '#b91c1c',
                  }}
                >
                  {fmtPKR(portfolioVariance.variance)}
                </strong>
              </div>
            </div>
          </div>

          {/* Projects Portfolio Data Table */}
          <div className="lst-card">
            <div className="lst-card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 className="lst-card-title">
                  <BriefcaseBusiness size={18} color="#0f172a" />
                  Active Construction Projects Portfolio ({filteredProjects.length})
                </h2>
                <span className="lst-card-sub">
                  Filtered bound to global search input · Live budgetary tracking
                </span>
              </div>
            </div>

            <div className="lst-table-wrapper">
              <table className="lst-table">
                <thead>
                  <tr>
                    <th>Project ID</th>
                    <th>Project Name</th>
                    <th>Client Authority</th>
                    <th>Total Budget</th>
                    <th>Actual Spent</th>
                    <th>Cost Variance</th>
                    <th>Current Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((p) => {
                    const variance = p.budget - p.spent
                    return (
                      <tr key={p.id}>
                        <td>
                          <span className="lst-tender-id">{p.id}</span>
                        </td>
                        <td>
                          <strong>{p.name}</strong>
                        </td>
                        <td>{p.client}</td>
                        <td style={{ fontWeight: 600 }}>{fmtPKR(p.budget)}</td>
                        <td style={{ color: '#b91c1c' }}>{fmtPKR(p.spent)}</td>
                        <td
                          style={{
                            fontWeight: 700,
                            color: variance >= 0 ? '#15803d' : '#b91c1c',
                          }}
                        >
                          {fmtPKR(variance)}
                        </td>
                        <td>
                          <span
                            className={`lst-badge ${
                              p.status === 'Completed'
                                ? 'lst-badge-success'
                                : p.status === 'Delayed'
                                ? 'lst-badge-danger'
                                : 'lst-badge-info'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredProjects.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                        No projects matching search term "{search}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ================================================================== */}
      {/* SUB-MODULE 2: Site Management & State Migration                     */}
      {/* ================================================================== */}
      {activeTab === 'site' && (
        <section className="lst-card">
          <div className="lst-card-head">
            <h2 className="lst-card-title">
              <HardHat size={18} color="#2563eb" />
              Site Machinery &amp; Material Allocation Manager
            </h2>
            <span className="lst-card-sub">
              Perform cross-project resource reallocation upon click events
            </span>
          </div>

          <div className="lst-table-wrapper">
            <table className="lst-table">
              <thead>
                <tr>
                  <th>Allocation ID</th>
                  <th>Current Project ID</th>
                  <th>Site Supervisor</th>
                  <th>Assigned Heavy Machinery</th>
                  <th>Allocated Construction Material</th>
                  <th style={{ width: '260px' }}>Reallocate Resource</th>
                </tr>
              </thead>
              <tbody>
                {siteAllocations.map((alloc) => (
                  <tr key={alloc.id}>
                    <td>
                      <span className="lst-tender-id">{alloc.id}</span>
                    </td>
                    <td>
                      <span className="lst-badge lst-badge-info">{alloc.projectId}</span>
                    </td>
                    <td>
                      <strong>{alloc.supervisor}</strong>
                    </td>
                    <td>{alloc.currentMachinery}</td>
                    <td style={{ color: '#475569' }}>{alloc.materialAllocated}</td>
                    <td>
                      {canEdit ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <select
                            style={{
                              padding: '5px 8px',
                              borderRadius: '4px',
                              border: '1px solid #cbd5e1',
                              fontSize: '12px',
                              background: '#fff',
                            }}
                            value={reallocTarget[alloc.id] || ''}
                            onChange={(e) =>
                              setReallocTarget({ ...reallocTarget, [alloc.id]: e.target.value })
                            }
                          >
                            <option value="">Select Target Project...</option>
                            {projectsArray
                              .filter((p) => p.id !== alloc.projectId)
                              .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.id} - {p.name.slice(0, 22)}...
                                </option>
                              ))}
                          </select>
                          <button
                            type="button"
                            className="lst-btn-secondary"
                            style={{ padding: '5px 9px', fontSize: '11px' }}
                            disabled={!reallocTarget[alloc.id]}
                            onClick={() => reallocateResource(alloc.id)}
                            title="Reallocate machinery and materials to selected project"
                          >
                            <ArrowRightLeft size={12} /> Shift
                          </button>
                        </div>
                      ) : (
                        <span>Read-only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ================================================================== */}
      {/* SUB-MODULE 3: Daily Progress Reports (DPR)                         */}
      {/* ================================================================== */}
      {activeTab === 'dpr' && (
        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '16px' }}>
          {/* DPR Submission Form */}
          <div className="lst-card">
            <div className="lst-card-head">
              <h2 className="lst-card-title">
                <FileText size={18} color="#2563eb" />
                Submit New DPR Log
              </h2>
              <span className="lst-card-sub">
                Emergency trigger active on Blockers entry
              </span>
            </div>

            <form onSubmit={handleDprSubmit} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label className="lst-form-label">
                <span>Report Date *</span>
                <input
                  type="date"
                  required
                  value={dprForm.date}
                  onChange={(e) => setDprForm({ ...dprForm, date: e.target.value })}
                />
              </label>

              <label className="lst-form-label">
                <span>Site Activity Details *</span>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. 5th Floor slab rebar tying and conduit electrical rough-in"
                  value={dprForm.activity}
                  onChange={(e) => setDprForm({ ...dprForm, activity: e.target.value })}
                />
              </label>

              <label className="lst-form-label">
                <span>Progress Milestone (%): {dprForm.progressPct}%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={dprForm.progressPct}
                  onChange={(e) => setDprForm({ ...dprForm, progressPct: Number(e.target.value) })}
                />
              </label>

              <label className="lst-form-label">
                <span>Weather Conditions</span>
                <input
                  type="text"
                  placeholder="e.g. Sunny 30°C / Rain / Wind"
                  value={dprForm.weather}
                  onChange={(e) => setDprForm({ ...dprForm, weather: e.target.value })}
                />
              </label>

              <label className="lst-form-label">
                <span style={{ color: '#b91c1c', fontWeight: 600 }}>
                  Site Blockers / Impediments (Triggers Critical Alert):
                </span>
                <input
                  type="text"
                  placeholder="Enter blockers to automatically notify Module 1..."
                  value={dprForm.blockers}
                  onChange={(e) => setDprForm({ ...dprForm, blockers: e.target.value })}
                />
              </label>

              <button type="submit" className="lst-btn-primary" style={{ marginTop: '8px' }}>
                <Plus size={14} /> Append DPR to Timeline
              </button>
            </form>
          </div>

          {/* DPR Logs Timeline */}
          <div className="lst-card">
            <div className="lst-card-head">
              <h2 className="lst-card-title">
                <FileText size={18} color="#0f172a" />
                DPR Historical Timeline ({dprLogs.length} logs)
              </h2>
              <span className="lst-card-sub">Real-time chronologically sorted site logs</span>
            </div>

            <div className="lst-table-wrapper">
              <table className="lst-table">
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>Date</th>
                    <th>Activity Summary</th>
                    <th>Progress</th>
                    <th>Weather</th>
                    <th>Blockers</th>
                  </tr>
                </thead>
                <tbody>
                  {dprLogs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <span className="lst-tender-id">{log.id}</span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{log.date}</td>
                      <td>{log.activity}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600, fontSize: '12px' }}>{log.progressPct}%</span>
                          <div style={{ width: '60px', height: '6px', background: '#e2e8f0', borderRadius: '3px' }}>
                            <div
                              style={{
                                width: `${log.progressPct}%`,
                                height: '100%',
                                background: '#2563eb',
                                borderRadius: '3px',
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>{log.weather}</td>
                      <td>
                        {log.blockers ? (
                          <span
                            className="lst-badge lst-badge-danger"
                            title={log.blockers}
                          >
                            <AlertTriangle size={12} style={{ marginRight: '4px' }} />
                            {log.blockers}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ================================================================== */}
      {/* SUB-MODULE 4: Tasks & Work Orders                                  */}
      {/* ================================================================== */}
      {activeTab === 'tasks' && (
        <section className="lst-card">
          <div className="lst-card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="lst-card-title">
                <CheckSquare size={18} color="#2563eb" />
                Tasks &amp; Site Work Orders
              </h2>
              <span className="lst-card-sub">
                Quick status-updater dynamically increments 'Tasks Completed'
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '6px 14px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
              }}
            >
              <span style={{ fontSize: '12px', color: '#64748b' }}>Tasks Completed Counter:</span>
              <strong style={{ fontSize: '16px', color: '#15803d' }}>
                {tasksCompletedCount} / {workOrders.length}
              </strong>
            </div>
          </div>

          <div className="lst-table-wrapper">
            <table className="lst-table">
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Task Title / Scope</th>
                  <th>Assignee</th>
                  <th>Priority</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Quick Action Controls</th>
                </tr>
              </thead>
              <tbody>
                {workOrders.map((wo) => (
                  <tr key={wo.taskId}>
                    <td>
                      <span className="lst-tender-id">{wo.taskId}</span>
                    </td>
                    <td>
                      <strong>{wo.title}</strong>
                    </td>
                    <td>{wo.assignee}</td>
                    <td>
                      <span
                        className={`lst-badge ${
                          wo.priority === 'Urgent'
                            ? 'lst-badge-danger'
                            : wo.priority === 'High'
                            ? 'lst-badge-warning'
                            : 'lst-badge-info'
                        }`}
                      >
                        {wo.priority}
                      </span>
                    </td>
                    <td>{wo.deadline}</td>
                    <td>
                      <span
                        className={`lst-badge ${
                          wo.status === 'Done'
                            ? 'lst-badge-success'
                            : wo.status === 'In-Progress'
                            ? 'lst-badge-warning'
                            : 'lst-badge-neutral'
                        }`}
                      >
                        {wo.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          className={`lst-btn-secondary ${wo.status === 'To-Do' ? 'active' : ''}`}
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          onClick={() => updateTaskStatus(wo.taskId, 'To-Do')}
                        >
                          To-Do
                        </button>
                        <button
                          type="button"
                          className={`lst-btn-secondary ${wo.status === 'In-Progress' ? 'active' : ''}`}
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          onClick={() => updateTaskStatus(wo.taskId, 'In-Progress')}
                        >
                          In-Progress
                        </button>
                        <button
                          type="button"
                          className="lst-btn-primary"
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            background: wo.status === 'Done' ? '#15803d' : undefined,
                          }}
                          onClick={() => updateTaskStatus(wo.taskId, 'Done')}
                        >
                          <Check size={12} /> Done
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ================================================================== */}
      {/* SUB-MODULE 5: BOQ & Estimates Calculation Loop                     */}
      {/* ================================================================== */}
      {activeTab === 'boq' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Top Global BOQ Dynamic Sum Display */}
          <div className="lst-formula-widget">
            <div className="lst-formula-header">
              <span className="lst-formula-title">
                <Calculator size={15} color="#2563eb" />
                Dynamic Global BOQ Total Sum (Optimized Calculation Loop)
              </span>
              <span className="lst-formula-badge">
                Total = ∑ (Qty × Unit Rate)
              </span>
            </div>
            <div className="lst-formula-grid">
              <div className="lst-formula-item">
                <span className="lst-formula-lbl">Total BOQ Line Items</span>
                <strong className="lst-formula-val">{boqMaster.length} Items</strong>
              </div>
              <div className="lst-formula-item">
                <span className="lst-formula-lbl">Global BOQ Total Valuation</span>
                <strong className="lst-formula-val" style={{ color: '#2563eb', fontSize: '20px' }}>
                  {fmtPKR(boqCalculations.totalBoqSum)}
                </strong>
              </div>
            </div>
          </div>

          {/* Form to Append BOQ Line Item */}
          {canEdit && (
            <div className="lst-card" style={{ padding: '16px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600 }}>
                Append New BOQ Item
              </h3>
              <form
                onSubmit={handleBoqSubmit}
                style={{ display: 'grid', gridTemplateColumns: '120px 1fr 100px 130px 140px auto', gap: '10px', alignItems: 'end' }}
              >
                <label className="lst-form-label">
                  <span>Item Code *</span>
                  <input
                    type="text"
                    required
                    placeholder="BOQ-05"
                    value={boqForm.itemCode}
                    onChange={(e) => setBoqForm({ ...boqForm, itemCode: e.target.value })}
                  />
                </label>
                <label className="lst-form-label">
                  <span>Item Description *</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1:4 cement sand plaster on external brickwork"
                    value={boqForm.description}
                    onChange={(e) => setBoqForm({ ...boqForm, description: e.target.value })}
                  />
                </label>
                <label className="lst-form-label">
                  <span>Unit *</span>
                  <select
                    value={boqForm.unit}
                    onChange={(e) => setBoqForm({ ...boqForm, unit: e.target.value })}
                  >
                    <option value="m³">m³</option>
                    <option value="m²">m²</option>
                    <option value="Ton">Ton</option>
                    <option value="RFT">RFT</option>
                    <option value="Job">Job</option>
                  </select>
                </label>
                <label className="lst-form-label">
                  <span>Quantity *</span>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="100"
                    value={boqForm.qty}
                    onChange={(e) => setBoqForm({ ...boqForm, qty: e.target.value })}
                  />
                </label>
                <label className="lst-form-label">
                  <span>Unit Rate (PKR) *</span>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="2500"
                    value={boqForm.rate}
                    onChange={(e) => setBoqForm({ ...boqForm, rate: e.target.value })}
                  />
                </label>
                <button type="submit" className="lst-btn-primary" style={{ height: '36px' }}>
                  <Plus size={14} /> Add Item
                </button>
              </form>
            </div>
          )}

          {/* BOQ Master Table */}
          <div className="lst-card">
            <div className="lst-table-wrapper">
              <table className="lst-table">
                <thead>
                  <tr>
                    <th>Item Code</th>
                    <th>Description</th>
                    <th>Unit</th>
                    <th>Quantity</th>
                    <th>Unit Rate (PKR)</th>
                    <th>Line Cost (Qty × Rate)</th>
                  </tr>
                </thead>
                <tbody>
                  {boqCalculations.itemsWithCost.map((item) => (
                    <tr key={item.itemCode}>
                      <td>
                        <span className="lst-tender-id">{item.itemCode}</span>
                      </td>
                      <td>{item.description}</td>
                      <td>{item.unit}</td>
                      <td style={{ fontWeight: 600 }}>{new Intl.NumberFormat('en-PK').format(item.qty)}</td>
                      <td>{fmtPKR(item.rate)}</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>
                        {fmtPKR(item.lineCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ================================================================== */}
      {/* SUB-MODULE 6: Quality & Safety (HSE/QA) Audit Validation           */}
      {/* ================================================================== */}
      {activeTab === 'hse' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Health Status Indicator Banner */}
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: projectHealthStatus === 'Warning' ? '#fff7ed' : '#f0fdf4',
              border: `1px solid ${projectHealthStatus === 'Warning' ? '#fdba74' : '#86efac'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {projectHealthStatus === 'Warning' ? (
                <AlertTriangle size={20} color="#c2410c" />
              ) : (
                <Check size={20} color="#15803d" />
              )}
              <div>
                <strong
                  style={{
                    fontSize: '14px',
                    color: projectHealthStatus === 'Warning' ? '#9a3412' : '#14532d',
                  }}
                >
                  Project Health Status: {projectHealthStatus.toUpperCase()}
                </strong>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                  {projectHealthStatus === 'Warning'
                    ? 'Automated HSE Alert: One or more critical PPE requirements are not compliant on site.'
                    : 'All mandatory site PPE protocols verified compliant across active shifts.'}
                </p>
              </div>
            </div>
          </div>

          {/* PPE Compliance Audit Checklist */}
          <div className="lst-card">
            <div className="lst-card-head">
              <h2 className="lst-card-title">
                <ShieldAlert size={18} color="#2563eb" />
                Mandatory Site PPE Compliance Checklist
              </h2>
              <span className="lst-card-sub">
                Toggling any check False automatically shifts Project Health Indicator to "Warning"
              </span>
            </div>

            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  background: ppeCompliance.hardHats ? '#f8fafc' : '#fef2f2',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={ppeCompliance.hardHats}
                  onChange={() => togglePpeCheck('hardHats')}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '13px' }}>Hard Hats (EN 397)</strong>
                  <small style={{ color: '#64748b' }}>100% field crew coverage</small>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  background: ppeCompliance.safetyBoots ? '#f8fafc' : '#fef2f2',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={ppeCompliance.safetyBoots}
                  onChange={() => togglePpeCheck('safetyBoots')}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '13px' }}>Steel-Toe Boots (S3)</strong>
                  <small style={{ color: '#64748b' }}>Puncture-proof sole</small>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  background: ppeCompliance.hiVisVests ? '#f8fafc' : '#fef2f2',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={ppeCompliance.hiVisVests}
                  onChange={() => togglePpeCheck('hiVisVests')}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '13px' }}>Hi-Vis Reflective Vests</strong>
                  <small style={{ color: '#64748b' }}>Class 2 day/night visibility</small>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  background: ppeCompliance.eyeProtection ? '#f8fafc' : '#fef2f2',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={ppeCompliance.eyeProtection}
                  onChange={() => togglePpeCheck('eyeProtection')}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '13px' }}>Eye / Welding Protection</strong>
                  <small style={{ color: ppeCompliance.eyeProtection ? '#64748b' : '#b91c1c' }}>
                    {ppeCompliance.eyeProtection ? 'Verified active' : 'Deficiency reported!'}
                  </small>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  background: ppeCompliance.fallHarness ? '#f8fafc' : '#fef2f2',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={ppeCompliance.fallHarness}
                  onChange={() => togglePpeCheck('fallHarness')}
                />
                <div>
                  <strong style={{ display: 'block', fontSize: '13px' }}>Fall Arrest Harnesses</strong>
                  <small style={{ color: '#64748b' }}>Working over 2m height</small>
                </div>
              </label>
            </div>
          </div>

          {/* HSE Incidents Ledger */}
          <div className="lst-card">
            <div className="lst-card-head">
              <h2 className="lst-card-title">
                <ShieldAlert size={18} color="#0f172a" />
                HSE Incident Register ({hseIncidents.length})
              </h2>
              <span className="lst-card-sub">Site safety records</span>
            </div>

            <div className="lst-table-wrapper">
              <table className="lst-table">
                <thead>
                  <tr>
                    <th>Incident ID</th>
                    <th>Date</th>
                    <th>Issue Description</th>
                    <th>Site Location</th>
                    <th>Severity Level</th>
                  </tr>
                </thead>
                <tbody>
                  {hseIncidents.map((inc) => (
                    <tr key={inc.id}>
                      <td>
                        <span className="lst-tender-id">{inc.id}</span>
                      </td>
                      <td>{inc.date}</td>
                      <td>{inc.issue}</td>
                      <td>{inc.location}</td>
                      <td>
                        <span
                          className={`lst-badge ${
                            inc.severity === 'High'
                              ? 'lst-badge-danger'
                              : inc.severity === 'Med'
                              ? 'lst-badge-warning'
                              : 'lst-badge-info'
                          }`}
                        >
                          {inc.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ================================================================== */}
      {/* SUB-MODULE 7: Snag List & Handover Approval Checker                */}
      {/* ================================================================== */}
      {activeTab === 'handover' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Handover Approval Action Bar */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '6px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                Final Project Handover &amp; Completion Sign-Off
              </strong>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                Handover button is strictly enabled only when 100% of defect snag items are marked "Resolved".
              </p>
            </div>

            <button
              type="button"
              className="lst-btn-primary"
              disabled={!isHandoverEligible}
              style={{
                background: isHandoverEligible ? '#15803d' : '#94a3b8',
                cursor: isHandoverEligible ? 'pointer' : 'not-allowed',
                padding: '9px 18px',
                fontSize: '13px',
              }}
              onClick={() => setHandoverApproved(true)}
            >
              {handoverApproved ? (
                <>
                  <Check size={16} /> Handover Approved &amp; Executed
                </>
              ) : isHandoverEligible ? (
                <>
                  <Award size={16} /> Approve &amp; Execute Handover
                </>
              ) : (
                <>
                  <XCircle size={16} /> Handover Blocked (Open Snags Pending)
                </>
              )}
            </button>
          </div>

          {handoverApproved && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '6px',
                background: '#f0fdf4',
                border: '1px solid #86efac',
                color: '#14532d',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 600,
              }}
            >
              <Check size={18} /> Official Project Handover Certificate successfully generated and signed off!
            </div>
          )}

          {/* Snag List Items Table */}
          <div className="lst-card">
            <div className="lst-card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 className="lst-card-title">
                  <Award size={18} color="#2563eb" />
                  Pre-Handover Snag List Defects ({snagList.length})
                </h2>
                <span className="lst-card-sub">
                  Target Project: PRJ-104 (Lake City Luxury Villas) · Click to toggle rectification status
                </span>
              </div>
              <span
                className="lst-badge"
                style={{
                  background: isHandoverEligible ? '#dcfce7' : '#fee2e2',
                  color: isHandoverEligible ? '#15803d' : '#b91c1c',
                  border: `1px solid ${isHandoverEligible ? '#86efac' : '#fca5a5'}`,
                  fontWeight: 600,
                }}
              >
                {snagList.filter((s) => s.rectificationStatus === 'Resolved').length} / {snagList.length} Resolved
              </span>
            </div>

            <div className="lst-table-wrapper">
              <table className="lst-table">
                <thead>
                  <tr>
                    <th>Defect ID</th>
                    <th>Project</th>
                    <th>Snag Defect Description</th>
                    <th>Rectification Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {snagList.map((snag) => (
                    <tr key={snag.defectId}>
                      <td>
                        <span className="lst-tender-id">{snag.defectId}</span>
                      </td>
                      <td>{snag.projectId}</td>
                      <td>
                        <strong>{snag.description}</strong>
                      </td>
                      <td>
                        <span
                          className={`lst-badge ${
                            snag.rectificationStatus === 'Resolved'
                              ? 'lst-badge-success'
                              : 'lst-badge-danger'
                          }`}
                        >
                          {snag.rectificationStatus}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={
                            snag.rectificationStatus === 'Resolved'
                              ? 'lst-btn-secondary'
                              : 'lst-btn-primary'
                          }
                          style={{ padding: '4px 9px', fontSize: '11px' }}
                          onClick={() => toggleSnagStatus(snag.defectId)}
                        >
                          {snag.rectificationStatus === 'Resolved' ? (
                            <>
                              <RefreshCw size={11} /> Re-Open
                            </>
                          ) : (
                            <>
                              <Check size={11} /> Mark Resolved
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
