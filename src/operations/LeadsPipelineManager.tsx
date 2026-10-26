import React, { useState, useMemo } from 'react'
import {
  Sparkles, FileText, CheckSquare, GitPullRequest,
  TrendingUp, UsersRound, CircleDollarSign, Plus,
  Search, Check, AlertCircle, ArrowRight,
  Filter, X, ShieldCheck, Award, MessageSquare, Landmark,
  Calculator, Table as TableIcon
} from 'lucide-react'
import './leads-pipeline.css'

// -------------------------------------------------------------
// Type Definitions
// -------------------------------------------------------------
export type LeadSource = 'Website' | 'Tender' | 'Referral' | 'Paid Ad'
export type LeadStatus = 'Inquiry' | 'Qualified' | 'Qualified Estimate' | 'Bidding' | 'Awarded' | 'Lost'

export type ConstructionLead = {
  id: string
  clientName: string
  email: string
  contactNumber: string
  projectedValue: number
  source: LeadSource
  projectScope: string
  location: string
  status: LeadStatus
  createdAt: string
  preQualNotes?: string
}

export type TenderItem = {
  id: string
  tenderId: string
  authorityName: string
  deadline: string
  earnestMoney: number
  status: 'Open' | 'Submitted' | 'Evaluation'
  projectScope: string
  tenderValue: number
}

export type ProposalItem = {
  id: string
  proposalCode: string
  projectTitle: string
  client: string
  estimator: string
  estimatedCost: number
  quotedValue: number
  submissionDeadline: string
  workflowStatus: 'Pending Review' | 'Approved for Bidding' | 'Sent for Revision' | 'Archived'
  revisionComment?: string
}

export type InvestorEntry = {
  id: string
  investorName: string
  fundedProject: string
  capitalCommitted: number
  capitalDisbursed: number
  equityShare: number
  dateCommitted: string
}

// -------------------------------------------------------------
// Initial High-Quality Construction Dummy State Data
// -------------------------------------------------------------
const INITIAL_CONSTRUCTION_LEADS: ConstructionLead[] = [
  {
    id: 'LD-101',
    clientName: 'Malik Riaz Properties',
    email: 'malik.riaz@bahriatown.com',
    contactNumber: '+92 300 8472911',
    projectedValue: 45000000,
    source: 'Referral',
    projectScope: 'Luxury Villa Renovation & Interior Architectural Fit-out',
    location: 'Bahria Town Phase 8, Rawalpindi',
    status: 'Inquiry',
    createdAt: '2026-10-18',
  },
  {
    id: 'LD-102',
    clientName: 'Hashir Enterprise & Retail',
    email: 'procurement@hashir.pk',
    contactNumber: '+92 321 4455890',
    projectedValue: 28500000,
    source: 'Tender',
    projectScope: 'Commercial Mall Retail Outlet Fit-out & HVAC Ducting',
    location: 'Gulberg Heights Mall, Lahore',
    status: 'Qualified',
    createdAt: '2026-10-20',
  },
  {
    id: 'LD-103',
    clientName: 'Vertex Logistics Corp',
    email: 'vertex.admin@vertex.com',
    contactNumber: '+92 333 5123984',
    projectedValue: 18000000,
    source: 'Website',
    projectScope: 'Corporate Headquarters Modern Interior & Partitions',
    location: 'DHA Phase 6 Commercial, Lahore',
    status: 'Inquiry',
    createdAt: '2026-10-22',
  },
  {
    id: 'LD-104',
    clientName: 'Dr. Salman Qureshi',
    email: 'salman.q@medix.org',
    contactNumber: '+92 302 9988771',
    projectedValue: 35000000,
    source: 'Paid Ad',
    projectScope: 'Residential Villa Gray Structure & Civil Works (1 Kanal)',
    location: 'Lake City Sector M, Lahore',
    status: 'Inquiry',
    createdAt: '2026-10-23',
  },
  {
    id: 'LD-105',
    clientName: 'Blue Sapphire Hospitality',
    email: 'gm@bluesapphire.pk',
    contactNumber: '+92 300 1122334',
    projectedValue: 82000000,
    source: 'Referral',
    projectScope: 'Boutique Hotel Comprehensive Civil & MEP Remodel',
    location: 'Sector F-7/2, Islamabad',
    status: 'Qualified Estimate',
    createdAt: '2026-10-24',
  },
  {
    id: 'LD-106',
    clientName: 'Al-Raza Packages Ltd',
    email: 'info@alraza.pk',
    contactNumber: '+92 345 6677889',
    projectedValue: 64000000,
    source: 'Tender',
    projectScope: 'Industrial Pre-Engineered Steel Warehouse Depot',
    location: 'Sundar Industrial Estate, Lahore',
    status: 'Inquiry',
    createdAt: '2026-10-25',
  },
]

const INITIAL_TENDERS: TenderItem[] = [
  {
    id: 'TND-1',
    tenderId: 'TND-2026-081',
    authorityName: 'National Highway Authority (NHA)',
    deadline: '2026-11-15',
    earnestMoney: 2500000,
    status: 'Submitted',
    projectScope: 'Bridge Deck Rehabilitation & Asphalt Overlay KM 42-68',
    tenderValue: 125000000,
  },
  {
    id: 'TND-2',
    tenderId: 'TND-2026-094',
    authorityName: 'Civil Aviation Authority (CAA)',
    deadline: '2026-11-28',
    earnestMoney: 4800000,
    status: 'Evaluation',
    projectScope: 'Terminal 2 Cargo Warehouse Extension & Cold Storage Facility',
    tenderValue: 240000000,
  },
  {
    id: 'TND-3',
    tenderId: 'TND-2026-103',
    authorityName: 'Punjab Communication & Works (C&W)',
    deadline: '2026-12-05',
    earnestMoney: 1800000,
    status: 'Open',
    projectScope: 'District Judicial Complex Civil Structures & Central HVAC',
    tenderValue: 90000000,
  },
  {
    id: 'TND-4',
    tenderId: 'TND-2026-112',
    authorityName: 'Federal Govt Employees Housing (FGEHA)',
    deadline: '2026-12-18',
    earnestMoney: 3200000,
    status: 'Open',
    projectScope: 'Multi-Story Residential Staff Apartments Package 4',
    tenderValue: 160000000,
  },
  {
    id: 'TND-5',
    tenderId: 'TND-2026-120',
    authorityName: 'DHA Urban Development Directorate',
    deadline: '2026-11-10',
    earnestMoney: 1500000,
    status: 'Submitted',
    projectScope: 'Sector J Community Club & Multi-Sport Facility Construction',
    tenderValue: 75000000,
  },
]

