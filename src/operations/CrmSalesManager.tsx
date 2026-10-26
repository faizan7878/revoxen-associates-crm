import React, { useState, useMemo } from 'react'
import {
  Users, Building2, Kanban, FileSpreadsheet, Scale, Plus, Search,
  CheckCircle2, XCircle, ArrowRight, ArrowLeft, RefreshCw, FileText,
  Clock, ShieldAlert, Layers, ChevronDown, ChevronRight, Phone, Mail,
  MapPin, DollarSign, Send, Archive, RotateCcw, AlertTriangle, Eye, Edit3
} from 'lucide-react'
import './crm-sales.css'

export interface CrmSalesManagerProps {
  canEdit?: boolean
  companyLeads?: any[]
  onRefresh?: () => void
  onNotify?: (msg: string) => void
  rawTableComponent?: React.ReactNode
}

// -------------------------------------------------------------
// 1. Leads & Inquiries Interfaces
// -------------------------------------------------------------
export type LeadSource = 'Website' | 'Tender' | 'Referral' | 'Paid Ad'
export interface MockLead {
  id: string
  clientName: string
  email: string
  contactNumber: string
  projectedValue: number
  source: LeadSource
  status: 'Inquiry' | 'Qualified' | 'Bidding' | 'Converted'
  date: string
}

// -------------------------------------------------------------
// 2. Client Management Interfaces
// -------------------------------------------------------------
export interface ClientRecord {
  id: string
  clientId: string
  companyName: string
  mainContact: string
  phone: string
  email: string
  activeSites: number
  totalInvoicedBilling: number
  isArchived: boolean
  communications: { id: string; date: string; channel: string; note: string; officer: string }[]
}

// -------------------------------------------------------------
// 3. Sales Pipeline Interfaces
// -------------------------------------------------------------
export type PipelineStage = 'Sourced' | 'In-Progress' | 'Submitted' | 'Negotiation'
export interface PipelineItem {
  id: string
  tenderId: string
  projectName: string
  clientName: string
  expectedValue: number
  stage: PipelineStage
  deadline: string
  probability: number
}

// -------------------------------------------------------------
// 4. Quotations & Proposals Interfaces
// -------------------------------------------------------------
export interface LineCostItem {
  id: string
  description: string
  materialSubtotal: number
  laborFactors: number
  overheads: number
  total: number
}

export interface QuotationEntry {
  id: string
  quoteNumber: string
  clientName: string
  projectScope: string
  items: LineCostItem[]
  materialSubtotal: number
  laborFactors: number
  overheads: number
  grandTotal: number
  status: 'Draft' | 'Approved for Client Delivery' | 'Revision Requested' | 'Archived'
  revisionNotes?: string
  dateDrafted: string
}

// -------------------------------------------------------------
// 5. Contracts & Agreements Interfaces
// -------------------------------------------------------------
export interface LegalContractRecord {
  id: string
  contractCode: string
  projectName: string
  investorGroup: string
  executionMilestone: string
  retentionPct: number
  equitySharePct: number
  contractValuePKR: number
  approvalState: 'Approved' | 'Executed' | 'Under Review' | 'Milestone Audit'
}

