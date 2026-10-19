import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import OperationsApp from './operations/OperationsApp.tsx'

function MainRouter() {
  const [view, setView] = useState<'crm' | 'operations'>(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('view') === 'operations' ? 'operations' : 'crm'
  })

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      setView(params.get('view') === 'operations' ? 'operations' : 'crm')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return view === 'operations' ? <OperationsApp /> : <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MainRouter />
  </StrictMode>,
)

