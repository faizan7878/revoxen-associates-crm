import { useCallback, useEffect, useMemo, useState, type DragEvent } from 'react'
import { ArrowLeft, ArrowUpRight, Check, Download, FileCode2, FileImage, FileText, FolderOpen, Plus, RefreshCw, ShieldCheck, Trash2, UploadCloud, X } from 'lucide-react'
import './project-profile.css'

type Row = Record<string, unknown>
type Drawing = Row & { id: number; drawing_no: string; title: string; category: string; revision: string; status: string; mime_type: string; file_size: number; original_name: string }
type ProfileData = { project: Row; drawings: Drawing[]; siteReports: Row[]; documents: Row[]; activity: Row[] }

const categories = ['Architectural','Structural','Foundation','Civil','Electrical','Plumbing','HVAC','Mechanical','Floor Plan','Elevation','Section','Site Plan','Roof Plan','Shop Drawing','As-Built','Reinforcement','Detail','Other']
const allowedExtensions = new Set(['pdf','dwg','dxf','jpg','jpeg','png','tif','tiff','ifc','zip','rvt'])
const text = (value: unknown) => value === undefined || value === null || value === '' ? '—' : String(value)
const pkr = (value: unknown) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(Number(value) || 0)
const sizeLabel = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
const previewable = (drawing: Drawing) => ['application/pdf','image/jpeg','image/png','image/tiff'].includes(drawing.mime_type)

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } })
  const result = await response.json().catch(() => ({})) as { error?: string } & T
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`)
  return result
}

export default function ProjectProfile({ projectId, canEdit, canOpenAccounts, onBack, onEdit, onOpenAccount, onNotify }: {
  projectId: number
  canEdit: boolean
  canOpenAccounts: boolean
  onBack: () => void
  onEdit: (id: number) => void
  onOpenAccount: (projectCode: string) => void
  onNotify: (message: string) => void
}) {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [category, setCategory] = useState('Architectural')
  const [revision, setRevision] = useState('A')
  const [drawingDescription, setDrawingDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewDrawing, setPreviewDrawing] = useState<Drawing | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const loadProfile = useCallback(async () => {
    setLoading(true)
    setError('')
    try { setProfile(await api<ProfileData>(`/projects/${projectId}/profile`)) }
    catch (problem) { setError(problem instanceof Error ? problem.message : 'Could not load the project profile.') }
    finally { setLoading(false) }
  }, [projectId])

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadProfile() }, 0)
    return () => window.clearTimeout(timer)
  }, [loadProfile])

  const groupedDrawings = useMemo(() => {
    const visible = (profile?.drawings ?? []).filter((drawing) => showArchived || drawing.status !== 'Archived')
    const groups = new Map<string, Drawing[]>()
    for (const drawing of visible) groups.set(drawing.drawing_no, [...(groups.get(drawing.drawing_no) ?? []), drawing])
    return [...groups.entries()].map(([drawingNo, revisions]) => [drawingNo, revisions.sort((a, b) => b.id - a.id)] as const)
  }, [profile?.drawings, showArchived])

  const addFiles = (selected: FileList | File[]) => {
    const incoming = Array.from(selected)
    const invalid = incoming.find((file) => !allowedExtensions.has(file.name.split('.').pop()?.toLowerCase() || '') || file.size > 100 * 1024 * 1024)
    if (invalid) { setError(`${invalid.name}: unsupported format or larger than 100 MB.`); return }
    setError('')
    setFiles((current) => [...current, ...incoming])
  }

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    addFiles(event.dataTransfer.files)
  }

  const uploadOne = (file: File, drawingNo: string, loadedBefore: number, totalSize: number) => new Promise<void>((resolve, reject) => {
    const form = new FormData()
    form.append('file', file)
    form.append('drawing_no', drawingNo)
    form.append('title', file.name.replace(/\.[^.]+$/, ''))
    form.append('category', category)
    form.append('revision', revision.trim())
    form.append('description', drawingDescription)
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `/api/projects/${projectId}/drawings`)
    xhr.withCredentials = true
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) setUploadProgress(Math.round((loadedBefore + event.loaded) / totalSize * 100))
    }
    xhr.onload = () => {
      const result = JSON.parse(xhr.responseText || '{}') as { error?: string }
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(result.error || `Upload failed (${xhr.status}).`))
    }
    xhr.onerror = () => reject(new Error(`Upload failed for ${file.name}.`))
    xhr.send(form)
  })

  const uploadDrawings = async () => {
    if (!files.length || !profile) return
    setUploading(true)
    setUploadProgress(0)
    setError('')
    try {
      const totalSize = files.reduce((total, file) => total + file.size, 0)
      let loaded = 0
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index]
        const base = file.name.replace(/\.[^.]+$/, '').toUpperCase().replace(/[^A-Z0-9-]+/g, '-').replace(/^-|-$/g, '').slice(0, 36) || `DRAWING-${index + 1}`
        const drawingNo = files.length > 1 ? `${base}-${String(index + 1).padStart(2, '0')}` : base
        await uploadOne(file, drawingNo, loaded, totalSize)
        loaded += file.size
        setUploadProgress(Math.round(loaded / totalSize * 100))
      }
      setFiles([])
      setDrawingDescription('')
      await loadProfile()
      onNotify(`Uploaded ${files.length} project drawing${files.length === 1 ? '' : 's'}.`)
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Drawing upload failed. Already uploaded files were retained.')
      await loadProfile()
    } finally { setUploading(false) }
  }

  const changeStatus = async (drawing: Drawing, status: string) => {
    try {
      await api(`/project-drawings/${drawing.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
      await loadProfile()
      onNotify(`Drawing ${drawing.drawing_no} marked ${status}.`)
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'Could not update drawing status.') }
  }

  const archiveDrawing = async (drawing: Drawing) => {
    if (!window.confirm(`Archive ${drawing.drawing_no} revision ${drawing.revision}? It will remain available to estimates that already reference it.`)) return
    try {
      await api(`/project-drawings/${drawing.id}`, { method: 'DELETE' })
      await loadProfile()
      onNotify('Drawing revision archived.')
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'Could not archive drawing.') }
  }

  if (loading && !profile) return <div className="ops-loading"><span className="ops-spinner" />Loading project profile…</div>
  if (!profile) return <section className="ops-panel project-profile-error"><div className="ops-error"><span>{error || 'Project profile unavailable.'}</span><button className="ops-outline-button" onClick={onBack}><ArrowLeft size={14} />Back to projects</button></div></section>

  const project = profile.project
  const documents = profile.documents
  return <div className="project-profile">
    <div className="project-profile-toolbar"><button className="ops-outline-button" onClick={onBack}><ArrowLeft size={14} />Portfolio</button><div className="project-profile-actions"><button className="ops-outline-button" onClick={() => void loadProfile()} aria-label="Refresh project profile"><RefreshCw size={14} />Refresh</button>{canOpenAccounts && <button className="ops-outline-button" onClick={() => onOpenAccount(String(project.project_code))}><ArrowUpRight size={14} />Project account</button>}{canEdit && <button className="ops-red-button" onClick={() => onEdit(projectId)}>Edit project</button>}</div></div>
    {error && <div className="ops-error"><span>{error}</span><button onClick={() => setError('')}>Dismiss</button></div>}
    <section className="ops-panel project-profile-hero"><div className="project-profile-identity"><span className="ops-section-label">{text(project.project_code)} · PROJECT #{text(project.id)}</span><h2>{text(project.name)}</h2><p>{text(project.client)} · {text(project.work_type)} · {text(project.site_address)}</p></div><div className="project-profile-status"><span className={`ops-status ops-status-${String(project.status || '').toLowerCase().replaceAll(/[^a-z]+/g, '-')}`}><i />{text(project.status)}</span><span className="ops-status">{text(project.priority)} priority</span></div></section>
    <section className="ops-metric-grid project-profile-metrics">{[
      ['CONTRACT VALUE', pkr(project.contract_amount)], ['START DATE', text(project.start_date)], ['TARGET COMPLETION', text(project.due_date)], ['DRAWING REVISIONS', String(profile.drawings.length)],
    ].map(([label, amount]) => <article className="ops-metric" key={label}><div className="ops-metric-head"><span>{label}</span><i className="ops-metric-icon metric-gray"><FileText size={14} /></i></div><strong>{amount}</strong><small>{label === 'DRAWING REVISIONS' ? 'Project-linked document history' : label === 'CONTRACT VALUE' ? 'Existing project contract record' : 'Project schedule'}</small></article>)}</section>

    <div className="project-profile-grid"><section className="ops-panel"><div className="ops-panel-head"><div><span className="ops-section-label">PROJECT INFORMATION</span><h2>Client, scope &amp; responsibilities</h2></div></div><dl className="project-detail-grid">
      <div><dt>Client contact</dt><dd>{text(project.client_contact)}</dd></div><div><dt>Phone / email</dt><dd>{text(project.client_phone)}{project.client_email ? ` · ${text(project.client_email)}` : ''}</dd></div>
      <div><dt>Project category</dt><dd>{text(project.category)}</dd></div><div><dt>Project manager</dt><dd>{text(project.manager)}</dd></div>
      <div><dt>Assigned engineers</dt><dd>{text(project.assigned_engineers)}</dd></div><div><dt>Site supervisor</dt><dd>{text(project.site_supervisor)}</dd></div>
      <div className="project-detail-full"><dt>Scope of work</dt><dd>{text(project.scope_of_work)}</dd></div><div className="project-detail-full"><dt>Description</dt><dd>{text(project.description)}</dd></div>
      <div className="project-detail-full"><dt>Specifications</dt><dd>{text(project.project_specifications)}</dd></div><div className="project-detail-full"><dt>Project notes</dt><dd>{text(project.project_notes)}</dd></div>
    </dl></section>
      <section className="ops-panel"><div className="ops-panel-head"><div><span className="ops-section-label">SITE PROGRESS</span><h2>Recent daily reports</h2></div><span className="ops-action-chip">{profile.siteReports.length} reports</span></div><div className="project-report-list">{profile.siteReports.map((report) => <article key={String(report.id)}><div><strong>{text(report.report_number)} · {text(report.report_date)}</strong><span className={`ops-status ops-status-${String(report.status).toLowerCase()}`}><i />{text(report.status)}</span></div><p>{text(report.work_completed)}</p><small>{text(report.supervisor_name)} · {Number(report.labor_count || 0)} workers{report.delays_issues ? ` · Issue: ${text(report.delays_issues)}` : ''}</small></article>)}{!profile.siteReports.length && <div className="project-ledger-empty">No daily site reports recorded yet.</div>}</div></section></div>

    <section className="ops-panel project-profile-drawings"><div className="ops-panel-head"><div><span className="ops-section-label">PROJECT DRAWING REGISTER</span><h2>Drawings &amp; engineering documents</h2></div><div className="project-drawing-head-actions"><label className="project-archive-toggle"><input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} />Show archived</label><span className="ops-action-chip">{profile.drawings.filter((drawing) => drawing.status !== 'Archived').length} active</span></div></div>
      {canEdit && <div className="project-drawing-upload"><label className="project-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}><input type="file" multiple accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png,.tif,.tiff,.ifc,.zip,.rvt" onChange={(event) => event.target.files && addFiles(event.target.files)} /><UploadCloud size={19} /><strong>Drop project drawings here or browse</strong><small>PDF, DWG, DXF, JPG, PNG, TIFF, IFC, ZIP · up to 100 MB each</small></label><div className="project-upload-fields"><label className="ops-field"><span>Drawing category</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label className="ops-field"><span>Revision</span><input value={revision} onChange={(event) => setRevision(event.target.value)} required /></label><label className="ops-field"><span>Description</span><input value={drawingDescription} onChange={(event) => setDrawingDescription(event.target.value)} placeholder="Optional drawing package note" /></label></div>{Boolean(files.length) && <div className="project-upload-queue">{files.map((file, index) => <div key={`${file.name}-${index}`}><FileCode2 size={14} /><span>{file.name}</span><small>{sizeLabel(file.size)}</small><button className="ops-icon-button" disabled={uploading} onClick={() => setFiles((current) => current.filter((_, position) => position !== index))} aria-label={`Remove ${file.name}`}><X size={14} /></button></div>)}<button className="ops-red-button" disabled={uploading || !revision.trim()} onClick={() => void uploadDrawings()}><Plus size={14} />{uploading ? `Uploading ${uploadProgress}%` : `Upload ${files.length} file${files.length === 1 ? '' : 's'}`}</button>{uploading && <progress max="100" value={uploadProgress} />}</div>}</div>}
      <div className="project-drawing-groups">{groupedDrawings.map(([drawingNo, revisions]) => <article className="project-drawing-group" key={drawingNo}><div className="project-drawing-group-head"><span><strong>{drawingNo}</strong><small>{revisions[0].title} · {revisions[0].category}</small></span><span>{revisions.length} revision{revisions.length === 1 ? '' : 's'}</span></div><div className="ops-table-wrap"><table className="ops-table project-drawing-table"><thead><tr><th>REVISION</th><th>UPLOADED</th><th>UPLOADED BY</th><th>FILE</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{revisions.map((drawing) => <tr key={drawing.id}><td><strong>{drawing.revision}</strong></td><td>{text(drawing.uploaded_at)}</td><td>{text(drawing.uploaded_by)}</td><td>{drawing.original_name}<small>{sizeLabel(drawing.file_size)}</small></td><td><span className={`ops-status ops-status-${drawing.status.toLowerCase().replaceAll(/[^a-z]+/g, '-')}`}><i />{drawing.status}</span></td><td><div className="project-drawing-actions">{previewable(drawing) && <button className="ops-row-action" onClick={() => setPreviewDrawing(drawing)}><FileImage size={13} />Preview</button>}<a className="ops-row-action" href={`/api/project-drawings/${drawing.id}/file`}><Download size={13} />Download</a>{canEdit && drawing.status === 'Under Review' && <button className="ops-row-action" onClick={() => void changeStatus(drawing, 'Approved')}><Check size={13} />Approve</button>}{canEdit && drawing.status === 'Approved' && <button className="ops-row-action" onClick={() => void changeStatus(drawing, 'Issued for Construction')}><ShieldCheck size={13} />Issue IFC</button>}{canEdit && drawing.status !== 'Archived' && <button className="ops-row-action project-archive-action" onClick={() => void archiveDrawing(drawing)}><Trash2 size={13} />Archive</button>}{!previewable(drawing) && <span className="project-no-preview">External CAD viewer required</span>}</div></td></tr>)}</tbody></table></div></article>)}{!groupedDrawings.length && <div className="project-ledger-empty"><FolderOpen size={17} />No project drawings yet. Upload files here; every revision is stored against project #{projectId}.</div>}</div>
    </section>

    <section className="ops-panel"><div className="ops-panel-head"><div><span className="ops-section-label">PROJECT ESTIMATES &amp; BILLING</span><h2>Linked documents</h2></div></div><div className="project-compact-list">{documents.map((document) => <div key={String(document.id)}><span><strong>{text(document.document_number)} · {text(document.subject)}</strong><small>{text(document.document_type)} · {text(document.issue_date)} · {text(document.status)}</small></span><b>{pkr(document.grand_total)}</b></div>)}{!documents.length && <div className="project-ledger-empty">No estimates or invoices linked to this project.</div>}</div></section>
    {profile.activity.length > 0 && <section className="ops-panel"><div className="ops-panel-head"><div><span className="ops-section-label">AUDIT TRAIL</span><h2>Recent project activity</h2></div></div><div className="project-report-list">{profile.activity.map((item) => <article key={String(item.id)}><div><strong>{text(item.action)}</strong><small>{text(item.user_name)} · {text(item.created_at)}</small></div><p>{text(item.description)}</p></article>)}</div></section>}
    {previewDrawing && <div className="ops-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewDrawing(null) }}><section className="ops-modal project-preview-modal" role="dialog" aria-modal="true" aria-label={`${previewDrawing.drawing_no} preview`}><div className="ops-modal-head"><span className="ops-section-label">{previewDrawing.drawing_no} · REV {previewDrawing.revision}</span><h2>{previewDrawing.title}</h2><button className="ops-icon-button" onClick={() => setPreviewDrawing(null)} aria-label="Close preview"><X size={16} /></button></div>{previewDrawing.mime_type.startsWith('image/') ? <img className="project-preview-image" src={`/api/project-drawings/${previewDrawing.id}/file?preview=1`} alt={previewDrawing.title} /> : <iframe className="project-preview-pdf" title={previewDrawing.title} src={`/api/project-drawings/${previewDrawing.id}/file?preview=1`} />}</section></div>}
  </div>
}