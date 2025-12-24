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
  const [retryCount, setRetryCount] = useState(0)

  async function fetchContent(attempt = 0) {
    setLoading(true)
    try {
      const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
      const url = base ? `${base}/api/content` : '/api/content'
      const res = await axios.get(url)
      
      // Check if we got valid content (not just empty object or default values)
      if (res.data && Object.keys(res.data).length > 0) {
        setContent(res.data)
        setError(null)
        setRetryCount(0)
        setLoading(false)
      } else if (attempt < 3) {
        // If content is empty and we haven't retried 3 times, retry after a delay
        console.log(`Content empty, retrying... (attempt ${attempt + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
        return fetchContent(attempt + 1)
      } else {
        // After max retries, accept whatever we got
        setContent(res.data || {})
        setError(null)
        setLoading(false)
      }
    } catch (err) {
      console.error('Failed to load content', err)
      
      // Retry on network errors (backend not ready yet)
      if (attempt < 3 && (err.code === 'ERR_NETWORK' || err.response?.status >= 500)) {
        console.log(`Network error, retrying... (attempt ${attempt + 1})`);
        setRetryCount(attempt + 1)
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
        return fetchContent(attempt + 1)
      }
      
      // Max retries reached or non-retryable error
      setError(err)
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
