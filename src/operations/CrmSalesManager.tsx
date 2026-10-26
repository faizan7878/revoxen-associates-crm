import React, { useState, useMemo } from 'react'
import {
  Users, Building2, Kanban, FileSpreadsheet, Scale, Plus, Search,
  CheckCircle2, XCircle, ArrowRight, ArrowLeft, RefreshCw, FileText,
  Clock, ShieldAlert, Layers, ChevronDown, ChevronRight, Phone, Mail,
  MapPin, DollarSign, Send, Archive, RotateCcw, AlertTriangle, Eye
} from 'lucide-react'
import './crm-sales.css'

export interface CrmSalesManagerProps {
  canEdit?: boolean
  companyLeads?: any[]
  onRefresh?: () => void
  onNotify?: (msg: string) => void
  rawTableComponent?: React.ReactNode
}

// 1. Leads & Inquiries Models
interface LeadItem {
  id: string
  clientName: string
  source: string
  contact: string
  email: string
  estValue: number
  status: 'New' | 'Contacted' | 'Qualified' | 'Proposal Sent' | 'Converted' | 'Lost'
  dateAdded: string
  notes?: string
}

// 2. Client Management Models
interface ClientProfile {
  id: string
  clientId: string
  companyName: string
  mainContact: string
  phone: string
  email: string
  activeSites: number
  totalInvoicedBilling: number
  isArchived: boolean
  communications: { id: string; date: string; channel: 'Call' | 'Email' | 'Site Visit' | 'Meeting'; notes: string; agent: string }[]
}

// 3. Sales Pipeline Models
type PipelineStage = 'Sourced' | 'In-Progress' | 'Submitted' | 'Negotiation'
interface PipelineDeal {
  id: string
  tenderId: string
  projectName: string
  client: string
  stage: PipelineStage
  expectedValue: number
  closingDate: string
  probability: number
}

// 4. Quotations & Proposals Models
interface LineCostItem {
  id: string
  description: string
  materialSubtotal: number
  laborFactors: number
  overheadsPercent: number
  total: number
}

interface QuotationDraft {
  id: string
  quoteNumber: string
  clientName: string
  projectScope: string
  dateDrafted: string
  items: LineCostItem[]
  materialTotal: number
  laborTotal: number
  overheadTotal: number
  grandTotal: number
  status: 'Draft' | 'Approved for Client Delivery' | 'Rejected / Revise'
  locked: boolean
}

// 5. Contracts & Agreements Models
interface ContractRevision {
  id: string
  version: string
  date: string
  revisedBy: string
  clauseChanged: string
  amendmentValue: number
  notes: string
}