export default function CrmSalesManager({
  canEdit = true,
  companyLeads = [],
  onRefresh,
  onNotify = () => {},
  rawTableComponent,
}: CrmSalesManagerProps) {
  // Navigation active tab: 5 sub-navigation links
  type TabKey = 'leads' | 'clients' | 'pipeline' | 'quotations' | 'contracts' | 'master_register'
  const [activeTab, setActiveTab] = useState<TabKey>('leads')

  // Notification helper
  const notify = (msg: string) => onNotify(msg)

  // ---------------------------------------------------------------------------
  // 1. LEADS & INQUIRIES STATE & HANDLERS
  // ---------------------------------------------------------------------------
  const [leadsState, setLeadsState] = useState<MockLead[]>([
    { id: 'LD-201', clientName: 'Habib Metro Construction', email: 'procurement@hmc-pk.com', contactNumber: '+92 300 2345678', projectedValue: 14500000, source: 'Tender', status: 'Qualified', date: '2026-10-14' },
    { id: 'LD-202', clientName: 'Bahria Town Luxury Villas', email: 'villas@bahriatowngroup.com', contactNumber: '+92 321 8899112', projectedValue: 28000000, source: 'Referral', status: 'Converted', date: '2026-10-18' },
    { id: 'LD-203', clientName: 'Lucky One Plaza Mall Fitout', email: 'tenders@luckyone.com.pk', contactNumber: '+92 333 4455667', projectedValue: 9200000, source: 'Website', status: 'Bidding', date: '2026-10-21' },
    { id: 'LD-204', clientName: 'Al-Karam Textile Warehouse', email: 'engineering@alkaram.com', contactNumber: '+92 301 7766554', projectedValue: 34000000, source: 'Paid Ad', status: 'Inquiry', date: '2026-10-24' },
    { id: 'LD-205', clientName: 'Engro Polymers Site Office', email: 'projects@engro-pk.com', contactNumber: '+92 312 9988776', projectedValue: 6500000, source: 'Referral', status: 'Qualified', date: '2026-10-25' },
  ])

  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false)
  const [newLeadForm, setNewLeadForm] = useState<{
    clientName: string
    email: string
    contactNumber: string
    projectedValue: string
    source: LeadSource
  }>({
    clientName: '',
    email: '',
    contactNumber: '',
    projectedValue: '',
    source: 'Website',
  })

  // Top metric recalculations
  const leadsMetrics = useMemo(() => {
    const totalLeads = leadsState.length
    const qualifiedBids = leadsState.filter(l => l.status === 'Qualified' || l.status === 'Bidding').length
    const converted = leadsState.filter(l => l.status === 'Converted').length
    const conversionRate = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : '0.0'
    const totalValue = leadsState.reduce((sum, l) => sum + (Number(l.projectedValue) || 0), 0)
    return { totalLeads, qualifiedBids, conversionRate, totalValue }
  }, [leadsState])

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLeadForm.clientName.trim()) {
      alert('Please enter Client Name')
      return
    }
    const newLead: MockLead = {
      id: `LD-${Math.floor(200 + Math.random() * 800)}`,
      clientName: newLeadForm.clientName.trim(),
      email: newLeadForm.email.trim() || '—',
      contactNumber: newLeadForm.contactNumber.trim() || '—',
      projectedValue: Number(newLeadForm.projectedValue) || 0,
      source: newLeadForm.source,
      status: 'Inquiry',
      date: new Date().toISOString().slice(0, 10),
    }

    setLeadsState(prev => [newLead, ...prev])
    setIsNewLeadModalOpen(false)
    setNewLeadForm({ clientName: '', email: '', contactNumber: '', projectedValue: '', source: 'Website' })
    notify(`New Lead ${newLead.id} (${newLead.clientName}) appended! Metrics updated.`)
  }

  // ---------------------------------------------------------------------------
  // 2. CLIENT MANAGEMENT STATE & HANDLERS
  // ---------------------------------------------------------------------------
  const [clientLedger, setClientLedger] = useState<ClientRecord[]>([
    {
      id: 'CL-001',
      clientId: 'CL-001',
      companyName: 'Habib Metro Real Estate',
      mainContact: 'Engr. Tariq Masood (Project Director)',
      phone: '+92 300 2345678',
      email: 'tariq.masood@hmc-pk.com',
      activeSites: 4,
      totalInvoicedBilling: 46500000,
      isArchived: false,
      communications: [
        { id: 'COMM-1', date: '2026-10-22', channel: 'Meeting', note: 'Discussed foundation pile testing report. Client requested advance schedule.', officer: 'Faizan (Director Operations)' },
        { id: 'COMM-2', date: '2026-10-18', channel: 'Call', note: 'Followed up on IPC #04 certificate signoff. Awaiting internal audit.', officer: 'Accountant' },
      ],
    },
    {
      id: 'CL-002',
      clientId: 'CL-002',
      companyName: 'Lucky Core Ventures',
      mainContact: 'Bilal Farooq (Head of Procurement)',
      phone: '+92 321 4455889',
      email: 'bilal.farooq@luckycore.pk',
      activeSites: 2,
      totalInvoicedBilling: 29800000,
      isArchived: false,
      communications: [
        { id: 'COMM-3', date: '2026-10-24', channel: 'Site Visit', note: 'Joint site inspection at Site B. Concrete pour approved without defect.', officer: 'Lead Site Engineer' },
      ],
    },
    {
      id: 'CL-003',
      clientId: 'CL-003',
      companyName: 'Al-Karam Warehousing Corp',
      mainContact: 'Hassan Raza (GM Facilities)',
      phone: '+92 301 7766554',
      email: 'hassan.raza@alkaram.com',
      activeSites: 3,
      totalInvoicedBilling: 62400000,
      isArchived: false,
      communications: [
        { id: 'COMM-4', date: '2026-10-15', channel: 'Email', note: 'Sent draft quotation for mezzanine steel extension structure.', officer: 'Estimator' },
      ],
    },
    {
      id: 'CL-004',
      clientId: 'CL-004',
      companyName: 'Zubair Commercial Towers',
      mainContact: 'Syed Zubair Ali (CEO)',
      phone: '+92 333 1122334',
      email: 'zubair@ztowers.com.pk',
      activeSites: 0,
      totalInvoicedBilling: 18200000,
      isArchived: true,
      communications: [
        { id: 'COMM-5', date: '2026-08-10', channel: 'Meeting', note: 'Handover complete. Retention warranty period ongoing.', officer: 'Legal Counsel' },
      ],
    },
  ])

  const [clientSearch, setClientSearch] = useState('')
  const [viewHistoryClientId, setViewHistoryClientId] = useState<string | null>(null)
  const [newLogNote, setNewLogNote] = useState({ channel: 'Call', note: '' })

  const filteredClients = useMemo(() => {
    const q = clientSearch.toLowerCase().trim()
    return clientLedger.filter(c => {
      return !q || c.companyName.toLowerCase().includes(q) || c.clientId.toLowerCase().includes(q) || c.mainContact.toLowerCase().includes(q)
    })
  }, [clientLedger, clientSearch])

  const toggleArchiveClient = (id: string) => {
    setClientLedger(prev => prev.map(c => {
      if (c.id === id) {
        const next = !c.isArchived
        notify(`Client ${c.companyName} is now ${next ? 'Archived' : 'Active'}.`)
        return { ...c, isArchived: next }
      }
      return c
    }))
  }

  const handleAddCommunicationLog = (clientId: string) => {
    if (!newLogNote.note.trim()) return
    const newEntry = {
      id: `COMM-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      channel: newLogNote.channel,
      note: newLogNote.note.trim(),
      officer: 'Active User',
    }
    setClientLedger(prev => prev.map(c => {
      if (c.id === clientId) {
        return { ...c, communications: [newEntry, ...c.communications] }
      }
      return c
    }))
    setNewLogNote({ channel: 'Call', note: '' })
    notify('Logged new communication note to client history.')
  }

  // ---------------------------------------------------------------------------
  // 3. SALES PIPELINE STATE & HANDLERS
  // ---------------------------------------------------------------------------
  const stages: PipelineStage[] = ['Sourced', 'In-Progress', 'Submitted', 'Negotiation']

  const [pipelineDeals, setPipelineDeals] = useState<PipelineItem[]>([
    { id: 'PL-501', tenderId: 'TND-2026-08', projectName: 'Port Qasim Fuel Terminal Works', clientName: 'Qasim Energy Ltd', expectedValue: 48000000, stage: 'Sourced', deadline: '2026-11-20', probability: 35 },
    { id: 'PL-502', tenderId: 'TND-2026-11', projectName: 'Defense Complex Boundary & Civil Walls', clientName: 'Naval Housing Auth', expectedValue: 31500000, stage: 'In-Progress', deadline: '2026-11-10', probability: 55 },
    { id: 'PL-503', tenderId: 'TND-2026-15', projectName: 'North Karachi Industrial Substation', clientName: 'K-Electric Subcontractor', expectedValue: 19800000, stage: 'Submitted', deadline: '2026-11-05', probability: 75 },
    { id: 'PL-504', tenderId: 'TND-2026-04', projectName: 'Gulberg Executive Offices Renovation', clientName: 'Gulberg Developers', expectedValue: 15400000, stage: 'Negotiation', deadline: '2026-10-31', probability: 90 },
    { id: 'PL-505', tenderId: 'TND-2026-19', projectName: 'Clifton Beachside Pavilion Steel Piling', clientName: 'Metropolitan Corp', expectedValue: 56000000, stage: 'In-Progress', deadline: '2026-12-15', probability: 50 },
  ])

  // Running sum formula widget in header
  const totalExpectedDealValue = useMemo(() => {
    return pipelineDeals.reduce((sum, d) => sum + (Number(d.expectedValue) || 0), 0)
  }, [pipelineDeals])

  const shiftPipelineStage = (id: string, dir: 'prev' | 'next') => {
    setPipelineDeals(prev => prev.map(deal => {
      if (deal.id !== id) return deal
      const currIdx = stages.indexOf(deal.stage)
      const nextIdx = dir === 'next' ? Math.min(currIdx + 1, stages.length - 1) : Math.max(currIdx - 1, 0)
      const newStage = stages[nextIdx]
      if (newStage !== deal.stage) {
        notify(`Tender ${deal.tenderId} shifted to: ${newStage}`)
      }
      return { ...deal, stage: newStage }
    }))
  }

  // ---------------------------------------------------------------------------
  // 4. QUOTATIONS & PROPOSALS STATE & HANDLERS
  // ---------------------------------------------------------------------------
  const [quotations, setQuotations] = useState<QuotationEntry[]>([
    {
      id: 'QT-801',
      quoteNumber: 'REV-EST-2026-44',
      clientName: 'Habib Metro Construction',
      projectScope: 'Basement Poured Concrete & Reinforced Retaining Walls',
      items: [
        { id: 'LI-1', description: 'Grade 60 Deformed Rebar Steel Reinforcement (Ton)', materialSubtotal: 4500000, laborFactors: 850000, overheads: 500000, total: 5850000 },
        { id: 'LI-2', description: 'Class A Ready-Mix Concrete 3000 PSI with Pumping', materialSubtotal: 3200000, laborFactors: 600000, overheads: 350000, total: 4150000 },
      ],
      materialSubtotal: 7700000,
      laborFactors: 1450000,
      overheads: 850000,
      grandTotal: 10000000,
      status: 'Approved for Client Delivery',
      dateDrafted: '2026-10-22',
    },
    {
      id: 'QT-802',
      quoteNumber: 'REV-EST-2026-49',
      clientName: 'Lucky Core Ventures',
      projectScope: 'Structural Steel Portal Frames & Pre-Engineered Trusses',
      items: [
        { id: 'LI-3', description: 'Fabrication of MS Universal Beams & Columns', materialSubtotal: 6200000, laborFactors: 1400000, overheads: 700000, total: 8300000 },
      ],
      materialSubtotal: 6200000,
      laborFactors: 1400000,
      overheads: 700000,
      grandTotal: 8300000,
      status: 'Draft',
      dateDrafted: '2026-10-25',
    },
  ])

  // Revision text box per quote
  const [activeRevisionQuoteId, setActiveRevisionQuoteId] = useState<string | null>(null)
  const [revisionText, setRevisionText] = useState('')

  // Line item builder modal
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [builderClient, setBuilderClient] = useState('')
  const [builderScope, setBuilderScope] = useState('')
  const [builderItems, setBuilderItems] = useState<LineCostItem[]>([
    { id: 'BLI-1', description: 'Site Excavation & Foundation Bedding', materialSubtotal: 350000, laborFactors: 150000, overheads: 50000, total: 550000 },
  ])

  const builderTotals = useMemo(() => {
    let mat = 0
    let lab = 0
    let ovh = 0
    let tot = 0
    builderItems.forEach(i => {
      const m = Number(i.materialSubtotal) || 0
      const l = Number(i.laborFactors) || 0
      const o = Number(i.overheads) || 0
      mat += m
      lab += l
      ovh += o
      tot += (m + l + o)
    })
    return { mat, lab, ovh, tot }
  }, [builderItems])

  const addBuilderLine = () => {
    setBuilderItems(prev => [
      ...prev,
      { id: `BLI-${Date.now()}`, description: 'New Scope Line Item', materialSubtotal: 100000, laborFactors: 50000, overheads: 20000, total: 170000 },
    ])
  }

  const updateBuilderLine = (id: string, field: keyof LineCostItem, val: any) => {
    setBuilderItems(prev => prev.map(item => {
      if (item.id !== id) return item
      const updated = { ...item, [field]: val }
      const m = Number(field === 'materialSubtotal' ? val : updated.materialSubtotal) || 0
      const l = Number(field === 'laborFactors' ? val : updated.laborFactors) || 0
      const o = Number(field === 'overheads' ? val : updated.overheads) || 0
      updated.total = m + l + o
      return updated
    }))
  }

  const removeBuilderLine = (id: string) => {
    if (builderItems.length <= 1) {
      alert('Estimate must contain at least one line item.')
      return
    }
    setBuilderItems(prev => prev.filter(i => i.id !== id))
  }

  const saveBuilderQuote = () => {
    if (!builderClient.trim() || !builderScope.trim()) {
      alert('Please enter Client Name and Project Scope')
      return
    }
    const newQuote: QuotationEntry = {
      id: `QT-${Math.floor(800 + Math.random() * 200)}`,
      quoteNumber: `REV-EST-2026-${Math.floor(50 + Math.random() * 50)}`,
      clientName: builderClient.trim(),
      projectScope: builderScope.trim(),
      items: builderItems,
      materialSubtotal: builderTotals.mat,
      laborFactors: builderTotals.lab,
      overheads: builderTotals.ovh,
      grandTotal: builderTotals.tot,
      status: 'Draft',
      dateDrafted: new Date().toISOString().slice(0, 10),
    }

    setQuotations(prev => [newQuote, ...prev])
    setIsBuilderOpen(false)
    setBuilderClient('')
    setBuilderScope('')
    setBuilderItems([{ id: `BLI-${Date.now()}`, description: 'Site Excavation & Foundation Bedding', materialSubtotal: 350000, laborFactors: 150000, overheads: 50000, total: 550000 }])
    notify(`Quotation ${newQuote.quoteNumber} drafted with PKR ${newQuote.grandTotal.toLocaleString()}!`)
  }

  const handleApproveQuote = (id: string) => {
    setQuotations(prev => prev.map(q => {
      if (q.id === id) {
        notify(`Quotation ${q.quoteNumber} Approved for Client Delivery!`)
        return { ...q, status: 'Approved for Client Delivery' }
      }
      return q
    }))
  }

  const handleSendBackRevision = (id: string) => {
    setActiveRevisionQuoteId(id)
    const quote = quotations.find(q => q.id === id)
    setRevisionText(quote?.revisionNotes || '')
  }

  const handleSaveRevisionNote = (id: string) => {
    setQuotations(prev => prev.map(q => {
      if (q.id === id) {
        notify(`Quotation ${q.quoteNumber} marked for Revision with comments.`)
        return { ...q, status: 'Revision Requested', revisionNotes: revisionText }
      }
      return q
    }))
    setActiveRevisionQuoteId(null)
    setRevisionText('')
  }

  const handleArchiveQuote = (id: string) => {
    setQuotations(prev => prev.map(q => {
      if (q.id === id) {
        notify(`Quotation ${q.quoteNumber} Archived.`)
        return { ...q, status: 'Archived' }
      }
      return q
    }))
  }

  // ---------------------------------------------------------------------------
  // 5. CONTRACTS & AGREEMENTS STATE & HANDLERS (with USD/PKR converter)
  // ---------------------------------------------------------------------------
  const [currencyMode, setCurrencyMode] = useState<'PKR' | 'USD'>('PKR')
  const USD_RATE = 278 // 1 USD = 278 PKR

  const [contractsList] = useState<LegalContractRecord[]>([
    {
      id: 'CTR-01',
      contractCode: 'REV-CNT-2026-01',
      projectName: 'Habib Metro Commercial Tower Basement & Plinth',
      investorGroup: 'Habib Consortium & Revoxen Syndication',
      executionMilestone: 'Substructure Poured & Waterproofed',
      retentionPct: 5.0,
      equitySharePct: 35.0,
      contractValuePKR: 47500000,
      approvalState: 'Executed',
    },
    {
      id: 'CTR-02',
      contractCode: 'REV-CNT-2026-02',
      projectName: 'Lucky Core Industrial Warehouse Fabrication',
      investorGroup: 'Lucky Core Ventures Asset Pool',
      executionMilestone: 'Portal Frames Erected & Sheeting',
      retentionPct: 7.5,
      equitySharePct: 20.0,
      contractValuePKR: 32000000,
      approvalState: 'Approved',
    },
    {
      id: 'CTR-03',
      contractCode: 'REV-CNT-2026-03',
      projectName: 'Al-Karam Textile Logistics Facility',
      investorGroup: 'Sindh Industrial Private Equity Group',
      executionMilestone: 'HVAC Ducting & Mezzanine Completion',
      retentionPct: 10.0,
      equitySharePct: 50.0,
      contractValuePKR: 68000000,
      approvalState: 'Under Review',
    },
    {
      id: 'CTR-04',
      contractCode: 'REV-CNT-2026-04',
      projectName: 'Defense Complex Boundary & Civil Walls',
      investorGroup: 'Defense Institutional Trust',
      executionMilestone: 'Boundary Wall 100% Brickwork',
      retentionPct: 5.0,
      equitySharePct: 15.0,
      contractValuePKR: 31500000,
      approvalState: 'Milestone Audit',
    },
  ])

  // Currency formatter
  const formatCurrency = (valPKR: number) => {
    if (currencyMode === 'USD') {
      const valUSD = valPKR / USD_RATE
      return `$${valUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    }
    return `PKR ${valPKR.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`
  }

  return (
    <div className="crm-scope">
      {/* ===================================================================== */}
      {/* 5 ACTIVE SUB-NAVIGATION LINKS (plus Master DB tab) */}
      {/* ===================================================================== */}
      <div className="crm-subnav-strip" role="tablist">
        <button
          className={`crm-subnav-tab ${activeTab === 'leads' ? 'active' : ''}`}
          onClick={() => setActiveTab('leads')}
          role="tab"
          aria-selected={activeTab === 'leads'}
        >
          <Users size={15} />
          <span>1. Leads & Inquiries</span>
          <span className="crm-tab-badge">{leadsState.length}</span>
        </button>

        <button
          className={`crm-subnav-tab ${activeTab === 'clients' ? 'active' : ''}`}
          onClick={() => setActiveTab('clients')}
          role="tab"
          aria-selected={activeTab === 'clients'}
        >
          <Building2 size={15} />
          <span>2. Client Management</span>
          <span className="crm-tab-badge">{clientLedger.length}</span>
        </button>

        <button
          className={`crm-subnav-tab ${activeTab === 'pipeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('pipeline')}
          role="tab"
          aria-selected={activeTab === 'pipeline'}
        >
          <Kanban size={15} />
          <span>3. Sales Pipeline</span>
          <span className="crm-tab-badge">{pipelineDeals.length}</span>
        </button>

        <button
          className={`crm-subnav-tab ${activeTab === 'quotations' ? 'active' : ''}`}
          onClick={() => setActiveTab('quotations')}
          role="tab"
          aria-selected={activeTab === 'quotations'}
        >
          <FileSpreadsheet size={15} />
          <span>4. Quotations & Proposals</span>
          <span className="crm-tab-badge">{quotations.length}</span>
        </button>

        <button
          className={`crm-subnav-tab ${activeTab === 'contracts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contracts')}
          role="tab"
          aria-selected={activeTab === 'contracts'}
        >
          <Scale size={15} />
          <span>5. Contracts & Agreements</span>
          <span className="crm-tab-badge">{contractsList.length}</span>
        </button>

        {rawTableComponent && (
          <button
            className={`crm-subnav-tab ${activeTab === 'master_register' ? 'active' : ''}`}
            onClick={() => setActiveTab('master_register')}
            role="tab"
            aria-selected={activeTab === 'master_register'}
            style={{ marginLeft: 'auto' }}
          >
            <Layers size={15} />
            <span>Master Database Register</span>
          </button>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 1. LEADS & INQUIRIES VIEW */}
      {/* ===================================================================== */}
      {activeTab === 'leads' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Top Analytical Grid Blocks */}
          <div className="crm-metrics-bar">
            <div className="crm-metric-box">
              <span className="crm-metric-label">Total Leads</span>
              <span className="crm-metric-num">{leadsMetrics.totalLeads}</span>
              <span className="crm-metric-hint">Active construction inquiries</span>
            </div>
            <div className="crm-metric-box green">
              <span className="crm-metric-label">Qualified Bids</span>
              <span className="crm-metric-num" style={{ color: '#059669' }}>
                {leadsMetrics.qualifiedBids}
              </span>
              <span className="crm-metric-hint">Conversion Rate: {leadsMetrics.conversionRate}%</span>
            </div>
            <div className="crm-metric-box dark">
              <span className="crm-metric-label">Projected Pipeline Value</span>
              <span className="crm-metric-num" style={{ color: '#b3202a' }}>
                PKR {leadsMetrics.totalValue.toLocaleString()}
              </span>
              <span className="crm-metric-hint">Weighted inquiry worth</span>
            </div>
          </div>

          {/* Section Header */}
          <div className="crm-header-row">
            <div className="crm-header-title">
              <h3>Lead Sourcing & Opportunity Register</h3>
              <p>Capture and qualify construction project inquiries across marketing and tender channels.</p>
            </div>
            <button className="crm-action-btn primary" onClick={() => setIsNewLeadModalOpen(true)}>
              <Plus size={14} />
              <span>+ New Lead</span>
            </button>
          </div>

          {/* Leads Data Table */}
          <div className="crm-table-container">
            <table className="crm-data-table">
              <thead>
                <tr>
                  <th>Lead ID</th>
                  <th>Client / Organization</th>
                  <th>Source Channel</th>
                  <th>Contact Details</th>
                  <th>Projected Value (PKR)</th>
                  <th>Date Logged</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leadsState.map(lead => (
                  <tr key={lead.id}>
                    <td><span className="crm-pill crm-pill-gray">{lead.id}</span></td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{lead.clientName}</td>
                    <td><span className="crm-pill crm-pill-blue">{lead.source}</span></td>
                    <td>
                      <div style={{ fontSize: '11px' }}>
                        <div>{lead.contactNumber}</div>
                        <div style={{ color: '#64748b' }}>{lead.email}</div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>PKR {lead.projectedValue.toLocaleString()}</td>
                    <td>{lead.date}</td>
                    <td>
                      <span className={`crm-pill ${
                        lead.status === 'Converted' ? 'crm-pill-green' :
                        lead.status === 'Bidding' ? 'crm-pill-amber' :
                        lead.status === 'Qualified' ? 'crm-pill-purple' : 'crm-pill-gray'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* "+ New Lead" Modal Form */}
          {isNewLeadModalOpen && (
            <div className="crm-modal-overlay" onClick={() => setIsNewLeadModalOpen(false)}>
              <div className="crm-modal-window" onClick={e => e.stopPropagation()}>
                <div className="crm-modal-top">
                  <h4>+ Add New Construction Lead</h4>
                  <button className="crm-action-btn" onClick={() => setIsNewLeadModalOpen(false)} style={{ padding: '3px 8px' }}>
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateLead}>
                  <div className="crm-modal-body">
                    <div className="crm-form-field">
                      <label>Client Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Al-Mansoor Mega Towers"
                        value={newLeadForm.clientName}
                        onChange={e => setNewLeadForm({ ...newLeadForm, clientName: e.target.value })}
                        required
                        autoFocus
                      />
                    </div>

                    <div className="crm-grid-2col">
                      <div className="crm-form-field">
                        <label>Lead Source Channel *</label>
                        <select
                          value={newLeadForm.source}
                          onChange={e => setNewLeadForm({ ...newLeadForm, source: e.target.value as LeadSource })}
                        >
                          <option value="Website">Website</option>
                          <option value="Tender">Tender</option>
                          <option value="Referral">Referral</option>
                          <option value="Paid Ad">Paid Ad</option>
                        </select>
                      </div>

                      <div className="crm-form-field">
                        <label>Projected Value (PKR)</label>
                        <input
                          type="number"
                          placeholder="e.g. 15000000"
                          value={newLeadForm.projectedValue}
                          onChange={e => setNewLeadForm({ ...newLeadForm, projectedValue: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="crm-grid-2col">
                      <div className="crm-form-field">
                        <label>Contact Number</label>
                        <input
                          type="tel"
                          placeholder="+92 300 1234567"
                          value={newLeadForm.contactNumber}
                          onChange={e => setNewLeadForm({ ...newLeadForm, contactNumber: e.target.value })}
                        />
                      </div>

                      <div className="crm-form-field">
                        <label>Email Address</label>
                        <input
                          type="email"
                          placeholder="client@domain.com"
                          value={newLeadForm.email}
                          onChange={e => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="crm-modal-foot">
                    <button type="button" className="crm-action-btn" onClick={() => setIsNewLeadModalOpen(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="crm-action-btn primary">
                      <Plus size={14} />
                      <span>Append New Lead</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. CLIENT MANAGEMENT VIEW */}
      {/* ===================================================================== */}
      {activeTab === 'clients' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Header with real-time text string search field */}
          <div className="crm-header-row">
            <div className="crm-header-title">
              <h3>Client Profiles & Database Ledger</h3>
              <p>Verified accounts, active construction site locations, and invoice billing history.</p>
            </div>
            <div className="crm-search-field">
              <Search size={14} color="#64748b" />
              <input
                type="text"
                placeholder="Search by Company Name or Client ID..."
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
              />
              {clientSearch && (
                <button
                  onClick={() => setClientSearch('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '11px' }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Interactive Client Table */}
          <div className="crm-table-container">
            <table className="crm-data-table">
              <thead>
                <tr>
                  <th>Client ID</th>
                  <th>Company Name</th>
                  <th>Main Contact Person</th>
                  <th>Contact Details</th>
                  <th>Active Sites</th>
                  <th>Total Invoiced Billing</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Row Item Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                      No clients found matching "{clientSearch}".
                    </td>
                  </tr>
                ) : (
                  filteredClients.map(client => (
                    <React.Fragment key={client.id}>
                      <tr style={{ background: client.isArchived ? '#f8fafc' : 'transparent', opacity: client.isArchived ? 0.75 : 1 }}>
                        <td><span className="crm-pill crm-pill-gray">{client.clientId}</span></td>
                        <td style={{ fontWeight: 600, color: '#0f172a' }}>
                          {client.companyName}
                          {client.isArchived && <span style={{ marginLeft: 6, fontSize: '10px', color: '#dc2626' }}>(Archived)</span>}
                        </td>
                        <td>{client.mainContact}</td>
                        <td>
                          <div style={{ fontSize: '11px' }}>
                            <div>{client.phone}</div>
                            <div style={{ color: '#64748b' }}>{client.email}</div>
                          </div>
                        </td>
                        <td>
                          <span className="crm-pill crm-pill-blue">
                            {client.activeSites} {client.activeSites === 1 ? 'Site' : 'Sites'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>
                          PKR {client.totalInvoicedBilling.toLocaleString()}
                        </td>
                        <td>
                          {client.isArchived ? (
                            <span className="crm-pill crm-pill-gray">Archived</span>
                          ) : (
                            <span className="crm-pill crm-pill-green">Active</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              className={`crm-action-btn ${viewHistoryClientId === client.id ? 'primary' : ''}`}
                              onClick={() => setViewHistoryClientId(viewHistoryClientId === client.id ? null : client.id)}
                            >
                              <Eye size={12} />
                              <span>{viewHistoryClientId === client.id ? 'Hide History' : 'View History'}</span>
                            </button>
                            <button
                              className={`crm-action-btn ${client.isArchived ? '' : 'danger'}`}
                              onClick={() => toggleArchiveClient(client.id)}
                            >
                              {client.isArchived ? <RotateCcw size={12} /> : <Archive size={12} />}
                              <span>{client.isArchived ? 'Restore' : 'Archive'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Sub-panel communication log history */}
                      {viewHistoryClientId === client.id && (
                        <tr>
                          <td colSpan={8} style={{ padding: 0 }}>
                            <div className="crm-comm-box">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong style={{ fontSize: '12px', color: '#0f172a' }}>
                                  Logged Communications Feed: {client.companyName}
                                </strong>
                                <span style={{ fontSize: '11px', color: '#64748b' }}>
                                  {client.communications.length} records on file
                                </span>
                              </div>

                              {/* Form to log note */}
                              <div style={{ display: 'flex', gap: 8 }}>
                                <select
                                  style={{ padding: '6px 8px', fontSize: '11.5px', border: '1px solid #cbd5e1', borderRadius: 4 }}
                                  value={newLogNote.channel}
                                  onChange={e => setNewLogNote({ ...newLogNote, channel: e.target.value })}
                                >
                                  <option value="Call">Phone Call</option>
                                  <option value="Email">Email</option>
                                  <option value="Site Visit">Site Visit</option>
                                  <option value="Meeting">Meeting</option>
                                </select>
                                <input
                                  type="text"
                                  placeholder="Log discussion notes, agreements or meeting minutes..."
                                  style={{ flex: 1, padding: '6px 10px', fontSize: '11.5px', border: '1px solid #cbd5e1', borderRadius: 4 }}
                                  value={newLogNote.note}
                                  onChange={e => setNewLogNote({ ...newLogNote, note: e.target.value })}
                                  onKeyDown={e => { if (e.key === 'Enter') handleAddCommunicationLog(client.id) }}
                                />
                                <button className="crm-action-btn primary" onClick={() => handleAddCommunicationLog(client.id)}>
                                  <Send size={12} />
                                  <span>Log Note</span>
                                </button>
                              </div>

                              {/* Timeline Entries */}
                              <div className="crm-comm-timeline">
                                {client.communications.length === 0 ? (
                                  <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8' }}>No communications recorded yet.</p>
                                ) : (
                                  client.communications.map(comm => (
                                    <div key={comm.id} className="crm-comm-entry">
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '10.5px' }}>
                                        <span className="crm-pill crm-pill-blue">{comm.channel}</span>
                                        <span style={{ color: '#64748b' }}>{comm.date}</span>
                                        <span style={{ fontWeight: 600, color: '#334155' }}>· {comm.officer}</span>
                                      </div>
                                      <div style={{ fontSize: '11.5px', color: '#1e293b' }}>{comm.note}</div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. SALES PIPELINE VIEW */}
      {/* ===================================================================== */}
      {activeTab === 'pipeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Header with live running sum formula widget */}
          <div className="crm-header-row">
            <div className="crm-header-title">
              <h3>Bidding & Tender Management Pipeline</h3>
              <p>Multi-stage workflow tracker for public and private construction bids.</p>
            </div>
            <div className="crm-running-sum-widget">
              <span className="lbl">Total Expected Deal Value:</span>
              <span className="val">PKR {totalExpectedDealValue.toLocaleString()}</span>
              <span className="crm-pill crm-pill-gray" style={{ background: '#ffffff' }}>
                {pipelineDeals.length} Active Deals
              </span>
            </div>
          </div>

          {/* 4-Stage Workflow Board */}
          <div className="crm-board-grid">
            {stages.map((stg, stgIdx) => {
              const dealsInStage = pipelineDeals.filter(d => d.stage === stg)
              const stageSum = dealsInStage.reduce((acc, d) => acc + (Number(d.expectedValue) || 0), 0)

              return (
                <div key={stg} className="crm-board-col">
                  <div className="crm-col-head">
                    <span className="crm-col-name">{stg}</span>
                    <span className="crm-col-badge">{dealsInStage.length}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                    PKR {stageSum.toLocaleString()}
                  </div>

                  {dealsInStage.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 8px', fontSize: '11px', color: '#94a3b8' }}>
                      No tenders in this stage
                    </div>
                  ) : (
                    dealsInStage.map(deal => (
                      <div key={deal.id} className="crm-item-card">
                        <div className="crm-item-head">
                          <span className="crm-pill crm-pill-gray">{deal.tenderId}</span>
                          <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#059669' }}>
                            {deal.probability}% Win Prob
                          </span>
                        </div>
                        <div className="crm-item-title">{deal.projectName}</div>
                        <div className="crm-item-client">{deal.clientName}</div>

                        <div className="crm-item-val">
                          PKR {deal.expectedValue.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                          Due Date: {deal.deadline}
                        </div>

                        {/* Functional next/prev action controllers */}
                        <div className="crm-item-actions">
                          <button
                            className="crm-action-btn"
                            style={{ padding: '3px 8px', fontSize: '10.5px' }}
                            disabled={stgIdx === 0}
                            onClick={() => shiftPipelineStage(deal.id, 'prev')}
                            title="Move to previous stage"
                          >
                            <ArrowLeft size={11} />
                            <span>Prev</span>
                          </button>
                          <button
                            className="crm-action-btn"
                            style={{ padding: '3px 8px', fontSize: '10.5px' }}
                            disabled={stgIdx === stages.length - 1}
                            onClick={() => shiftPipelineStage(deal.id, 'next')}
                            title="Advance to next stage"
                          >
                            <span>Next</span>
                            <ArrowRight size={11} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. QUOTATIONS & PROPOSALS VIEW */}
      {/* ===================================================================== */}
      {activeTab === 'quotations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="crm-header-row">
            <div className="crm-header-title">
              <h3>Estimation & Proposal Pipeline</h3>
              <p>Line-item cost builder, bill of quantities, and client delivery authorization.</p>
            </div>
            <button className="crm-action-btn primary" onClick={() => setIsBuilderOpen(true)}>
              <Plus size={14} />
              <span>+ Build New Estimate</span>
            </button>
          </div>

          {/* Reactive Line-Item Builder Modal */}
          {isBuilderOpen && (
            <div className="crm-builder-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                  BoQ Estimation Line-Item Builder Engine
                </strong>
                <button className="crm-action-btn" onClick={() => setIsBuilderOpen(false)} style={{ padding: '3px 8px' }}>
                  ✕ Close
                </button>
              </div>

              <div className="crm-grid-2col">
                <div className="crm-form-field">
                  <label>Client Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Al-Baqir Commercial Group"
                    value={builderClient}
                    onChange={e => setBuilderClient(e.target.value)}
                  />
                </div>
                <div className="crm-form-field">
                  <label>Project Scope Description *</label>
                  <input
                    type="text"
                    placeholder="e.g. Foundation Excavation & Shuttering"
                    value={builderScope}
                    onChange={e => setBuilderScope(e.target.value)}
                  />
                </div>
              </div>

              {/* Items Table */}
              <table className="crm-data-table" style={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th style={{ width: '150px' }}>Material Subtotal (PKR)</th>
                    <th style={{ width: '150px' }}>Labor Factors (PKR)</th>
                    <th style={{ width: '130px' }}>Overheads (PKR)</th>
                    <th style={{ width: '150px' }}>Reactive Line Total</th>
                    <th style={{ width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {builderItems.map(item => (
                    <tr key={item.id}>
                      <td>
                        <input
                          type="text"
                          style={{ width: '100%', padding: '5px 8px', fontSize: '11.5px', border: '1px solid #cbd5e1', borderRadius: 3 }}
                          value={item.description}
                          onChange={e => updateBuilderLine(item.id, 'description', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          style={{ width: '100%', padding: '5px 8px', fontSize: '11.5px', border: '1px solid #cbd5e1', borderRadius: 3 }}
                          value={item.materialSubtotal}
                          onChange={e => updateBuilderLine(item.id, 'materialSubtotal', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          style={{ width: '100%', padding: '5px 8px', fontSize: '11.5px', border: '1px solid #cbd5e1', borderRadius: 3 }}
                          value={item.laborFactors}
                          onChange={e => updateBuilderLine(item.id, 'laborFactors', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          style={{ width: '100%', padding: '5px 8px', fontSize: '11.5px', border: '1px solid #cbd5e1', borderRadius: 3 }}
                          value={item.overheads}
                          onChange={e => updateBuilderLine(item.id, 'overheads', e.target.value)}
                        />
                      </td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>
                        PKR {item.total.toLocaleString()}
                      </td>
                      <td>
                        <button
                          className="crm-action-btn danger"
                          style={{ padding: '3px 6px' }}
                          onClick={() => removeBuilderLine(item.id)}
                          title="Remove Line"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Reactive Engine Summary */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 14px', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                <button className="crm-action-btn" onClick={addBuilderLine}>
                  <Plus size={12} />
                  <span>+ Append Cost Item</span>
                </button>

                <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: '11.5px' }}>
                  <span>Material: <strong>PKR {builderTotals.mat.toLocaleString()}</strong></span>
                  <span>Labor: <strong>PKR {builderTotals.lab.toLocaleString()}</strong></span>
                  <span>Overheads: <strong>PKR {builderTotals.ovh.toLocaleString()}</strong></span>
                  <span style={{ fontSize: '13px', color: '#b3202a', fontWeight: 800 }}>
                    Reactive Grand Total: PKR {builderTotals.tot.toLocaleString()}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="crm-action-btn" onClick={() => setIsBuilderOpen(false)}>
                  Cancel
                </button>
                <button className="crm-action-btn primary" onClick={saveBuilderQuote}>
                  <CheckCircle2 size={13} />
                  <span>Save Estimate</span>
                </button>
              </div>
            </div>
          )}

          {/* Quotations Master Table */}
          <div className="crm-table-container">
            <table className="crm-data-table">
              <thead>
                <tr>
                  <th>Quote Ref</th>
                  <th>Client Name</th>
                  <th>Project Scope</th>
                  <th>Material Subtotal</th>
                  <th>Labor Factors</th>
                  <th>Overheads</th>
                  <th>Grand Total (PKR)</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action Controls</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map(quote => (
                  <React.Fragment key={quote.id}>
                    <tr>
                      <td><span className="crm-pill crm-pill-gray">{quote.quoteNumber}</span></td>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{quote.clientName}</td>
                      <td style={{ maxWidth: '220px' }}>{quote.projectScope}</td>
                      <td>PKR {quote.materialSubtotal.toLocaleString()}</td>
                      <td>PKR {quote.laborFactors.toLocaleString()}</td>
                      <td>PKR {quote.overheads.toLocaleString()}</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>PKR {quote.grandTotal.toLocaleString()}</td>
                      <td>
                        <span className={`crm-pill ${
                          quote.status === 'Approved for Client Delivery' ? 'crm-pill-green' :
                          quote.status === 'Revision Requested' ? 'crm-pill-amber' :
                          quote.status === 'Archived' ? 'crm-pill-gray' : 'crm-pill-blue'
                        }`}>
                          {quote.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          {/* 1. Approve for Client Delivery */}
                          <button
                            className="crm-action-btn"
                            style={{ color: '#059669', borderColor: '#a7f3d0' }}
                            disabled={quote.status === 'Approved for Client Delivery'}
                            onClick={() => handleApproveQuote(quote.id)}
                            title="Approve for Client Delivery"
                          >
                            <CheckCircle2 size={12} />
                            <span>Approve</span>
                          </button>

                          {/* 2. Send Back for Revision */}
                          <button
                            className="crm-action-btn"
                            style={{ color: '#b45309', borderColor: '#fde68a' }}
                            onClick={() => handleSendBackRevision(quote.id)}
                            title="Send Back for Revision"
                          >
                            <Edit3 size={12} />
                            <span>Revise</span>
                          </button>

                          {/* 3. Archive */}
                          <button
                            className="crm-action-btn danger"
                            onClick={() => handleArchiveQuote(quote.id)}
                            title="Archive Quote"
                          >
                            <Archive size={12} />
                            <span>Archive</span>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Conditional layout check: renders textarea when "Send Back for Revision" is clicked */}
                    {activeRevisionQuoteId === quote.id && (
                      <tr>
                        <td colSpan={9} style={{ background: '#fffbeb', padding: '12px 18px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <strong style={{ fontSize: '12px', color: '#92400e' }}>
                              Revision Feedback & Amendments Note for {quote.quoteNumber}:
                            </strong>
                            <textarea
                              className="crm-revision-textarea"
                              rows={2}
                              placeholder="Detail required quantity adjustments, labor rate recalculations, or client comments..."
                              value={revisionText}
                              onChange={e => setRevisionText(e.target.value)}
                              autoFocus
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                              <button
                                className="crm-action-btn"
                                onClick={() => setActiveRevisionQuoteId(null)}
                              >
                                Cancel
                              </button>
                              <button
                                className="crm-action-btn primary"
                                style={{ background: '#b45309', borderColor: '#b45309' }}
                                onClick={() => handleSaveRevisionNote(quote.id)}
                              >
                                Submit Revision Request
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. CONTRACTS & AGREEMENTS VIEW */}
      {/* ===================================================================== */}
      {activeTab === 'contracts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Header with Currency Conversion Flag Handler Button (USD / PKR Toggle) */}
          <div className="crm-header-row">
            <div className="crm-header-title">
              <h3>Legal Contracts & Investor Pool Ledger</h3>
              <p>Milestone execution tracking, retention agreements, and equity participation matrix.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Currency Conversion:</span>
              <div className="crm-currency-toggle">
                <button
                  className={`crm-cur-btn ${currencyMode === 'PKR' ? 'active' : ''}`}
                  onClick={() => setCurrencyMode('PKR')}
                >
                  PKR
                </button>
                <button
                  className={`crm-cur-btn ${currencyMode === 'USD' ? 'active' : ''}`}
                  onClick={() => setCurrencyMode('USD')}
                >
                  USD ($)
                </button>
              </div>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>(1 USD = 278 PKR)</span>
            </div>
          </div>

          {/* Secure Legal Matrix Table */}
          <div className="crm-table-container">
            <table className="crm-data-table">
              <thead>
                <tr>
                  <th>Contract Code</th>
                  <th>Project Name</th>
                  <th>Investor / Client Group Name</th>
                  <th>Execution Milestones</th>
                  <th>Retentions (%)</th>
                  <th>Equity Share (%)</th>
                  <th>Contract Value ({currencyMode})</th>
                  <th>Approval State</th>
                </tr>
              </thead>
              <tbody>
                {contractsList.map(contract => (
                  <tr key={contract.id}>
                    <td><span className="crm-pill crm-pill-gray">{contract.contractCode}</span></td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{contract.projectName}</td>
                    <td>{contract.investorGroup}</td>
                    <td>
                      <span className="crm-pill crm-pill-blue">
                        {contract.executionMilestone}
                      </span>
                    </td>
                    <td>
                      <span className="crm-pill crm-pill-purple">
                        {contract.retentionPct.toFixed(1)}% Retention
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#047857' }}>
                      {contract.equitySharePct.toFixed(1)}% Share
                    </td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>
                      {formatCurrency(contract.contractValuePKR)}
                    </td>
                    <td>
                      <span className={`crm-pill ${
                        contract.approvalState === 'Executed' ? 'crm-pill-green' :
                        contract.approvalState === 'Approved' ? 'crm-pill-blue' :
                        contract.approvalState === 'Milestone Audit' ? 'crm-pill-amber' : 'crm-pill-gray'
                      }`}>
                        {contract.approvalState}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* OPTIONAL MASTER DATABASE REGISTER (Module Table with 10 Action Buttons) */}
      {/* ===================================================================== */}
      {activeTab === 'master_register' && rawTableComponent && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="crm-header-row">
            <div className="crm-header-title">
              <h3>Master Database Register</h3>
              <p>Raw leads database records with bulk actions: Add, Edit, Delete, Select All, Copy, Print, Share, PDF Download, and Save.</p>
            </div>
          </div>
          {rawTableComponent}
        </div>
      )}
    </div>
  )
}
