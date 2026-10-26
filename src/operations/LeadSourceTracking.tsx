import { useState, useMemo } from 'react'
import {
  CircleDollarSign, Filter,
  PieChart as PieIcon, Trophy, UsersRound, FileText,
  Check, BarChart3, Layers, CheckSquare,
  GitBranch, Building2, TrendingUp, Search, Plus, X, AlertCircle,
  ArrowRight, CheckCircle2, Clock, Edit3,
  MessageSquare, Archive, Send, FileCheck
} from 'lucide-react'
import './lead-tracking.css'

// ============================================================================
// Types
// ============================================================================

export type SubModuleTab =
  | 'sourcing'         // 1. Lead Sourcing & Tracking
  | 'tenders'          // 2. Bidding & Tender Management
  | 'prequalification' // 3. Pre-Qualification Checklist
  | 'proposals'        // 4. Estimation & Proposal Pipeline
  | 'investors'        // 5. Investor Pool Ledger
  | 'roi'              // 6. ROI Forecast Engine

export interface ConstructionLead {
  id: string
  clientName: string
  email: string
  contactNumber: string
  projectedValue: number // in PKR
  source: 'Website' | 'Tender' | 'Referral' | 'Paid Ad'
  stage: 'Inquiry' | 'Site Visit' | 'Qualified Estimate' | 'Awarded' | 'Lost'
  scope: string
  location: string
  createdAt: string
  verifiedAt?: string
}

export interface TenderItem {
  tenderId: string
  authorityName: string
  projectTitle: string
  submissionDeadline: string
  earnestMoney: number // in PKR
  bidStatus: 'Open' | 'Submitted' | 'Evaluation'
}

export interface ProposalItem {
  id: string
  leadId: string
  projectTitle: string
  clientName: string
  leadEstimator: string
  totalEstimatedCost: number // in PKR
  bidPrice: number // in PKR
  targetMarginPct: number
  status: 'Pending Review' | 'Approved for Bidding' | 'Revision Required' | 'Archived'
  revisionComment?: string
}

export interface InvestorPosition {
  id: string
  investorName: string
  fundedProject: string
  capitalCommitted: number // in PKR
  capitalDisbursed: number // in PKR
  equityShare: number // %
  joinedDate: string
}

export type SourcePerformance = {
  source: string
  totalLeads: number
  percentage: number
  qualified: number
  siteVisits: number
  bids: number
  proposals: number
  awarded: number
  lost: number
  estimatedValue: number
  conversionRate: number
  color: string
}

export type PipelineStep = {
  stage: string
  count: number
  percentage: number
  color: string
}

export type LeadSummaryData = {
  totalLeads: number
  qualified: number
  bids: number
  awarded: number
  lost: number
  estimatedValue: number
  conversionRate: number
  sources: SourcePerformance[]
  pipeline: PipelineStep[]
  keyInsights: string[]
}

const USD_PKR_RATE = 278

// ============================================================================
// Initial Dummy State Data
// ============================================================================

const initialConstructionLeads: ConstructionLead[] = [
  {
    id: 'LD-101',
    clientName: 'Tariq Mahmood & Sons',
    email: 'tariq@dha-plaza.pk',
    contactNumber: '+92 300 8451122',
    projectedValue: 45000000,
    source: 'Website',
    stage: 'Inquiry',
    scope: 'Commercial Plaza Gray Structure & MEP Works',
    location: 'DHA Phase 9 Commercial, Lahore',
    createdAt: '2026-10-18',
  },
  {
    id: 'LD-102',
    clientName: 'Brig. (R) Salman Farooq',
    email: 'salman.farooq@gmail.com',
    contactNumber: '+92 321 4455889',
    projectedValue: 28500000,
    source: 'Referral',
    stage: 'Qualified Estimate',
    scope: 'Turnkey Luxury Villa Construction',
    location: 'Lake City Sector M, Lahore',
    createdAt: '2026-10-19',
    verifiedAt: '2026-10-21',
  },
  {
    id: 'LD-103',
    clientName: 'Apex Horizon Technologies',
    email: 'procurement@apexhorizon.com',
    contactNumber: '+92 333 5123987',
    projectedValue: 36000000,
    source: 'Paid Ad',
    stage: 'Inquiry',
    scope: 'High-Tech Corporate Office Interior & Fit-Out',
    location: 'Bahria Heights Tower B, Rawalpindi',
    createdAt: '2026-10-20',
  },
  {
    id: 'LD-104',
    clientName: 'Al-Karam Developers',
    email: 'info@alkaramdev.com',
    contactNumber: '+92 301 7766554',
    projectedValue: 82000000,
    source: 'Tender',
    stage: 'Qualified Estimate',
    scope: 'Multi-Storey Civil Frame & Basement Shoring',
    location: 'Main Boulevard Gulberg III, Lahore',
    createdAt: '2026-10-21',
    verifiedAt: '2026-10-23',
  },
  {
    id: 'LD-105',
    clientName: 'Ambassador Tariq Aziz',
    email: 'tariq.aziz@foreignaffairs.pk',
    contactNumber: '+92 345 9988776',
    projectedValue: 64000000,
    source: 'Referral',
    stage: 'Inquiry',
    scope: 'Diplomatic Compound Villa & Security Perimeter',
    location: 'Sector F-5/2, Islamabad',
    createdAt: '2026-10-22',
  },
  {
    id: 'LD-106',
    clientName: 'Packages Cargo Logistics',
    email: 'cargowarehouse@packages.com.pk',
    contactNumber: '+92 300 2233445',
    projectedValue: 95000000,
    source: 'Website',
    stage: 'Qualified Estimate',
    scope: 'Heavy Industrial Pre-Engineered Steel Shed',
    location: 'Multan Road Industrial Corridor, Lahore',
    createdAt: '2026-10-23',
    verifiedAt: '2026-10-25',
  },
  {
    id: 'LD-107',
    clientName: 'Coastal Development Authority',
    email: 'tenders@cda-coast.gov.pk',
    contactNumber: '+92 21 99242400',
    projectedValue: 115000000,
    source: 'Tender',
    stage: 'Inquiry',
    scope: 'Waterfront Retaining Wall & Marine Infrastructure',
    location: 'Gwadar Port Boulevard',
    createdAt: '2026-10-24',
  },
  {
    id: 'LD-108',
    clientName: 'Coastal Hospitality Pvt Ltd',
    email: 'invest@coastalhosp.com',
    contactNumber: '+92 322 8877112',
    projectedValue: 21000000,
    source: 'Paid Ad',
    stage: 'Inquiry',
    scope: 'Boutique Restaurant & Steel Glazing Pavilion',
    location: 'Clifton Block 4, Karachi',
    createdAt: '2026-10-25',
  },
]

const initialTenders: TenderItem[] = [
  {
    tenderId: 'TND-CDA-2026-09',
    authorityName: 'Capital Development Authority (CDA)',
    projectTitle: 'Islamabad Sector I-15 Trunk Infrastructure & Dual Carriageway',
    submissionDeadline: '2026-11-20',
    earnestMoney: 4500000,
    bidStatus: 'Open',
  },
  {
    tenderId: 'TND-PHA-102',
    authorityName: 'Punjab Highway Authority (PHA)',
    projectTitle: 'Lahore Ring Road Southern Loop Extension Package 4 Flyovers',
    submissionDeadline: '2026-11-08',
    earnestMoney: 8200000,
    bidStatus: 'Submitted',
  },
  {
    tenderId: 'TND-NESPAK-44',
    authorityName: 'NESPAK National Consultants',
    projectTitle: 'Central Medical University HVAC & MEP District Cooling Plant',
    submissionDeadline: '2026-11-30',
    earnestMoney: 3100000,
    bidStatus: 'Evaluation',
  },
  {
    tenderId: 'TND-CAA-88',
    authorityName: 'Civil Aviation Authority (CAA)',
    projectTitle: 'Terminal 2 Cargo Apron Heavy Duty Concrete Pavement',
    submissionDeadline: '2026-12-15',
    earnestMoney: 6000000,
    bidStatus: 'Open',
  },
  {
    tenderId: 'TND-FWO-51',
    authorityName: 'Frontier Works Organization (FWO)',
    projectTitle: 'Motorway M-8 Section II Cut-and-Fill Heavy Earthwork',
    submissionDeadline: '2026-11-12',
    earnestMoney: 5500000,
    bidStatus: 'Evaluation',
  },
]

