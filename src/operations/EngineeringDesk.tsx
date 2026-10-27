import { useState, useMemo, type FormEvent } from 'react'
import {
  Compass, Calculator, Layers, Plus, Search, Download, Trash2,
  Boxes, FileSpreadsheet, Copy, Check, Eye, X, FileCode, Printer,
  Building, Wrench
} from 'lucide-react'
import './lead-tracking.css'

// ============================================================================
// Types
// ============================================================================

export type EngineeringTab = 'boq' | 'calculator' | 'bim'

export interface BoqItem {
  id: string
  itemCode: string
  projectId: string
  projectName: string
  category: 'Earthwork' | 'Concrete & RCC' | 'Masonry' | 'Steel' | 'Finishing' | 'MEP'
  description: string
  unit: string
  quantity: number
  rate: number
  amount: number
  notes?: string
}

export interface DrawingItem {
  id: string
  drawingNo: string
  title: string
  projectId: string
  projectName: string
  discipline: 'Architectural' | 'Structural' | 'MEP' | 'BIM 3D' | 'Civil'
  fileFormat: 'DWG' | 'RVT' | 'IFC' | 'PDF' | 'DXF'
  revision: string
  scale: string
  sheetSize: string
  fileSize: string
  status: 'Issued for Construction' | 'Approved' | 'Under Review' | 'Tender Archive'
  author: string
  uploadDate: string
}

interface ProjectOption {
  id: string | number
  name: string
  project_code?: string
}

// ============================================================================
// Initial Seed Data
// ============================================================================

const defaultProjects: ProjectOption[] = [
  { id: 'PRJ-101', name: 'Gulberg Executive Tower (G+18)' },
  { id: 'PRJ-102', name: 'DHA Commercial Complex Ring Road' },
  { id: 'PRJ-103', name: 'Multan Industrial Logistics Warehouse' },
  { id: 'PRJ-104', name: 'Lake City Luxury Residential Villas' },
]

const initialBoqItems: BoqItem[] = [
  {
    id: 'BOQ-1',
    itemCode: 'BOQ-STR-01',
    projectId: 'PRJ-101',
    projectName: 'Gulberg Executive Tower (G+18)',
    category: 'Earthwork',
    description: 'Bulk excavation in all types of soil including shoring, dewatering & disposal up to 8km',
    unit: 'm³',
    quantity: 14500,
    rate: 520,
    amount: 14500 * 520,
    notes: 'Approved geotechnical soil report baseline'
  },
  {
    id: 'BOQ-2',
    itemCode: 'BOQ-STR-02',
    projectId: 'PRJ-101',
    projectName: 'Gulberg Executive Tower (G+18)',
    category: 'Concrete & RCC',
    description: 'Raft foundation concrete pouring Class A (1:2:4) with superplasticizer & waterstops',
    unit: 'm³',
    quantity: 4200,
    rate: 17200,
    amount: 4200 * 17200,
    notes: 'Continuous 36-hour pour planned'
  },
  {
    id: 'BOQ-3',
    itemCode: 'BOQ-STR-03',
    projectId: 'PRJ-101',
    projectName: 'Gulberg Executive Tower (G+18)',
    category: 'Steel',
    description: 'Deformed High-Strength Steel Bar Grade 60 ASTM A615 with mechanical couplers',
    unit: 'Ton',
    quantity: 480,
    rate: 268000,
    amount: 480 * 268000,
    notes: 'Mughal / Amreli Steel test certificates required'
  },
  {
    id: 'BOQ-4',
    itemCode: 'BOQ-MSN-04',
    projectId: 'PRJ-102',
    projectName: 'DHA Commercial Complex Ring Road',
    category: 'Masonry',
    description: 'Solid First Class burnt clay brickwork 9-inch thick in 1:4 cement-sand mortar',
    unit: 'm³',
    quantity: 1850,
    rate: 14500,
    amount: 1850 * 14500,
    notes: 'Pre-soaked clay bricks minimum 1500 psi'
  },
  {
    id: 'BOQ-5',
    itemCode: 'BOQ-FIN-05',
    projectId: 'PRJ-102',
    projectName: 'DHA Commercial Complex Ring Road',
    category: 'Finishing',
    description: 'Porcelain floor tiles 600x600mm heavy duty with epoxy grout & leveling spacers',
    unit: 'Sft',
    quantity: 32000,
    rate: 340,
    amount: 32000 * 340,
    notes: 'Anti-skid Grade IV commercial'
  },
  {
    id: 'BOQ-6',
    itemCode: 'BOQ-MEP-06',
    projectId: 'PRJ-104',
    projectName: 'Lake City Luxury Residential Villas',
    category: 'MEP',
    description: 'PPR-C Class 20 cold & hot water piping installation with pressure testing 15 bar',
    unit: 'Rft',
    quantity: 6800,
    rate: 420,
    amount: 6800 * 420,
    notes: 'Concealed piping in chase cut walls'
  },
]

const initialDrawings: DrawingItem[] = [
  {
    id: 'DWG-1',
    drawingNo: 'STR-FND-01',
    title: 'Raft Foundation General Layout & Rebar Schedule',
    projectId: 'PRJ-101',
    projectName: 'Gulberg Executive Tower (G+18)',
    discipline: 'Structural',
    fileFormat: 'DWG',
    revision: 'Rev C',
    scale: '1:100',
    sheetSize: 'A0',
    fileSize: '14.8 MB',
    status: 'Issued for Construction',
    author: 'Engr. Zafar Iqbal (PE)',
    uploadDate: '2026-10-22'
  },
  {
    id: 'DWG-2',
    drawingNo: 'ARC-TYP-05',
    title: 'Typical Floor Architectural Layout & Partition Details',
    projectId: 'PRJ-101',
    projectName: 'Gulberg Executive Tower (G+18)',
    discipline: 'Architectural',
    fileFormat: 'PDF',
    revision: 'Rev B',
    scale: '1:50',
    sheetSize: 'A1',
    fileSize: '8.4 MB',
    status: 'Approved',
    author: 'Ar. Hina Tariq',
    uploadDate: '2026-10-20'
  },
  {
    id: 'DWG-3',
    drawingNo: 'BIM-FED-18',
    title: '3D BIM Federated Model (Architectural + Structural + MEP)',
    projectId: 'PRJ-101',
    projectName: 'Gulberg Executive Tower (G+18)',
    discipline: 'BIM 3D',
    fileFormat: 'RVT',
    revision: 'Rev 2.4',
    scale: '1:1 (3D)',
    sheetSize: 'Navisworks / Revit',
    fileSize: '184.2 MB',
    status: 'Issued for Construction',
    author: 'BIM Lead Khurram',
    uploadDate: '2026-10-24'
  },
  {
    id: 'DWG-4',
    drawingNo: 'MEP-HVAC-02',
    title: 'Basement Ventilation & Chilled Water Piping Riser',
    projectId: 'PRJ-102',
    projectName: 'DHA Commercial Complex Ring Road',
    discipline: 'MEP',
    fileFormat: 'IFC',
    revision: 'Rev A',
    scale: '1:100',
    sheetSize: 'A1',
    fileSize: '24.6 MB',
    status: 'Under Review',
    author: 'Engr. Salman Farooq',
    uploadDate: '2026-10-25'
  },
  {
    id: 'DWG-5',
    drawingNo: 'STR-COL-08',
    title: 'Column Reinforcement & Beam-Column Joint Details Floor 1-5',
    projectId: 'PRJ-102',
    projectName: 'DHA Commercial Complex Ring Road',
    discipline: 'Structural',
    fileFormat: 'DWG',
    revision: 'Rev B',
    scale: '1:25',
    sheetSize: 'A0',
    fileSize: '12.1 MB',
    status: 'Approved',
    author: 'Engr. Usman Tariq',
    uploadDate: '2026-10-18'
  },
  {
    id: 'DWG-6',
    drawingNo: 'CIV-SIT-01',
    title: 'Master Site Boundary Survey & Stormwater Drainage Layout',
    projectId: 'PRJ-103',
    projectName: 'Multan Industrial Logistics Warehouse',
    discipline: 'Civil',
    fileFormat: 'DXF',
    revision: 'Rev 0',
    scale: '1:500',
    sheetSize: 'A0',
    fileSize: '6.2 MB',
    status: 'Tender Archive',
    author: 'Surveyor Noman',
    uploadDate: '2026-10-15'
  },
]