const INITIAL_PROPOSALS: ProposalItem[] = [
  {
    id: 'PROP-1',
    proposalCode: 'PROP-2026-401',
    projectTitle: 'Commercial Fit-Out Tower 3',
    client: 'Hashir Enterprise & Retail',
    estimator: 'Engr. Daniyal Malik',
    estimatedCost: 22000000,
    quotedValue: 28500000,
    submissionDeadline: '2026-11-04',
    workflowStatus: 'Pending Review',
  },
  {
    id: 'PROP-2',
    proposalCode: 'PROP-2026-402',
    projectTitle: 'Luxury Villa Bahria Phase 8',
    client: 'Malik Riaz Properties',
    estimator: 'Arch. Ayesha Siddiqui',
    estimatedCost: 34000000,
    quotedValue: 45000000,
    submissionDeadline: '2026-11-08',
    workflowStatus: 'Approved for Bidding',
  },
  {
    id: 'PROP-3',
    proposalCode: 'PROP-2026-403',
    projectTitle: 'Boutique Hotel Remodel F-7',
    client: 'Blue Sapphire Hospitality',
    estimator: 'Engr. Daniyal Malik',
    estimatedCost: 63000000,
    quotedValue: 82000000,
    submissionDeadline: '2026-11-12',
    workflowStatus: 'Sent for Revision',
    revisionComment: 'Recheck structural glass curtain wall quotation from supplier and reduce contingency from 5% to 3%.',
  },
  {
    id: 'PROP-4',
    proposalCode: 'PROP-2026-404',
    projectTitle: 'Sundar Logistics Depot Pre-Fab',
    client: 'Al-Raza Packages Ltd',
    estimator: 'Engr. Usman Tariq',
    estimatedCost: 49000000,
    quotedValue: 64000000,
    submissionDeadline: '2026-11-19',
    workflowStatus: 'Pending Review',
  },
]

const INITIAL_INVESTORS: InvestorEntry[] = [
  {
    id: 'INV-1',
    investorName: 'Syed Asad Builders Consortium',
    fundedProject: 'Gulberg Heights Mall Fit-Out',
    capitalCommitted: 40000000,
    capitalDisbursed: 28000000,
    equityShare: 20.0,
    dateCommitted: '2026-09-12',
  },
  {
    id: 'INV-2',
    investorName: 'Al-Farooq Equity Group',
    fundedProject: 'Boutique Hotel Remodel F-7',
    capitalCommitted: 60000000,
    capitalDisbursed: 45000000,
    equityShare: 25.0,
    dateCommitted: '2026-09-28',
  },
  {
    id: 'INV-3',
    investorName: 'Dr. Kashif Commercial Trust',
    fundedProject: 'Sundar Logistics Depot Pre-Fab',
    capitalCommitted: 35000000,
    capitalDisbursed: 20000000,
    equityShare: 18.5,
    dateCommitted: '2026-10-05',
  },
  {
    id: 'INV-4',
    investorName: 'Engr. Bilal Hashmi Real Estate Fund',
    fundedProject: 'Luxury Villa Bahria Phase 8',
    capitalCommitted: 25000000,
    capitalDisbursed: 15000000,
    equityShare: 12.0,
    dateCommitted: '2026-10-15',
  },
]

const USD_TO_PKR_RATE = 278

// -------------------------------------------------------------
// Props Interface
// -------------------------------------------------------------
interface LeadsPipelineManagerProps {
  canEdit?: boolean
  companyLeads?: any[]
  onRefresh?: () => void
  rawTableComponent?: React.ReactNode
}

