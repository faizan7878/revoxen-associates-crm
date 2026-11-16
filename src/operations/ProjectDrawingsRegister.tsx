import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, FileCode2, FileImage, FolderOpen, RefreshCw } from 'lucide-react'

type Project = { id: number; project_code: string; name: string }
type Drawing = { id: number; project_id: number; drawing_no: string; title: string; category: string; revision: string; status: string; mime_type: string; file_size: number; original_name: string; uploaded_by: string; uploaded_at: string }

const text = (value: unknown) => value === undefined || value === null || value === '' ? '—' : String(value)
const bytes = (size: number) => size >= 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(size / 1024))} KB`
const canPreview = (drawing: Drawing) => ['application/pdf','image/jpeg','image/png','image/tiff'].includes(drawing.mime_type)

async function getDrawings(projectId: number) {
  const token = localStorage.getItem('revoxen_token')
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined
  const response = await fetch(`/api/projects/${projectId}/drawings`, { credentials: 'include', headers })
  const result = await response.json() as Drawing[] | { error?: string }
  if (!response.ok) throw new Error('error' in result ? result.error : `Request failed (${response.status})`)
  return result as Drawing[]
}

export default function ProjectDrawingsRegister({ projects, search, onOpenProject }: { projects: Project[]; search: string; onOpenProject: (projectId: number) => void }) {
  const [drawings, setDrawings] = useState<Drawing[]>([])
  const [category, setCategory] = useState('All categories')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<Drawing | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try { setDrawings((await Promise.all(projects.map((project) => getDrawings(project.id)))).flat()) }
    catch (problem) { setError(problem instanceof Error ? problem.message : 'Could not load project drawings.') }
    finally { setLoading(false) }
  }, [projects])

  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const categories = useMemo(() => ['All categories', ...new Set(drawings.map((drawing) => drawing.category))], [drawings])
  const filtered = drawings.filter((drawing) => {
    const project = projects.find((item) => item.id === drawing.project_id)
    const query = search.trim().toLowerCase()
    return (category === 'All categories' || drawing.category === category) && (!query || `${drawing.drawing_no} ${drawing.title} ${drawing.category} ${drawing.revision} ${project?.project_code} ${project?.name}`.toLowerCase().includes(query))
  })

  return <div className="project-register-page">
    <section className="ops-panel project-register-toolbar"><div><span className="ops-section-label">SHARED DRAWING REGISTER</span><h2>{drawings.length} project-linked revisions</h2><p>Each record is stored against a numeric project ID and keeps its original file.</p></div><div><select aria-label="Filter by drawing category" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select><button className="ops-outline-button" onClick={() => void load()}><RefreshCw size={14} />Refresh</button></div></section>
    {error && <div className="ops-error"><span>{error}</span><button onClick={() => void load()}>Retry</button></div>}
    <section className="ops-panel project-register-table"><div className="ops-table-wrap"><table className="ops-table"><thead><tr><th>DRAWING NO.</th><th>TITLE / FILE</th><th>PROJECT</th><th>CATEGORY</th><th>REVISION</th><th>STATUS</th><th>UPLOADED</th><th>ACTIONS</th></tr></thead><tbody>
      {filtered.map((drawing) => {
        const project = projects.find((item) => item.id === drawing.project_id)
        return <tr key={drawing.id}><td><strong>{drawing.drawing_no}</strong></td><td>{drawing.title}<small>{drawing.original_name} · {bytes(drawing.file_size)}</small></td><td><button className="ops-row-action" onClick={() => onOpenProject(drawing.project_id)}>{project?.project_code || `#${drawing.project_id}`} · {project?.name || 'Project'}</button></td><td>{drawing.category}</td><td>{drawing.revision}</td><td><span className={`ops-status ops-status-${drawing.status.toLowerCase().replaceAll(/[^a-z]+/g, '-')}`}><i />{drawing.status}</span></td><td>{text(drawing.uploaded_at)}<small>{drawing.uploaded_by}</small></td><td><div className="project-register-actions">{canPreview(drawing) && <button className="ops-row-action" onClick={() => setPreview(drawing)}><FileImage size={13} />Preview</button>}<a className="ops-row-action" href={`/api/project-drawings/${drawing.id}/file`}><Download size={13} />Download</a><button className="ops-row-action" onClick={() => onOpenProject(drawing.project_id)}><FolderOpen size={13} />Open project</button></div></td></tr>
      })}
      {!filtered.length && <tr><td colSpan={8}><div className="project-register-empty">{loading ? 'Loading drawing register…' : drawings.length ? 'No drawings match the current search and category.' : <><FileCode2 size={18} />No uploaded project drawings yet. Open a project profile to upload drawings.</>}</div></td></tr>}
    </tbody></table></div></section>
    {preview && <div className="ops-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreview(null) }}><section className="ops-modal project-preview-modal" role="dialog" aria-modal="true" aria-label={`${preview.drawing_no} preview`}><div className="ops-modal-head"><span className="ops-section-label">{preview.drawing_no} · REV {preview.revision}</span><h2>{preview.title}</h2><button className="ops-icon-button" onClick={() => setPreview(null)} aria-label="Close preview">×</button></div>{preview.mime_type.startsWith('image/') ? <img className="project-preview-image" src={`/api/project-drawings/${preview.id}/file?preview=1`} alt={preview.title} /> : <iframe className="project-preview-pdf" title={preview.title} src={`/api/project-drawings/${preview.id}/file?preview=1`} />}</section></div>}
  </div>
}