import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { useContent } from '../contexts/ContentContext'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '')
  const [unlocked, setUnlocked] = useState(!!localStorage.getItem('admin_token'))
  const [activeTab, setActiveTab] = useState('about')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [saving, setSaving] = useState(false)

  const { content, fetchContent, updateKey } = useContent()
  const [editContent, setEditContent] = useState({})

  useEffect(() => {
    if (unlocked && content) {
      setEditContent(content)
    }
  }, [content, unlocked])

  useEffect(() => {
    if (unlocked) fetchContent()
  }, [unlocked])

  function saveToken() {
    if (!token.trim()) {
      showMessage('error', 'Please enter an admin token')
      return
    }
    localStorage.setItem('admin_token', token)
    setUnlocked(true)
    showMessage('success', 'Admin access granted')
  }

  function logout() {
    localStorage.removeItem('admin_token')
    setToken('')
    setUnlocked(false)
    showMessage('info', 'Logged out successfully')
  }

  function showMessage(type, text) {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 4000)
  }

  async function saveSection(section) {
    setSaving(true)
    setMessage({ type: '', text: '' })
    try {
      const result = await updateKey(section, editContent[section], token)
      if (result.success) {
        showMessage('success', `${section.charAt(0).toUpperCase() + section.slice(1)} saved successfully!`)
      } else {
        showMessage('error', 'Failed to save. Please check your token.')
      }
    } catch (err) {
      showMessage('error', 'An error occurred while saving.')
    } finally {
      setSaving(false)
    }
  }

  async function uploadImage(file, section, field) {
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await axios.post(`${API_BASE}/api/upload`, fd, {
        headers: { 'X-ADMIN-TOKEN': token, 'Content-Type': 'multipart/form-data' }
      })
      const url = res.data?.url
      if (url) {
        // If the target section in editContent is an array (e.g., projects),
        // do not overwrite the whole section object — return the URL so the caller
        // can update the array item. For top-level objects (like about), update directly.
        if (Array.isArray(editContent[section])) {
          showMessage('success', 'Image uploaded successfully!')
          return url
        } else {
          updateSection(section, field, url)
          showMessage('success', 'Image uploaded successfully!')
          return url
        }
      }
      return null
    } catch (err) {
      showMessage('error', 'Failed to upload image')
      return null
    }
  }

  function updateSection(section, field, value) {
    setEditContent(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [field]: value
      }
    }))
  }

  function updateArrayItem(section, index, field, value) {
    setEditContent(prev => {
      const arr = [...(prev[section] || [])]
      arr[index] = { ...arr[index], [field]: value }
      return { ...prev, [section]: arr }
    })
  }

  function addArrayItem(section, template) {
    setEditContent(prev => ({
      ...prev,
      [section]: [...(prev[section] || []), template]
    }))
  }

  function removeArrayItem(section, index) {
    setEditContent(prev => ({
      ...prev,
      [section]: (prev[section] || []).filter((_, i) => i !== index)
    }))
  }

  function addSkill(category, skill) {
    if (!skill.trim()) return
    setEditContent(prev => ({
      ...prev,
      skills: {
        ...(prev.skills || {}),
        [category]: [...((prev.skills || {})[category] || []), skill.trim()]
      }
    }))
  }

  function removeSkill(category, index) {
    setEditContent(prev => ({
      ...prev,
      skills: {
        ...(prev.skills || {}),
        [category]: ((prev.skills || {})[category] || []).filter((_, i) => i !== index)
      }
    }))
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-pink-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-2xl p-8 max-w-md w-full shadow-2xl"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Access</h1>
            <p className="text-gray-600">Enter your admin token to continue</p>
          </div>

          <div className="space-y-4">
            <input
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveToken()}
              placeholder="Enter admin token..."
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
            />
            <button
              onClick={saveToken}
              className="w-full btn-primary"
            >
              Unlock Admin Panel
            </button>
          </div>

          {message.text && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-indigo-50 text-indigo-700'
            }`}>
              {message.text}
            </div>
          )}
        </motion.div>
      </div>
    )
  }

  const tabs = [
    { id: 'about', label: 'About Me', icon: '👤' },
    { id: 'experience', label: 'Experience', icon: '💼' },
    { id: 'projects', label: 'Projects', icon: '💻' },
    { id: 'skills', label: 'Skills', icon: '🎯' },
    { id: 'contact', label: 'Contact', icon: '📧' },
    { id: 'footer', label: 'Footer', icon: '🔗' },
    { id: 'layout', label: 'Layout', icon: '⚙️' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20">
      <div className="section py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Content Management</h1>
            <p className="text-gray-600">Manage your portfolio content with ease</p>
          </div>
          <button
            onClick={logout}
            className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transform hover:scale-105 transition-all inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
              message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' :
              'bg-blue-50 border border-blue-200 text-blue-700'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap inline-flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="glass-card rounded-2xl p-8">
          {activeTab === 'about' && <AboutTab data={editContent.about || {}} update={updateSection} save={() => saveSection('about')} saving={saving} uploadImage={uploadImage} />}
          {activeTab === 'experience' && <ExperienceTab data={editContent.experience || []} update={(data) => setEditContent(prev => ({...prev, experience: data}))} save={() => saveSection('experience')} saving={saving} addItem={addArrayItem} removeItem={removeArrayItem} updateItem={updateArrayItem} />}
          {activeTab === 'projects' && <ProjectsTab data={editContent.projects || []} update={(data) => setEditContent(prev => ({...prev, projects: data}))} save={() => saveSection('projects')} saving={saving} addItem={addArrayItem} removeItem={removeArrayItem} updateItem={updateArrayItem} uploadImage={uploadImage} token={token} />}
          {activeTab === 'skills' && <SkillsTab data={editContent.skills || {}} update={(data) => setEditContent(prev => ({...prev, skills: data}))} save={() => saveSection('skills')} saving={saving} addSkill={addSkill} removeSkill={removeSkill} />}
          {activeTab === 'contact' && <ContactTab data={editContent.contact || {}} update={updateSection} save={() => saveSection('contact')} saving={saving} />}
          {activeTab === 'footer' && <FooterTab data={editContent.footerLinks || []} update={(data) => setEditContent(prev => ({...prev, footerLinks: data}))} save={() => saveSection('footerLinks')} saving={saving} />}
          {activeTab === 'layout' && <LayoutTab data={editContent.layout || {}} update={(data) => setEditContent(prev => ({...prev, layout: data}))} save={() => saveSection('layout')} saving={saving} />}
        </div>
      </div>
    </div>
  )
}

// Footer Tab - manage footer social link blocks
function FooterTab({ data, update, save, saving }) {
  const handleAdd = () => {
    const item = { id: Date.now(), provider: 'custom', label: 'Custom', url: '' }
    update([...(data || []), item])
  }

  const updateItem = (idx, field, value) => {
    const newData = [...(data || [])]
    newData[idx] = { ...newData[idx], [field]: value }
    update(newData)
  }

  const removeItem = (idx) => {
    update((data || []).filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Footer Social Links</h2>
        <button onClick={handleAdd} className="btn-secondary inline-flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Link
        </button>
      </div>

      {(data || []).map((item, idx) => (
        <div key={item.id || idx} className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
          <div className="grid md:grid-cols-3 gap-3">
            <select value={item.provider || 'custom'} onChange={e => updateItem(idx, 'provider', e.target.value)} className="px-3 py-2 rounded border-2 border-gray-200">
              <option value="github">GitHub</option>
              <option value="linkedin">LinkedIn</option>
              <option value="twitter">Twitter</option>
              <option value="custom">Custom</option>
            </select>

            <input type="text" value={item.label || ''} onChange={e => updateItem(idx, 'label', e.target.value)} placeholder="Label (e.g., GitHub)" className="px-3 py-2 rounded border-2 border-gray-200" />

            <input type="url" value={item.url || ''} onChange={e => updateItem(idx, 'url', e.target.value)} placeholder="https://..." className="px-3 py-2 rounded border-2 border-gray-200" />
          </div>

          <div className="flex justify-end mt-3">
            <button onClick={() => removeItem(idx)} className="text-red-600 hover:text-red-800">Remove</button>
          </div>
        </div>
      ))}

      <div className="flex gap-3 pt-6 border-t border-gray-200">
        <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Footer Links'}
        </button>
      </div>
    </div>
  )
}

// About Tab
function AboutTab({ data, update, save, saving, uploadImage }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">About Me Content</h2>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
          <input
            type="text"
            value={data.name || ''}
            onChange={e => update('about', 'name', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
            placeholder="Your Full Name"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Headline</label>
          <input
            type="text"
            value={data.headline || ''}
            onChange={e => update('about', 'headline', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
            placeholder="Hi, I'm..."
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Tagline</label>
        <input
          type="text"
          value={data.tagline || ''}
          onChange={e => update('about', 'tagline', e.target.value)}
          className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
          placeholder="Your professional tagline"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Summary/Bio</label>
        <textarea
          value={data.summary || ''}
          onChange={e => update('about', 'summary', e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none resize-none"
          placeholder="A brief summary about yourself..."
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Profile Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={e => e.target.files[0] && uploadImage(e.target.files[0], 'about', 'profileImage')}
          className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
        />
        {data.profileImage && (
          <div className="mt-4 flex items-center gap-4">
            <img src={data.profileImage} alt="Profile" className="w-32 h-32 object-cover rounded-lg" />
            <div className="flex flex-col gap-2">
              <button
                onClick={() => update('about', 'profileImage', '')}
                className="btn-secondary"
                type="button"
              >
                Remove Image
              </button>
              <div className="text-sm text-gray-500">Click Remove Image then Save to persist.</div>
            </div>
          </div>
        )}
      </div>

      <div>
        <h4 className="mt-4 mb-2 font-semibold text-gray-800">Social Links</h4>
        <div className="grid md:grid-cols-3 gap-4">
          <input
            type="url"
            value={(data.socialLinks && data.socialLinks.github) || ''}
            onChange={e => update('about', 'socialLinks', { ...(data.socialLinks || {}), github: e.target.value })}
            placeholder="GitHub URL"
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
          />
          <input
            type="url"
            value={(data.socialLinks && data.socialLinks.linkedin) || ''}
            onChange={e => update('about', 'socialLinks', { ...(data.socialLinks || {}), linkedin: e.target.value })}
            placeholder="LinkedIn URL"
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
          />
          <input
            type="url"
            value={(data.socialLinks && data.socialLinks.twitter) || ''}
            onChange={e => update('about', 'socialLinks', { ...(data.socialLinks || {}), twitter: e.target.value })}
            placeholder="Twitter URL"
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-6 border-t border-gray-200">
        <button
          onClick={save}
          disabled={saving}
          className="btn-primary disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save About Section'}
        </button>
      </div>
    </div>
  )
}

// Experience Tab
function ExperienceTab({ data, update, save, saving, addItem, removeItem, updateItem }) {
  const handleAdd = () => {
    const newExp = { company: '', role: '', period: '', summary: '', responsibilities: [], technologies: [] }
    update([...data, newExp])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Experience</h2>
        <button onClick={handleAdd} className="btn-secondary inline-flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Experience
        </button>
      </div>

      {data.map((exp, idx) => (
        <div key={idx} className="p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Experience #{idx + 1}</h3>
            <button
              onClick={() => update(data.filter((_, i) => i !== idx))}
              className="text-red-500 hover:text-red-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              value={exp.company || ''}
              onChange={e => {
                const newData = [...data]
                newData[idx] = { ...newData[idx], company: e.target.value }
                update(newData)
              }}
              placeholder="Company Name"
              className="px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
            />
            <input
              type="text"
              value={exp.role || ''}
              onChange={e => {
                const newData = [...data]
                newData[idx] = { ...newData[idx], role: e.target.value }
                update(newData)
              }}
              placeholder="Job Title"
              className="px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
            />
          </div>

          <input
            type="text"
            value={exp.period || ''}
            onChange={e => {
              const newData = [...data]
              newData[idx] = { ...newData[idx], period: e.target.value }
              update(newData)
            }}
            placeholder="Time Period (e.g., 2020 - 2023)"
            className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none mb-4"
          />

          <textarea
            value={exp.summary || ''}
            onChange={e => {
              const newData = [...data]
              newData[idx] = { ...newData[idx], summary: e.target.value }
              update(newData)
            }}
            rows={3}
            placeholder="Job summary..."
            className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none resize-none"
          />
        </div>
      ))}

      <div className="flex gap-3 pt-6 border-t border-gray-200">
        <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Experience'}
        </button>
      </div>
    </div>
  )
}

// Projects Tab
function ProjectsTab({ data, update, save, saving, uploadImage, token }) {
  const handleAdd = () => {
    const newProject = { id: Date.now(), title: '', description: '', tech: [], demo: '', github: '', image: '' }
    update([...data, newProject])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
        <button onClick={handleAdd} className="btn-secondary inline-flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Project
        </button>
      </div>

      {data.map((project, idx) => (
        <div key={project.id || idx} className="p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Project #{idx + 1}</h3>
            <button
              onClick={() => update(data.filter((_, i) => i !== idx))}
              className="text-red-500 hover:text-red-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          <input
            type="text"
            value={project.title || ''}
            onChange={e => {
              const newData = [...data]
              newData[idx] = { ...newData[idx], title: e.target.value }
              update(newData)
            }}
            placeholder="Project Title"
            className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none mb-4"
          />

          <textarea
            value={project.description || ''}
            onChange={e => {
              const newData = [...data]
              newData[idx] = { ...newData[idx], description: e.target.value }
              update(newData)
            }}
            rows={3}
            placeholder="Project description..."
            className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none resize-none mb-4"
          />

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              value={project.demo || ''}
              onChange={e => {
                const newData = [...data]
                newData[idx] = { ...newData[idx], demo: e.target.value }
                update(newData)
              }}
              placeholder="Demo URL"
              className="px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
            />
            <input
              type="text"
              value={project.github || ''}
              onChange={e => {
                const newData = [...data]
                newData[idx] = { ...newData[idx], github: e.target.value }
                update(newData)
              }}
              placeholder="GitHub URL"
              className="px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
            />
          </div>

          <input
            type="text"
            value={(project.tech || []).join(', ')}
            onChange={e => {
              const newData = [...data]
              newData[idx] = { ...newData[idx], tech: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }
              update(newData)
            }}
            placeholder="Technologies (comma-separated)"
            className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none mb-4"
          />

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Project Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => {
                if (e.target.files[0]) {
                  uploadImage(e.target.files[0], 'projects', 'image').then(url => {
                    if (url) {
                      const newData = [...data]
                      newData[idx] = { ...newData[idx], image: url }
                      update(newData)
                    }
                  })
                }
              }}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
            />
            {project.image && (
              <img src={project.image} alt={project.title} className="mt-2 w-full h-32 object-cover rounded-lg" />
            )}
          </div>
        </div>
      ))}

      <div className="flex gap-3 pt-6 border-t border-gray-200">
        <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Projects'}
        </button>
      </div>
    </div>
  )
}

// Skills Tab
function SkillsTab({ data, update, save, saving, addSkill, removeSkill }) {
  const [newSkills, setNewSkills] = useState({ technical: '', tools: '', soft: '', other: '' })

  const categories = [
    { key: 'technical', label: 'Technical Skills', icon: '💻' },
    { key: 'tools', label: 'Tools & Frameworks', icon: '🛠️' },
    { key: 'soft', label: 'Soft Skills', icon: '🤝' },
    { key: 'other', label: 'Other Skills', icon: '🎯' }
  ]

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Skills Management</h2>

      {categories.map(cat => (
        <div key={cat.key} className="p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </h3>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newSkills[cat.key]}
              onChange={e => setNewSkills(prev => ({...prev, [cat.key]: e.target.value}))}
              onKeyDown={e => {
                if (e.key === 'Enter' && newSkills[cat.key].trim()) {
                  addSkill(cat.key, newSkills[cat.key])
                  setNewSkills(prev => ({...prev, [cat.key]: ''}))
                }
              }}
              placeholder={`Add ${cat.label.toLowerCase()}...`}
              className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
            />
            <button
              onClick={() => {
                if (newSkills[cat.key].trim()) {
                  addSkill(cat.key, newSkills[cat.key])
                  setNewSkills(prev => ({...prev, [cat.key]: ''}))
                }
              }}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
            >
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {(data[cat.key] || []).map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-indigo-200 text-indigo-700 rounded-full font-medium"
              >
                {skill}
                <button
                  onClick={() => removeSkill(cat.key, idx)}
                  className="hover:text-red-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      ))}

      <div className="flex gap-3 pt-6 border-t border-gray-200">
        <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Skills'}
        </button>
      </div>
    </div>
  )
}

// Contact Tab
function ContactTab({ data, update, save, saving }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={data.email || ''}
            onChange={e => update('contact', 'email', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
          <input
            type="tel"
            value={data.phone || ''}
            onChange={e => update('contact', 'phone', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
            placeholder="+1 (555) 123-4567"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
        <input
          type="text"
          value={data.location || ''}
          onChange={e => update('contact', 'location', e.target.value)}
          className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
          placeholder="City, Country"
        />
      </div>

      <div className="flex gap-3 pt-6 border-t border-gray-200">
        <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Contact Info'}
        </button>
      </div>
    </div>
  )
}

// Layout Tab
function LayoutTab({ data, update, save, saving }) {
  const sections = ['home', 'about', 'experience', 'projects', 'skills', 'contact']
  const enabledSections = data.sections || sections

  const toggleSection = (section) => {
    const newSections = enabledSections.includes(section)
      ? enabledSections.filter(s => s !== section)
      : [...enabledSections, section]
    update({ ...data, sections: newSections })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Layout Configuration</h2>

      <div className="p-6 bg-gray-50 rounded-xl">
        <h3 className="font-bold text-gray-900 mb-4">Section Visibility</h3>
        <p className="text-sm text-gray-600 mb-4">Toggle sections on/off to control what appears on your portfolio</p>

        <div className="space-y-3">
          {sections.map(section => (
            <label key={section} className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={enabledSections.includes(section)}
                onChange={() => toggleSection(section)}
                className="w-5 h-5 text-indigo-600 rounded"
              />
              <span className="font-medium text-gray-900 capitalize">{section}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-6 border-t border-gray-200">
        <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Layout'}
        </button>
      </div>
    </div>
  )
}