// ============================================================================
// Main Component
// ============================================================================

export default function EngineeringDesk({
  projects = [],
  canEdit = true,
}: {
  projects?: Array<Record<string, unknown>>
  canEdit?: boolean
}) {
  const [activeTab, setActiveTab] = useState<EngineeringTab>('boq')

  // Combine DB projects with default sample projects
  const projectList: ProjectOption[] = useMemo(() => {
    if (!projects || projects.length === 0) return defaultProjects
    const mapped = projects.map((p) => ({
      id: String(p.id || p.project_code || ''),
      name: String(p.name || p.project_code || 'Unnamed Project'),
      project_code: typeof p.project_code === 'string' ? p.project_code : undefined
    }))
    return mapped.length ? mapped : defaultProjects
  }, [projects])

  // --------------------------------------------------------------------------
  // Submodule 1: BOQ & Estimates State
  // --------------------------------------------------------------------------
  const [boqItems, setBoqItems] = useState<BoqItem[]>(() => {
    try {
      const saved = localStorage.getItem('revoxen_boq_items')
      return saved ? JSON.parse(saved) : initialBoqItems
    } catch {
      return initialBoqItems
    }
  })

  const [boqProjectFilter, setBoqProjectFilter] = useState<string>('all')
  const [boqCategoryFilter, setBoqCategoryFilter] = useState<string>('all')
  const [boqSearch, setBoqSearch] = useState<string>('')
  const [showBoqModal, setShowBoqModal] = useState<boolean>(false)
  const [editingBoqId, setEditingBoqId] = useState<string | null>(null)

  // BOQ Form state
  const [formItemCode, setFormItemCode] = useState('')
  const [formProjectId, setFormProjectId] = useState('')
  const [formCategory, setFormCategory] = useState<BoqItem['category']>('Concrete & RCC')
  const [formDescription, setFormDescription] = useState('')
  const [formUnit, setFormUnit] = useState('m³')
  const [formQuantity, setFormQuantity] = useState<number | ''>(100)
  const [formRate, setFormRate] = useState<number | ''>(15000)
  const [formNotes, setFormNotes] = useState('')

  // --------------------------------------------------------------------------
  // Submodule 2: Material Calculator State
  // --------------------------------------------------------------------------
  const [calcType, setCalcType] = useState<'concrete' | 'bricks' | 'steel'>('concrete')

  // Concrete state
  const [concreteUnit, setConcreteUnit] = useState<'ft' | 'm'>('ft')
  const [concreteLength, setConcreteLength] = useState<number>(30)
  const [concreteWidth, setConcreteWidth] = useState<number>(20)
  const [concreteDepth, setConcreteDepth] = useState<number>(0.5) // 6 inches in ft
  const [concreteRatio, setConcreteRatio] = useState<'1:1.5:3' | '1:2:4' | '1:3:6' | '1:4:8'>('1:2:4')

  // Brickwork state
  const [wallLength, setWallLength] = useState<number>(40)
  const [wallHeight, setWallHeight] = useState<number>(10)
  const [wallThickness, setWallThickness] = useState<4.5 | 9 | 13.5>(9)
  const [mortarRatio, setMortarRatio] = useState<'1:3' | '1:4' | '1:5' | '1:6'>('1:4')

  // Steel state
  const [steelMode, setSteelMode] = useState<'by_bar' | 'by_pct'>('by_bar')
  const [rebarSize, setRebarSize] = useState<'#3 (10mm)' | '#4 (12mm)' | '#5 (16mm)' | '#6 (20mm)' | '#8 (25mm)'>('#4 (12mm)')
  const [steelLengthFt, setSteelLengthFt] = useState<number>(1500)
  const [steelConcreteVolCft, setSteelConcreteVolCft] = useState<number>(1200)
  const [steelMemberType, setSteelMemberType] = useState<'slab' | 'beam' | 'column' | 'footing'>('slab')
  const [steelRatePerTon, setSteelRatePerTon] = useState<number>(265000)

  const [copiedSummary, setCopiedSummary] = useState(false)

  // --------------------------------------------------------------------------
  // Submodule 3: BIM & Drawings State
  // --------------------------------------------------------------------------
  const [drawings, setDrawings] = useState<DrawingItem[]>(() => {
    try {
      const saved = localStorage.getItem('revoxen_bim_drawings')
      return saved ? JSON.parse(saved) : initialDrawings
    } catch {
      return initialDrawings
    }
  })

  const [drawingDisciplineFilter, setDrawingDisciplineFilter] = useState<string>('all')
  const [drawingProjectFilter, setDrawingProjectFilter] = useState<string>('all')
  const [drawingSearch, setDrawingSearch] = useState<string>('')
  const [showDrawingModal, setShowDrawingModal] = useState<boolean>(false)
  const [viewingDrawing, setViewingDrawing] = useState<DrawingItem | null>(null)

  // Drawing Form state
  const [formDwgNo, setFormDwgNo] = useState('')
  const [formDwgTitle, setFormDwgTitle] = useState('')
  const [formDwgProjectId, setFormDwgProjectId] = useState('')
  const [formDwgDiscipline, setFormDwgDiscipline] = useState<DrawingItem['discipline']>('Structural')
  const [formDwgFormat, setFormDwgFormat] = useState<DrawingItem['fileFormat']>('DWG')
  const [formDwgRevision, setFormDwgRevision] = useState('Rev A')
  const [formDwgScale, setFormDwgScale] = useState('1:100')
  const [formDwgSheet, setFormDwgSheet] = useState('A1')
  const [formDwgStatus, setFormDwgStatus] = useState<DrawingItem['status']>('Issued for Construction')
  const [formDwgAuthor, setFormDwgAuthor] = useState('Site Engineer')

  // Save helpers
  const saveBoqItems = (items: BoqItem[]) => {
    setBoqItems(items)
    try { localStorage.setItem('revoxen_boq_items', JSON.stringify(items)) } catch {}
  }

  const saveDrawings = (items: DrawingItem[]) => {
    setDrawings(items)
    try { localStorage.setItem('revoxen_bim_drawings', JSON.stringify(items)) } catch {}
  }

  // --------------------------------------------------------------------------
  // Filtered BOQ calculations
  // --------------------------------------------------------------------------
  const filteredBoq = useMemo(() => {
    return boqItems.filter((item) => {
      const matchProject = boqProjectFilter === 'all' || item.projectId === boqProjectFilter
      const matchCat = boqCategoryFilter === 'all' || item.category === boqCategoryFilter
      const matchText = boqSearch.trim() === '' ||
        item.itemCode.toLowerCase().includes(boqSearch.toLowerCase()) ||
        item.description.toLowerCase().includes(boqSearch.toLowerCase()) ||
        item.projectName.toLowerCase().includes(boqSearch.toLowerCase())
      return matchProject && matchCat && matchText
    })
  }, [boqItems, boqProjectFilter, boqCategoryFilter, boqSearch])

  const boqTotalAmount = useMemo(() => {
    return filteredBoq.reduce((acc, cur) => acc + (cur.amount || 0), 0)
  }, [filteredBoq])

  const boqGrandTotal = useMemo(() => {
    return boqItems.reduce((acc, cur) => acc + (cur.amount || 0), 0)
  }, [boqItems])

  // Open Add/Edit BOQ Modal
  const handleOpenBoqModal = (item?: BoqItem) => {
    if (item) {
      setEditingBoqId(item.id)
      setFormItemCode(item.itemCode)
      setFormProjectId(item.projectId)
      setFormCategory(item.category)
      setFormDescription(item.description)
      setFormUnit(item.unit)
      setFormQuantity(item.quantity)
      setFormRate(item.rate)
      setFormNotes(item.notes || '')
    } else {
      setEditingBoqId(null)
      const nextNum = boqItems.length + 1
      setFormItemCode(`BOQ-NEW-${String(nextNum).padStart(2, '0')}`)
      setFormProjectId(projectList[0]?.id ? String(projectList[0].id) : 'PRJ-101')
      setFormCategory('Concrete & RCC')
      setFormDescription('')
      setFormUnit('m³')
      setFormQuantity(100)
      setFormRate(16500)
      setFormNotes('')
    }
    setShowBoqModal(true)
  }

  const handleSaveBoq = (e: FormEvent) => {
    e.preventDefault()
    const p = projectList.find((prj) => String(prj.id) === String(formProjectId)) || projectList[0]
    const qty = Number(formQuantity) || 0
    const rate = Number(formRate) || 0
    const amount = qty * rate

    if (editingBoqId) {
      const updated = boqItems.map((item) => {
        if (item.id === editingBoqId) {
          return {
            ...item,
            itemCode: formItemCode.trim() || item.itemCode,
            projectId: String(p?.id || 'PRJ-101'),
            projectName: p?.name || 'Main Project',
            category: formCategory,
            description: formDescription.trim(),
            unit: formUnit,
            quantity: qty,
            rate,
            amount,
            notes: formNotes.trim(),
          }
        }
        return item
      })
      saveBoqItems(updated)
    } else {
      const newItem: BoqItem = {
        id: `BOQ-${Date.now()}`,
        itemCode: formItemCode.trim() || `BOQ-${Date.now().toString().slice(-4)}`,
        projectId: String(p?.id || 'PRJ-101'),
        projectName: p?.name || 'Main Project',
        category: formCategory,
        description: formDescription.trim(),
        unit: formUnit,
        quantity: qty,
        rate,
        amount,
        notes: formNotes.trim(),
      }
      saveBoqItems([newItem, ...boqItems])
    }
    setShowBoqModal(false)
  }

  const handleDeleteBoq = (id: string) => {
    if (window.confirm('Are you sure you want to delete this BOQ item?')) {
      const updated = boqItems.filter((item) => item.id !== id)
      saveBoqItems(updated)
    }
  }

  // --------------------------------------------------------------------------
  // Material Calculator Computations
  // --------------------------------------------------------------------------

  // 1. Concrete Computation
  const concreteResults = useMemo(() => {
    let wetCft = 0
    if (concreteUnit === 'ft') {
      wetCft = (Number(concreteLength) || 0) * (Number(concreteWidth) || 0) * (Number(concreteDepth) || 0)
    } else {
      // Meters to cft: 1 m³ = 35.3147 cft
      const m3 = (Number(concreteLength) || 0) * (Number(concreteWidth) || 0) * (Number(concreteDepth) || 0)
      wetCft = m3 * 35.3147
    }

    const wetM3 = wetCft / 35.3147
    const dryCft = wetCft * 1.54 // standard 1.54 dry volume factor

    let cRatio = 1
    let sRatio = 2
    let aRatio = 4
    if (concreteRatio === '1:1.5:3') { cRatio = 1; sRatio = 1.5; aRatio = 3 }
    else if (concreteRatio === '1:2:4') { cRatio = 1; sRatio = 2; aRatio = 4 }
    else if (concreteRatio === '1:3:6') { cRatio = 1; sRatio = 3; aRatio = 6 }
    else if (concreteRatio === '1:4:8') { cRatio = 1; sRatio = 4; aRatio = 8 }

    const sumRatios = cRatio + sRatio + aRatio
    const cementCft = (cRatio / sumRatios) * dryCft
    const cementBags = cementCft / 1.25 // 1 bag cement = 1.25 cft (50 kg)
    const sandCft = (sRatio / sumRatios) * dryCft
    const crushCft = (aRatio / sumRatios) * dryCft
    const waterLiters = cementBags * 26 // ~26 L per bag for w/c ratio ~0.52

    return {
      wetCft: Math.round(wetCft * 10) / 10,
      wetM3: Math.round(wetM3 * 100) / 100,
      dryCft: Math.round(dryCft * 10) / 10,
      cementBags: Math.ceil(cementBags),
      sandCft: Math.round(sandCft * 10) / 10,
      sandTons: Math.round((sandCft * 45 / 1000) * 10) / 10, // ~45-50 kg/cft
      crushCft: Math.round(crushCft * 10) / 10,
      crushTons: Math.round((crushCft * 46 / 1000) * 10) / 10,
      waterLiters: Math.round(waterLiters)
    }
  }, [concreteUnit, concreteLength, concreteWidth, concreteDepth, concreteRatio])

  // 2. Brickwork Computation
  const brickResults = useMemo(() => {
    const l = Number(wallLength) || 0
    const h = Number(wallHeight) || 0
    const thickFt = wallThickness / 12
    const wallVolCft = l * h * thickFt

    // 1 cft of brickwork contains 13.5 standard bricks (including 5% wastage)
    const totalBricks = Math.ceil(wallVolCft * 13.5)

    // Mortar volume is approx 25% to 30% of total masonry volume
    const wetMortarCft = wallVolCft * 0.28
    const dryMortarCft = wetMortarCft * 1.33 // dry factor for mortar

    let cPart = 1
    let sPart = 4
    if (mortarRatio === '1:3') { cPart = 1; sPart = 3 }
    else if (mortarRatio === '1:4') { cPart = 1; sPart = 4 }
    else if (mortarRatio === '1:5') { cPart = 1; sPart = 5 }
    else if (mortarRatio === '1:6') { cPart = 1; sPart = 6 }

    const cementVolCft = (cPart / (cPart + sPart)) * dryMortarCft
    const cementBags = Math.ceil(cementVolCft / 1.25)
    const sandCft = Math.round(((sPart / (cPart + sPart)) * dryMortarCft) * 10) / 10

    return {
      wallVolCft: Math.round(wallVolCft * 10) / 10,
      totalBricks,
      cementBags,
      sandCft,
    }
  }, [wallLength, wallHeight, wallThickness, mortarRatio])

  // 3. Steel Computation
  const steelResults = useMemo(() => {
    let weightKg = 0
    let metricTons = 0

    if (steelMode === 'by_bar') {
      // Rebar weight formula: D^2 / 52.9 in kg/ft where D is bar diameter in eighths of an inch (#3 = 3, #4 = 4)
      let barNo = 4
      if (rebarSize.includes('#3')) barNo = 3
      if (rebarSize.includes('#4')) barNo = 4
      if (rebarSize.includes('#5')) barNo = 5
      if (rebarSize.includes('#6')) barNo = 6
      if (rebarSize.includes('#8')) barNo = 8

      const weightPerFt = (barNo * barNo) / 52.9
      weightKg = (Number(steelLengthFt) || 0) * weightPerFt
    } else {
      // Rule of thumb percentage of concrete
      // Density of steel = 7850 kg/m³ = 222.3 kg/cft
      let pct = 0.01 // 1%
      if (steelMemberType === 'slab') pct = 0.01
      if (steelMemberType === 'beam') pct = 0.018
      if (steelMemberType === 'column') pct = 0.025
      if (steelMemberType === 'footing') pct = 0.008

      const cft = Number(steelConcreteVolCft) || 0
      const steelCft = cft * pct
      weightKg = steelCft * 222.3
    }

    metricTons = weightKg / 1000
    const costPkr = metricTons * (Number(steelRatePerTon) || 265000)

    return {
      weightKg: Math.round(weightKg * 10) / 10,
      metricTons: Math.round(metricTons * 1000) / 1000,
      costPkr: Math.round(costPkr)
    }
  }, [steelMode, rebarSize, steelLengthFt, steelMemberType, steelConcreteVolCft, steelRatePerTon])

  // Copy calculations to clipboard
  const handleCopyCalculation = () => {
    let text = ''
    if (calcType === 'concrete') {
      text = `Revoxen Concrete Calculation (${concreteRatio}):
Length: ${concreteLength}${concreteUnit}, Width: ${concreteWidth}${concreteUnit}, Depth: ${concreteDepth}${concreteUnit}
Wet Volume: ${concreteResults.wetCft} cft (${concreteResults.wetM3} m³)
Dry Volume: ${concreteResults.dryCft} cft
- Cement Required: ${concreteResults.cementBags} Bags (50kg)
- Sand Required: ${concreteResults.sandCft} cft (~${concreteResults.sandTons} Tons)
- Aggregate / Crush: ${concreteResults.crushCft} cft (~${concreteResults.crushTons} Tons)
- Water: ~${concreteResults.waterLiters} Liters`
    } else if (calcType === 'bricks') {
      text = `Revoxen Masonry Calculation (${wallThickness}" Wall, Mortar ${mortarRatio}):
Wall Size: ${wallLength} ft x ${wallHeight} ft
Masonry Volume: ${brickResults.wallVolCft} cft
- Bricks Required: ${brickResults.totalBricks.toLocaleString()} Nos (incl. 5% waste)
- Cement Required: ${brickResults.cementBags} Bags
- Sand Required: ${brickResults.sandCft} cft`
    } else {
      text = `Revoxen Steel Estimation (${steelMode === 'by_bar' ? rebarSize : steelMemberType}):
- Total Steel Weight: ${steelResults.weightKg.toLocaleString()} kg (${steelResults.metricTons} Metric Tons)
- Estimated Material Cost: PKR ${steelResults.costPkr.toLocaleString()} (@ ${steelRatePerTon.toLocaleString()}/Ton)`
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopiedSummary(true)
      setTimeout(() => setCopiedSummary(false), 2500)
    }).catch(() => {})
  }

  // --------------------------------------------------------------------------
  // Submodule 3: BIM & Drawings Actions
  // --------------------------------------------------------------------------
  const filteredDrawings = useMemo(() => {
    return drawings.filter((dwg) => {
      const matchProject = drawingProjectFilter === 'all' || dwg.projectId === drawingProjectFilter
      const matchDisc = drawingDisciplineFilter === 'all' || dwg.discipline === drawingDisciplineFilter
      const matchText = drawingSearch.trim() === '' ||
        dwg.drawingNo.toLowerCase().includes(drawingSearch.toLowerCase()) ||
        dwg.title.toLowerCase().includes(drawingSearch.toLowerCase()) ||
        dwg.author.toLowerCase().includes(drawingSearch.toLowerCase()) ||
        dwg.projectName.toLowerCase().includes(drawingSearch.toLowerCase())
      return matchProject && matchDisc && matchText
    })
  }, [drawings, drawingProjectFilter, drawingDisciplineFilter, drawingSearch])

  // Download simulation
  const handleDownloadDrawing = (dwg: DrawingItem) => {
    const dummyContent = `REVOXEN ASSOCIATES - ENGINEERING DESK
ARCHIVE DRAWING METADATA
=========================================================
Drawing Number: ${dwg.drawingNo}
Title         : ${dwg.title}
Project       : ${dwg.projectName}
Discipline    : ${dwg.discipline}
Format        : ${dwg.fileFormat}
Revision      : ${dwg.revision}
Status        : ${dwg.status}
Scale         : ${dwg.scale}
Sheet Size    : ${dwg.sheetSize}
Approved By   : ${dwg.author}
Upload Date   : ${dwg.uploadDate}
File Size     : ${dwg.fileSize}
=========================================================
This file contains the verified engineering specification and
CAD/BIM coordination layer parameters for Revoxen Construction CRM.
`
    const blob = new Blob([dummyContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${dwg.drawingNo}_${dwg.revision}.${dwg.fileFormat.toLowerCase()}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleOpenDrawingModal = () => {
    const nextNum = drawings.length + 1
    setFormDwgNo(`STR-SHT-${String(nextNum).padStart(2, '0')}`)
    setFormDwgTitle('')
    setFormDwgProjectId(projectList[0]?.id ? String(projectList[0].id) : 'PRJ-101')
    setFormDwgDiscipline('Structural')
    setFormDwgFormat('DWG')
    setFormDwgRevision('Rev A')
    setFormDwgScale('1:100')
    setFormDwgSheet('A1')
    setFormDwgStatus('Issued for Construction')
    setFormDwgAuthor('Site Engineer')
    setShowDrawingModal(true)
  }

  const handleSaveDrawing = (e: FormEvent) => {
    e.preventDefault()
    const p = projectList.find((prj) => String(prj.id) === String(formDwgProjectId)) || projectList[0]
    const newDrawing: DrawingItem = {
      id: `DWG-${Date.now()}`,
      drawingNo: formDwgNo.trim() || `DWG-${Date.now().toString().slice(-4)}`,
      title: formDwgTitle.trim() || 'Untitled Engineering Drawing',
      projectId: String(p?.id || 'PRJ-101'),
      projectName: p?.name || 'Main Project',
      discipline: formDwgDiscipline,
      fileFormat: formDwgFormat,
      revision: formDwgRevision,
      scale: formDwgScale,
      sheetSize: formDwgSheet,
      fileSize: `${(Math.random() * 15 + 4).toFixed(1)} MB`,
      status: formDwgStatus,
      author: formDwgAuthor.trim() || 'Engineering Team',
      uploadDate: new Date().toISOString().split('T')[0],
    }
    saveDrawings([newDrawing, ...drawings])
    setShowDrawingModal(false)
  }

  const handleDeleteDrawing = (id: string) => {
    if (window.confirm('Delete this drawing from the archive?')) {
      const updated = drawings.filter((d) => d.id !== id)
      saveDrawings(updated)
      if (viewingDrawing?.id === id) setViewingDrawing(null)
    }
  }

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div className="lst-container">
      {/* Top Header */}
      <div className="lst-header">
        <div className="lst-header-left">
          <div className="lst-header-icon" style={{ background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', color: '#4338ca' }}>
            <Compass size={22} strokeWidth={2.2} />
          </div>
          <div className="lst-header-title">
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Engineering &amp; Technical Desk
              <span style={{ fontSize: '12px', background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                v2.0
              </span>
            </h1>
            <p>BOQ creation, structural material calculator, and BIM / CAD drawings archive for active projects.</p>
          </div>
        </div>

        <div className="lst-header-right">
          {activeTab === 'boq' && canEdit && (
            <button
              type="button"
              className="lst-btn-primary"
              onClick={() => handleOpenBoqModal()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} />
              <span>Add BOQ Item</span>
            </button>
          )}

          {activeTab === 'bim' && canEdit && (
            <button
              type="button"
              className="lst-btn-primary"
              onClick={handleOpenDrawingModal}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#4338ca', borderColor: '#4338ca' }}
            >
              <Plus size={15} />
              <span>Upload Drawing</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="lst-subnav-tabs" style={{ flexWrap: 'wrap', gap: '8px' }}>
        <button
          type="button"
          className={`lst-subnav-tab ${activeTab === 'boq' ? 'active' : ''}`}
          onClick={() => setActiveTab('boq')}
        >
          <FileSpreadsheet size={15} />
          <span>1. BOQ &amp; Estimates</span>
          <span className="lst-tab-badge">{boqItems.length}</span>
        </button>

        <button
          type="button"
          className={`lst-subnav-tab ${activeTab === 'calculator' ? 'active' : ''}`}
          onClick={() => setActiveTab('calculator')}
        >
          <Calculator size={15} />
          <span>2. Material Calculator</span>
          <span className="lst-tab-badge" style={{ background: '#fef3c7', color: '#b45309', borderColor: '#fde68a' }}>
            Cement • Sand • Steel
          </span>
        </button>

        <button
          type="button"
          className={`lst-subnav-tab ${activeTab === 'bim' ? 'active' : ''}`}
          onClick={() => setActiveTab('bim')}
        >
          <Layers size={15} />
          <span>3. BIM &amp; Drawings Archive</span>
          <span className="lst-tab-badge">{drawings.length}</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* SUBMODULE 1: BOQ & ESTIMATES                                        */}
      {/* =================================================================== */}
      {activeTab === 'boq' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Summary KPI Cards */}
          <div className="lst-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
            <div className="lst-stat-card" style={{ borderLeft: '3px solid #ea580c' }}>
              <div className="lst-stat-label">Filtered BOQ Total</div>
              <div className="lst-stat-value" style={{ fontSize: '20px', color: '#ea580c' }}>
                PKR {boqTotalAmount.toLocaleString()}
              </div>
              <div className="lst-stat-sub">Based on current filter criteria</div>
            </div>

            <div className="lst-stat-card" style={{ borderLeft: '3px solid #2563eb' }}>
              <div className="lst-stat-label">Total Grand BOQ</div>
              <div className="lst-stat-value" style={{ fontSize: '20px', color: '#1e293b' }}>
                PKR {boqGrandTotal.toLocaleString()}
              </div>
              <div className="lst-stat-sub">Across all registered sites</div>
            </div>

            <div className="lst-stat-card" style={{ borderLeft: '3px solid #059669' }}>
              <div className="lst-stat-label">Line Items Registered</div>
              <div className="lst-stat-value" style={{ fontSize: '20px', color: '#059669' }}>
                {filteredBoq.length} of {boqItems.length}
              </div>
              <div className="lst-stat-sub">Active scheduled items</div>
            </div>

            <div className="lst-stat-card" style={{ borderLeft: '3px solid #7c3aed' }}>
              <div className="lst-stat-label">Active Project Filter</div>
              <div className="lst-stat-value" style={{ fontSize: '15px', fontWeight: 700, color: '#4b5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {boqProjectFilter === 'all' ? 'All Projects' : projectList.find(p => p.id === boqProjectFilter)?.name || boqProjectFilter}
              </div>
              <div className="lst-stat-sub">Project-wise cost breakdown</div>
            </div>
          </div>

          {/* Table Container */}
          <div className="lst-tender-panel">
            {/* Toolbar */}
            <div className="lst-table-toolbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
                <div className="lst-search-wrap" style={{ maxWidth: '280px' }}>
                  <Search size={14} />
                  <input
                    type="text"
                    value={boqSearch}
                    onChange={(e) => setBoqSearch(e.target.value)}
                    placeholder="Search by code, scope, project..."
                  />
                </div>

                {/* Project Filter */}
                <select
                  value={boqProjectFilter}
                  onChange={(e) => setBoqProjectFilter(e.target.value)}
                  style={{
                    height: '34px',
                    padding: '0 10px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155'
                  }}
                >
                  <option value="all">📁 All Projects ({projectList.length})</option>
                  {projectList.map((p) => (
                    <option key={String(p.id)} value={String(p.id)}>{p.name}</option>
                  ))}
                </select>

                {/* Category Filter */}
                <select
                  value={boqCategoryFilter}
                  onChange={(e) => setBoqCategoryFilter(e.target.value)}
                  style={{
                    height: '34px',
                    padding: '0 10px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155'
                  }}
                >
                  <option value="all">🏷️ All Categories</option>
                  <option value="Earthwork">Earthwork &amp; Excavation</option>
                  <option value="Concrete & RCC">Concrete &amp; RCC</option>
                  <option value="Steel">Reinforcement Steel</option>
                  <option value="Masonry">Brick &amp; Block Masonry</option>
                  <option value="Finishing">Finishing &amp; Tiling</option>
                  <option value="MEP">MEP &amp; Utilities</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="lst-btn-secondary"
                  onClick={() => window.print()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  <Printer size={13} />
                  <span>Print BOQ</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '10px 14px' }}>Item Code</th>
                    <th style={{ padding: '10px 14px' }}>Category</th>
                    <th style={{ padding: '10px 14px', minWidth: '240px' }}>Description / Scope of Work</th>
                    <th style={{ padding: '10px 14px' }}>Project</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Unit</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Quantity</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Rate (PKR)</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Total Amount (PKR)</th>
                    {canEdit && <th style={{ padding: '10px 14px', textAlign: 'center' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredBoq.length === 0 ? (
                    <tr>
                      <td colSpan={canEdit ? 9 : 8} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                        No BOQ items match the selected filter. Click &ldquo;Add BOQ Item&rdquo; to create one.
                      </td>
                    </tr>
                  ) : (
                    filteredBoq.map((item, idx) => (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: idx % 2 === 0 ? '#ffffff' : '#fcfdfd',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <td style={{ padding: '11px 14px', fontWeight: 700, color: '#1e293b' }}>
                          {item.itemCode}
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: item.category === 'Concrete & RCC' ? '#dbeafe' : item.category === 'Steel' ? '#f3e8ff' : item.category === 'Earthwork' ? '#ffedd5' : '#f1f5f9',
                            color: item.category === 'Concrete & RCC' ? '#1d4ed8' : item.category === 'Steel' ? '#6b21a8' : item.category === 'Earthwork' ? '#c2410c' : '#475569'
                          }}>
                            {item.category}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px', color: '#334155' }}>
                          <div>{item.description}</div>
                          {item.notes && <small style={{ color: '#64748b', fontStyle: 'italic' }}>Note: {item.notes}</small>}
                        </td>
                        <td style={{ padding: '11px 14px', color: '#64748b' }}>
                          {item.projectName}
                        </td>
                        <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>
                          {item.unit}
                        </td>
                        <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                          {item.quantity.toLocaleString()}
                        </td>
                        <td style={{ padding: '11px 14px', textAlign: 'right', color: '#475569' }}>
                          {item.rate.toLocaleString()}
                        </td>
                        <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 750, color: '#ea580c' }}>
                          PKR {item.amount.toLocaleString()}
                        </td>
                        {canEdit && (
                          <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleOpenBoqModal(item)}
                                className="lst-btn-secondary"
                                style={{ height: '28px', padding: '0 8px', fontSize: '11px' }}
                                title="Edit Item"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBoq(item.id)}
                                style={{
                                  height: '28px',
                                  width: '28px',
                                  border: '1px solid #fee2e2',
                                  background: '#fff1f2',
                                  color: '#dc2626',
                                  borderRadius: '5px',
                                  cursor: 'pointer',
                                  display: 'grid',
                                  placeItems: 'center'
                                }}
                                title="Delete Item"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f8fafc', borderTop: '2px solid #cbd5e1', fontWeight: 750 }}>
                    <td colSpan={6} style={{ padding: '12px 14px', textAlign: 'right', color: '#1e293b' }}>
                      TOTAL ESTIMATED VALUE:
                    </td>
                    <td colSpan={2} style={{ padding: '12px 14px', textAlign: 'right', color: '#ea580c', fontSize: '14px' }}>
                      PKR {boqTotalAmount.toLocaleString()}
                    </td>
                    {canEdit && <td />}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUBMODULE 2: MATERIAL CALCULATOR                                    */}
      {/* =================================================================== */}
      {activeTab === 'calculator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Calculator Selector Tabs */}
          <div style={{ display: 'flex', gap: '8px', background: '#e2e8f0', padding: '4px', borderRadius: '8px', width: 'fit-content' }}>
            <button
              type="button"
              onClick={() => setCalcType('concrete')}
              style={{
                border: 'none',
                background: calcType === 'concrete' ? '#ffffff' : 'transparent',
                color: calcType === 'concrete' ? '#1e293b' : '#64748b',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: 650,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: calcType === 'concrete' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <Boxes size={14} />
              <span>Concrete &amp; RCC Mix</span>
            </button>

            <button
              type="button"
              onClick={() => setCalcType('bricks')}
              style={{
                border: 'none',
                background: calcType === 'bricks' ? '#ffffff' : 'transparent',
                color: calcType === 'bricks' ? '#1e293b' : '#64748b',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: 650,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: calcType === 'bricks' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <Building size={14} />
              <span>Brickwork &amp; Mortar</span>
            </button>

            <button
              type="button"
              onClick={() => setCalcType('steel')}
              style={{
                border: 'none',
                background: calcType === 'steel' ? '#ffffff' : 'transparent',
                color: calcType === 'steel' ? '#1e293b' : '#64748b',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: 650,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: calcType === 'steel' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <Wrench size={14} />
              <span>Steel Reinforcement</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(320px, 1fr)', gap: '16px' }}>
            {/* Input Panel */}
            <div className="lst-tender-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '14px', color: '#1e293b' }}>
                  {calcType === 'concrete' && 'Concrete Mix Parameters (1.54 Dry Factor)'}
                  {calcType === 'bricks' && 'Brick Wall Specifications'}
                  {calcType === 'steel' && 'Rebar & Steel Quantity Estimator'}
                </strong>
                <span style={{ fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                  Standard Engineering
                </span>
              </div>

              {/* CONCRETE FORM */}
              {calcType === 'concrete' && (
                <>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                        Measurement Unit
                      </label>
                      <select
                        value={concreteUnit}
                        onChange={(e) => setConcreteUnit(e.target.value as 'ft' | 'm')}
                        style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                      >
                        <option value="ft">Feet &amp; Inches (CFT)</option>
                        <option value="m">Meters (Cubic Meters)</option>
                      </select>
                    </div>

                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                        Mix Ratio (Cement:Sand:Crush)
                      </label>
                      <select
                        value={concreteRatio}
                        onChange={(e) => setConcreteRatio(e.target.value as any)}
                        style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                      >
                        <option value="1:1.5:3">1:1.5:3 (M20 - Slabs/Beams)</option>
                        <option value="1:2:4">1:2:4 (M15 - Standard RCC)</option>
                        <option value="1:3:6">1:3:6 (M10 - Foundation PCC)</option>
                        <option value="1:4:8">1:4:8 (Lean Concrete Mat)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                        Length ({concreteUnit})
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={concreteLength}
                        onChange={(e) => setConcreteLength(Number(e.target.value))}
                        style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                        Width ({concreteUnit})
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={concreteWidth}
                        onChange={(e) => setConcreteWidth(Number(e.target.value))}
                        style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                        Thickness ({concreteUnit})
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.05"
                        value={concreteDepth}
                        onChange={(e) => setConcreteDepth(Number(e.target.value))}
                        style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* BRICKWORK FORM */}
              {calcType === 'bricks' && (
                <>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                        Wall Thickness
                      </label>
                      <select
                        value={wallThickness}
                        onChange={(e) => setWallThickness(Number(e.target.value) as any)}
                        style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                      >
                        <option value="4.5">4.5 Inches (Single Partition)</option>
                        <option value="9">9.0 Inches (Standard Load-Bearing)</option>
                        <option value="13.5">13.5 Inches (Heavy External Wall)</option>
                      </select>
                    </div>

                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                        Mortar Ratio (Cement:Sand)
                      </label>
                      <select
                        value={mortarRatio}
                        onChange={(e) => setMortarRatio(e.target.value as any)}
                        style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                      >
                        <option value="1:3">1:3 (Rich Mortar)</option>
                        <option value="1:4">1:4 (Standard Recommended)</option>
                        <option value="1:5">1:5 (Normal Masonry)</option>
                        <option value="1:6">1:6 (Economy Mix)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                        Wall Length (Feet)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={wallLength}
                        onChange={(e) => setWallLength(Number(e.target.value))}
                        style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                        Wall Height (Feet)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={wallHeight}
                        onChange={(e) => setWallHeight(Number(e.target.value))}
                        style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* STEEL FORM */}
              {calcType === 'steel' && (
                <>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setSteelMode('by_bar')}
                      className={`lst-btn-view-toggle ${steelMode === 'by_bar' ? 'active' : ''}`}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      By Running Rebar Length
                    </button>
                    <button
                      type="button"
                      onClick={() => setSteelMode('by_pct')}
                      className={`lst-btn-view-toggle ${steelMode === 'by_pct' ? 'active' : ''}`}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      By % of Concrete Volume
                    </button>
                  </div>

                  {steelMode === 'by_bar' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                          Bar Size (Diameter)
                        </label>
                        <select
                          value={rebarSize}
                          onChange={(e) => setRebarSize(e.target.value as any)}
                          style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                        >
                          <option value="#3 (10mm)">#3 (10mm / 3/8&quot;)</option>
                          <option value="#4 (12mm)">#4 (12mm / 1/2&quot;)</option>
                          <option value="#5 (16mm)">#5 (16mm / 5/8&quot;)</option>
                          <option value="#6 (20mm)">#6 (20mm / 3/4&quot;)</option>
                          <option value="#8 (25mm)">#8 (25mm / 1&quot;)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                          Total Rebar Length (Feet)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={steelLengthFt}
                          onChange={(e) => setSteelLengthFt(Number(e.target.value))}
                          style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                          Structural Member Type
                        </label>
                        <select
                          value={steelMemberType}
                          onChange={(e) => setSteelMemberType(e.target.value as any)}
                          style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                        >
                          <option value="slab">RCC Slab (~1.0% steel)</option>
                          <option value="beam">RCC Beams (~1.8% steel)</option>
                          <option value="column">Columns (~2.5% steel)</option>
                          <option value="footing">Foundation Pad (~0.8% steel)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                          Total Concrete Volume (CFT)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={steelConcreteVolCft}
                          onChange={(e) => setSteelConcreteVolCft(Number(e.target.value))}
                          style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Rebar Steel Rate per Metric Ton (PKR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={steelRatePerTon}
                      onChange={(e) => setSteelRatePerTon(Number(e.target.value))}
                      style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Results Output Panel */}
            <div className="lst-tender-panel" style={{ padding: '20px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>Calculated Material Takeoff</strong>
                <button
                  type="button"
                  onClick={handleCopyCalculation}
                  className="lst-btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', height: '28px', fontSize: '11px' }}
                >
                  {copiedSummary ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                  <span>{copiedSummary ? 'Copied!' : 'Copy Takeoff'}</span>
                </button>
              </div>

              {/* CONCRETE RESULTS */}
              {calcType === 'concrete' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Wet Pour Volume</span>
                      <div style={{ fontSize: '16px', fontWeight: 750, color: '#1e293b' }}>
                        {concreteResults.wetCft} CFT <small style={{ fontSize: '11px', color: '#64748b' }}>({concreteResults.wetM3} m³)</small>
                      </div>
                    </div>
                    <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Dry Batch Volume</span>
                      <div style={{ fontSize: '16px', fontWeight: 750, color: '#4338ca' }}>
                        {concreteResults.dryCft} CFT
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #e2e8f0', paddingBottom: '6px' }}>
                      <span style={{ fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        📦 Cement Required:
                      </span>
                      <strong style={{ color: '#ea580c', fontSize: '15px' }}>{concreteResults.cementBags} Bags (50kg)</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #e2e8f0', paddingBottom: '6px' }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>🏖️ Fine Sand (Lawrancepur/Chenab):</span>
                      <strong style={{ color: '#0f172a' }}>{concreteResults.sandCft} CFT <small style={{ color: '#64748b' }}>(~{concreteResults.sandTons} Tons)</small></strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #e2e8f0', paddingBottom: '6px' }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>🪨 Coarse Aggregate / Crush (Margalla):</span>
                      <strong style={{ color: '#0f172a' }}>{concreteResults.crushCft} CFT <small style={{ color: '#64748b' }}>(~{concreteResults.crushTons} Tons)</small></strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>💧 Water Ratio Est.:</span>
                      <strong style={{ color: '#2563eb' }}>~{concreteResults.waterLiters.toLocaleString()} Liters</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* BRICKS RESULTS */}
              {calcType === 'bricks' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Total Masonry Volume</span>
                    <div style={{ fontSize: '18px', fontWeight: 750, color: '#1e293b' }}>
                      {brickResults.wallVolCft} CFT
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #e2e8f0', paddingBottom: '6px' }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>🧱 Clay Bricks (incl. 5% waste):</span>
                      <strong style={{ color: '#b91c1c', fontSize: '16px' }}>{brickResults.totalBricks.toLocaleString()} Nos</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #e2e8f0', paddingBottom: '6px' }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>📦 Mortar Cement Required:</span>
                      <strong style={{ color: '#ea580c', fontSize: '14px' }}>{brickResults.cementBags} Bags (50kg)</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>🏖️ Mortar Sand Required:</span>
                      <strong style={{ color: '#0f172a' }}>{brickResults.sandCft} CFT</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* STEEL RESULTS */}
              {calcType === 'steel' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Total Rebar Weight</span>
                      <div style={{ fontSize: '18px', fontWeight: 750, color: '#4338ca' }}>
                        {steelResults.weightKg.toLocaleString()} kg
                      </div>
                      <small style={{ color: '#64748b' }}>({steelResults.metricTons} Metric Tons)</small>
                    </div>

                    <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Estimated Procurement Cost</span>
                      <div style={{ fontSize: '16px', fontWeight: 750, color: '#059669' }}>
                        PKR {steelResults.costPkr.toLocaleString()}
                      </div>
                      <small style={{ color: '#64748b' }}>@ PKR {steelRatePerTon.toLocaleString()}/Ton</small>
                    </div>
                  </div>

                  <div style={{ background: '#f0fdf4', padding: '10px 14px', borderRadius: '6px', border: '1px solid #bbf7d0', fontSize: '11px', color: '#166534' }}>
                    ✓ Structural steel estimation complies with standard ASTM A615 Grade 60 bar weights.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUBMODULE 3: BIM & DRAWINGS ARCHIVE                                */}
      {/* =================================================================== */}
      {activeTab === 'bim' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Drawing Stats */}
          <div className="lst-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
            <div className="lst-stat-card" style={{ borderLeft: '3px solid #4338ca' }}>
              <div className="lst-stat-label">Total Drawings in Archive</div>
              <div className="lst-stat-value" style={{ fontSize: '20px', color: '#1e293b' }}>
                {drawings.length} Sheets
              </div>
              <div className="lst-stat-sub">Central CAD &amp; BIM repository</div>
            </div>

            <div className="lst-stat-card" style={{ borderLeft: '3px solid #059669' }}>
              <div className="lst-stat-label">Issued for Construction (IFC)</div>
              <div className="lst-stat-value" style={{ fontSize: '20px', color: '#059669' }}>
                {drawings.filter(d => d.status === 'Issued for Construction').length} Sheets
              </div>
              <div className="lst-stat-sub">Approved site execution packages</div>
            </div>

            <div className="lst-stat-card" style={{ borderLeft: '3px solid #ea580c' }}>
              <div className="lst-stat-label">3D BIM Models (.RVT / .IFC)</div>
              <div className="lst-stat-value" style={{ fontSize: '20px', color: '#ea580c' }}>
                {drawings.filter(d => d.fileFormat === 'RVT' || d.fileFormat === 'IFC').length} Models
              </div>
              <div className="lst-stat-sub">Federated &amp; clash-checked</div>
            </div>

            <div className="lst-stat-card" style={{ borderLeft: '3px solid #2563eb' }}>
              <div className="lst-stat-label">Active Discipline Filter</div>
              <div className="lst-stat-value" style={{ fontSize: '15px', fontWeight: 700, color: '#334155' }}>
                {drawingDisciplineFilter === 'all' ? 'All Disciplines' : drawingDisciplineFilter}
              </div>
              <div className="lst-stat-sub">{filteredDrawings.length} matching sheets</div>
            </div>
          </div>

          {/* Table Container */}
          <div className="lst-tender-panel">
            {/* Toolbar */}
            <div className="lst-table-toolbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
                <div className="lst-search-wrap" style={{ maxWidth: '280px' }}>
                  <Search size={14} />
                  <input
                    type="text"
                    value={drawingSearch}
                    onChange={(e) => setDrawingSearch(e.target.value)}
                    placeholder="Search drawing no, title, author..."
                  />
                </div>

                {/* Project Filter */}
                <select
                  value={drawingProjectFilter}
                  onChange={(e) => setDrawingProjectFilter(e.target.value)}
                  style={{
                    height: '34px',
                    padding: '0 10px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155'
                  }}
                >
                  <option value="all">📁 All Projects</option>
                  {projectList.map((p) => (
                    <option key={String(p.id)} value={String(p.id)}>{p.name}</option>
                  ))}
                </select>

                {/* Discipline Filter */}
                <select
                  value={drawingDisciplineFilter}
                  onChange={(e) => setDrawingDisciplineFilter(e.target.value)}
                  style={{
                    height: '34px',
                    padding: '0 10px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155'
                  }}
                >
                  <option value="all">📐 All Disciplines</option>
                  <option value="Architectural">Architectural (ARCH)</option>
                  <option value="Structural">Structural (STR)</option>
                  <option value="MEP">MEP Services</option>
                  <option value="BIM 3D">3D BIM Model (IFC/RVT)</option>
                  <option value="Civil">Civil &amp; Infrastructure</option>
                </select>
              </div>
            </div>

            {/* Drawings Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '10px 14px' }}>Sheet / Drawing No.</th>
                    <th style={{ padding: '10px 14px', minWidth: '220px' }}>Sheet Title</th>
                    <th style={{ padding: '10px 14px' }}>Project</th>
                    <th style={{ padding: '10px 14px' }}>Discipline</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>Format</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>Rev</th>
                    <th style={{ padding: '10px 14px' }}>Status</th>
                    <th style={{ padding: '10px 14px' }}>Size / Date</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrawings.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                        No drawings match the current filter. Click &ldquo;Upload Drawing&rdquo; to add one.
                      </td>
                    </tr>
                  ) : (
                    filteredDrawings.map((dwg, idx) => (
                      <tr
                        key={dwg.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: idx % 2 === 0 ? '#ffffff' : '#fcfdfd',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <td style={{ padding: '11px 14px', fontWeight: 700, color: '#1e293b' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <FileCode size={14} color="#4338ca" />
                            {dwg.drawingNo}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px', color: '#1e293b', fontWeight: 600 }}>
                          <div>{dwg.title}</div>
                          <small style={{ color: '#64748b', fontWeight: 400 }}>Scale: {dwg.scale} • Sheet: {dwg.sheetSize}</small>
                        </td>
                        <td style={{ padding: '11px 14px', color: '#64748b' }}>
                          {dwg.projectName}
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: dwg.discipline === 'Structural' ? '#e0e7ff' : dwg.discipline === 'Architectural' ? '#dcfce7' : dwg.discipline === 'BIM 3D' ? '#fae8ff' : '#f1f5f9',
                            color: dwg.discipline === 'Structural' ? '#3730a3' : dwg.discipline === 'Architectural' ? '#166534' : dwg.discipline === 'BIM 3D' ? '#86198f' : '#475569'
                          }}>
                            {dwg.discipline}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 6px',
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#0f172a'
                          }}>
                            .{dwg.fileFormat}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px', textAlign: 'center', fontWeight: 700, color: '#2563eb' }}>
                          {dwg.revision}
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: dwg.status === 'Issued for Construction' ? '#f0fdf4' : dwg.status === 'Approved' ? '#eff6ff' : '#fffbeb',
                            color: dwg.status === 'Issued for Construction' ? '#15803d' : dwg.status === 'Approved' ? '#1d4ed8' : '#b45309',
                            border: `1px solid ${dwg.status === 'Issued for Construction' ? '#bbf7d0' : dwg.status === 'Approved' ? '#bfdbfe' : '#fde68a'}`
                          }}>
                            {dwg.status}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px', color: '#64748b' }}>
                          <div>{dwg.fileSize}</div>
                          <small>{dwg.uploadDate}</small>
                        </td>
                        <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleDownloadDrawing(dwg)}
                              className="lst-btn-secondary"
                              style={{ height: '28px', padding: '0 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              title="Download File"
                            >
                              <Download size={12} />
                              <span>Get</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setViewingDrawing(dwg)}
                              style={{
                                height: '28px',
                                width: '28px',
                                border: '1px solid #cbd5e1',
                                background: '#ffffff',
                                color: '#334155',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                display: 'grid',
                                placeItems: 'center'
                              }}
                              title="View Metadata"
                            >
                              <Eye size={13} />
                            </button>

                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => handleDeleteDrawing(dwg.id)}
                                style={{
                                  height: '28px',
                                  width: '28px',
                                  border: '1px solid #fee2e2',
                                  background: '#fff1f2',
                                  color: '#dc2626',
                                  borderRadius: '5px',
                                  cursor: 'pointer',
                                  display: 'grid',
                                  placeItems: 'center'
                                }}
                                title="Delete Drawing"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 1: ADD / EDIT BOQ ITEM                                       */}
      {/* =================================================================== */}
      {showBoqModal && (
        <div className="lst-modal-overlay">
          <div className="lst-modal-card" style={{ maxWidth: '580px' }}>
            <div className="lst-modal-header">
              <h3>{editingBoqId ? 'Edit BOQ Line Item' : 'Add New BOQ Line Item'}</h3>
              <button
                type="button"
                className="lst-icon-btn"
                onClick={() => setShowBoqModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveBoq}>
              <div className="lst-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Item Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formItemCode}
                      onChange={(e) => setFormItemCode(e.target.value)}
                      placeholder="e.g. BOQ-STR-05"
                      style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Project *
                    </label>
                    <select
                      value={formProjectId}
                      onChange={(e) => setFormProjectId(e.target.value)}
                      style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                    >
                      {projectList.map((p) => (
                        <option key={String(p.id)} value={String(p.id)}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Category *
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                    >
                      <option value="Earthwork">Earthwork &amp; Excavation</option>
                      <option value="Concrete & RCC">Concrete &amp; RCC</option>
                      <option value="Steel">Reinforcement Steel</option>
                      <option value="Masonry">Brick &amp; Block Masonry</option>
                      <option value="Finishing">Finishing &amp; Tiling</option>
                      <option value="MEP">MEP &amp; Utilities</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Unit *
                    </label>
                    <select
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                    >
                      <option value="m³">m³ (Cubic Meters)</option>
                      <option value="cft">cft (Cubic Feet)</option>
                      <option value="Ton">Ton (Metric Ton)</option>
                      <option value="Sft">Sft (Square Feet)</option>
                      <option value="Rft">Rft (Running Feet)</option>
                      <option value="Nos">Nos (Count/Each)</option>
                      <option value="Bags">Bags (50kg)</option>
                      <option value="Job">Job / Lump Sum</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Description / Scope of Work *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Full item specification, mix ratio, material grade, and execution notes..."
                    style={{ width: '100%', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '6px 8px', fontSize: '12px', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formQuantity}
                      onChange={(e) => setFormQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                      style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Unit Rate (PKR) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formRate}
                      onChange={(e) => setFormRate(e.target.value === '' ? '' : Number(e.target.value))}
                      style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                    />
                  </div>
                </div>

                {/* Auto Calculated Preview */}
                <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', padding: '10px 14px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#9a3412', fontWeight: 600 }}>Calculated Total Amount:</span>
                  <strong style={{ fontSize: '15px', color: '#ea580c' }}>
                    PKR {((Number(formQuantity) || 0) * (Number(formRate) || 0)).toLocaleString()}
                  </strong>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Compliance / Specification Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="e.g. ASTM A615 Grade 60, Lab test cylinder required"
                    style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div className="lst-modal-actions">
                <button
                  type="button"
                  className="lst-btn-secondary"
                  onClick={() => setShowBoqModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="lst-btn-primary"
                >
                  {editingBoqId ? 'Save Changes' : 'Add to BOQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: UPLOAD DRAWING                                            */}
      {/* =================================================================== */}
      {showDrawingModal && (
        <div className="lst-modal-overlay">
          <div className="lst-modal-card" style={{ maxWidth: '580px' }}>
            <div className="lst-modal-header">
              <h3>Upload CAD Drawing / BIM Model</h3>
              <button
                type="button"
                className="lst-icon-btn"
                onClick={() => setShowDrawingModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveDrawing}>
              <div className="lst-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Drawing / Sheet No. *
                    </label>
                    <input
                      type="text"
                      required
                      value={formDwgNo}
                      onChange={(e) => setFormDwgNo(e.target.value)}
                      placeholder="e.g. STR-FND-02"
                      style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Project *
                    </label>
                    <select
                      value={formDwgProjectId}
                      onChange={(e) => setFormDwgProjectId(e.target.value)}
                      style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                    >
                      {projectList.map((p) => (
                        <option key={String(p.id)} value={String(p.id)}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Sheet Title / Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={formDwgTitle}
                    onChange={(e) => setFormDwgTitle(e.target.value)}
                    placeholder="e.g. 5th Floor Slab Framing Plan & Beam Schedule"
                    style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Discipline *
                    </label>
                    <select
                      value={formDwgDiscipline}
                      onChange={(e) => setFormDwgDiscipline(e.target.value as any)}
                      style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                    >
                      <option value="Structural">Structural (STR)</option>
                      <option value="Architectural">Architectural (ARCH)</option>
                      <option value="MEP">MEP Services</option>
                      <option value="BIM 3D">3D BIM Model</option>
                      <option value="Civil">Civil / Site</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Format *
                    </label>
                    <select
                      value={formDwgFormat}
                      onChange={(e) => setFormDwgFormat(e.target.value as any)}
                      style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                    >
                      <option value="DWG">AutoCAD .DWG</option>
                      <option value="RVT">Revit .RVT</option>
                      <option value="IFC">OpenBIM .IFC</option>
                      <option value="PDF">Vector .PDF</option>
                      <option value="DXF">CAD .DXF</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Revision *
                    </label>
                    <input
                      type="text"
                      value={formDwgRevision}
                      onChange={(e) => setFormDwgRevision(e.target.value)}
                      placeholder="Rev A"
                      style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Drawing Scale
                    </label>
                    <input
                      type="text"
                      value={formDwgScale}
                      onChange={(e) => setFormDwgScale(e.target.value)}
                      placeholder="1:100"
                      style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Sheet Size
                    </label>
                    <select
                      value={formDwgSheet}
                      onChange={(e) => setFormDwgSheet(e.target.value)}
                      style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                    >
                      <option value="A0">A0 (841 x 1189 mm)</option>
                      <option value="A1">A1 (594 x 841 mm)</option>
                      <option value="A2">A2 (420 x 594 mm)</option>
                      <option value="A3">A3 (297 x 420 mm)</option>
                      <option value="Navisworks / Revit">3D BIM Coordinates</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Status *
                    </label>
                    <select
                      value={formDwgStatus}
                      onChange={(e) => setFormDwgStatus(e.target.value as any)}
                      style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                    >
                      <option value="Issued for Construction">Issued for Construction (IFC)</option>
                      <option value="Approved">Approved</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Tender Archive">Tender Archive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Author / Structural Designer
                  </label>
                  <input
                    type="text"
                    value={formDwgAuthor}
                    onChange={(e) => setFormDwgAuthor(e.target.value)}
                    placeholder="e.g. Engr. Haroon Rasheed"
                    style={{ width: '100%', height: '34px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div className="lst-modal-actions">
                <button
                  type="button"
                  className="lst-btn-secondary"
                  onClick={() => setShowDrawingModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="lst-btn-primary"
                  style={{ background: '#4338ca', borderColor: '#4338ca' }}
                >
                  Upload &amp; Register Sheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: VIEW DRAWING DETAILS                                       */}
      {/* =================================================================== */}
      {viewingDrawing && (
        <div className="lst-modal-overlay">
          <div className="lst-modal-card" style={{ maxWidth: '520px' }}>
            <div className="lst-modal-header">
              <h3>Drawing Sheet Metadata</h3>
              <button
                type="button"
                className="lst-icon-btn"
                onClick={() => setViewingDrawing(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="lst-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ width: '40px', height: '40px', background: '#e0e7ff', borderRadius: '8px', display: 'grid', placeItems: 'center', color: '#4338ca' }}>
                  <FileCode size={20} />
                </div>
                <div>
                  <strong style={{ fontSize: '14px', color: '#1e293b' }}>{viewingDrawing.drawingNo}</strong>
                  <div style={{ fontSize: '12px', color: '#475569' }}>{viewingDrawing.title}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                <div><strong>Project:</strong> <span style={{ color: '#475569' }}>{viewingDrawing.projectName}</span></div>
                <div><strong>Discipline:</strong> <span style={{ color: '#475569' }}>{viewingDrawing.discipline}</span></div>
                <div><strong>Format:</strong> <span style={{ color: '#475569' }}>.{viewingDrawing.fileFormat}</span></div>
                <div><strong>Revision:</strong> <span style={{ color: '#2563eb', fontWeight: 700 }}>{viewingDrawing.revision}</span></div>
                <div><strong>Scale:</strong> <span style={{ color: '#475569' }}>{viewingDrawing.scale}</span></div>
                <div><strong>Sheet Size:</strong> <span style={{ color: '#475569' }}>{viewingDrawing.sheetSize}</span></div>
                <div><strong>Status:</strong> <span style={{ color: '#059669', fontWeight: 600 }}>{viewingDrawing.status}</span></div>
                <div><strong>File Size:</strong> <span style={{ color: '#475569' }}>{viewingDrawing.fileSize}</span></div>
                <div><strong>Uploaded By:</strong> <span style={{ color: '#475569' }}>{viewingDrawing.author}</span></div>
                <div><strong>Date Registered:</strong> <span style={{ color: '#475569' }}>{viewingDrawing.uploadDate}</span></div>
              </div>

              <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '6px', fontSize: '11px', color: '#475569' }}>
                ℹ️ This drawing record is tracked in the Revoxen central drawings register. Download below to obtain the coordination bundle.
              </div>
            </div>

            <div className="lst-modal-actions">
              <button
                type="button"
                className="lst-btn-secondary"
                onClick={() => setViewingDrawing(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="lst-btn-primary"
                onClick={() => handleDownloadDrawing(viewingDrawing)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={14} />
                <span>Download .{viewingDrawing.fileFormat} File</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
