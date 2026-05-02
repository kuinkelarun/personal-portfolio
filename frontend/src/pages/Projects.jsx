import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useContent } from '../contexts/ContentContext'

// In development, use the Vite proxy by calling the API with a relative path to avoid CORS.
// In production, use VITE_API_BASE_URL if provided.
const API_BASE = (import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || '')).replace(/\/$/, '')

export default function Projects() {
  const { content, loading: contentLoading } = useContent()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hoveredId, setHoveredId] = useState(null)

  useEffect(() => {
    // Use projects from content if available, otherwise fall back to API call
    if (content && Array.isArray(content.projects)) {
      const normalized = content.projects.map(p => ({
        ...p,
        title: p.title ?? p.name,
        tech: p.tech ?? p.tags,
        demo: p.demo ?? p.links?.demo,
        github: p.github ?? p.links?.github,
      }))
      setProjects(normalized)
      setLoading(false)
      return
    }

    // content not available yet — keep previous behavior: call /api/projects
    const url = `${API_BASE}/api/projects`
    import('axios').then(({ default: axios }) => {
      axios.get(url)
        .then(res => {
          const data = res.data
          if (Array.isArray(data)) {
            const normalized = data.map(p => ({
              ...p,
              title: p.title ?? p.name,
              tech: p.tech ?? p.tags,
              demo: p.demo ?? p.links?.demo,
              github: p.github ?? p.links?.github,
            }))
            setProjects(normalized)
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
    })
  }, [content])

  return (
    <section id="projects" className="section py-20 bg-white">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl sm:text-5xl font-bold mb-4">
          <span className="text-gray-900">{(content?.sectionHeaders?.projectsTitle) || 'Featured'} </span>
          <span className="gradient-text">{(content?.sectionHeaders?.projectsSubtitle) || 'Projects'}</span>
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          A showcase of my recent work and personal projects
        </p>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="glass-card rounded-xl p-8">
            <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading projects...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex justify-center py-20">
          <div className="glass-card rounded-xl p-8 text-center max-w-md">
            <span className="text-5xl mb-4 block">⚠️</span>
            <p className="text-red-500 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {!loading && !error && projects.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, idx) => (
            <div
              key={project.id}
              className="relative"
              style={{ zIndex: hoveredId === project.id ? 50 : 'auto' }}
              onMouseEnter={() => setHoveredId(project.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Base Card */}
              <div className={`transition-opacity duration-150 ${hoveredId === project.id ? 'opacity-0' : 'opacity-100'}`}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="glass-card rounded-xl overflow-hidden shadow-md"
              >
                {/* Project Image/Thumbnail */}
                <div className="relative h-48 bg-gradient-to-br from-indigo-100 via-pink-100 to-purple-100 overflow-hidden">
                  {project.image ? (
                    <img
                      src={project.image}
                      alt={project.title || project.name}
                      className="w-full h-full object-cover transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl opacity-50">
                        {((project.title || project.name) ?? '').toLowerCase().includes('calendar') ? '📅' :
                         ((project.title || project.name) ?? '').toLowerCase().includes('housing') ? '🏠' :
                         ((project.title || project.name) ?? '').toLowerCase().includes('api') ? '🔌' : '💻'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="font-bold text-gray-900 text-xl mb-3 line-clamp-2">
                    {project.title ?? project.name ?? 'Untitled Project'}
                  </h3>

                  <p className="text-gray-600 mb-4 leading-relaxed line-clamp-3">
                    {project.description}
                  </p>

                  {/* Tech Stack */}
                  {(project.tech || project.tags) && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(project.tech || project.tags || []).slice(0, 4).map((tech, techIdx) => (
                        <span
                          key={techIdx}
                          className="px-3 py-1 text-xs bg-gradient-to-r from-indigo-50 to-pink-50 text-indigo-600 rounded-full border border-indigo-200 font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                      {(project.tech || project.tags || []).length > 4 && (
                        <span className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-full font-medium">
                          +{(project.tech || project.tags || []).length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    {(project.demo || project.links?.demo) && (
                      <a
                        href={project.demo ?? project.links?.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-center text-sm font-semibold transition-all"
                      >
                        View Demo
                      </a>
                    )}
                    {(project.github || project.links?.github) && (
                      <a
                        href={project.github ?? project.links?.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-center text-sm font-semibold transition-all inline-flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                        </svg>
                        Code
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
              </div>

              {/* Hover Popup */}
              <AnimatePresence>
                {hoveredId === project.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="absolute -top-3 -bottom-3 -left-5 -right-5 z-50 rounded-2xl overflow-hidden shadow-2xl border border-indigo-100 bg-white"
                  >
                    {/* Popup Image Header */}
                    <div className="relative h-44 bg-gradient-to-br from-indigo-100 via-pink-100 to-purple-100 overflow-hidden flex-shrink-0">
                      {project.image ? (
                        <img
                          src={project.image}
                          alt={project.title || project.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-6xl opacity-40">
                            {((project.title || project.name) ?? '').toLowerCase().includes('calendar') ? '📅' :
                             ((project.title || project.name) ?? '').toLowerCase().includes('housing') ? '🏠' :
                             ((project.title || project.name) ?? '').toLowerCase().includes('api') ? '🔌' : '💻'}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-transparent" />
                    </div>

                    {/* Popup Body */}
                    <div className="px-6 pb-6 -mt-3 relative">
                      <h3 className="font-bold text-gray-900 text-xl mb-2 leading-snug">
                        {project.title ?? project.name ?? 'Untitled Project'}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        {project.description}
                      </p>

                      {/* All Tech Tags */}
                      {(project.tech || project.tags) && (
                        <div className="flex flex-wrap gap-1.5 mb-5">
                          {(project.tech || project.tags || []).map((tech, techIdx) => (
                            <span
                              key={techIdx}
                              className="px-2.5 py-0.5 text-xs bg-gradient-to-r from-indigo-50 to-pink-50 text-indigo-600 rounded-full border border-indigo-200 font-medium"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Popup Action Buttons */}
                      <div className="flex gap-3 pt-4 border-t border-gray-100">
                        {(project.demo || project.links?.demo) && (
                          <a
                            href={project.demo ?? project.links?.demo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-center text-sm font-semibold transition-all"
                          >
                            View Demo
                          </a>
                        )}
                        {(project.github || project.links?.github) && (
                          <a
                            href={project.github ?? project.links?.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-center text-sm font-semibold transition-all inline-flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                            </svg>
                            Code
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && projects.length === 0 && (
        <div className="flex justify-center py-20">
          <div className="glass-card rounded-xl p-12 text-center max-w-md">
            <span className="text-6xl mb-4 block">📂</span>
            <p className="text-gray-600 text-lg">No projects to display yet.</p>
          </div>
        </div>
      )}
    </section>
  )
}