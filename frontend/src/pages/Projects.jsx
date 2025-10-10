import { useEffect, useState } from 'react'
import axios from 'axios'
import ProjectCard from '../components/ProjectCard'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const url = `${API_BASE}/api/projects`
    axios.get(url)
      .then(res => {
        const data = res.data
        if (Array.isArray(data)) {
          setProjects(data)
        } else {
          console.error('API response is not an array:', data)
          setError('Invalid API response format')
        }
      })
      .catch(err => {
        console.error('Failed to fetch projects:', err)
        setError('Failed to load projects')
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="projects" className="section py-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 via-primary-600 to-purple-600 dark:from-slate-100 dark:via-primary-400 dark:to-purple-400 bg-clip-text text-transparent mb-4">
          Featured Projects
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          A showcase of my work in data science, web development, and tools for the Nepali community.
        </p>
      </div>
      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && projects.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p, index) => <ProjectCard key={p.id} project={p} index={index} />)}
        </div>
      )}
      {!loading && !error && projects.length === 0 && (
        <p className="text-slate-600 dark:text-slate-300">No projects found.</p>
      )}
    </section>
  )
}