export default function LeadsPipelineManager({
  canEdit = true,
  companyLeads = [],
  rawTableComponent,
}: LeadsPipelineManagerProps) {
  // Sub-Navigation Active Tab
  const [activeTab, setActiveTab] = useState<
    'sourcing' | 'tenders' | 'checklist' | 'pipeline' | 'investors' | 'roi' | 'rawTable'
  >('sourcing')

  // 1. Lead Sourcing & Tracking State
  const [leadsList, setLeadsList] = useState<ConstructionLead[]>(INITIAL_CONSTRUCTION_LEADS)
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false)
  const [newLeadForm, setNewLeadForm] = useState({
    clientName: '',
    email: '',
    contactNumber: '',
    projectedValue: '',
    source: 'Website' as LeadSource,
  })

  // 2. Bidding & Tender Management State
  const [tenders, setTenders] = useState<TenderItem[]>(INITIAL_TENDERS)
  const [tenderSearch, setTenderSearch] = useState('')
  const [tenderStatusFilter, setTenderStatusFilter] = useState<'All' | 'Open' | 'Submitted' | 'Evaluation'>('All')

  // 3. Pre-Qualification Checklist State
  const [selectedLeadForPreQual, setSelectedLeadForPreQual] = useState<string>(
    INITIAL_CONSTRUCTION_LEADS.find((l) => l.status === 'Inquiry')?.id || INITIAL_CONSTRUCTION_LEADS[0].id
  )
  const [preQualChecklist, setPreQualChecklist] = useState({
    technicalEligibility: false,
    legalCompliance: false,
    financialSolvency: false,
    clientBudget: false,
  })
  const [preQualNotes, setPreQualNotes] = useState('')
  const [preQualNotification, setPreQualNotification] = useState<string | null>(null)

  // 4. Estimation & Proposal Pipeline State
  const [proposals, setProposals] = useState<ProposalItem[]>(INITIAL_PROPOSALS)
  const [revisionInputs, setRevisionInputs] = useState<Record<string, string>>({})
  const [showRevisionBoxId, setShowRevisionBoxId] = useState<string | null>(null)

  // 5. Investor Pool Ledger State
  const [investors, setInvestors] = useState<InvestorEntry[]>(INITIAL_INVESTORS)
  const [isAddInvestorOpen, setIsAddInvestorOpen] = useState(false)
  const [newInvestorForm, setNewInvestorForm] = useState({
    investorName: '',
    fundedProject: 'Gulberg Heights Mall Fit-Out',
    capitalCommitted: '',
    capitalDisbursed: '',
    equityShare: '',
  })

  // 6. ROI Forecast Engine State
  const [roiCurrency, setRoiCurrency] = useState<'PKR' | 'USD'>('PKR')
  const [selectedRoiLeadId, setSelectedRoiLeadId] = useState<string>('LD-101')
  const [customProjectValue, setCustomProjectValue] = useState<number>(45000000)

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // -------------------------------------------------------------
  // Dynamically Calculated Primary Metrics (Requirement 1)
  // -------------------------------------------------------------
  const metrics = useMemo(() => {
    const totalLeads = leadsList.length + companyLeads.length
    const qualifiedBids = leadsList.filter(
      (l) => l.status === 'Qualified' || l.status === 'Qualified Estimate' || l.status === 'Bidding'
    ).length
    const totalProjectedValue = leadsList.reduce((sum, l) => sum + Number(l.projectedValue || 0), 0)
    const activeInquiries = leadsList.filter((l) => l.status === 'Inquiry').length

    return {
      totalLeads,
      qualifiedBids,
      totalProjectedValue,
      activeInquiries,
    }
  }, [leadsList, companyLeads])

  // Helper Currency Formatter
  const formatMoney = (val: number, cur: 'PKR' | 'USD' = 'PKR') => {
    if (cur === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(val)
    }
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(val)
  }

  // -------------------------------------------------------------
  // Handler 1: + New Lead Submission
  // -------------------------------------------------------------
  const handleNewLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLeadForm.clientName.trim()) {
      showToast('Client Name is required.')
      return
    }

    const numericVal = parseFloat(newLeadForm.projectedValue) || 10000000
    const newLead: ConstructionLead = {
      id: `LD-${100 + leadsList.length + 1}`,
      clientName: newLeadForm.clientName.trim(),
      email: newLeadForm.email.trim() || 'info@client.com',
      contactNumber: newLeadForm.contactNumber.trim() || '+92 300 0000000',
      projectedValue: numericVal,
      source: newLeadForm.source,
      projectScope: 'Custom Commercial / Residential Construction Scope',
      location: 'Lahore / Islamabad Region',
      status: 'Inquiry',
      createdAt: new Date().toISOString().slice(0, 10),
    }

    setLeadsList((prev) => [newLead, ...prev])
    setIsNewLeadModalOpen(false)
    setNewLeadForm({
      clientName: '',
      email: '',
      contactNumber: '',
      projectedValue: '',
      source: 'Website',
    })

    showToast(`Lead added! Top metrics (Total Leads: ${metrics.totalLeads + 1}) dynamically updated.`)
  }

  // -------------------------------------------------------------
  // Handler 2: Pre-Qualification Checklist Submit (Requirement 3)
  // -------------------------------------------------------------
  const handlePreQualSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const allChecked =
      preQualChecklist.technicalEligibility &&
      preQualChecklist.legalCompliance &&
      preQualChecklist.financialSolvency &&
      preQualChecklist.clientBudget

    if (!allChecked) {
      setPreQualNotification('All 4 pre-qualification compliance criteria must be checked before approval.')
      return
    }

    setLeadsList((prev) =>
      prev.map((lead) => {
        if (lead.id === selectedLeadForPreQual) {
          return {
            ...lead,
            status: 'Qualified Estimate',
            preQualNotes: preQualNotes.trim() || 'All 4 technical and commercial eligibility checks passed.',
          }
        }
        return lead
      })
    )

    setPreQualNotification(null)
    setPreQualChecklist({
      technicalEligibility: false,
      legalCompliance: false,
      financialSolvency: false,
      clientBudget: false,
    })
    setPreQualNotes('')

    showToast(`Lead ${selectedLeadForPreQual} upgraded from Inquiry to "Qualified Estimate"!`)
  }

  // -------------------------------------------------------------
  // Handler 3: Workflow Queue Controls (Requirement 4)
  // -------------------------------------------------------------
  const handleProposalWorkflow = (
    id: string,
    action: 'Approve for Bidding' | 'Send Back for Revision' | 'Archive'
  ) => {
    if (action === 'Send Back for Revision') {
      setShowRevisionBoxId(id)
      return
    }

    setProposals((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return { ...p, workflowStatus: action === 'Approve for Bidding' ? 'Approved for Bidding' : 'Archived' }
        }
        return p
      })
    )
    showToast(`Proposal status updated to "${action}".`)
  }

  const handleSaveRevision = (id: string) => {
    const comment = revisionInputs[id] || 'Revision requested for technical specifications and markup adjustment.'
    setProposals((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            workflowStatus: 'Sent for Revision',
            revisionComment: comment,
          }
        }
        return p
      })
    )
    setShowRevisionBoxId(null)
    showToast('Revision notes logged and proposal returned to estimator queue.')
  }

  // -------------------------------------------------------------
  // Handler 4: Add Investor to Ledger (Requirement 5)
  // -------------------------------------------------------------
  const handleAddInvestor = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newInvestorForm.investorName.trim()) return

    const committed = parseFloat(newInvestorForm.capitalCommitted) || 20000000
    const disbursed = parseFloat(newInvestorForm.capitalDisbursed) || 10000000
    const equity = parseFloat(newInvestorForm.equityShare) || 10.0

    const newEntry: InvestorEntry = {
      id: `INV-${investors.length + 1}`,
      investorName: newInvestorForm.investorName.trim(),
      fundedProject: newInvestorForm.fundedProject,
      capitalCommitted: committed,
      capitalDisbursed: disbursed,
      equityShare: equity,
      dateCommitted: new Date().toISOString().slice(0, 10),
    }

    setInvestors((prev) => [...prev, newEntry])
    setIsAddInvestorOpen(false)
    setNewInvestorForm({
      investorName: '',
      fundedProject: 'Gulberg Heights Mall Fit-Out',
      capitalCommitted: '',
      capitalDisbursed: '',
      equityShare: '',
    })

    showToast('Investor commitment registered and pool formula widget updated!')
  }

  // -------------------------------------------------------------
  // Filtered Tenders (Requirement 2)
  // -------------------------------------------------------------
  const filteredTenders = useMemo(() => {
    return tenders.filter((t) => {
      const matchSearch =
        tenderSearch === '' ||
        t.authorityName.toLowerCase().includes(tenderSearch.toLowerCase()) ||
        t.tenderId.toLowerCase().includes(tenderSearch.toLowerCase()) ||
        t.projectScope.toLowerCase().includes(tenderSearch.toLowerCase())
      const matchStatus = tenderStatusFilter === 'All' || t.status === tenderStatusFilter
      return matchSearch && matchStatus
    })
  }, [tenders, tenderSearch, tenderStatusFilter])

  // -------------------------------------------------------------
  // Investor Pool Calculation Widget (Requirement 5)
  // -------------------------------------------------------------
  const investorPoolSummary = useMemo(() => {
    const totalCommitted = investors.reduce((sum, inv) => sum + inv.capitalCommitted, 0)
    const totalDisbursed = investors.reduce((sum, inv) => sum + inv.capitalDisbursed, 0)
    const availableLiquidity = Math.max(0, totalCommitted - totalDisbursed)
    const totalEquity = investors.reduce((sum, inv) => sum + inv.equityShare, 0)

    return {
      totalCommitted,
      totalDisbursed,
      availableLiquidity,
      totalEquity,
    }
  }, [investors])

  // -------------------------------------------------------------
  // ROI Forecast Engine Logic Controller (Requirement 6)
  // -------------------------------------------------------------
  const roiCalculations = useMemo(() => {
    const rawValPkr = customProjectValue || 45000000
    // Factor logic: 65% material & labor cost factor, 35% gross margin
    const costFactor65Pkr = rawValPkr * 0.65
    const grossMargin35Pkr = rawValPkr * 0.35

    // Sub-breakdowns
    const directMaterials40Pkr = rawValPkr * 0.40
    const laborSubcontract25Pkr = rawValPkr * 0.25
    const machineryOverheads10Pkr = rawValPkr * 0.10
    const netProfitExpected25Pkr = rawValPkr * 0.25

    // Currency Scale: static factor 1 USD = 278 PKR
    const scale = roiCurrency === 'USD' ? 1 / USD_TO_PKR_RATE : 1

    return {
      rawVal: rawValPkr * scale,
      costFactor65: costFactor65Pkr * scale,
      grossMargin35: grossMargin35Pkr * scale,
      directMaterials40: directMaterials40Pkr * scale,
      laborSubcontract25: laborSubcontract25Pkr * scale,
      machineryOverheads10: machineryOverheads10Pkr * scale,
      netProfitExpected25: netProfitExpected25Pkr * scale,
    }
  }, [customProjectValue, roiCurrency])

  return (
    <div className="lpm-wrapper">
      {/* -------------------------------------------------------------
          Top Dynamic Sub-Navigation Bar
      ------------------------------------------------------------- */}
      <nav className="lpm-subnav-bar" aria-label="Leads & Pipeline Sections">
        <button
          className={`lpm-subnav-tab ${activeTab === 'sourcing' ? 'active' : ''}`}
          onClick={() => setActiveTab('sourcing')}
        >
          <Sparkles size={15} />
          <span>1. Lead Sourcing & Tracking</span>
          <span className="lpm-tab-badge">{leadsList.length}</span>
        </button>

        <button
          className={`lpm-subnav-tab ${activeTab === 'tenders' ? 'active' : ''}`}
          onClick={() => setActiveTab('tenders')}
        >
          <FileText size={15} />
          <span>2. Bidding & Tender Management</span>
          <span className="lpm-tab-badge">{tenders.length}</span>
        </button>

        <button
          className={`lpm-subnav-tab ${activeTab === 'checklist' ? 'active' : ''}`}
          onClick={() => setActiveTab('checklist')}
        >
          <CheckSquare size={15} />
          <span>3. Pre-Qualification Checklist</span>
          <span className="lpm-tab-badge">{metrics.activeInquiries}</span>
        </button>

        <button
          className={`lpm-subnav-tab ${activeTab === 'pipeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('pipeline')}
        >
          <GitPullRequest size={15} />
          <span>4. Estimation & Proposal Pipeline</span>
          <span className="lpm-tab-badge">{proposals.length}</span>
        </button>

        <button
          className={`lpm-subnav-tab ${activeTab === 'investors' ? 'active' : ''}`}
          onClick={() => setActiveTab('investors')}
        >
          <Landmark size={15} />
          <span>5. Investor Pool Ledger</span>
          <span className="lpm-tab-badge">{investors.length}</span>
        </button>

        <button
          className={`lpm-subnav-tab ${activeTab === 'roi' ? 'active' : ''}`}
          onClick={() => setActiveTab('roi')}
        >
          <TrendingUp size={15} />
          <span>6. ROI Forecast Engine</span>
          <span className="lpm-tab-badge">35%</span>
        </button>

        {rawTableComponent && (
          <button
            className={`lpm-subnav-tab ${activeTab === 'rawTable' ? 'active' : ''}`}
            onClick={() => setActiveTab('rawTable')}
          >
            <TableIcon size={15} />
            <span>Master Database Register</span>
          </button>
        )}
      </nav>

      {/* -------------------------------------------------------------
          Primary Top Metric Cards (Dynamically calculated upon entry)
      ------------------------------------------------------------- */}
      <section className="lpm-kpi-grid">
        <div className="lpm-kpi-card">
          <div className="lpm-kpi-header">
            <span className="lpm-kpi-label">Total Leads</span>
            <span className="lpm-kpi-icon red">
              <UsersRound size={17} />
            </span>
          </div>
          <div className="lpm-kpi-value">{metrics.totalLeads}</div>
          <div className="lpm-kpi-sub">{leadsList.length} state leads + {companyLeads.length} database records</div>
        </div>

        <div className="lpm-kpi-card">
          <div className="lpm-kpi-header">
            <span className="lpm-kpi-label">Qualified Bids</span>
            <span className="lpm-kpi-icon green">
              <CheckSquare size={17} />
            </span>
          </div>
          <div className="lpm-kpi-value">{metrics.qualifiedBids}</div>
          <div className="lpm-kpi-sub">Ready for technical estimation & bidding</div>
        </div>

        <div className="lpm-kpi-card">
          <div className="lpm-kpi-header">
            <span className="lpm-kpi-label">Pending Inquiries</span>
            <span className="lpm-kpi-icon amber">
              <Filter size={17} />
            </span>
          </div>
          <div className="lpm-kpi-value">{metrics.activeInquiries}</div>
          <div className="lpm-kpi-sub">Awaiting Pre-Qualification Checklist</div>
        </div>

        <div className="lpm-kpi-card">
          <div className="lpm-kpi-header">
            <span className="lpm-kpi-label">Pipeline Value</span>
            <span className="lpm-kpi-icon blue">
              <CircleDollarSign size={17} />
            </span>
          </div>
          <div className="lpm-kpi-value">{formatMoney(metrics.totalProjectedValue)}</div>
          <div className="lpm-kpi-sub">Calculated across active opportunity state</div>
        </div>
      </section>

      {/* =============================================================
          SUB-MODULE 1: Lead Sourcing & Tracking
      ============================================================= */}
      {activeTab === 'sourcing' && (
        <section className="lpm-section-card">
          <div className="lpm-section-header">
            <div className="lpm-section-title">
              <h2>Lead Sourcing & Channel Tracking</h2>
              <p>Opportunity register populated with construction project leads and live acquisition channels.</p>
            </div>
            <div className="lpm-header-actions">
              {canEdit && (
                <button
                  type="button"
                  className="lpm-btn-primary"
                  onClick={() => setIsNewLeadModalOpen(true)}
                  title="Open interactive modal to create a new lead"
                >
                  <Plus size={14} />
                  <span>+ New Lead</span>
                </button>
              )}
            </div>
          </div>

          <div className="lpm-table-container">
            <table className="lpm-table">
              <thead>
                <tr>
                  <th>Lead ID</th>
                  <th>Client / Entity Name</th>
                  <th>Channel Source</th>
                  <th>Scope & Location</th>
                  <th>Projected Value (PKR)</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {leadsList.map((lead) => (
                  <tr key={lead.id}>
                    <td><strong>{lead.id}</strong></td>
                    <td>
                      <div>
                        <strong>{lead.clientName}</strong>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>
                          {lead.contactNumber} · {lead.email}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="lpm-badge open">{lead.source}</span>
                    </td>
                    <td>
                      <div>
                        <strong>{lead.projectScope}</strong>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>{lead.location}</div>
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{formatMoney(lead.projectedValue)}</strong>
                    </td>
                    <td>
                      <span className={`lpm-badge ${lead.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td>
                      {lead.status === 'Inquiry' && (
                        <button
                          type="button"
                          className="lpm-btn-outline lpm-btn-sm"
                          onClick={() => {
                            setSelectedLeadForPreQual(lead.id)
                            setActiveTab('checklist')
                          }}
                          title="Verify lead in Pre-Qualification Checklist"
                        >
                          Verify Checklist <ArrowRight size={11} />
                        </button>
                      )}
                      {lead.status === 'Qualified Estimate' && (
                        <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: 600 }}>
                          ✓ Ready for Bidding
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* =============================================================
          SUB-MODULE 2: Bidding & Tender Management
      ============================================================= */}
      {activeTab === 'tenders' && (
        <section className="lpm-section-card">
          <div className="lpm-section-header">
            <div className="lpm-section-title">
              <h2>Bidding & Tender Management Tracker</h2>
              <p>Government, semi-autonomous, and commercial tenders with earnest money and deadline tracking.</p>
            </div>
            <div className="lpm-header-actions">
              {/* Real-time search filter synced to table */}
              <div className="lpm-search-input">
                <Search size={14} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Filter by Authority or Tender ID…"
                  value={tenderSearch}
                  onChange={(e) => setTenderSearch(e.target.value)}
                  aria-label="Filter tenders"
                />
                {tenderSearch && (
                  <button
                    type="button"
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                    onClick={() => setTenderSearch('')}
                  >
                    <X size={13} color="#64748b" />
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '4px' }}>
                {(['All', 'Open', 'Submitted', 'Evaluation'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`lpm-btn-outline lpm-btn-sm ${tenderStatusFilter === st ? 'lpm-btn-primary' : ''}`}
                    onClick={() => setTenderStatusFilter(st)}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lpm-table-container">
            <table className="lpm-table">
              <thead>
                <tr>
                  <th>Tender ID</th>
                  <th>Authority Name</th>
                  <th>Bid Submission Deadline</th>
                  <th>Earnest Money Deposited</th>
                  <th>Estimated Tender Value</th>
                  <th>Bid Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenders.map((tender) => (
                  <tr key={tender.id}>
                    <td><strong>{tender.tenderId}</strong></td>
                    <td>
                      <div>
                        <strong>{tender.authorityName}</strong>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>{tender.projectScope}</div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{tender.deadline}</span>
                    </td>
                    <td>
                      <strong style={{ color: '#b45309' }}>{formatMoney(tender.earnestMoney)}</strong>
                    </td>
                    <td>
                      <strong>{formatMoney(tender.tenderValue)}</strong>
                    </td>
                    <td>
                      <span className={`lpm-badge ${tender.status.toLowerCase()}`}>
                        {tender.status}
                      </span>
                    </td>
                    <td>
                      <select
                        value={tender.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as 'Open' | 'Submitted' | 'Evaluation'
                          setTenders((prev) =>
                            prev.map((t) => (t.id === tender.id ? { ...t, status: newStatus } : t))
                          )
                          showToast(`Tender ${tender.tenderId} status updated to ${newStatus}`)
                        }}
                        style={{
                          height: '26px',
                          fontSize: '10.5px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                          padding: '0 6px',
                          backgroundColor: '#ffffff',
                        }}
                      >
                        <option value="Open">Open</option>
                        <option value="Submitted">Submitted</option>
                        <option value="Evaluation">Evaluation</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {filteredTenders.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                      No tenders match "{tenderSearch}". Try a different authority or ID.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* =============================================================
          SUB-MODULE 3: Pre-Qualification Checklist
      ============================================================= */}
      {activeTab === 'checklist' && (
        <section className="lpm-section-card">
          <div className="lpm-section-header">
            <div className="lpm-section-title">
              <h2>Pre-Qualification Checklist Form</h2>
              <p>Strict multi-step verification gate before moving inquiry leads into technical estimation.</p>
            </div>
            <div className="lpm-header-actions">
              <span className="lpm-badge qualified">Gated Workflow Control</span>
            </div>
          </div>

          <form onSubmit={handlePreQualSubmit} className="lpm-checklist-card">
            {/* Lead Selector */}
            <div className="lpm-form-group">
              <label htmlFor="preQualLeadSelect">Select Lead Under Inquiry Evaluation:</label>
              <select
                id="preQualLeadSelect"
                value={selectedLeadForPreQual}
                onChange={(e) => setSelectedLeadForPreQual(e.target.value)}
              >
                {leadsList.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.id} · {lead.clientName} ({formatMoney(lead.projectedValue)}) — Current Status: {lead.status}
                  </option>
                ))}
              </select>
            </div>

            {/* Notification alert if incomplete */}
            {preQualNotification && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  color: '#991b1b',
                  fontSize: '11px',
                }}
              >
                <AlertCircle size={16} />
                <span>{preQualNotification}</span>
              </div>
            )}

            {/* Validation Checkbox 1: Technical Eligibility */}
            <label
              className={`lpm-check-item ${preQualChecklist.technicalEligibility ? 'checked' : ''}`}
            >
              <input
                type="checkbox"
                checked={preQualChecklist.technicalEligibility}
                onChange={(e) =>
                  setPreQualChecklist((prev) => ({ ...prev, technicalEligibility: e.target.checked }))
                }
              />
              <div className="lpm-check-content">
                <span className="lpm-check-title">1. Technical Eligibility Verified</span>
                <span className="lpm-check-desc">
                  Confirm machinery availability, structural engineering roster, site accessibility, and required PEC category licenses for this project scope.
                </span>
              </div>
            </label>

            {/* Validation Checkbox 2: Legal Compliance */}
            <label
              className={`lpm-check-item ${preQualChecklist.legalCompliance ? 'checked' : ''}`}
            >
              <input
                type="checkbox"
                checked={preQualChecklist.legalCompliance}
                onChange={(e) =>
                  setPreQualChecklist((prev) => ({ ...prev, legalCompliance: e.target.checked }))
                }
              />
              <div className="lpm-check-content">
                <span className="lpm-check-title">2. Legal Compliance Checked</span>
                <span className="lpm-check-desc">
                  Active taxpayer status (NTN/STRN), non-blacklisted undertaking, local building authority zoning clearance, and labor indemnity insurance verified.
                </span>
              </div>
            </label>

            {/* Validation Checkbox 3: Financial Solvency */}
            <label
              className={`lpm-check-item ${preQualChecklist.financialSolvency ? 'checked' : ''}`}
            >
              <input
                type="checkbox"
                checked={preQualChecklist.financialSolvency}
                onChange={(e) =>
                  setPreQualChecklist((prev) => ({ ...prev, financialSolvency: e.target.checked }))
                }
              />
              <div className="lpm-check-content">
                <span className="lpm-check-title">3. Financial Solvency Proven</span>
                <span className="lpm-check-desc">
                  Bank line of credit letter verified, minimum working capital buffer established, and cash flow liquidity confirmed for material procurement.
                </span>
              </div>
            </label>

            {/* Validation Checkbox 4: Client Budget */}
            <label
              className={`lpm-check-item ${preQualChecklist.clientBudget ? 'checked' : ''}`}
            >
              <input
                type="checkbox"
                checked={preQualChecklist.clientBudget}
                onChange={(e) =>
                  setPreQualChecklist((prev) => ({ ...prev, clientBudget: e.target.checked }))
                }
              />
              <div className="lpm-check-content">
                <span className="lpm-check-title">4. Client Budget Confirmed</span>
                <span className="lpm-check-desc">
                  Owner has demonstrated proof of funds, agreed in writing to 15-20% mobilization advance, and signed the preliminary site inspection memorandum.
                </span>
              </div>
            </label>

            {/* Notes */}
            <div className="lpm-form-group">
              <label htmlFor="preQualNotes">Evaluation Notes / Auditor Observations:</label>
              <textarea
                id="preQualNotes"
                placeholder="Enter technical observations, site condition remarks, or specific milestone prerequisites…"
                value={preQualNotes}
                onChange={(e) => setPreQualNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="lpm-btn-outline"
                onClick={() =>
                  setPreQualChecklist({
                    technicalEligibility: true,
                    legalCompliance: true,
                    financialSolvency: true,
                    clientBudget: true,
                  })
                }
              >
                Check All (Fast Pass)
              </button>
              <button type="submit" className="lpm-btn-primary">
                <Check size={14} />
                <span>Submit Pre-Qualification & Upgrade to "Qualified Estimate"</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* =============================================================
          SUB-MODULE 4: Estimation & Proposal Pipeline
      ============================================================= */}
      {activeTab === 'pipeline' && (
        <section className="lpm-section-card">
          <div className="lpm-section-header">
            <div className="lpm-section-title">
              <h2>Estimation & Proposal Workflow Queue</h2>
              <p>Operational review queue for civil estimators, engineering bids, and executive revision controls.</p>
            </div>
            <div className="lpm-header-actions">
              <span className="lpm-badge open">Active Review Queue ({proposals.length})</span>
            </div>
          </div>

          <div className="lpm-table-container">
            <table className="lpm-table">
              <thead>
                <tr>
                  <th>Proposal Code</th>
                  <th>Project Title & Client</th>
                  <th>Lead Estimator</th>
                  <th>Estimated Cost</th>
                  <th>Quoted Value</th>
                  <th>Workflow Status</th>
                  <th>Operational Toggle Controls</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.proposalCode}</strong></td>
                    <td>
                      <div>
                        <strong>{item.projectTitle}</strong>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>Client: {item.client}</div>
                      </div>
                    </td>
                    <td>
                      <span>{item.estimator}</span>
                    </td>
                    <td>
                      <span style={{ color: '#475569' }}>{formatMoney(item.estimatedCost)}</span>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{formatMoney(item.quotedValue)}</strong>
                      <div style={{ fontSize: '9.5px', color: '#16a34a' }}>
                        Margin: {formatMoney(item.quotedValue - item.estimatedCost)}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`lpm-badge ${
                          item.workflowStatus === 'Approved for Bidding'
                            ? 'approved'
                            : item.workflowStatus === 'Sent for Revision'
                            ? 'revision'
                            : item.workflowStatus === 'Archived'
                            ? 'archived'
                            : 'open'
                        }`}
                      >
                        {item.workflowStatus}
                      </span>
                      {item.revisionComment && item.workflowStatus === 'Sent for Revision' && (
                        <div
                          style={{
                            marginTop: '4px',
                            fontSize: '9.5px',
                            color: '#991b1b',
                            background: '#fee2e2',
                            padding: '3px 6px',
                            borderRadius: '4px',
                            maxWidth: '220px',
                          }}
                        >
                          💬 "{item.revisionComment}"
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="lpm-workflow-actions">
                        {/* 1. Approve for Bidding */}
                        <button
                          type="button"
                          className="lpm-btn-outline lpm-btn-sm"
                          style={{ color: '#15803d', borderColor: '#86efac' }}
                          onClick={() => handleProposalWorkflow(item.id, 'Approve for Bidding')}
                          title="Approve proposal directly for client submission"
                        >
                          <Check size={11} /> Approve for Bidding
                        </button>

                        {/* 2. Send Back for Revision */}
                        <button
                          type="button"
                          className="lpm-btn-outline lpm-btn-sm"
                          style={{ color: '#b91c1c', borderColor: '#fca5a5' }}
                          onClick={() => handleProposalWorkflow(item.id, 'Send Back for Revision')}
                          title="Reveal comment box and send back for revision"
                        >
                          <MessageSquare size={11} /> Send Back for Revision
                        </button>

                        {/* 3. Archive */}
                        <button
                          type="button"
                          className="lpm-btn-outline lpm-btn-sm"
                          style={{ color: '#64748b' }}
                          onClick={() => handleProposalWorkflow(item.id, 'Archive')}
                          title="Move to archived proposals"
                        >
                          Archive
                        </button>
                      </div>

                      {/* Conditionally rendered comment textbox on revision click */}
                      {showRevisionBoxId === item.id && (
                        <div className="lpm-revision-box">
                          <label style={{ fontSize: '10px', fontWeight: 700, color: '#991b1b' }}>
                            Required Revision Instructions for Estimator:
                          </label>
                          <textarea
                            placeholder="Detail required adjustments: e.g. reduce margin, revise concrete mix, re-check supplier quote…"
                            value={revisionInputs[item.id] || ''}
                            onChange={(e) =>
                              setRevisionInputs((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                          />
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="lpm-btn-outline lpm-btn-sm"
                              onClick={() => setShowRevisionBoxId(null)}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="lpm-btn-primary lpm-btn-sm"
                              onClick={() => handleSaveRevision(item.id)}
                            >
                              Commit Revision
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* =============================================================
          SUB-MODULE 5: Investor Pool Ledger
      ============================================================= */}
      {activeTab === 'investors' && (
        <section className="lpm-section-card">
          {/* Summary Calculation Formula Widget at the Top (Requirement 5) */}
          <div className="lpm-pool-summary-widget">
            <div className="lpm-pool-stat">
              <span className="lpm-pool-stat-label">Total Committed Pool</span>
              <span className="lpm-pool-stat-value highlight">
                {formatMoney(investorPoolSummary.totalCommitted)}
              </span>
              <span className="lpm-pool-stat-sub">Σ Capital committed across all equity syndicates</span>
            </div>

            <div className="lpm-pool-stat">
              <span className="lpm-pool-stat-label">Capital Disbursed</span>
              <span className="lpm-pool-stat-value">
                {formatMoney(investorPoolSummary.totalDisbursed)}
              </span>
              <span className="lpm-pool-stat-sub">Site mobilization & procurement calls</span>
            </div>

            <div className="lpm-pool-stat">
              <span className="lpm-pool-stat-label">Available Liquidity</span>
              <span className="lpm-pool-stat-value" style={{ color: '#38bdf8' }}>
                {formatMoney(investorPoolSummary.availableLiquidity)}
              </span>
              <span className="lpm-pool-stat-sub">Remaining drawdown capacity</span>
            </div>

            <div className="lpm-pool-stat">
              <span className="lpm-pool-stat-label">Allocated Equity</span>
              <span className="lpm-pool-stat-value">
                {investorPoolSummary.totalEquity.toFixed(1)}%
              </span>
              <span className="lpm-pool-stat-sub">Remaining founder stake: {(100 - investorPoolSummary.totalEquity).toFixed(1)}%</span>
            </div>
          </div>

          <div className="lpm-section-header">
            <div className="lpm-section-title">
              <h2>Investor Pool Accounting Ledger</h2>
              <p>Funding syndicate partners, committed project capital, and profit-sharing equity stakes.</p>
            </div>
            <div className="lpm-header-actions">
              {canEdit && (
                <button
                  type="button"
                  className="lpm-btn-primary"
                  onClick={() => setIsAddInvestorOpen(true)}
                  title="Add new investor commitment"
                >
                  <Plus size={14} />
                  <span>+ Add Investor Commitment</span>
                </button>
              )}
            </div>
          </div>

          <div className="lpm-table-container">
            <table className="lpm-table">
              <thead>
                <tr>
                  <th>Investor Name</th>
                  <th>Funded Project</th>
                  <th>Capital Committed</th>
                  <th>Capital Disbursed</th>
                  <th>Available Capital</th>
                  <th>Equity Share (%)</th>
                  <th>Commitment Date</th>
                </tr>
              </thead>
              <tbody>
                {investors.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <strong>{inv.investorName}</strong>
                    </td>
                    <td>
                      <span className="lpm-badge open">{inv.fundedProject}</span>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{formatMoney(inv.capitalCommitted)}</strong>
                    </td>
                    <td>
                      <span style={{ color: '#b91c1c' }}>{formatMoney(inv.capitalDisbursed)}</span>
                    </td>
                    <td>
                      <strong style={{ color: '#16a34a' }}>
                        {formatMoney(Math.max(0, inv.capitalCommitted - inv.capitalDisbursed))}
                      </strong>
                    </td>
                    <td>
                      <span className="lpm-badge evaluation">{inv.equityShare.toFixed(1)}%</span>
                    </td>
                    <td>{inv.dateCommitted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* =============================================================
          SUB-MODULE 6: ROI Forecast Engine
      ============================================================= */}
      {activeTab === 'roi' && (
        <section className="lpm-section-card">
          <div className="lpm-roi-dashboard">
            {/* Header with Project Selector & Currency Toggle */}
            <div className="lpm-roi-header-card">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#b3202a', letterSpacing: '0.5px' }}>
                  AUTOMATED MARGIN & REVENUE CONTROLLER
                </span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Construction ROI & Margin Forecast Engine
                </h3>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                  Real-time formula: Project Value − 65% Target Cost Factor = 35% Projected Gross Margin
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Currency Conversion Toggle (Requirement 6) */}
                <div className="lpm-currency-switch">
                  <button
                    type="button"
                    className={`lpm-currency-btn ${roiCurrency === 'PKR' ? 'active' : ''}`}
                    onClick={() => setRoiCurrency('PKR')}
                  >
                    ₨ PKR
                  </button>
                  <button
                    type="button"
                    className={`lpm-currency-btn ${roiCurrency === 'USD' ? 'active' : ''}`}
                    onClick={() => setRoiCurrency('USD')}
                  >
                    $ USD (1:278)
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Value Controller */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
                gap: '16px',
                padding: '16px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
              }}
            >
              <div className="lpm-form-group">
                <label htmlFor="roiLeadPreset">Select Construction Lead / Project Preset:</label>
                <select
                  id="roiLeadPreset"
                  value={selectedRoiLeadId}
                  onChange={(e) => {
                    setSelectedRoiLeadId(e.target.value)
                    const found = leadsList.find((l) => l.id === e.target.value)
                    if (found) setCustomProjectValue(found.projectedValue)
                  }}
                >
                  {leadsList.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.clientName} — {lead.projectScope} ({formatMoney(lead.projectedValue)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="lpm-form-group">
                <label htmlFor="customValInput">
                  Or Test Custom Contract Value ({roiCurrency}):
                </label>
                <input
                  id="customValInput"
                  type="number"
                  min="100000"
                  step="500000"
                  value={roiCurrency === 'USD' ? Math.round(customProjectValue / USD_TO_PKR_RATE) : customProjectValue}
                  onChange={(e) => {
                    const inputVal = parseFloat(e.target.value) || 0
                    setCustomProjectValue(roiCurrency === 'USD' ? inputVal * USD_TO_PKR_RATE : inputVal)
                  }}
                />
              </div>
            </div>

            {/* Primary Calculation Formula Widget (Requirement 6) */}
            <div className="lpm-roi-formula-banner">
              {/* 1. Estimated Project Value */}
              <div className="lpm-roi-formula-card gross">
                <span className="lpm-formula-tag">Estimated Project Value (100%)</span>
                <div className="lpm-formula-val">{formatMoney(roiCalculations.rawVal, roiCurrency)}</div>
                <span className="lpm-formula-note">Contract base awarded or proposed</span>
              </div>

              {/* 2. Target Cost Factor (65%) */}
              <div className="lpm-roi-formula-card cost">
                <span className="lpm-formula-tag">Target Material & Labor Cost (65%)</span>
                <div className="lpm-formula-val" style={{ color: '#b91c1c' }}>
                  − {formatMoney(roiCalculations.costFactor65, roiCurrency)}
                </div>
                <span className="lpm-formula-note">65% capped allocation factor</span>
              </div>

              {/* 3. Projected Gross Margin (35%) */}
              <div className="lpm-roi-formula-card margin">
                <span className="lpm-formula-tag">Projected Gross Margin (35%)</span>
                <div className="lpm-formula-val" style={{ color: '#15803d' }}>
                  {formatMoney(roiCalculations.grossMargin35, roiCurrency)}
                </div>
                <span className="lpm-formula-note">Automatically calculated surplus</span>
              </div>
            </div>

            {/* Granular Cost Allocation Sub-breakdowns */}
            <div>
              <h4 style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                Itemized Cost Breakdown Model (65% Cost Factor Details):
              </h4>
              <div className="lpm-roi-breakdown-grid">
                <div className="lpm-breakdown-item">
                  <span className="lpm-breakdown-title">Direct Materials (Cement, Steel, Finishes)</span>
                  <span className="lpm-breakdown-val">
                    {formatMoney(roiCalculations.directMaterials40, roiCurrency)}
                  </span>
                  <span className="lpm-breakdown-pct">Target ~40% of Project Value</span>
                </div>

                <div className="lpm-breakdown-item">
                  <span className="lpm-breakdown-title">Site Labor & Subcontracts</span>
                  <span className="lpm-breakdown-val">
                    {formatMoney(roiCalculations.laborSubcontract25, roiCurrency)}
                  </span>
                  <span className="lpm-breakdown-pct">Target ~25% of Project Value</span>
                </div>

                <div className="lpm-breakdown-item">
                  <span className="lpm-breakdown-title">Plant, Fuel & Logistics</span>
                  <span className="lpm-breakdown-val">
                    {formatMoney(roiCalculations.machineryOverheads10, roiCurrency)}
                  </span>
                  <span className="lpm-breakdown-pct">Target ~10% Overheads Factor</span>
                </div>

                <div className="lpm-breakdown-item" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                  <span className="lpm-breakdown-title" style={{ color: '#15803d' }}>
                    Net Operating Profit Target
                  </span>
                  <span className="lpm-breakdown-val" style={{ color: '#15803d' }}>
                    {formatMoney(roiCalculations.netProfitExpected25, roiCurrency)}
                  </span>
                  <span className="lpm-breakdown-pct" style={{ color: '#16a34a' }}>
                    ~25% Net Retained Operating Cash
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =============================================================
          SUB-MODULE 7: Raw Database Table (Preserves earlier 10-button CRUD)
      ============================================================= */}
      {activeTab === 'rawTable' && rawTableComponent && (
        <div>{rawTableComponent}</div>
      )}

      {/* =============================================================
          MODAL: + New Lead Interactive Form (Requirement 1)
      ============================================================= */}
      {isNewLeadModalOpen && (
        <div
          className="lpm-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsNewLeadModalOpen(false)
          }}
        >
          <div className="lpm-modal" role="dialog" aria-modal="true" aria-labelledby="new-lead-title">
            <header className="lpm-modal-header">
              <h3 id="new-lead-title">+ New Construction Lead</h3>
              <button
                type="button"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                onClick={() => setIsNewLeadModalOpen(false)}
              >
                <X size={18} color="#64748b" />
              </button>
            </header>

            <form onSubmit={handleNewLeadSubmit}>
              <div className="lpm-modal-body">
                {/* 1. Client Name */}
                <div className="lpm-form-group">
                  <label htmlFor="leadClientName">Client Name / Business Entity *</label>
                  <input
                    id="leadClientName"
                    type="text"
                    required
                    placeholder="e.g. Malik Riaz Properties / Al-Rehman Hospital"
                    value={newLeadForm.clientName}
                    onChange={(e) =>
                      setNewLeadForm((prev) => ({ ...prev, clientName: e.target.value }))
                    }
                  />
                </div>

                {/* 2. Email */}
                <div className="lpm-form-group">
                  <label htmlFor="leadEmail">Email Address</label>
                  <input
                    id="leadEmail"
                    type="email"
                    placeholder="e.g. client@example.com"
                    value={newLeadForm.email}
                    onChange={(e) =>
                      setNewLeadForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                </div>

                {/* 3. Contact Number */}
                <div className="lpm-form-group">
                  <label htmlFor="leadContact">Contact Phone / WhatsApp Number</label>
                  <input
                    id="leadContact"
                    type="tel"
                    placeholder="e.g. +92 300 1234567"
                    value={newLeadForm.contactNumber}
                    onChange={(e) =>
                      setNewLeadForm((prev) => ({ ...prev, contactNumber: e.target.value }))
                    }
                  />
                </div>

                {/* 4. Projected Value */}
                <div className="lpm-form-group">
                  <label htmlFor="leadValue">Projected Value (PKR) *</label>
                  <input
                    id="leadValue"
                    type="number"
                    min="100000"
                    step="500000"
                    required
                    placeholder="e.g. 35000000"
                    value={newLeadForm.projectedValue}
                    onChange={(e) =>
                      setNewLeadForm((prev) => ({ ...prev, projectedValue: e.target.value }))
                    }
                  />
                </div>

                {/* 5. Lead Source Dropdown */}
                <div className="lpm-form-group">
                  <label htmlFor="leadSource">Lead Source Channel *</label>
                  <select
                    id="leadSource"
                    value={newLeadForm.source}
                    onChange={(e) =>
                      setNewLeadForm((prev) => ({ ...prev, source: e.target.value as LeadSource }))
                    }
                  >
                    <option value="Website">Website</option>
                    <option value="Tender">Tender</option>
                    <option value="Referral">Referral</option>
                    <option value="Paid Ad">Paid Ad</option>
                  </select>
                </div>
              </div>

              <footer className="lpm-modal-footer">
                <button
                  type="button"
                  className="lpm-btn-outline"
                  onClick={() => setIsNewLeadModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="lpm-btn-primary">
                  <Check size={14} />
                  <span>Save Lead & Update Metrics</span>
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* =============================================================
          MODAL: + Add Investor Commitment (Requirement 5)
      ============================================================= */}
      {isAddInvestorOpen && (
        <div
          className="lpm-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsAddInvestorOpen(false)
          }}
        >
          <div className="lpm-modal" role="dialog" aria-modal="true" aria-labelledby="add-investor-title">
            <header className="lpm-modal-header">
              <h3 id="add-investor-title">+ Add Investor Capital Commitment</h3>
              <button
                type="button"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                onClick={() => setIsAddInvestorOpen(false)}
              >
                <X size={18} color="#64748b" />
              </button>
            </header>

            <form onSubmit={handleAddInvestor}>
              <div className="lpm-modal-body">
                <div className="lpm-form-group">
                  <label htmlFor="invName">Investor / Syndicate Name *</label>
                  <input
                    id="invName"
                    type="text"
                    required
                    placeholder="e.g. Al-Farooq Real Estate Equity Group"
                    value={newInvestorForm.investorName}
                    onChange={(e) =>
                      setNewInvestorForm((prev) => ({ ...prev, investorName: e.target.value }))
                    }
                  />
                </div>

                <div className="lpm-form-group">
                  <label htmlFor="invProject">Funded Project (Dropdown) *</label>
                  <select
                    id="invProject"
                    value={newInvestorForm.fundedProject}
                    onChange={(e) =>
                      setNewInvestorForm((prev) => ({ ...prev, fundedProject: e.target.value }))
                    }
                  >
                    <option value="Gulberg Heights Mall Fit-Out">Gulberg Heights Mall Fit-Out</option>
                    <option value="Boutique Hotel Remodel F-7">Boutique Hotel Remodel F-7</option>
                    <option value="Sundar Logistics Depot Pre-Fab">Sundar Logistics Depot Pre-Fab</option>
                    <option value="Luxury Villa Bahria Phase 8">Luxury Villa Bahria Phase 8</option>
                    <option value="Lake City Sector M Gray Structure">Lake City Sector M Gray Structure</option>
                  </select>
                </div>

                <div className="lpm-form-group">
                  <label htmlFor="invCommitted">Capital Committed (PKR) *</label>
                  <input
                    id="invCommitted"
                    type="number"
                    min="1000000"
                    step="1000000"
                    required
                    placeholder="e.g. 50000000"
                    value={newInvestorForm.capitalCommitted}
                    onChange={(e) =>
                      setNewInvestorForm((prev) => ({ ...prev, capitalCommitted: e.target.value }))
                    }
                  />
                </div>

                <div className="lpm-form-group">
                  <label htmlFor="invDisbursed">Initial Capital Disbursed (PKR)</label>
                  <input
                    id="invDisbursed"
                    type="number"
                    min="0"
                    step="1000000"
                    placeholder="e.g. 20000000"
                    value={newInvestorForm.capitalDisbursed}
                    onChange={(e) =>
                      setNewInvestorForm((prev) => ({ ...prev, capitalDisbursed: e.target.value }))
                    }
                  />
                </div>

                <div className="lpm-form-group">
                  <label htmlFor="invEquity">Equity Share (%) *</label>
                  <input
                    id="invEquity"
                    type="number"
                    min="1"
                    max="100"
                    step="0.5"
                    required
                    placeholder="e.g. 15.0"
                    value={newInvestorForm.equityShare}
                    onChange={(e) =>
                      setNewInvestorForm((prev) => ({ ...prev, equityShare: e.target.value }))
                    }
                  />
                </div>
              </div>

              <footer className="lpm-modal-footer">
                <button
                  type="button"
                  className="lpm-btn-outline"
                  onClick={() => setIsAddInvestorOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="lpm-btn-primary">
                  <Check size={14} />
                  <span>Record Commitment</span>
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Floating Feedback Toast */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 120,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 18px',
            background: '#1e293b',
            color: '#ffffff',
            borderRadius: '6px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            fontSize: '11px',
            fontFamily: 'var(--ops-body, sans-serif)',
          }}
        >
          <Check size={15} color="#4ade80" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
