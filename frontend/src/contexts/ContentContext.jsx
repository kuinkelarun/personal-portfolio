import { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'

const ContentContext = createContext(null)

export function useContent() {
  return useContext(ContentContext)
}

export function ContentProvider({ children }) {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetchContent() {
    setLoading(true)
    try {
      const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
      const url = base ? `${base}/api/content` : '/api/content'
      const res = await axios.get(url)
      setContent(res.data)
      setError(null)
    } catch (err) {
      console.error('Failed to load content', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchContent() }, [])

  // Update a single key and refresh local state
  async function updateKey(key, value, token) {
    try {
      const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
      const url = base ? `${base}/api/content/${encodeURIComponent(key)}` : `/api/content/${encodeURIComponent(key)}`
      await axios.put(url, value, {
        headers: token ? { 'X-ADMIN-TOKEN': token } : {}
      })
      // refresh
      await fetchContent()
      return { success: true }
    } catch (err) {
      console.error('Failed to update content key', key, err)
      return { success: false, error: err }
    }
  }

  return (
    <ContentContext.Provider value={{ content, loading, error, fetchContent, updateKey }}>
      {children}
    </ContentContext.Provider>
  )
}

export default ContentContext