interface ContractAgreement {
  id: string
  contractCode: string
  projectName: string
  clientName: string
  executionDate: string
  retentionClausesPct: number
  baseValue: number
  currentValue: number
  legalApprovalStatus: 'Approved' | 'Pending Legal' | 'Under Review' | 'Addendum Executed'
  revisions: ContractRevision[]
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
  const [leadsState, setLeadsState] = useState<LeadItem[]>([
    { id: 'LD-101', clientName: 'Habib Metro Construction', source: 'Tender Portal', contact: '+92 300 2345678', email: 'habib@hmc-pk.com', estValue: 14500000, status: 'Qualified', dateAdded: '2026-10-14' },
    { id: 'LD-102', clientName: 'Bahria Town Luxury Villas', source: 'Referral', contact: '+92 321 8899112', email: 'procurement@bahriatowngroup.com', estValue: 28000000, status: 'Converted', dateAdded: '2026-10-18' },
    { id: 'LD-103', clientName: 'Lucky One Plaza Mall Fitout', source: 'Website', contact: '+92 333 4455667', email: 'tenders@luckyone.com.pk', estValue: 9200000, status: 'Proposal Sent', dateAdded: '2026-10-21' },
    { id: 'LD-104', clientName: 'Al-Karam Textile Warehouse', source: 'Paid Ad', contact: '+92 301 7766554', email: 'engineering@alkaram.com', estValue: 34000000, status: 'New', dateAdded: '2026-10-24' },
    { id: 'LD-105', clientName: 'Engro Polymers Site Office', source: 'Referral', contact: '+92 312 9988776', email: 'projects@engro-pk.com', estValue: 6500000, status: 'Contacted', dateAdded: '2026-10-25' },
  ])

  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false)
  const [newLeadForm, setNewLeadForm] = useState({
    clientName: '',
    source: 'Tender Portal',
    contact: '',
    email: '',
    estValue: '',
  })

  // Instant metric recalculation for Leads
  const leadsMetrics = useMemo(() => {
    const totalLeads = leadsState.length
    const converted = leadsState.filter(l => l.status === 'Converted').length
    const conversionRate = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : '0.0'
    const projectedPipelineValue = leadsState.reduce((sum, l) => sum + (Number(l.estValue) || 0), 0)
    return { totalLeads, conversionRate, projectedPipelineValue }
  }, [leadsState])

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLeadForm.clientName.trim()) {
      alert('Please enter a Client Name')
      return
    }
    const newLead: LeadItem = {
      id: `LD-${Math.floor(100 + Math.random() * 900)}`,
      clientName: newLeadForm.clientName.trim(),
      source: newLeadForm.source,
      contact: newLeadForm.contact.trim() || '—',
      email: newLeadForm.email.trim() || '—',
      estValue: Number(newLeadForm.estValue) || 0,
      status: 'New',
      dateAdded: new Date().toISOString().slice(0, 10),
    }

    setLeadsState(prev => [newLead, ...prev])
    setIsNewLeadModalOpen(false)
    setNewLeadForm({ clientName: '', source: 'Tender Portal', contact: '', email: '', estValue: '' })
    notify(`New Lead ${newLead.id} (${newLead.clientName}) safely appended to register!`)
  }

  // ---------------------------------------------------------------------------
  // 2. CLIENT MANAGEMENT STATE & HANDLERS
  // ---------------------------------------------------------------------------
  const [clientList, setClientList] = useState<ClientProfile[]>([
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
        { id: 'COMM-1', date: '2026-10-22', channel: 'Meeting', notes: 'Discussed foundation pile testing report. Client requested advance schedule.', agent: 'Faizan (Director Operations)' },
        { id: 'COMM-2', date: '2026-10-18', channel: 'Call', notes: 'Followed up on IPC #04 certificate signoff. Awaiting internal audit.', agent: 'Accountant' },
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
        { id: 'COMM-3', date: '2026-10-24', channel: 'Site Visit', notes: 'Joint site inspection at Site B. Concrete pour approved without defect.', agent: 'Lead Site Engineer' },
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
        { id: 'COMM-4', date: '2026-10-15', channel: 'Email', notes: 'Sent draft quotation for mezzanine steel extension structure.', agent: 'Estimator' },
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
        { id: 'COMM-5', date: '2026-08-10', channel: 'Meeting', notes: 'Handover complete. Retention warranty period ongoing.', agent: 'Legal Counsel' },
      ],
    },
  ])

  const [clientSearchString, setClientSearchString] = useState('')
  const [activeHistoryClientId, setActiveHistoryClientId] = useState<string | null>(null)
  const [newCommNote, setNewCommNote] = useState({ channel: 'Call' as const, notes: '' })

  const filteredClients = useMemo(() => {
    const q = clientSearchString.toLowerCase().trim()
    return clientList.filter(c => {
      const matchSearch = !q || c.companyName.toLowerCase().includes(q) || c.clientId.toLowerCase().includes(q) || c.mainContact.toLowerCase().includes(q)
      return matchSearch
    })
  }, [clientList, clientSearchString])

  const toggleArchiveClient = (clientId: string) => {
    setClientList(prev => prev.map(c => {
      if (c.id === clientId) {
        const nextState = !c.isArchived
        notify(`Client ${c.companyName} is now ${nextState ? 'Archived' : 'Active'}.`)
        return { ...c, isArchived: nextState }
      }
      return c
    }))
  }

  const handleAddCommunication = (clientId: string) => {
    if (!newCommNote.notes.trim()) return
    const commItem = {
      id: `COMM-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      channel: newCommNote.channel,
      notes: newCommNote.notes.trim(),
      agent: 'Active User',
    }
    setClientList(prev => prev.map(c => {
      if (c.id === clientId) {
        return { ...c, communications: [commItem, ...c.communications] }
      }
      return c
    }))
    setNewCommNote({ channel: 'Call', notes: '' })
    notify('Logged new communication note to client ledger.')
  }

  // ---------------------------------------------------------------------------
  // 3. SALES PIPELINE STATE & HANDLERS
  // ---------------------------------------------------------------------------
  const pipelineStages: PipelineStage[] = ['Sourced', 'In-Progress', 'Submitted', 'Negotiation']

  const [pipelineDeals, setPipelineDeals] = useState<PipelineDeal[]>([
    { id: 'PL-301', tenderId: 'TND-2026-08', projectName: 'Port Qasim Fuel Terminal Works', client: 'Qasim Energy Ltd', stage: 'Sourced', expectedValue: 48000000, closingDate: '2026-11-20', probability: 35 },
    { id: 'PL-302', tenderId: 'TND-2026-11', projectName: 'Defense Complex Boundary & Civil Walls', client: 'Naval Housing Auth', stage: 'In-Progress', expectedValue: 31500000, closingDate: '2026-11-10', probability: 55 },
    { id: 'PL-303', tenderId: 'TND-2026-15', projectName: 'North Karachi Industrial Substation', client: 'K-Electric Subcontractor', stage: 'Submitted', expectedValue: 19800000, closingDate: '2026-11-05', probability: 75 },
    { id: 'PL-304', tenderId: 'TND-2026-04', projectName: 'Gulberg Executive Offices Renovation', client: 'Gulberg Developers', stage: 'Negotiation', expectedValue: 15400000, closingDate: '2026-10-31', probability: 90 },
    { id: 'PL-305', tenderId: 'TND-2026-19', projectName: 'Clifton Beachside Pavilion Steel Piling', client: 'Metropolitan Corp', stage: 'In-Progress', expectedValue: 56000000, closingDate: '2026-12-15', probability: 50 },
  ])

  // Live running sum of Total Expected Deal Value
  const totalExpectedDealValue = useMemo(() => {
    return pipelineDeals.reduce((sum, item) => sum + (Number(item.expectedValue) || 0), 0)
  }, [pipelineDeals])

  const movePipelineDeal = (dealId: string, direction: 'prev' | 'next') => {
    setPipelineDeals(prev => prev.map(deal => {
      if (deal.id !== dealId) return deal
      const currentIndex = pipelineStages.indexOf(deal.stage)
      const nextIndex = direction === 'next'
        ? Math.min(currentIndex + 1, pipelineStages.length - 1)
        : Math.max(currentIndex - 1, 0)
      const newStage = pipelineStages[nextIndex]
      if (newStage !== deal.stage) {
        notify(`Tender ${deal.tenderId} moved to stage: ${newStage}`)
      }
      return { ...deal, stage: newStage }
    }))
  }

  // ---------------------------------------------------------------------------
  // 4. QUOTATIONS & PROPOSALS STATE & HANDLERS
  // ---------------------------------------------------------------------------
  const [quotationsList, setQuotationsList] = useState<QuotationDraft[]>([
    {
      id: 'QT-901',
      quoteNumber: 'REV-EST-2026-44',
      clientName: 'Habib Metro Construction',
      projectScope: 'Basement Poured Concrete & Reinforced Retaining Walls',
      dateDrafted: '2026-10-22',
      items: [
        { id: 'LI-1', description: 'Grade 60 Deformed Rebar Steel Reinforcement (Ton)', materialSubtotal: 4500000, laborFactors: 850000, overheadsPercent: 12, total: 5992000 },
        { id: 'LI-2', description: 'Class A Ready-Mix Concrete 3000 PSI with Pumping', materialSubtotal: 3200000, laborFactors: 600000, overheadsPercent: 10, total: 4180000 },
        { id: 'LI-3', description: 'Heavy Duty Steel Shuttering & Scaffolding System', materialSubtotal: 1100000, laborFactors: 450000, overheadsPercent: 15, total: 1782500 },
      ],
      materialTotal: 8800000,
      laborTotal: 1900000,
      overheadTotal: 1254500,
      grandTotal: 11954500,
      status: 'Approved for Client Delivery',
      locked: true,
    },
    {
      id: 'QT-902',
      quoteNumber: 'REV-EST-2026-49',
      clientName: 'Lucky Core Ventures',
      projectScope: 'Structural Steel Portal Frames & Pre-Engineered Trusses',
      dateDrafted: '2026-10-25',
      items: [
        { id: 'LI-4', description: 'Fabrication of MS Universal Beams & Columns', materialSubtotal: 6200000, laborFactors: 1400000, overheadsPercent: 15, total: 8740000 },
        { id: 'LI-5', description: 'High-Tensile Anchor Bolts and Base Plate Assemblies', materialSubtotal: 950000, laborFactors: 280000, overheadsPercent: 12, total: 1377600 },
      ],
      materialTotal: 7150000,
      laborTotal: 1680000,
      overheadTotal: 1287600,
      grandTotal: 10117600,
      status: 'Draft',
      locked: false,
    },
  ])

  // Line Item Builder Form state for creating a new quotation draft
  const [isNewQuoteOpen, setIsNewQuoteOpen] = useState(false)
  const [quoteClient, setQuoteClient] = useState('')
  const [quoteScope, setQuoteScope] = useState('')
  const [draftLineItems, setDraftLineItems] = useState<LineCostItem[]>([
    { id: 'DLI-1', description: 'Site Excavation & Backfilling', materialSubtotal: 350000, laborFactors: 200000, overheadsPercent: 10, total: 605000 },
  ])

  const draftTotals = useMemo(() => {
    let mat = 0
    let lab = 0
    let ovh = 0
    let total = 0
    draftLineItems.forEach(i => {
      mat += Number(i.materialSubtotal) || 0
      lab += Number(i.laborFactors) || 0
      const sub = (Number(i.materialSubtotal) || 0) + (Number(i.laborFactors) || 0)
      const lineOvh = (sub * (Number(i.overheadsPercent) || 0)) / 100
      ovh += lineOvh
      total += sub + lineOvh
    })
    return { mat, lab, ovh, total }
  }, [draftLineItems])

  const handleAddDraftLineItem = () => {
    const newItem: LineCostItem = {
      id: `DLI-${Date.now()}`,
      description: 'New Bill of Quantity Scope Item',
      materialSubtotal: 100000,
      laborFactors: 50000,
      overheadsPercent: 12,
      total: 168000,
    }
    setDraftLineItems(prev => [...prev, newItem])
  }

  const handleUpdateDraftLineItem = (id: string, field: keyof LineCostItem, value: any) => {
    setDraftLineItems(prev => prev.map(item => {
      if (item.id !== id) return item
      const updated = { ...item, [field]: value }
      const mat = Number(field === 'materialSubtotal' ? value : updated.materialSubtotal) || 0
      const lab = Number(field === 'laborFactors' ? value : updated.laborFactors) || 0
      const ovhPct = Number(field === 'overheadsPercent' ? value : updated.overheadsPercent) || 0
      const sub = mat + lab
      const lineOvh = (sub * ovhPct) / 100
      updated.total = sub + lineOvh
      return updated
    }))
  }

  const handleRemoveDraftLineItem = (id: string) => {
    if (draftLineItems.length <= 1) {
      alert('Estimate must contain at least one line-item.')
      return
    }
    setDraftLineItems(prev => prev.filter(i => i.id !== id))
  }

  const handleSaveQuotationDraft = () => {
    if (!quoteClient.trim() || !quoteScope.trim()) {
      alert('Please enter Client Name and Project Scope')
      return
    }
    const newQuote: QuotationDraft = {
      id: `QT-${Math.floor(100 + Math.random() * 900)}`,
      quoteNumber: `REV-EST-2026-${Math.floor(50 + Math.random() * 50)}`,
      clientName: quoteClient.trim(),
      projectScope: quoteScope.trim(),
      dateDrafted: new Date().toISOString().slice(0, 10),
      items: draftLineItems,
      materialTotal: draftTotals.mat,
      laborTotal: draftTotals.lab,
      overheadTotal: draftTotals.ovh,
      grandTotal: draftTotals.total,
      status: 'Draft',
      locked: false,
    }
    setQuotationsList(prev => [newQuote, ...prev])
    setIsNewQuoteOpen(false)
    setQuoteClient('')
    setQuoteScope('')
    setDraftLineItems([{ id: `DLI-${Date.now()}`, description: 'Site Excavation & Backfilling', materialSubtotal: 350000, laborFactors: 200000, overheadsPercent: 10, total: 605000 }])
    notify(`Quotation ${newQuote.quoteNumber} drafted successfully with PKR ${newQuote.grandTotal.toLocaleString()}!`)
  }

  const handleApproveQuotation = (quoteId: string) => {
    setQuotationsList(prev => prev.map(q => {
      if (q.id === quoteId) {
        notify(`Quotation ${q.quoteNumber} is Approved for Client Delivery. Editing locked.`)
        return { ...q, status: 'Approved for Client Delivery', locked: true }
      }
      return q
    }))
  }

  const handleRejectQuotation = (quoteId: string) => {
    setQuotationsList(prev => prev.map(q => {
      if (q.id === quoteId) {
        notify(`Quotation ${q.quoteNumber} marked for Revision. Editing unlocked.`)
        return { ...q, status: 'Rejected / Revise', locked: false }
      }
      return q
    }))
  }

  // ---------------------------------------------------------------------------
  // 5. CONTRACTS & AGREEMENTS STATE & HANDLERS
  // ---------------------------------------------------------------------------
  const [contractsList, setContractsList] = useState<ContractAgreement[]>([
    {
      id: 'CTR-01',
      contractCode: 'REV-CNT-2026-01',
      projectName: 'Habib Metro Commercial Tower Basement & Plinth',
      clientName: 'Habib Metro Construction',
      executionDate: '2026-08-15',
      retentionClausesPct: 5.0,
      baseValue: 45000000,
      currentValue: 47500000,
      legalApprovalStatus: 'Addendum Executed',
      revisions: [
        {
          id: 'REV-1',
          version: 'Rev-01',
          date: '2026-09-20',
          revisedBy: 'Barrister Zafar (Legal Advisor)',
          clauseChanged: 'Clause 14.2: Extension of deep dewatering boundary',
          amendmentValue: 2500000,
          notes: 'Added additional diesel pump dewatering sets due to monsoon canal overflow.',
        },
      ],
    },
    {
      id: 'CTR-02',
      contractCode: 'REV-CNT-2026-02',
      projectName: 'Lucky Core Industrial Warehouse Fabrication',
      clientName: 'Lucky Core Ventures',
      executionDate: '2026-09-01',
      retentionClausesPct: 7.5,
      baseValue: 32000000,
      currentValue: 32000000,
      legalApprovalStatus: 'Approved',
      revisions: [],
    },
    {
      id: 'CTR-03',
      contractCode: 'REV-CNT-2026-03',
      projectName: 'Al-Karam Textile Logistics Facility',
      clientName: 'Al-Karam Warehousing Corp',
      executionDate: '2026-10-10',
      retentionClausesPct: 10.0,
      baseValue: 68000000,
      currentValue: 68000000,
      legalApprovalStatus: 'Under Review',
      revisions: [],
    },
  ])

  const [expandedContractIds, setExpandedContractIds] = useState<Set<string>>(new Set(['CTR-01']))
  const [activeAddendumContractId, setActiveAddendumContractId] = useState<string | null>(null)
  const [addendumForm, setAddendumForm] = useState({
    clauseChanged: '',
    amendmentValue: '',
    revisedBy: 'Faizan (Legal / Contracts Head)',
    notes: '',
  })

  const toggleContractExpansion = (id: string) => {
    setExpandedContractIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleGenerateAddendum = (contractId: string) => {
    if (!addendumForm.clauseChanged.trim()) {
      alert('Please specify the Clause or Scope modified')
      return
    }
    const amendmentVal = Number(addendumForm.amendmentValue) || 0
    const newRevision: ContractRevision = {
      id: `REV-${Date.now()}`,
      version: `Rev-${String(Math.floor(10 + Math.random() * 90))}`,
      date: new Date().toISOString().slice(0, 10),
      revisedBy: addendumForm.revisedBy || 'Legal Department',
      clauseChanged: addendumForm.clauseChanged.trim(),
      amendmentValue: amendmentVal,
      notes: addendumForm.notes.trim() || 'Legally executed addendum.',
    }

    setContractsList(prev => prev.map(c => {
      if (c.id === contractId) {
        const updatedVal = c.currentValue + amendmentVal
        return {
          ...c,
          currentValue: updatedVal,
          legalApprovalStatus: 'Addendum Executed',
          revisions: [newRevision, ...c.revisions],
        }
      }
      return c
    }))

    // Expand the contract row so user sees new addendum
    setExpandedContractIds(prev => new Set(prev).add(contractId))
    setActiveAddendumContractId(null)
    setAddendumForm({ clauseChanged: '', amendmentValue: '', revisedBy: 'Faizan (Legal / Contracts Head)', notes: '' })
    notify(`Addendum logged successfully! Contract value updated by PKR ${amendmentVal.toLocaleString()}`)
  }

  // Format currency in PKR
  const formatPKR = (amt: number) => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(amt || 0)
  }

  return (
    <div className="crm-container">
      {/* ===================================================================== */}
      {/* 5 ACTIVE SUB-NAVIGATION LINKS (plus Master DB tab) */}
      {/* ===================================================================== */}
      <div className="crm-subnav-bar" role="tablist">
        <button
          className={`crm-subnav-btn ${activeTab === 'leads' ? 'active' : ''}`}
          onClick={() => setActiveTab('leads')}
          role="tab"
          aria-selected={activeTab === 'leads'}
        >
          <Users size={15} />
          <span>1. Leads & Inquiries</span>
          <span className="crm-subnav-badge">{leadsState.length}</span>
        </button>

        <button
          className={`crm-subnav-btn ${activeTab === 'clients' ? 'active' : ''}`}
          onClick={() => setActiveTab('clients')}
          role="tab"
          aria-selected={activeTab === 'clients'}
        >
          <Building2 size={15} />
          <span>2. Client Management</span>
          <span className="crm-subnav-badge">{clientList.length}</span>
        </button>

        <button
          className={`crm-subnav-btn ${activeTab === 'pipeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('pipeline')}
          role="tab"
          aria-selected={activeTab === 'pipeline'}
        >
          <Kanban size={15} />
          <span>3. Sales Pipeline</span>
          <span className="crm-subnav-badge">{pipelineDeals.length}</span>
        </button>

        <button
          className={`crm-subnav-btn ${activeTab === 'quotations' ? 'active' : ''}`}
          onClick={() => setActiveTab('quotations')}
          role="tab"
          aria-selected={activeTab === 'quotations'}
        >
          <FileSpreadsheet size={15} />
          <span>4. Quotations & Proposals</span>
          <span className="crm-subnav-badge">{quotationsList.length}</span>
        </button>

        <button
          className={`crm-subnav-btn ${activeTab === 'contracts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contracts')}
          role="tab"
          aria-selected={activeTab === 'contracts'}
        >
          <Scale size={15} />
          <span>5. Contracts & Agreements</span>
          <span className="crm-subnav-badge">{contractsList.length}</span>
        </button>

        {rawTableComponent && (
          <button
            className={`crm-subnav-btn ${activeTab === 'master_register' ? 'active' : ''}`}
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
        <div className="crm-module-view">
          {/* Main Metric Grid Blocks (recalculated instantly without redraw failure) */}
          <div className="crm-metrics-grid">
            <div className="crm-metric-card">
              <span className="crm-metric-title">Total Leads</span>
              <span className="crm-metric-value">{leadsMetrics.totalLeads}</span>
              <span className="crm-metric-sub">Active incoming inquiries</span>
            </div>
            <div className="crm-metric-card">
              <span className="crm-metric-title">Conversion Rate</span>
              <span className="crm-metric-value" style={{ color: '#047857' }}>
                {leadsMetrics.conversionRate}%
              </span>
              <span className="crm-metric-sub">Qualified to Project Award</span>
            </div>
            <div className="crm-metric-card">
              <span className="crm-metric-title">Projected Pipeline Value</span>
              <span className="crm-metric-value" style={{ color: '#b3202a' }}>
                {formatPKR(leadsMetrics.projectedPipelineValue)}
              </span>
              <span className="crm-metric-sub">Estimated opportunity worth</span>
            </div>
          </div>

          {/* Module Action Header */}
          <div className="crm-section-header">
            <div>
              <h3>Leads & Inquiries Register</h3>
              <p>Capture, qualify, and convert construction and architectural project inquiries.</p>
            </div>
            <button className="crm-btn crm-btn-primary" onClick={() => setIsNewLeadModalOpen(true)}>
              <Plus size={15} />
              <span>+ New Lead</span>
            </button>
          </div>

          {/* Interactive Leads Table */}
          <div className="crm-table-wrapper">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Lead ID</th>
                  <th>Client / Organization</th>
                  <th>Source Channel</th>
                  <th>Contact Info</th>
                  <th>Est. Value (PKR)</th>
                  <th>Date Logged</th>
                  <th>Current Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leadsState.map(lead => (
                  <tr key={lead.id}>
                    <td><span className="crm-badge crm-badge-neutral">{lead.id}</span></td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{lead.clientName}</td>
                    <td><span className="crm-badge crm-badge-info">{lead.source}</span></td>
                    <td>
                      <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column' }}>
                        <span>{lead.contact}</span>
                        <span style={{ color: '#64748b' }}>{lead.email}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{formatPKR(lead.estValue)}</td>
                    <td>{lead.dateAdded}</td>
                    <td>
                      <span className={`crm-badge ${
                        lead.status === 'Converted' ? 'crm-badge-success' :
                        lead.status === 'Proposal Sent' ? 'crm-badge-info' :
                        lead.status === 'Qualified' ? 'crm-badge-purple' : 'crm-badge-neutral'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {lead.status !== 'Converted' ? (
                        <button
                          className="crm-btn crm-btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          onClick={() => {
                            setLeadsState(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'Converted' } : l))
                            notify(`Lead ${lead.id} marked as Converted! Conversion metrics updated.`)
                          }}
                        >
                          <CheckCircle2 size={13} style={{ color: '#059669' }} />
                          <span>Convert</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>Converted</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* "+ New Lead" Interactive Modal */}
          {isNewLeadModalOpen && (
            <div className="crm-modal-backdrop" onClick={() => setIsNewLeadModalOpen(false)}>
              <div className="crm-modal-card" onClick={e => e.stopPropagation()}>
                <div className="crm-modal-header">
                  <div>
                    <h4>+ Add New Construction Lead</h4>
                    <p style={{ margin: 0, fontSize: '11.5px', color: '#64748b' }}>Append a verified prospect to the sales pipeline</p>
                  </div>
                  <button className="crm-btn crm-btn-secondary" onClick={() => setIsNewLeadModalOpen(false)} style={{ padding: '4px 8px' }}>
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateLead} className="crm-form">
                  <div className="crm-form-group">
                    <label className="crm-label">Client / Firm Name *</label>
                    <input
                      type="text"
                      className="crm-input"
                      placeholder="e.g. Al-Mansoor Mega Towers"
                      value={newLeadForm.clientName}
                      onChange={e => setNewLeadForm({ ...newLeadForm, clientName: e.target.value })}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="crm-form-row">
                    <div className="crm-form-group">
                      <label className="crm-label">Lead Source Channel</label>
                      <select
                        className="crm-select"
                        value={newLeadForm.source}
                        onChange={e => setNewLeadForm({ ...newLeadForm, source: e.target.value })}
                      >
                        <option value="Tender Portal">Tender Portal / Government</option>
                        <option value="Referral">Client Referral</option>
                        <option value="Website">Website Inquiry</option>
                        <option value="Paid Ad">Digital Marketing Ad</option>
                        <option value="Direct Call">Direct Inbound Call</option>
                      </select>
                    </div>

                    <div className="crm-form-group">
                      <label className="crm-label">Estimated Value (PKR)</label>
                      <input
                        type="number"
                        className="crm-input"
                        placeholder="e.g. 15000000"
                        value={newLeadForm.estValue}
                        onChange={e => setNewLeadForm({ ...newLeadForm, estValue: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="crm-form-row">
                    <div className="crm-form-group">
                      <label className="crm-label">Contact Phone / Mobile</label>
                      <input
                        type="tel"
                        className="crm-input"
                        placeholder="+92 300 1234567"
                        value={newLeadForm.contact}
                        onChange={e => setNewLeadForm({ ...newLeadForm, contact: e.target.value })}
                      />
                    </div>

                    <div className="crm-form-group">
                      <label className="crm-label">Email Address</label>
                      <input
                        type="email"
                        className="crm-input"
                        placeholder="procurement@client.com"
                        value={newLeadForm.email}
                        onChange={e => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="crm-modal-actions">
                    <button type="button" className="crm-btn crm-btn-secondary" onClick={() => setIsNewLeadModalOpen(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="crm-btn crm-btn-primary">
                      <Plus size={14} />
                      <span>Save & Append Lead</span>
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
        <div className="crm-module-view">
          {/* Header with Real-time JS Search Handler */}
          <div className="crm-section-header">
            <div>
              <h3>Client Profiles & Database Ledger</h3>
              <p>Manage verified business accounts, billing statements, and live communication logs.</p>
            </div>
            <div className="crm-search-box">
              <Search size={14} color="#64748b" />
              <input
                type="text"
                className="crm-input"
                placeholder="Search by Company Name, ID or Contact..."
                value={clientSearchString}
                onChange={e => setClientSearchString(e.target.value)}
                style={{ width: '280px' }}
              />
              {clientSearchString && (
                <button
                  onClick={() => setClientSearchString('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '11px' }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Interactive Client Ledger Table */}
          <div className="crm-table-wrapper">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Client ID</th>
                  <th>Company Name</th>
                  <th>Main Contact Person</th>
                  <th>Contact Details</th>
                  <th>Active Construction Sites</th>
                  <th>Total Invoiced Billing</th>
                  <th>Ledger Status</th>
                  <th style={{ textAlign: 'right' }}>Inline Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                      No clients matching "{clientSearchString}".
                    </td>
                  </tr>
                ) : (
                  filteredClients.map(client => (
                    <React.Fragment key={client.id}>
                      <tr style={{ background: client.isArchived ? '#f8fafc' : 'transparent', opacity: client.isArchived ? 0.75 : 1 }}>
                        <td><span className="crm-badge crm-badge-neutral">{client.clientId}</span></td>
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
                          <span className="crm-badge crm-badge-info">
                            {client.activeSites} {client.activeSites === 1 ? 'Site' : 'Sites'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: '#0f172a' }}>
                          {formatPKR(client.totalInvoicedBilling)}
                        </td>
                        <td>
                          {client.isArchived ? (
                            <span className="crm-badge crm-badge-neutral">Archived</span>
                          ) : (
                            <span className="crm-badge crm-badge-success">Active Account</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              className={`crm-btn ${activeHistoryClientId === client.id ? 'crm-btn-primary' : 'crm-btn-secondary'}`}
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                              onClick={() => setActiveHistoryClientId(activeHistoryClientId === client.id ? null : client.id)}
                            >
                              <Eye size={12} />
                              <span>{activeHistoryClientId === client.id ? 'Hide History' : 'View History'}</span>
                            </button>
                            <button
                              className="crm-btn crm-btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '11px', color: client.isArchived ? '#059669' : '#dc2626' }}
                              onClick={() => toggleArchiveClient(client.id)}
                            >
                              {client.isArchived ? <RotateCcw size={12} /> : <Archive size={12} />}
                              <span>{client.isArchived ? 'Restore' : 'Archive'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Transitioned Card State: Logged Communications Feed */}
                      {activeHistoryClientId === client.id && (
                        <tr>
                          <td colSpan={8} style={{ padding: '0', background: '#f8fafc' }}>
                            <div className="crm-comm-feed-box">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <Clock size={16} color="#b3202a" />
                                  <h4 style={{ margin: 0, fontSize: '13px', color: '#0f172a' }}>
                                    Communications Feed: {client.companyName}
                                  </h4>
                                </div>
                                <span style={{ fontSize: '11px', color: '#64748b' }}>
                                  {client.communications.length} log records on file
                                </span>
                              </div>

                              {/* New communication entry */}
                              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                                <select
                                  className="crm-select"
                                  style={{ width: '130px' }}
                                  value={newCommNote.channel}
                                  onChange={e => setNewCommNote({ ...newCommNote, channel: e.target.value as any })}
                                >
                                  <option value="Call">Phone Call</option>
                                  <option value="Email">Email Exchange</option>
                                  <option value="Site Visit">Site Visit</option>
                                  <option value="Meeting">Direct Meeting</option>
                                </select>
                                <input
                                  type="text"
                                  className="crm-input"
                                  placeholder="Log discussion notes, agreements or meeting minutes..."
                                  value={newCommNote.notes}
                                  onChange={e => setNewCommNote({ ...newCommNote, notes: e.target.value })}
                                  onKeyDown={e => { if (e.key === 'Enter') handleAddCommunication(client.id) }}
                                />
                                <button
                                  className="crm-btn crm-btn-primary"
                                  onClick={() => handleAddCommunication(client.id)}
                                  style={{ padding: '6px 14px' }}
                                >
                                  <Send size={13} />
                                  <span>Log Note</span>
                                </button>
                              </div>

                              {/* Communication items list */}
                              <div className="crm-comm-timeline">
                                {client.communications.length === 0 ? (
                                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>No communications logged yet for this account.</p>
                                ) : (
                                  client.communications.map(comm => (
                                    <div key={comm.id} className="crm-comm-item">
                                      <div className="crm-comm-item-meta">
                                        <span className="crm-badge crm-badge-info">{comm.channel}</span>
                                        <span style={{ fontSize: '11px', color: '#64748b' }}>{comm.date}</span>
                                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>· {comm.agent}</span>
                                      </div>
                                      <p className="crm-comm-text">{comm.notes}</p>
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
        <div className="crm-module-view">
          {/* Header with live dynamic running sum of Total Expected Deal Value */}
          <div className="crm-section-header">
            <div>
              <h3>Bidding & Tender Workflow Pipeline</h3>
              <p>Track bids from sourcing to negotiation across active construction opportunities.</p>
            </div>
            <div className="crm-pipeline-header-stat">
              <span className="crm-stat-lbl">Live Running Sum:</span>
              <span className="crm-stat-val">{formatPKR(totalExpectedDealValue)}</span>
              <span className="crm-stat-badge">Total Expected Deal Value ({pipelineDeals.length} deals)</span>
            </div>
          </div>

          {/* Multi-Stage Workflow Pipeline Board */}
          <div className="crm-pipeline-board">
            {pipelineStages.map((stage, stageIdx) => {
              const stageDeals = pipelineDeals.filter(d => d.stage === stage)
              const stageTotal = stageDeals.reduce((sum, d) => sum + (Number(d.expectedValue) || 0), 0)

              return (
                <div key={stage} className="crm-pipeline-column">
                  <div className="crm-column-header">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span className="crm-col-title">{stage}</span>
                      <span className="crm-subnav-badge">{stageDeals.length}</span>
                    </div>
                    <span className="crm-col-sum">{formatPKR(stageTotal)}</span>
                  </div>

                  <div className="crm-column-body">
                    {stageDeals.length === 0 ? (
                      <div className="crm-pipeline-empty">No bids in this stage</div>
                    ) : (
                      stageDeals.map(deal => (
                        <div key={deal.id} className="crm-pipeline-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                            <span className="crm-badge crm-badge-neutral">{deal.tenderId}</span>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#047857' }}>{deal.probability}% Prob.</span>
                          </div>
                          <div className="crm-card-title">{deal.projectName}</div>
                          <div className="crm-card-client">{deal.client}</div>

                          <div className="crm-card-val-row">
                            <span style={{ color: '#64748b', fontSize: '11px' }}>Est. Deal Value:</span>
                            <span style={{ fontWeight: 700, color: '#b3202a', fontSize: '12.5px' }}>{formatPKR(deal.expectedValue)}</span>
                          </div>

                          <div style={{ fontSize: '10.5px', color: '#64748b', marginBottom: 10 }}>
                            Target Closing: {deal.closingDate}
                          </div>

                          {/* Action buttons inside pipeline item to modify state dynamically */}
                          <div className="crm-card-actions">
                            <button
                              className="crm-btn crm-btn-secondary"
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                              disabled={stageIdx === 0}
                              onClick={() => movePipelineDeal(deal.id, 'prev')}
                              title="Move back to previous stage"
                            >
                              <ArrowLeft size={12} />
                              <span>Prev</span>
                            </button>
                            <button
                              className="crm-btn crm-btn-secondary"
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                              disabled={stageIdx === pipelineStages.length - 1}
                              onClick={() => movePipelineDeal(deal.id, 'next')}
                              title="Advance to next pipeline stage"
                            >
                              <span>Next</span>
                              <ArrowRight size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
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
        <div className="crm-module-view">
          <div className="crm-section-header">
            <div>
              <h3>Quotations & Pre-Contract Estimates</h3>
              <p>State engine for drafting architectural estimates and contractor quotations with line-item pricing.</p>
            </div>
            <button
              className="crm-btn crm-btn-primary"
              onClick={() => setIsNewQuoteOpen(true)}
            >
              <Plus size={15} />
              <span>+ Draft New Quotation</span>
            </button>
          </div>

          {/* Line-Item Builder Modal/Form */}
          {isNewQuoteOpen && (
            <div className="crm-lineitem-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h4 style={{ margin: 0, fontSize: '14px', color: '#0f172a' }}>
                  Interactive Estimation Line-Item Builder
                </h4>
                <button
                  className="crm-btn crm-btn-secondary"
                  onClick={() => setIsNewQuoteOpen(false)}
                  style={{ padding: '4px 8px' }}
                >
                  ✕ Close
                </button>
              </div>

              <div className="crm-form-row" style={{ marginBottom: 14 }}>
                <div className="crm-form-group">
                  <label className="crm-label">Client Name *</label>
                  <input
                    type="text"
                    className="crm-input"
                    placeholder="e.g. Al-Baqir Towers"
                    value={quoteClient}
                    onChange={e => setQuoteClient(e.target.value)}
                  />
                </div>
                <div className="crm-form-group">
                  <label className="crm-label">Project Scope Description *</label>
                  <input
                    type="text"
                    className="crm-input"
                    placeholder="e.g. Civil Concrete & Plinth Level Finishing"
                    value={quoteScope}
                    onChange={e => setQuoteScope(e.target.value)}
                  />
                </div>
              </div>

              {/* Dynamic Line Items Table */}
              <table className="crm-table" style={{ marginBottom: 14 }}>
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th style={{ width: '160px' }}>Material Subtotal (PKR)</th>
                    <th style={{ width: '160px' }}>Labor Factors (PKR)</th>
                    <th style={{ width: '130px' }}>Overheads (%)</th>
                    <th style={{ width: '160px' }}>Reactive Line Total</th>
                    <th style={{ width: '60px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {draftLineItems.map((item, idx) => (
                    <tr key={item.id}>
                      <td>
                        <input
                          type="text"
                          className="crm-input"
                          value={item.description}
                          onChange={e => handleUpdateDraftLineItem(item.id, 'description', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="crm-input"
                          value={item.materialSubtotal}
                          onChange={e => handleUpdateDraftLineItem(item.id, 'materialSubtotal', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="crm-input"
                          value={item.laborFactors}
                          onChange={e => handleUpdateDraftLineItem(item.id, 'laborFactors', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="crm-input"
                          value={item.overheadsPercent}
                          onChange={e => handleUpdateDraftLineItem(item.id, 'overheadsPercent', e.target.value)}
                        />
                      </td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>
                        {formatPKR(item.total)}
                      </td>
                      <td>
                        <button
                          className="crm-btn crm-btn-secondary"
                          style={{ padding: '4px 6px', color: '#dc2626' }}
                          onClick={() => handleRemoveDraftLineItem(item.id)}
                          title="Remove Line"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Reactive Total Sum Function Display */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: 6, border: '1px solid #e2e8f0', marginBottom: 14 }}>
                <button className="crm-btn crm-btn-secondary" onClick={handleAddDraftLineItem}>
                  <Plus size={13} />
                  <span>+ Append Line Cost Item</span>
                </button>

                <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Material: <strong style={{ color: '#0f172a' }}>{formatPKR(draftTotals.mat)}</strong>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Labor: <strong style={{ color: '#0f172a' }}>{formatPKR(draftTotals.lab)}</strong>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Overheads: <strong style={{ color: '#0f172a' }}>{formatPKR(draftTotals.ovh)}</strong>
                  </div>
                  <div style={{ fontSize: '13px', color: '#b3202a', fontWeight: 800 }}>
                    Reactive Grand Total: {formatPKR(draftTotals.total)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button className="crm-btn crm-btn-secondary" onClick={() => setIsNewQuoteOpen(false)}>
                  Cancel
                </button>
                <button className="crm-btn crm-btn-primary" onClick={handleSaveQuotationDraft}>
                  <CheckCircle2 size={14} />
                  <span>Confirm & Save Quotation</span>
                </button>
              </div>
            </div>
          )}

          {/* Drafted Quotations Master Table */}
          <div className="crm-table-wrapper">
            <table className="crm-table">
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
                  <th style={{ textAlign: 'right' }}>Active Event Triggers</th>
                </tr>
              </thead>
              <tbody>
                {quotationsList.map(quote => (
                  <tr key={quote.id} style={{ background: quote.locked ? '#fcfcfc' : 'transparent' }}>
                    <td><span className="crm-badge crm-badge-neutral">{quote.quoteNumber}</span></td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{quote.clientName}</td>
                    <td style={{ maxWidth: '240px', fontSize: '11.5px' }}>{quote.projectScope}</td>
                    <td>{formatPKR(quote.materialTotal)}</td>
                    <td>{formatPKR(quote.laborTotal)}</td>
                    <td>{formatPKR(quote.overheadTotal)}</td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{formatPKR(quote.grandTotal)}</td>
                    <td>
                      <span className={`crm-badge ${
                        quote.status === 'Approved for Client Delivery' ? 'crm-badge-success' :
                        quote.status === 'Rejected / Revise' ? 'crm-badge-warning' : 'crm-badge-neutral'
                      }`}>
                        {quote.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          className="crm-btn crm-btn-primary"
                          style={{ padding: '4px 8px', fontSize: '11px', background: quote.locked ? '#059669' : undefined, borderColor: quote.locked ? '#059669' : undefined }}
                          disabled={quote.locked}
                          onClick={() => handleApproveQuotation(quote.id)}
                          title="Approving locks quotation editing"
                        >
                          <CheckCircle2 size={12} />
                          <span>{quote.locked ? 'Approved & Locked' : 'Approve for Client Delivery'}</span>
                        </button>
                        <button
                          className="crm-btn crm-btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11px', color: '#b45309' }}
                          onClick={() => handleRejectQuotation(quote.id)}
                          title="Marks quote as needing revision"
                        >
                          <XCircle size={12} />
                          <span>Reject / Revise</span>
                        </button>
                      </div>
                    </td>
                  </tr>
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
        <div className="crm-module-view">
          <div className="crm-section-header">
            <div>
              <h3>Legal Contracts & Agreement Master Log</h3>
              <p>Enforceable contracts, retention warranty clauses, and addendum revision history.</p>
            </div>
            <span className="crm-badge crm-badge-neutral" style={{ padding: '6px 12px', fontSize: '12px' }}>
              Master Legal Database (Module 36)
            </span>
          </div>

          {/* Structural Master Table */}
          <div className="crm-table-wrapper">
            <table className="crm-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Contract Code</th>
                  <th>Project Name</th>
                  <th>Contractor / Client Name</th>
                  <th>Execution Date</th>
                  <th>Retention Clauses (%)</th>
                  <th>Contract Value (PKR)</th>
                  <th>Legal Status</th>
                  <th style={{ textAlign: 'right' }}>Addendum Generator</th>
                </tr>
              </thead>
              <tbody>
                {contractsList.map(contract => {
                  const isExpanded = expandedContractIds.has(contract.id)
                  const isAddendumOpen = activeAddendumContractId === contract.id

                  return (
                    <React.Fragment key={contract.id}>
                      <tr>
                        <td>
                          <button
                            onClick={() => toggleContractExpansion(contract.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: '#64748b' }}
                            title="Toggle Revision History"
                          >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        </td>
                        <td><span className="crm-badge crm-badge-neutral">{contract.contractCode}</span></td>
                        <td style={{ fontWeight: 600, color: '#0f172a' }}>{contract.projectName}</td>
                        <td>{contract.clientName}</td>
                        <td>{contract.executionDate}</td>
                        <td>
                          <span className="crm-badge crm-badge-purple">
                            {contract.retentionClausesPct.toFixed(1)}% Retention
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>
                          {formatPKR(contract.currentValue)}
                          {contract.currentValue !== contract.baseValue && (
                            <div style={{ fontSize: '10.5px', color: '#059669', fontWeight: 500 }}>
                              Base: {formatPKR(contract.baseValue)}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`crm-badge ${
                            contract.legalApprovalStatus === 'Approved' ? 'crm-badge-success' :
                            contract.legalApprovalStatus === 'Addendum Executed' ? 'crm-badge-info' : 'crm-badge-warning'
                          }`}>
                            {contract.legalApprovalStatus}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="crm-btn crm-btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                            onClick={() => {
                              setActiveAddendumContractId(isAddendumOpen ? null : contract.id)
                            }}
                          >
                            <FileText size={12} />
                            <span>{isAddendumOpen ? 'Cancel' : 'Generate Addendum'}</span>
                          </button>
                        </td>
                      </tr>

                      {/* Addendum Generator Active Form */}
                      {isAddendumOpen && (
                        <tr>
                          <td colSpan={9} style={{ background: '#f8fafc', padding: '16px 20px' }}>
                            <div className="crm-addendum-box">
                              <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#0f172a' }}>
                                Generate Legal Addendum for {contract.contractCode} ({contract.projectName})
                              </h4>
                              <div className="crm-form-row">
                                <div className="crm-form-group">
                                  <label className="crm-label">Clause Modified / Scope Amendment *</label>
                                  <input
                                    type="text"
                                    className="crm-input"
                                    placeholder="e.g. Clause 8.1 - Variation in Soil Stabilization Foundation"
                                    value={addendumForm.clauseChanged}
                                    onChange={e => setAddendumForm({ ...addendumForm, clauseChanged: e.target.value })}
                                  />
                                </div>
                                <div className="crm-form-group">
                                  <label className="crm-label">Amendment Value Change (PKR) *</label>
                                  <input
                                    type="number"
                                    className="crm-input"
                                    placeholder="e.g. 1500000"
                                    value={addendumForm.amendmentValue}
                                    onChange={e => setAddendumForm({ ...addendumForm, amendmentValue: e.target.value })}
                                  />
                                </div>
                              </div>
                              <div className="crm-form-group" style={{ marginBottom: 12 }}>
                                <label className="crm-label">Legal Justification / Confirmation Notes</label>
                                <input
                                  type="text"
                                  className="crm-input"
                                  placeholder="Approved by Client Technical Director and Consultant Architect..."
                                  value={addendumForm.notes}
                                  onChange={e => setAddendumForm({ ...addendumForm, notes: e.target.value })}
                                />
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                <button
                                  type="button"
                                  className="crm-btn crm-btn-secondary"
                                  onClick={() => setActiveAddendumContractId(null)}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  className="crm-btn crm-btn-primary"
                                  onClick={() => handleGenerateAddendum(contract.id)}
                                >
                                  <CheckCircle2 size={13} />
                                  <span>Log & Execute Addendum</span>
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Nested Conditional Row Toggle: Revision History Logs */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} style={{ background: '#f8fafc', padding: '12px 24px' }}>
                            <div className="crm-revision-history-panel">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                <Clock size={14} color="#64748b" />
                                <strong style={{ fontSize: '12px', color: '#334155' }}>
                                  Contract Revision & Addendum History Log ({contract.revisions.length} records)
                                </strong>
                              </div>
                              {contract.revisions.length === 0 ? (
                                <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8' }}>
                                  No addendums or revisions executed yet for this contract. Base agreement stands unaltered.
                                </p>
                              ) : (
                                <table className="crm-table" style={{ background: '#ffffff', borderRadius: 4 }}>
                                  <thead>
                                    <tr>
                                      <th>Revision #</th>
                                      <th>Execution Date</th>
                                      <th>Legal Counsel / Officer</th>
                                      <th>Amended Clause</th>
                                      <th>Value Adjustment</th>
                                      <th>Notes</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {contract.revisions.map(rev => (
                                      <tr key={rev.id}>
                                        <td><span className="crm-badge crm-badge-info">{rev.version}</span></td>
                                        <td>{rev.date}</td>
                                        <td>{rev.revisedBy}</td>
                                        <td style={{ fontWeight: 500 }}>{rev.clauseChanged}</td>
                                        <td style={{ fontWeight: 600, color: rev.amendmentValue >= 0 ? '#047857' : '#dc2626' }}>
                                          {formatPKR(rev.amendmentValue)}
                                        </td>
                                        <td style={{ color: '#64748b', fontSize: '11px' }}>{rev.notes}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* OPTIONAL MASTER DATABASE REGISTER (Module Table with 10 Action Buttons) */}
      {/* ===================================================================== */}
      {activeTab === 'master_register' && rawTableComponent && (
        <div className="crm-module-view">
          <div className="crm-section-header">
            <div>
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