const initialProposals: ProposalItem[] = [
  {
    id: 'PRP-801',
    leadId: 'LD-101',
    projectTitle: 'DHA Phase 9 Commercial Plaza',
    clientName: 'Tariq Mahmood & Sons',
    leadEstimator: 'Engr. Bilal Farooq (PE)',
    totalEstimatedCost: 38250000,
    bidPrice: 45000000,
    targetMarginPct: 15.0,
    status: 'Pending Review',
  },
  {
    id: 'PRP-802',
    leadId: 'LD-106',
    projectTitle: 'Multan Road Logistics Warehouse',
    clientName: 'Packages Cargo',
    leadEstimator: 'Engr. Asif Munir',
    totalEstimatedCost: 80750000,
    bidPrice: 95000000,
    targetMarginPct: 15.0,
    status: 'Approved for Bidding',
  },
  {
    id: 'PRP-803',
    leadId: 'LD-103',
    projectTitle: 'Bahria Heights Corporate Fitout',
    clientName: 'Apex Horizon',
    leadEstimator: 'Engr. Danial Shah',
    totalEstimatedCost: 30600000,
    bidPrice: 36000000,
    targetMarginPct: 15.0,
    status: 'Revision Required',
    revisionComment: 'Reduce HVAC ducting subcontractor rate by 6% and re-examine imported ceiling tiles freight.',
  },
  {
    id: 'PRP-804',
    leadId: 'LD-104',
    projectTitle: 'Gulberg Business Hub Civil Works',
    clientName: 'Al-Karam Developers',
    leadEstimator: 'Engr. Bilal Farooq (PE)',
    totalEstimatedCost: 69700000,
    bidPrice: 82000000,
    targetMarginPct: 15.0,
    status: 'Pending Review',
  },
]

const initialInvestors: InvestorPosition[] = [
  {
    id: 'INV-01',
    investorName: 'Habib Equity Syndicate',
    fundedProject: 'Gulberg Business Hub',
    capitalCommitted: 45000000,
    capitalDisbursed: 35000000,
    equityShare: 22.5,
    joinedDate: '2026-02-15',
  },
  {
    id: 'INV-02',
    investorName: 'Apex Capital Partners',
    fundedProject: 'Bahria Heights Tower B',
    capitalCommitted: 30000000,
    capitalDisbursed: 20000000,
    equityShare: 15.0,
    joinedDate: '2026-03-01',
  },
  {
    id: 'INV-03',
    investorName: 'Zubair Infrastructure Holdings',
    fundedProject: 'DHA Phase 9 Commercial Plaza',
    capitalCommitted: 55000000,
    capitalDisbursed: 42000000,
    equityShare: 28.0,
    joinedDate: '2026-04-10',
  },
  {
    id: 'INV-04',
    investorName: 'Crescent Horizon Wealth Group',
    fundedProject: 'Multan Road Logistics Warehouse',
    capitalCommitted: 60000000,
    capitalDisbursed: 60000000,
    equityShare: 30.0,
    joinedDate: '2026-01-20',
  },
  {
    id: 'INV-05',
    investorName: 'Malik & Sons Private Equity',
    fundedProject: 'Lake City Luxury Villas Block M',
    capitalCommitted: 25000000,
    capitalDisbursed: 15000000,
    equityShare: 12.5,
    joinedDate: '2026-05-18',
  },
]

const defaultSources: SourcePerformance[] = [
  { source: 'Website Enquiries', totalLeads: 69, percentage: 28, qualified: 40, siteVisits: 28, bids: 22, proposals: 14, awarded: 8, lost: 10, estimatedValue: 6850000, conversionRate: 12, color: '#2563eb' },
  { source: 'Referrals', totalLeads: 45, percentage: 18, qualified: 28, siteVisits: 20, bids: 16, proposals: 10, awarded: 7, lost: 6, estimatedValue: 5420000, conversionRate: 16, color: '#10b981' },
  { source: 'Repeat Customers', totalLeads: 37, percentage: 15, qualified: 22, siteVisits: 18, bids: 14, proposals: 9, awarded: 5, lost: 5, estimatedValue: 4180000, conversionRate: 14, color: '#f59e0b' },
  { source: 'Paid Campaigns', totalLeads: 30, percentage: 12, qualified: 18, siteVisits: 12, bids: 10, proposals: 6, awarded: 4, lost: 4, estimatedValue: 2960000, conversionRate: 13, color: '#8b5cf6' },
  { source: 'Bid Platforms', totalLeads: 25, percentage: 10, qualified: 14, siteVisits: 10, bids: 8, proposals: 4, awarded: 2, lost: 4, estimatedValue: 1850000, conversionRate: 8, color: '#ef4444' },
  { source: 'Partners', totalLeads: 20, percentage: 8, qualified: 12, siteVisits: 8, bids: 6, proposals: 4, awarded: 3, lost: 3, estimatedValue: 2140000, conversionRate: 15, color: '#eab308' },
  { source: 'Outbound Sales', totalLeads: 17, percentage: 7, qualified: 8, siteVisits: 6, bids: 4, proposals: 2, awarded: 2, lost: 2, estimatedValue: 1420000, conversionRate: 12, color: '#06b6d4' },
]

const defaultPipeline: PipelineStep[] = [
  { stage: 'Lead Source', count: 248, percentage: 100, color: '#e0f2fe' },
  { stage: 'Qualified', count: 142, percentage: 57, color: '#dbeafe' },
  { stage: 'Site Visit', count: 102, percentage: 41, color: '#ccfbf1' },
  { stage: 'Estimate / Bid', count: 70, percentage: 28, color: '#fef3c7' },
  { stage: 'Proposal', count: 49, percentage: 20, color: '#ede9fe' },
  { stage: 'Awarded', count: 32, percentage: 13, color: '#d1fae5' },
]

const defaultKeyInsights = [
  'Website enquiries generate the highest volume of leads.',
  'Referrals and repeat customers have the best conversion rate.',
  'Paid campaigns and bid platforms are driving new opportunities.',
  'Track the original source through the entire sales process to see which channels create real revenue.',
]

interface LeadSourceTrackingProps {
  onNavigate: (module: any) => void
  onSwitchToOperations?: () => void
  leadsData?: any[]
  canEdit?: boolean
}

export default function LeadSourceTracking({ onNavigate: _onNavigate, onSwitchToOperations, leadsData: _leadsData, canEdit = true }: LeadSourceTrackingProps) {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<SubModuleTab>('sourcing')
  const [currency, setCurrency] = useState<'USD' | 'PKR'>('USD')
  const [_periodPreset] = useState<'default' | 'all' | 'q1' | 'q2' | 'q3'>('default')

  // Sub-Module 1 State: Construction Leads & Modal
  const [leads, setLeads] = useState<ConstructionLead[]>(initialConstructionLeads)
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false)
  const [newLeadForm, setNewLeadForm] = useState<{
    clientName: string
    email: string
    contactNumber: string
    projectedValue: string
    source: 'Website' | 'Tender' | 'Referral' | 'Paid Ad'
    scope: string
    location: string
  }>({
    clientName: '',
    email: '',
    contactNumber: '',
    projectedValue: '',
    source: 'Website',
    scope: '',
    location: '',
  })

  // Sub-Module 2 State: Tenders & Search Filter
  const [tenders, setTenders] = useState<TenderItem[]>(initialTenders)
  const [tenderSearch, setTenderSearch] = useState('')
  const [isNewTenderModalOpen, setIsNewTenderModalOpen] = useState(false)
  const [newTenderForm, setNewTenderForm] = useState<{
    authorityName: string
    projectTitle: string
    submissionDeadline: string
    earnestMoney: string
    bidStatus: 'Open' | 'Submitted' | 'Evaluation'
  }>({
    authorityName: '',
    projectTitle: '',
    submissionDeadline: '2026-11-30',
    earnestMoney: '',
    bidStatus: 'Open',
  })

  // Sub-Module 3 State: Pre-Qualification Checklist
  const [selectedLeadId, setSelectedLeadId] = useState<string>('LD-101')
  const [checklist, setChecklist] = useState<{
    technicalEligibility: boolean
    legalCompliance: boolean
    financialSolvency: boolean
    clientBudget: boolean
  }>({
    technicalEligibility: false,
    legalCompliance: false,
    financialSolvency: false,
    clientBudget: false,
  })
  const [prequalAlert, setPrequalAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Sub-Module 4 State: Estimation & Proposal Workflow Queue
  const [proposals, setProposals] = useState<ProposalItem[]>(initialProposals)
  const [activeRevisionId, setActiveRevisionId] = useState<string | null>(null)
  const [revisionNoteInput, setRevisionNoteInput] = useState<string>('')

  // Sub-Module 5 State: Investor Pool Ledger
  const [investors, setInvestors] = useState<InvestorPosition[]>(initialInvestors)
  const [isNewInvestorModalOpen, setIsNewInvestorModalOpen] = useState(false)
  const [newInvestorForm, setNewInvestorForm] = useState<{
    investorName: string
    fundedProject: string
    capitalCommitted: string
    capitalDisbursed: string
    equityShare: string
  }>({
    investorName: '',
    fundedProject: 'Gulberg Business Hub',
    capitalCommitted: '',
    capitalDisbursed: '',
    equityShare: '',
  })

  // Sub-Module 6 State: ROI Forecast Engine
  const [roiProjectValue, setRoiProjectValue] = useState<number>(45000000)
  const [roiCostFactor, setRoiCostFactor] = useState<number>(0.65) // 65% mock target cost factor
  const [roiCurrency, setRoiCurrency] = useState<'USD' | 'PKR'>('USD')

  // Top Dashboard Metrics State
  const [summary, setSummary] = useState<LeadSummaryData>({
    totalLeads: 248,
    qualified: 142,
    bids: 87,
    awarded: 32,
    lost: 38,
    estimatedValue: 24780000,
    conversionRate: 13,
    sources: defaultSources,
    pipeline: defaultPipeline,
    keyInsights: defaultKeyInsights,
  })

  // Reactive primary top metric cards calculation
  const totalLeadsCount = useMemo(() => {
    return summary.totalLeads + (leads.length - initialConstructionLeads.length)
  }, [summary.totalLeads, leads.length])

  const qualifiedBidsCount = useMemo(() => {
    const qualifiedLeads = leads.filter((l) => l.stage === 'Qualified Estimate').length
    const baseQualified = summary.qualified
    return baseQualified + (qualifiedLeads - 3)
  }, [summary.qualified, leads])

  const totalBidsCount = useMemo(() => {
    const approvedProposals = proposals.filter((p) => p.status === 'Approved for Bidding').length
    return summary.bids + approvedProposals
  }, [summary.bids, proposals])

  const totalPipelineValue = useMemo(() => {
    const customLeadsSum = leads.reduce((sum, l) => sum + Number(l.projectedValue || 0), 0)
    return Math.max(summary.estimatedValue, customLeadsSum)
  }, [summary.estimatedValue, leads])

  // Currency Formatter helper
  const formatMoney = (amount: number, compact = false) => {
    if (currency === 'PKR') {
      if (compact) {
        if (amount >= 1e7) return `₨ ${(amount / 1e7).toFixed(1)} Cr`
        if (amount >= 1e6) return `₨ ${(amount / 1e6).toFixed(1)}M`
        if (amount >= 1e5) return `₨ ${(amount / 1e5).toFixed(1)} Lac`
        return `₨ ${(amount / 1000).toFixed(0)}K`
      }
      return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(amount)
    }
    // USD
    if (compact) {
      if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`
      return `$${(amount / 1000).toFixed(0)}K`
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
  }

  // Currency Formatter helper with fixed exchange rate for Sub-Module 6
  const formatRoiMoney = (amountInPKR: number) => {
    if (roiCurrency === 'USD') {
      const usdValue = amountInPKR / USD_PKR_RATE
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(usdValue)
    }
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(amountInPKR)
  }

  // Handlers for Sub-Module 1: Create New Lead
  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLeadForm.clientName || !newLeadForm.projectedValue) return

    const val = Number(newLeadForm.projectedValue) || 10000000
    const newLead: ConstructionLead = {
      id: `LD-${Date.now().toString().slice(-4)}`,
      clientName: newLeadForm.clientName,
      email: newLeadForm.email || 'client@example.com',
      contactNumber: newLeadForm.contactNumber || '+92 300 0000000',
      projectedValue: val,
      source: newLeadForm.source,
      stage: 'Inquiry',
      scope: newLeadForm.scope || 'Civil & Structural Construction',
      location: newLeadForm.location || 'Islamabad / Rawalpindi',
      createdAt: new Date().toISOString().slice(0, 10),
    }

    // Update state array
    setLeads((prev) => [newLead, ...prev])

    // Dynamically update top metric cards
    setSummary((prev) => ({
      ...prev,
      totalLeads: prev.totalLeads + 1,
      estimatedValue: prev.estimatedValue + val,
      sources: prev.sources.map((src) => {
        if (
          (newLead.source === 'Website' && src.source.includes('Website')) ||
          (newLead.source === 'Tender' && src.source.includes('Bid')) ||
          (newLead.source === 'Referral' && src.source.includes('Referral')) ||
          (newLead.source === 'Paid Ad' && src.source.includes('Paid'))
        ) {
          return {
            ...src,
            totalLeads: src.totalLeads + 1,
            estimatedValue: src.estimatedValue + val,
          }
        }
        return src
      }),
    }))

    // Reset and close
    setNewLeadForm({
      clientName: '',
      email: '',
      contactNumber: '',
      projectedValue: '',
      source: 'Website',
      scope: '',
      location: '',
    })
    setIsNewLeadModalOpen(false)
  }

  // Handlers for Sub-Module 2: Tenders
  const filteredTenders = useMemo(() => {
    if (!tenderSearch.trim()) return tenders
    const q = tenderSearch.toLowerCase()
    return tenders.filter(
      (t) => t.authorityName.toLowerCase().includes(q) || t.tenderId.toLowerCase().includes(q)
    )
  }, [tenders, tenderSearch])

  const handleCreateTender = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTenderForm.authorityName || !newTenderForm.projectTitle) return
    const tender: TenderItem = {
      tenderId: `TND-${newTenderForm.authorityName.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-2)}`,
      authorityName: newTenderForm.authorityName,
      projectTitle: newTenderForm.projectTitle,
      submissionDeadline: newTenderForm.submissionDeadline,
      earnestMoney: Number(newTenderForm.earnestMoney) || 3000000,
      bidStatus: newTenderForm.bidStatus,
    }
    setTenders((prev) => [tender, ...prev])
    setNewTenderForm({
      authorityName: '',
      projectTitle: '',
      submissionDeadline: '2026-11-30',
      earnestMoney: '',
      bidStatus: 'Open',
    })
    setIsNewTenderModalOpen(false)
  }

  // Handlers for Sub-Module 3: Pre-Qualification Checklist
  const activePrequalLead = useMemo(() => {
    return leads.find((l) => l.id === selectedLeadId) || leads[0]
  }, [leads, selectedLeadId])

  const handlePrequalSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const { technicalEligibility, legalCompliance, financialSolvency, clientBudget } = checklist
    if (!technicalEligibility || !legalCompliance || !financialSolvency || !clientBudget) {
      setPrequalAlert({
        type: 'error',
        message: 'All 4 pre-qualification checklist items must be verified before approval.',
      })
      return
    }

    // Change core status to "Qualified Estimate"
    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id === selectedLeadId) {
          return {
            ...lead,
            stage: 'Qualified Estimate',
            verifiedAt: new Date().toISOString().slice(0, 10),
          }
        }
        return lead
      })
    )

    // Recalculate summary metrics dynamically
    setSummary((prev) => ({
      ...prev,
      qualified: prev.qualified + 1,
    }))

    setPrequalAlert({
      type: 'success',
      message: `Lead "${activePrequalLead?.clientName}" successfully verified! Status elevated to "Qualified Estimate".`,
    })

    // Reset checklist
    setChecklist({
      technicalEligibility: false,
      legalCompliance: false,
      financialSolvency: false,
      clientBudget: false,
    })
  }

  // Handlers for Sub-Module 4: Estimation & Proposal Queue
  const handleProposalAction = (proposalId: string, action: 'Approve for Bidding' | 'Send Back for Revision' | 'Archive') => {
    if (action === 'Send Back for Revision') {
      setActiveRevisionId(activeRevisionId === proposalId ? null : proposalId)
      return
    }

    setProposals((prev) =>
      prev.map((p) => {
        if (p.id === proposalId) {
          return {
            ...p,
            status: action === 'Approve for Bidding' ? 'Approved for Bidding' : 'Archived',
          }
        }
        return p
      })
    )
    if (activeRevisionId === proposalId) {
      setActiveRevisionId(null)
    }
  }

  const handleSaveRevisionComment = (proposalId: string) => {
    if (!revisionNoteInput.trim()) return
    setProposals((prev) =>
      prev.map((p) => {
        if (p.id === proposalId) {
          return {
            ...p,
            status: 'Revision Required',
            revisionComment: revisionNoteInput,
          }
        }
        return p
      })
    )
    setActiveRevisionId(null)
    setRevisionNoteInput('')
  }

  // Handlers for Sub-Module 5: Investor Pool Ledger
  const totalCommittedPool = useMemo(() => {
    return investors.reduce((sum, inv) => sum + Number(inv.capitalCommitted || 0), 0)
  }, [investors])

  const totalDisbursedPool = useMemo(() => {
    return investors.reduce((sum, inv) => sum + Number(inv.capitalDisbursed || 0), 0)
  }, [investors])

  const handleAddInvestor = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newInvestorForm.investorName || !newInvestorForm.capitalCommitted) return
    const pos: InvestorPosition = {
      id: `INV-${Date.now().toString().slice(-3)}`,
      investorName: newInvestorForm.investorName,
      fundedProject: newInvestorForm.fundedProject,
      capitalCommitted: Number(newInvestorForm.capitalCommitted) || 20000000,
      capitalDisbursed: Number(newInvestorForm.capitalDisbursed) || 0,
      equityShare: Number(newInvestorForm.equityShare) || 10,
      joinedDate: new Date().toISOString().slice(0, 10),
    }
    setInvestors((prev) => [pos, ...prev])
    setNewInvestorForm({
      investorName: '',
      fundedProject: 'Gulberg Business Hub',
      capitalCommitted: '',
      capitalDisbursed: '',
      equityShare: '',
    })
    setIsNewInvestorModalOpen(false)
  }

  // Calculation formulas for Sub-Module 6: ROI Forecast Engine
  const roiCalculations = useMemo(() => {
    const projectVal = Number(roiProjectValue) || 45000000
    const targetCost = projectVal * roiCostFactor // 65% cost factor
    const projectedMargin = projectVal - targetCost // 35% gross margin
    const marginPct = (projectedMargin / projectVal) * 100

    // Component cost breakdown
    const civilMaterials = projectVal * 0.40 // 40%
    const directLabor = projectVal * 0.25    // 25%
    const overheads = projectVal * 0.10      // 10%
    const netProfit = projectVal * 0.25      // 25%

    return {
      projectVal,
      targetCost,
      projectedMargin,
      marginPct,
      civilMaterials,
      directLabor,
      overheads,
      netProfit,
    }
  }, [roiProjectValue, roiCostFactor])

  // Donut chart slices for Sub-Module 1
  const donutSlices = useMemo(() => {
    const total = summary.sources.reduce((sum, s) => sum + s.totalLeads, 0) || 248
    return summary.sources.reduce<{ slice: SourcePerformance & { pathData: string }; nextAngle: number }[]>((acc, s) => {
      const startAngle = acc.length > 0 ? acc[acc.length - 1].nextAngle : 0
      const fraction = s.totalLeads / total
      const angle = fraction * 2 * Math.PI
      const endAngle = startAngle + angle

      const outerRadius = 88
      const innerRadius = 58
      const cx = 100
      const cy = 100

      const x1Outer = cx + outerRadius * Math.cos(startAngle)
      const y1Outer = cy + outerRadius * Math.sin(startAngle)
      const x2Outer = cx + outerRadius * Math.cos(endAngle)
      const y2Outer = cy + outerRadius * Math.sin(endAngle)

      const x1Inner = cx + innerRadius * Math.cos(endAngle)
      const y1Inner = cy + innerRadius * Math.sin(endAngle)
      const x2Inner = cx + innerRadius * Math.cos(startAngle)
      const y2Inner = cy + innerRadius * Math.sin(startAngle)

      const largeArc = angle > Math.PI ? 1 : 0
      const pathData = [
        `M ${x1Outer} ${y1Outer}`,
        `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2Outer} ${y2Outer}`,
        `L ${x1Inner} ${y1Inner}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x2Inner} ${y2Inner}`,
        'Z',
      ].join(' ')

      return [...acc, { slice: { ...s, pathData }, nextAngle: endAngle }]
    }, []).map((item) => item.slice)
  }, [summary.sources])

  return (
    <div className="lst-container">
      {/* Top Header */}
      <header className="lst-header">
        <div className="lst-header-left">
          <div className="lst-header-icon">
            <PieIcon size={24} strokeWidth={2.2} />
          </div>
          <div className="lst-header-title">
            <h1>Leads &amp; Pipeline Architecture</h1>
            <p>End-to-end commercial sourcing, bidding, verification, proposals, and ROI forecasting</p>
          </div>
        </div>

        <div className="lst-header-right">
          <div className="lst-currency-pill">
            <button
              className={`lst-currency-btn ${currency === 'USD' ? 'active' : ''}`}
              onClick={() => setCurrency('USD')}
            >
              $ USD
            </button>
            <button
              className={`lst-currency-btn ${currency === 'PKR' ? 'active' : ''}`}
              onClick={() => setCurrency('PKR')}
            >
              ₨ PKR
            </button>
          </div>

          {onSwitchToOperations && (
            <button className="lst-btn-view-toggle" onClick={onSwitchToOperations}>
              <Layers size={14} /> Operations &amp; P&amp;L
            </button>
          )}

          {canEdit && (
            <button
              className="lst-btn-view-toggle lst-btn-new-lead"
              onClick={() => setIsNewLeadModalOpen(true)}
              title="Add a new construction lead"
            >
              <Plus size={14} /> + New Lead
            </button>
          )}
        </div>
      </header>

      {/* Dynamic Sub-Navigation Bar hosting the 6 Sub-Modules */}
      <nav className="lst-subnav-container" aria-label="Leads and Pipeline Modules">
        <div className="lst-subnav-tabs">
          <button
            type="button"
            className={`lst-subnav-tab ${activeTab === 'sourcing' ? 'active' : ''}`}
            onClick={() => setActiveTab('sourcing')}
          >
            <PieIcon size={14} />
            <span>1. Lead Sourcing &amp; Tracking</span>
            <span className="lst-tab-badge">{leads.length} leads</span>
          </button>

          <button
            type="button"
            className={`lst-subnav-tab ${activeTab === 'tenders' ? 'active' : ''}`}
            onClick={() => setActiveTab('tenders')}
          >
            <FileText size={14} />
            <span>2. Bidding &amp; Tender Management</span>
            <span className="lst-tab-badge">{tenders.length} tenders</span>
          </button>

          <button
            type="button"
            className={`lst-subnav-tab ${activeTab === 'prequalification' ? 'active' : ''}`}
            onClick={() => setActiveTab('prequalification')}
          >
            <CheckSquare size={14} />
            <span>3. Pre-Qualification Checklist</span>
            <span className="lst-tab-badge">
              {leads.filter((l) => l.stage === 'Inquiry').length} pending
            </span>
          </button>

          <button
            type="button"
            className={`lst-subnav-tab ${activeTab === 'proposals' ? 'active' : ''}`}
            onClick={() => setActiveTab('proposals')}
          >
            <GitBranch size={14} />
            <span>4. Estimation &amp; Proposal Pipeline</span>
            <span className="lst-tab-badge">{proposals.length} active</span>
          </button>

          <button
            type="button"
            className={`lst-subnav-tab ${activeTab === 'investors' ? 'active' : ''}`}
            onClick={() => setActiveTab('investors')}
          >
            <Building2 size={14} />
            <span>5. Investor Pool Ledger</span>
            <span className="lst-tab-badge">{investors.length} groups</span>
          </button>

          <button
            type="button"
            className={`lst-subnav-tab ${activeTab === 'roi' ? 'active' : ''}`}
            onClick={() => setActiveTab('roi')}
          >
            <TrendingUp size={14} />
            <span>6. ROI Forecast Engine</span>
            <span className="lst-tab-badge">35% Gross</span>
          </button>
        </div>
      </nav>

      {/* Primary Top Metric Cards (Calculated and updated dynamically) */}
      <section className="lst-kpi-grid">
        {/* Total Leads */}
        <div className="lst-kpi-card" onClick={() => setActiveTab('sourcing')}>
          <div className="lst-kpi-top">
            <div className="lst-kpi-icon lst-icon-blue">
              <UsersRound size={19} strokeWidth={2.2} />
            </div>
          </div>
          <div className="lst-kpi-value">{totalLeadsCount}</div>
          <div className="lst-kpi-label">Total Leads</div>
          <div className="lst-kpi-trend">
            <span>↑ {leads.length} tracked</span>
            <span className="lst-kpi-trend-sub">active pipeline</span>
          </div>
        </div>

        {/* Qualified Opportunities / Bids */}
        <div className="lst-kpi-card" onClick={() => setActiveTab('prequalification')}>
          <div className="lst-kpi-top">
            <div className="lst-kpi-icon lst-icon-green">
              <Filter size={19} strokeWidth={2.2} />
            </div>
          </div>
          <div className="lst-kpi-value">{qualifiedBidsCount}</div>
          <div className="lst-kpi-label">Qualified Bids</div>
          <div className="lst-kpi-trend">
            <span>↑ {leads.filter((l) => l.stage === 'Qualified Estimate').length} verified</span>
            <span className="lst-kpi-trend-sub">checked bids</span>
          </div>
        </div>

        {/* Bids / Estimates */}
        <div className="lst-kpi-card" onClick={() => setActiveTab('proposals')}>
          <div className="lst-kpi-top">
            <div className="lst-kpi-icon lst-icon-purple">
              <FileText size={19} strokeWidth={2.2} />
            </div>
          </div>
          <div className="lst-kpi-value">{totalBidsCount}</div>
          <div className="lst-kpi-label">Bids / Proposals</div>
          <div className="lst-kpi-trend">
            <span>{proposals.filter((p) => p.status === 'Approved for Bidding').length} approved</span>
            <span className="lst-kpi-trend-sub">tender submissions</span>
          </div>
        </div>

        {/* Awarded Projects */}
        <div className="lst-kpi-card" onClick={() => onNavigate('projects')}>
          <div className="lst-kpi-top">
            <div className="lst-kpi-icon lst-icon-orange">
              <Trophy size={19} strokeWidth={2.2} />
            </div>
          </div>
          <div className="lst-kpi-value">{summary.awarded}</div>
          <div className="lst-kpi-label">Awarded Projects</div>
          <div className="lst-kpi-trend">
            <span>↑ 23%</span>
            <span className="lst-kpi-trend-sub">commercial delivery</span>
          </div>
        </div>

        {/* Investor Committed Pool */}
        <div className="lst-kpi-card" onClick={() => setActiveTab('investors')}>
          <div className="lst-kpi-top">
            <div className="lst-kpi-icon lst-icon-purple">
              <Building2 size={19} strokeWidth={2.2} />
            </div>
          </div>
          <div className="lst-kpi-value">{formatMoney(totalCommittedPool, true)}</div>
          <div className="lst-kpi-label">Committed Investor Pool</div>
          <div className="lst-kpi-trend">
            <span>{investors.length} syndicates</span>
            <span className="lst-kpi-trend-sub">total capital</span>
          </div>
        </div>

        {/* Projected Opportunity Value */}
        <div className="lst-kpi-card" onClick={() => setActiveTab('roi')}>
          <div className="lst-kpi-top">
            <div className="lst-kpi-icon lst-icon-dark">
              <CircleDollarSign size={19} strokeWidth={2.2} />
            </div>
          </div>
          <div className="lst-kpi-value">{formatMoney(totalPipelineValue, true)}</div>
          <div className="lst-kpi-label">Est. Opportunity Value</div>
          <div className="lst-kpi-trend">
            <span>35% gross margin target</span>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SUB-MODULE 1: Lead Sourcing & Tracking
         ===================================================================== */}
      {activeTab === 'sourcing' && (
        <>
          {/* Charts Row */}
          <section className="lst-charts-row">
            {/* Donut Chart */}
            <div className="lst-card">
              <div className="lst-card-head">
                <h2 className="lst-card-title">
                  <PieIcon size={18} color="#2563eb" />
                  Lead Source Distribution
                </h2>
                <span className="lst-card-sub">Channels delivering prospects</span>
              </div>

              <div className="lst-donut-layout">
                <div className="lst-donut-wrapper">
                  <svg viewBox="0 0 200 200" className="lst-donut-svg">
                    {donutSlices.map((item) => (
                      <path
                        key={item.source}
                        d={item.pathData}
                        fill={item.color}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                      />
                    ))}
                  </svg>
                  <div className="lst-donut-center">
                    <span className="lst-donut-center-num">{totalLeadsCount}</span>
                    <span className="lst-donut-center-lbl">Total Leads</span>
                  </div>
                </div>

                <div className="lst-legend-list">
                  {summary.sources.map((s) => (
                    <div key={s.source} className="lst-legend-item">
                      <span className="lst-legend-dot" style={{ background: s.color }} />
                      <span className="lst-legend-name">{s.source}</span>
                      <span className="lst-legend-pct">{s.percentage}%</span>
                      <span className="lst-legend-count">{s.totalLeads} leads</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pipeline Stage Funnel */}
            <div className="lst-card">
              <div className="lst-card-head">
                <h2 className="lst-card-title">
                  <BarChart3 size={18} color="#10b981" />
                  Conversion Funnel by Pipeline Stage
                </h2>
                <span className="lst-card-sub">Conversion across lifecycle</span>
              </div>

              <div style={{ display: 'grid', gap: '10px', padding: '16px 0' }}>
                {defaultPipeline.map((step) => (
                  <div key={step.stage} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <strong style={{ color: '#1e293b' }}>{step.stage}</strong>
                      <span style={{ color: '#64748b' }}>
                        {step.count} leads ({step.percentage}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${step.percentage}%`,
                          height: '100%',
                          background: step.percentage > 50 ? '#2563eb' : step.percentage > 25 ? '#f59e0b' : '#10b981',
                          borderRadius: '5px',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Construction Dummy Leads Data Table */}
          <section className="lst-card">
            <div className="lst-card-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 className="lst-card-title">
                  <UsersRound size={18} color="#0f172a" />
                  High-Value Construction Leads ({leads.length})
                </h2>
                <span className="lst-card-sub">Commercial &amp; residential opportunities</span>
              </div>
              <button
                type="button"
                className="lst-btn-primary"
                onClick={() => setIsNewLeadModalOpen(true)}
              >
                <Plus size={14} /> + New Lead
              </button>
            </div>

            <div className="lst-table-wrap">
              <table className="lst-table">
                <thead>
                  <tr>
                    <th>LEAD ID</th>
                    <th>CLIENT / COMPANY</th>
                    <th>CONTACT &amp; LOCATION</th>
                    <th>SOURCE</th>
                    <th>PROJECTED VALUE</th>
                    <th>CURRENT STAGE</th>
                    <th>PRE-QUAL STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id}>
                      <td><strong>{lead.id}</strong></td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <strong style={{ color: '#0f172a' }}>{lead.clientName}</strong>
                          <small style={{ color: '#64748b', fontSize: '11px' }}>{lead.scope}</small>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ color: '#334155' }}>{lead.contactNumber}</span>
                          <small style={{ color: '#94a3b8', fontSize: '11px' }}>{lead.location}</small>
                        </div>
                      </td>
                      <td>
                        <span className="lst-badge" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                          {lead.source}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a', fontWeight: 700 }}>
                          {formatMoney(lead.projectedValue)}
                        </strong>
                      </td>
                      <td>
                        <span
                          className={`lst-badge ${
                            lead.stage === 'Qualified Estimate'
                              ? 'lst-badge-open'
                              : lead.stage === 'Inquiry'
                              ? 'lst-badge-evaluation'
                              : 'lst-badge-submitted'
                          }`}
                        >
                          {lead.stage}
                        </span>
                      </td>
                      <td>
                        {lead.stage === 'Qualified Estimate' ? (
                          <span style={{ color: '#16a34a', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                            <CheckCircle2 size={13} /> Verified
                          </span>
                        ) : (
                          <span style={{ color: '#d97706', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                            <Clock size={13} /> Pending Check
                          </span>
                        )}
                      </td>
                      <td>
                        {lead.stage === 'Inquiry' ? (
                          <button
                            type="button"
                            className="lst-btn-action lst-btn-revision"
                            onClick={() => {
                              setSelectedLeadId(lead.id)
                              setActiveTab('prequalification')
                            }}
                          >
                            Pre-Qualify <ArrowRight size={12} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="lst-btn-action lst-btn-approve"
                            onClick={() => {
                              setActiveTab('proposals')
                            }}
                          >
                            View Proposal
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* =====================================================================
          SUB-MODULE 2: Bidding & Tender Management
         ===================================================================== */}
      {activeTab === 'tenders' && (
        <section className="lst-tender-panel">
          <div className="lst-table-toolbar">
            <div className="lst-search-wrap">
              <Search size={15} />
              <input
                type="text"
                className="lst-search-input"
                placeholder="Filter by Authority Name or Tender ID in real-time..."
                value={tenderSearch}
                onChange={(e) => setTenderSearch(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                Showing {filteredTenders.length} of {tenders.length} tenders
              </span>
              <button
                type="button"
                className="lst-btn-primary"
                onClick={() => setIsNewTenderModalOpen(true)}
              >
                <Plus size={14} /> + New Tender
              </button>
            </div>
          </div>

          <div className="lst-table-wrap">
            <table className="lst-table">
              <thead>
                <tr>
                  <th>TENDER ID</th>
                  <th>AUTHORITY NAME</th>
                  <th>PROJECT TITLE &amp; SCOPE</th>
                  <th>BID SUBMISSION DEADLINE</th>
                  <th>EARNEST MONEY DEPOSITED</th>
                  <th>BID STATUS</th>
                  <th>STATUS TOGGLE</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenders.map((tender) => (
                  <tr key={tender.tenderId}>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{tender.tenderId}</strong>
                    </td>
                    <td>
                      <strong style={{ color: '#1e293b' }}>{tender.authorityName}</strong>
                    </td>
                    <td>
                      <span style={{ color: '#475569', fontSize: '12px' }}>{tender.projectTitle}</span>
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={13} color="#f59e0b" />
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>
                          {tender.submissionDeadline}
                        </span>
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a', fontWeight: 700 }}>
                        {formatMoney(tender.earnestMoney)}
                      </strong>
                    </td>
                    <td>
                      <span
                        className={`lst-badge ${
                          tender.bidStatus === 'Open'
                            ? 'lst-badge-open'
                            : tender.bidStatus === 'Submitted'
                            ? 'lst-badge-submitted'
                            : 'lst-badge-evaluation'
                        }`}
                      >
                        {tender.bidStatus}
                      </span>
                    </td>
                    <td>
                      <select
                        value={tender.bidStatus}
                        onChange={(e) => {
                          const nextStatus = e.target.value as any
                          setTenders((prev) =>
                            prev.map((t) => (t.tenderId === tender.tenderId ? { ...t, bidStatus: nextStatus } : t))
                          )
                        }}
                        style={{
                          height: '28px',
                          fontSize: '11px',
                          padding: '0 6px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          color: '#334155',
                          fontWeight: 600,
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
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                      No tenders match your search query "{tenderSearch}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* =====================================================================
          SUB-MODULE 3: Pre-Qualification Checklist
         ===================================================================== */}
      {activeTab === 'prequalification' && (
        <section className="lst-prequal-card">
          <div className="lst-prequal-head">
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                Lead Pre-Qualification &amp; Solvency Gate
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                Multi-step compliance &amp; capability filter required before promoting an inquiry to a technical bid
              </p>
            </div>

            <div className="lst-prequal-lead-select">
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Select Candidate Lead:</span>
              <select
                value={selectedLeadId}
                onChange={(e) => {
                  setSelectedLeadId(e.target.value)
                  setPrequalAlert(null)
                }}
              >
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.id} — {lead.clientName} ({lead.stage})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Lead Summary Card */}
          {activePrequalLead && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: '12px',
                padding: '14px 18px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                marginBottom: '20px',
              }}
            >
              <div>
                <small style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Client</small>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{activePrequalLead.clientName}</div>
              </div>
              <div>
                <small style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Project Scope</small>
                <div style={{ color: '#334155', fontSize: '12px' }}>{activePrequalLead.scope}</div>
              </div>
              <div>
                <small style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Projected Value</small>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{formatMoney(activePrequalLead.projectedValue)}</div>
              </div>
              <div>
                <small style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Current Status</small>
                <div>
                  <span
                    className={`lst-badge ${
                      activePrequalLead.stage === 'Qualified Estimate'
                        ? 'lst-badge-open'
                        : 'lst-badge-evaluation'
                    }`}
                  >
                    {activePrequalLead.stage}
                  </span>
                </div>
              </div>
            </div>
          )}

          {prequalAlert && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: prequalAlert.type === 'success' ? '#f0fdf4' : '#fef2f2',
                color: prequalAlert.type === 'success' ? '#166534' : '#991b1b',
                border: `1px solid ${prequalAlert.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
              }}
            >
              {prequalAlert.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{prequalAlert.message}</span>
            </div>
          )}

          {/* Multi-step Checklist Form */}
          <form onSubmit={handlePrequalSubmit}>
            <div className="lst-checklist-items">
              {/* Step 1: Technical Eligibility */}
              <label className={`lst-checklist-row ${checklist.technicalEligibility ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={checklist.technicalEligibility}
                  onChange={(e) => setChecklist((prev) => ({ ...prev, technicalEligibility: e.target.checked }))}
                />
                <div className="lst-checklist-text">
                  <h4>Step 1: Technical Eligibility Verified</h4>
                  <p>
                    Engineering team has verified machinery inventory, heavy equipment accessibility, site soil topography report, and assigned certified professional engineers.
                  </p>
                </div>
              </label>

              {/* Step 2: Legal Compliance */}
              <label className={`lst-checklist-row ${checklist.legalCompliance ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={checklist.legalCompliance}
                  onChange={(e) => setChecklist((prev) => ({ ...prev, legalCompliance: e.target.checked }))}
                />
                <div className="lst-checklist-text">
                  <h4>Step 2: Legal Compliance Checked</h4>
                  <p>
                    Pakistan Engineering Council (PEC) license valid for category, SECP corporate standing verified, active NTN/STRN tax filer status, and no debarment history.
                  </p>
                </div>
              </label>

              {/* Step 3: Financial Solvency */}
              <label className={`lst-checklist-row ${checklist.financialSolvency ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={checklist.financialSolvency}
                  onChange={(e) => setChecklist((prev) => ({ ...prev, financialSolvency: e.target.checked }))}
                />
                <div className="lst-checklist-text">
                  <h4>Step 3: Financial Solvency Proven</h4>
                  <p>
                    Audited 3-year turnover accounts cleared, commercial bank credit line exceeding 25M PKR certified, and adequate liquidity to cover mobilization costs.
                  </p>
                </div>
              </label>

              {/* Step 4: Client Budget */}
              <label className={`lst-checklist-row ${checklist.clientBudget ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={checklist.clientBudget}
                  onChange={(e) => setChecklist((prev) => ({ ...prev, clientBudget: e.target.checked }))}
                />
                <div className="lst-checklist-text">
                  <h4>Step 4: Client Budget Confirmed</h4>
                  <p>
                    Client verified proof of project financing or commercial loan approval; agreed to 20% mobilization advance payment security before ground-breaking.
                  </p>
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Required: 4 of 4 verification points checked before promotion
              </span>
              <button type="submit" className="lst-btn-primary" style={{ padding: '0 24px' }}>
                <FileCheck size={15} /> Confirm &amp; Promote to Qualified Estimate
              </button>
            </div>
          </form>
        </section>
      )}

      {/* =====================================================================
          SUB-MODULE 4: Estimation & Proposal Pipeline
         ===================================================================== */}
      {activeTab === 'proposals' && (
        <section className="lst-queue-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div>
              <h2 style={{ margin: '0 0 2px', fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                Technical Proposal Workflow Queue
              </h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Review, approve for bidding, or send back for engineering revision
              </span>
            </div>
            <span className="lst-badge lst-badge-submitted">
              {proposals.length} Proposals in Queue
            </span>
          </div>

          {proposals.map((item) => (
            <div key={item.id} className="lst-queue-card">
              <div className="lst-queue-main">
                <div className="lst-queue-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong>{item.id} — {item.projectTitle}</strong>
                    <span
                      className={`lst-badge ${
                        item.status === 'Approved for Bidding'
                          ? 'lst-badge-open'
                          : item.status === 'Revision Required'
                          ? 'lst-badge-evaluation'
                          : item.status === 'Archived'
                          ? 'lst-badge-archived'
                          : 'lst-badge-submitted'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <span>
                    Client: <strong>{item.clientName}</strong> · Lead Estimator: {item.leadEstimator} · Target Margin: <strong>{item.targetMarginPct}%</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <small style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Estimated Cost</small>
                    <span style={{ color: '#64748b', fontSize: '12px' }}>{formatMoney(item.totalEstimatedCost)}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <small style={{ color: '#64748b', fontSize: '11px', display: 'block', fontWeight: 700 }}>Bid Price</small>
                    <strong style={{ color: '#0f172a', fontSize: '14px', fontWeight: 800 }}>{formatMoney(item.bidPrice)}</strong>
                  </div>

                  <div className="lst-queue-actions">
                    <button
                      type="button"
                      className="lst-btn-action lst-btn-approve"
                      onClick={() => handleProposalAction(item.id, 'Approve for Bidding')}
                      title="Approve technical proposal for official bidding"
                    >
                      <Check size={12} /> Approve for Bidding
                    </button>
                    <button
                      type="button"
                      className="lst-btn-action lst-btn-revision"
                      onClick={() => handleProposalAction(item.id, 'Send Back for Revision')}
                      title="Request engineering revisions"
                    >
                      <MessageSquare size={12} /> Send Back for Revision
                    </button>
                    <button
                      type="button"
                      className="lst-btn-action lst-btn-archive"
                      onClick={() => handleProposalAction(item.id, 'Archive')}
                      title="Archive proposal"
                    >
                      <Archive size={12} /> Archive
                    </button>
                  </div>
                </div>
              </div>

              {/* Conditionally rendered comment textbox */}
              {activeRevisionId === item.id && (
                <div className="lst-revision-comment-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#92400e' }}>
                    <Edit3 size={14} /> Specify Revision Instructions for {item.leadEstimator}:
                  </div>
                  <textarea
                    placeholder="e.g. Recalculate concrete volumetric takeoffs for foundation footings, cross-check steel rebar unit rates, and verify 15% margin threshold."
                    value={revisionNoteInput}
                    onChange={(e) => setRevisionNoteInput(e.target.value)}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      className="lst-btn-secondary"
                      onClick={() => {
                        setActiveRevisionId(null)
                        setRevisionNoteInput('')
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="lst-btn-primary"
                      onClick={() => handleSaveRevisionComment(item.id)}
                    >
                      <Send size={13} /> Submit Revision Notes
                    </button>
                  </div>
                </div>
              )}

              {/* Show recorded revision note if present */}
              {item.revisionComment && activeRevisionId !== item.id && item.status === 'Revision Required' && (
                <div style={{ marginTop: '10px', padding: '8px 12px', background: '#fffbeb', borderRadius: '4px', fontSize: '11.5px', color: '#92400e', borderLeft: '3px solid #f59e0b' }}>
                  <strong>Revision Comment:</strong> {item.revisionComment}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* =====================================================================
          SUB-MODULE 5: Investor Pool Ledger
         ===================================================================== */}
      {activeTab === 'investors' && (
        <section>
          {/* Summary Calculation Formula Widget */}
          <div className="lst-formula-widget">
            <div className="lst-formula-box highlight">
              <span className="lst-formula-label">Total Current Committed Pool</span>
              <span className="lst-formula-value">{formatMoney(totalCommittedPool)}</span>
              <span className="lst-formula-sub">Formula: ∑ (Investor.CapitalCommitted)</span>
            </div>

            <div className="lst-formula-box">
              <span className="lst-formula-label">Capital Disbursed to Date</span>
              <span className="lst-formula-value">{formatMoney(totalDisbursedPool)}</span>
              <span className="lst-formula-sub">
                {((totalDisbursedPool / totalCommittedPool) * 100).toFixed(1)}% of total pool deployed
              </span>
            </div>

            <div className="lst-formula-box">
              <span className="lst-formula-label">Undisbursed Liquidity Reserve</span>
              <span className="lst-formula-value">{formatMoney(totalCommittedPool - totalDisbursedPool)}</span>
              <span className="lst-formula-sub">Available capital for project cash calls</span>
            </div>

            <div className="lst-formula-box">
              <span className="lst-formula-label">Active Funding Syndicates</span>
              <span className="lst-formula-value">{investors.length} Groups</span>
              <span className="lst-formula-sub">
                Average Equity Share: {(investors.reduce((s, i) => s + i.equityShare, 0) / investors.length).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="lst-card">
            <div className="lst-card-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 className="lst-card-title">
                  <Building2 size={18} color="#0f172a" />
                  Investor Capital Ledger
                </h2>
                <span className="lst-card-sub">Real-time accounting of project syndication</span>
              </div>
              <button
                type="button"
                className="lst-btn-primary"
                onClick={() => setIsNewInvestorModalOpen(true)}
              >
                <Plus size={14} /> + Add Investor Position
              </button>
            </div>

            <div className="lst-table-wrap">
              <table className="lst-table">
                <thead>
                  <tr>
                    <th>INVESTOR ID</th>
                    <th>INVESTOR NAME</th>
                    <th>FUNDED PROJECT</th>
                    <th>CAPITAL COMMITTED</th>
                    <th>CAPITAL DISBURSED</th>
                    <th>UNDISBURSED BALANCE</th>
                    <th>EQUITY SHARE</th>
                    <th>DEPLOYMENT STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {investors.map((inv) => {
                    const remaining = inv.capitalCommitted - inv.capitalDisbursed
                    const pct = ((inv.capitalDisbursed / inv.capitalCommitted) * 100).toFixed(0)
                    return (
                      <tr key={inv.id}>
                        <td><strong>{inv.id}</strong></td>
                        <td>
                          <strong style={{ color: '#0f172a' }}>{inv.investorName}</strong>
                        </td>
                        <td>
                          <span style={{ color: '#2563eb', fontWeight: 600 }}>{inv.fundedProject}</span>
                        </td>
                        <td>
                          <strong style={{ color: '#0f172a' }}>{formatMoney(inv.capitalCommitted)}</strong>
                        </td>
                        <td>
                          <span style={{ color: '#16a34a', fontWeight: 600 }}>
                            {formatMoney(inv.capitalDisbursed)}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: '#64748b' }}>{formatMoney(remaining)}</span>
                        </td>
                        <td>
                          <span className="lst-badge lst-badge-submitted" style={{ fontWeight: 700 }}>
                            {inv.equityShare}% Equity
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '60px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: '#16a34a' }} />
                            </div>
                            <small style={{ color: '#475569', fontSize: '11px' }}>{pct}%</small>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          SUB-MODULE 6: ROI Forecast Engine
         ===================================================================== */}
      {activeTab === 'roi' && (
        <section className="lst-roi-panel">
          {/* Logic Controller Card */}
          <div className="lst-roi-controller-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 2px', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  Project ROI Calculations Engine
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Automatic 65% cost factor deduction &amp; margin projection
                </span>
              </div>

              {/* Conversion Toggle Button (USD / PKR) with static scale factor (1 USD = 278 PKR) */}
              <div className="lst-currency-pill">
                <button
                  type="button"
                  className={`lst-currency-btn ${roiCurrency === 'USD' ? 'active' : ''}`}
                  onClick={() => setRoiCurrency('USD')}
                  title="Cross-currency conversion (1 USD = 278 PKR)"
                >
                  $ USD
                </button>
                <button
                  type="button"
                  className={`lst-currency-btn ${roiCurrency === 'PKR' ? 'active' : ''}`}
                  onClick={() => setRoiCurrency('PKR')}
                  title="Cross-currency conversion (1 USD = 278 PKR)"
                >
                  ₨ PKR
                </button>
              </div>
            </div>

            {/* Project Selection / Custom Input */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Preset Candidate Project:
              </label>
              <select
                style={{ width: '100%', height: '36px', padding: '0 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                onChange={(e) => {
                  if (e.target.value) setRoiProjectValue(Number(e.target.value))
                }}
              >
                <option value="45000000">DHA Phase 9 Commercial Plaza (₨ 45,000,000)</option>
                <option value="82000000">Gulberg Business Hub Civil Works (₨ 82,000,000)</option>
                <option value="95000000">Multan Road Industrial Warehouse (₨ 95,000,000)</option>
                <option value="115000000">Gwadar Marine Infrastructure (₨ 115,000,000)</option>
                <option value="28500000">Lake City Luxury Villa Turnkey (₨ 28,500,000)</option>
              </select>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Or Custom Estimated Project Value (in PKR):
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  min="1000000"
                  step="500000"
                  value={roiProjectValue}
                  onChange={(e) => setRoiProjectValue(Number(e.target.value) || 0)}
                  style={{ flex: 1, height: '36px', padding: '0 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 700 }}
                />
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                  ≈ {formatRoiMoney(roiProjectValue)}
                </span>
              </div>
            </div>

            {/* Target Material & Labor Cost Factor Slider */}
            <div style={{ marginBottom: '18px', padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>
                  Target Material &amp; Labor Cost Factor:
                </span>
                <strong style={{ color: '#ea580c', fontSize: '13px' }}>
                  {(roiCostFactor * 100).toFixed(0)}%
                </strong>
              </div>
              <input
                type="range"
                min="0.50"
                max="0.80"
                step="0.01"
                value={roiCostFactor}
                onChange={(e) => setRoiCostFactor(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#ea580c' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#94a3b8', marginTop: '4px' }}>
                <span>50% (High Efficiency)</span>
                <span>65% (Mock Benchmark)</span>
                <span>80% (Conservative)</span>
              </div>
            </div>

            {/* Output Metric Strip */}
            <div className="lst-roi-metric-strip">
              <div className="lst-roi-metric-item lst-roi-metric-cost">
                <small style={{ fontSize: '11px', fontWeight: 700 }}>
                  TOTAL COST FACTOR ({(roiCostFactor * 100).toFixed(0)}%)
                </small>
                <strong style={{ fontSize: '17px', fontWeight: 800 }}>
                  {formatRoiMoney(roiCalculations.targetCost)}
                </strong>
                <span style={{ fontSize: '10.5px' }}>Material, labor &amp; direct civil costs</span>
              </div>

              <div className="lst-roi-metric-item lst-roi-metric-margin">
                <small style={{ fontSize: '11px', fontWeight: 700 }}>
                  PROJECTED GROSS MARGIN ({roiCalculations.marginPct.toFixed(0)}%)
                </small>
                <strong style={{ fontSize: '17px', fontWeight: 800 }}>
                  {formatRoiMoney(roiCalculations.projectedMargin)}
                </strong>
                <span style={{ fontSize: '10.5px' }}>Calculated gross return</span>
              </div>
            </div>

            {/* Visual Margin Bar */}
            <div className="lst-roi-bar-wrap">
              <div
                className="lst-roi-bar-cost"
                style={{ width: `${(roiCostFactor * 100).toFixed(0)}%` }}
              >
                Cost Factor ({(roiCostFactor * 100).toFixed(0)}%)
              </div>
              <div
                className="lst-roi-bar-margin"
                style={{ width: `${roiCalculations.marginPct.toFixed(0)}%` }}
              >
                Gross Margin ({roiCalculations.marginPct.toFixed(0)}%)
              </div>
            </div>
          </div>

          {/* Results & Breakdown Card */}
          <div className="lst-roi-results-card">
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              Automatic Cost &amp; Profit Yield Breakdown
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Base Scale: 1 USD = {USD_PKR_RATE} PKR · Printed in {roiCurrency}
            </span>

            <div style={{ marginTop: '18px', display: 'grid', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '6px' }}>
                <div>
                  <strong style={{ color: '#1e293b', fontSize: '12.5px' }}>Direct Civil &amp; Structural Materials (40%)</strong>
                  <div style={{ color: '#64748b', fontSize: '11px' }}>Cement, Grade-60 deformed rebar, sand, aggregates &amp; bricks</div>
                </div>
                <strong style={{ color: '#0f172a', fontSize: '13px' }}>
                  {formatRoiMoney(roiCalculations.civilMaterials)}
                </strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '6px' }}>
                <div>
                  <strong style={{ color: '#1e293b', fontSize: '12.5px' }}>Direct Skilled &amp; Unskilled Labor (25%)</strong>
                  <div style={{ color: '#64748b', fontSize: '11px' }}>Masons, steel fixers, carpenters, site supervisors &amp; safety staff</div>
                </div>
                <strong style={{ color: '#0f172a', fontSize: '13px' }}>
                  {formatRoiMoney(roiCalculations.directLabor)}
                </strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '6px' }}>
                <div>
                  <strong style={{ color: '#1e293b', fontSize: '12.5px' }}>Site Machinery &amp; Temporary Works (10%)</strong>
                  <div style={{ color: '#64748b', fontSize: '11px' }}>Tower cranes, batching plants, scaffolding &amp; fuel logistics</div>
                </div>
                <strong style={{ color: '#0f172a', fontSize: '13px' }}>
                  {formatRoiMoney(roiCalculations.overheads)}
                </strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px' }}>
                <div>
                  <strong style={{ color: '#166534', fontSize: '13px' }}>Net Projected Contractor Profit (25%)</strong>
                  <div style={{ color: '#15803d', fontSize: '11px' }}>Retained earnings after direct expenditure &amp; site overhead</div>
                </div>
                <strong style={{ color: '#166534', fontSize: '16px', fontWeight: 800 }}>
                  {formatRoiMoney(roiCalculations.netProfit)}
                </strong>
              </div>
            </div>

            <div style={{ marginTop: '20px', padding: '12px', background: '#eff6ff', borderRadius: '6px', fontSize: '11.5px', color: '#1e40af', lineHeight: 1.5 }}>
              <strong>Calculation Controller Note:</strong> Cross-currency mathematics are evaluated in real time via the static parity scale factor (1 USD = {USD_PKR_RATE} PKR). Changing currency re-evaluates all displayed integers with zero component redraw failure.
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          Interactive Modal: + New Lead (Sub-Module 1)
         ===================================================================== */}
      {isNewLeadModalOpen && (
        <div className="lst-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsNewLeadModalOpen(false) }}>
          <div className="lst-modal-card" role="dialog" aria-modal="true">
            <div className="lst-modal-head">
              <h3>Register New Construction Lead</h3>
              <button
                type="button"
                className="lst-modal-close"
                onClick={() => setIsNewLeadModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateLead}>
              <div className="lst-modal-body">
                <div className="lst-form-grid">
                  <label className="lst-form-label lst-form-full">
                    <span>Client Name *</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Malik Riaz / Bahria Town"
                      value={newLeadForm.clientName}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, clientName: e.target.value })}
                    />
                  </label>

                  <label className="lst-form-label">
                    <span>Email Address *</span>
                    <input
                      type="email"
                      required
                      placeholder="client@company.com"
                      value={newLeadForm.email}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    />
                  </label>

                  <label className="lst-form-label">
                    <span>Contact Number *</span>
                    <input
                      type="tel"
                      required
                      placeholder="+92 300 1234567"
                      value={newLeadForm.contactNumber}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, contactNumber: e.target.value })}
                    />
                  </label>

                  <label className="lst-form-label">
                    <span>Projected Value (PKR) *</span>
                    <input
                      type="number"
                      required
                      min="100000"
                      step="50000"
                      placeholder="e.g. 45000000"
                      value={newLeadForm.projectedValue}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, projectedValue: e.target.value })}
                    />
                  </label>

                  <label className="lst-form-label">
                    <span>Lead Source Dropdown *</span>
                    <select
                      value={newLeadForm.source}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, source: e.target.value as any })}
                    >
                      <option value="Website">Website</option>
                      <option value="Tender">Tender</option>
                      <option value="Referral">Referral</option>
                      <option value="Paid Ad">Paid Ad</option>
                    </select>
                  </label>

                  <label className="lst-form-label lst-form-full">
                    <span>Scope / Work Type Description</span>
                    <textarea
                      placeholder="e.g. Turnkey RCC frame structure, basement waterproofing and MEP fitout"
                      value={newLeadForm.scope}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, scope: e.target.value })}
                    />
                  </label>
                </div>
              </div>

              <div className="lst-modal-foot">
                <button
                  type="button"
                  className="lst-btn-secondary"
                  onClick={() => setIsNewLeadModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="lst-btn-primary">
                  <Check size={14} /> Save &amp; Recalculate Metrics
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          Interactive Modal: + New Tender (Sub-Module 2)
         ===================================================================== */}
      {isNewTenderModalOpen && (
        <div className="lst-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsNewTenderModalOpen(false) }}>
          <div className="lst-modal-card" role="dialog" aria-modal="true">
            <div className="lst-modal-head">
              <h3>Create Tender Tracker Entry</h3>
              <button
                type="button"
                className="lst-modal-close"
                onClick={() => setIsNewTenderModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTender}>
              <div className="lst-modal-body">
                <div className="lst-form-grid">
                  <label className="lst-form-label lst-form-full">
                    <span>Authority Name *</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. National Highway Authority (NHA)"
                      value={newTenderForm.authorityName}
                      onChange={(e) => setNewTenderForm({ ...newTenderForm, authorityName: e.target.value })}
                    />
                  </label>

                  <label className="lst-form-label lst-form-full">
                    <span>Project Title &amp; Scope *</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Islamabad Bypass Package 2 Flyover Construction"
                      value={newTenderForm.projectTitle}
                      onChange={(e) => setNewTenderForm({ ...newTenderForm, projectTitle: e.target.value })}
                    />
                  </label>

                  <label className="lst-form-label">
                    <span>Bid Submission Deadline *</span>
                    <input
                      type="date"
                      required
                      value={newTenderForm.submissionDeadline}
                      onChange={(e) => setNewTenderForm({ ...newTenderForm, submissionDeadline: e.target.value })}
                    />
                  </label>

                  <label className="lst-form-label">
                    <span>Earnest Money Deposited (PKR) *</span>
                    <input
                      type="number"
                      required
                      min="50000"
                      placeholder="e.g. 5000000"
                      value={newTenderForm.earnestMoney}
                      onChange={(e) => setNewTenderForm({ ...newTenderForm, earnestMoney: e.target.value })}
                    />
                  </label>

                  <label className="lst-form-label lst-form-full">
                    <span>Bid Status *</span>
                    <select
                      value={newTenderForm.bidStatus}
                      onChange={(e) => setNewTenderForm({ ...newTenderForm, bidStatus: e.target.value as any })}
                    >
                      <option value="Open">Open</option>
                      <option value="Submitted">Submitted</option>
                      <option value="Evaluation">Evaluation</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="lst-modal-foot">
                <button
                  type="button"
                  className="lst-btn-secondary"
                  onClick={() => setIsNewTenderModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="lst-btn-primary">
                  <Check size={14} /> Add Tender
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          Interactive Modal: + New Investor (Sub-Module 5)
         ===================================================================== */}
      {isNewInvestorModalOpen && (
        <div className="lst-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsNewInvestorModalOpen(false) }}>
          <div className="lst-modal-card" role="dialog" aria-modal="true">
            <div className="lst-modal-head">
              <h3>Record Investor Funding Position</h3>
              <button
                type="button"
                className="lst-modal-close"
                onClick={() => setIsNewInvestorModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddInvestor}>
              <div className="lst-modal-body">
                <div className="lst-form-grid">
                  <label className="lst-form-label lst-form-full">
                    <span>Investor Name *</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Al-Falah Real Estate Syndicate"
                      value={newInvestorForm.investorName}
                      onChange={(e) => setNewInvestorForm({ ...newInvestorForm, investorName: e.target.value })}
                    />
                  </label>

                  <label className="lst-form-label lst-form-full">
                    <span>Funded Project (Dropdown) *</span>
                    <select
                      value={newInvestorForm.fundedProject}
                      onChange={(e) => setNewInvestorForm({ ...newInvestorForm, fundedProject: e.target.value })}
                    >
                      <option value="Gulberg Business Hub">Gulberg Business Hub</option>
                      <option value="Bahria Heights Tower B">Bahria Heights Tower B</option>
                      <option value="DHA Phase 9 Commercial Plaza">DHA Phase 9 Commercial Plaza</option>
                      <option value="Multan Road Logistics Warehouse">Multan Road Logistics Warehouse</option>
                      <option value="Lake City Luxury Villas Block M">Lake City Luxury Villas Block M</option>
                    </select>
                  </label>

                  <label className="lst-form-label">
                    <span>Capital Committed (PKR) *</span>
                    <input
                      type="number"
                      required
                      min="1000000"
                      placeholder="e.g. 50000000"
                      value={newInvestorForm.capitalCommitted}
                      onChange={(e) => setNewInvestorForm({ ...newInvestorForm, capitalCommitted: e.target.value })}
                    />
                  </label>

                  <label className="lst-form-label">
                    <span>Capital Disbursed (PKR) *</span>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="e.g. 30000000"
                      value={newInvestorForm.capitalDisbursed}
                      onChange={(e) => setNewInvestorForm({ ...newInvestorForm, capitalDisbursed: e.target.value })}
                    />
                  </label>

                  <label className="lst-form-label lst-form-full">
                    <span>Equity Share (%) *</span>
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      step="0.1"
                      placeholder="e.g. 25.0"
                      value={newInvestorForm.equityShare}
                      onChange={(e) => setNewInvestorForm({ ...newInvestorForm, equityShare: e.target.value })}
                    />
                  </label>
                </div>
              </div>

              <div className="lst-modal-foot">
                <button
                  type="button"
                  className="lst-btn-secondary"
                  onClick={() => setIsNewInvestorModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="lst-btn-primary">
                  <Check size={14} /> Commit Position &amp; Recalculate Pool
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
