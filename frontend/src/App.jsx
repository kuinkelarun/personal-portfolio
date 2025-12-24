import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Projects from './pages/Projects.jsx'
import About from './pages/About.jsx'
import Experience from './pages/Experience.jsx'
import Skills from './pages/Skills.jsx'
import Contact from './pages/Contact.jsx'
import Admin from './pages/Admin.jsx'
import ProgressTracker from './pages/ProgressTracker.jsx'
import { Routes, Route, useLocation } from 'react-router-dom'
import { ContentProvider } from './contexts/ContentContext'
import { useContent } from './contexts/ContentContext'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <ContentProvider>
        <AppContent />
      </ContentProvider>
    </div>
  )
}

function AppContent() {
  const location = useLocation()
  const { loading, error, fetchContent } = useContent()
  
  // Admin and progress tracker routes don't need content to be loaded
  const isAdminRoute = location.pathname === '/admin'
  const isProgressRoute = location.pathname.startsWith('/progress')
  
  if (isAdminRoute || isProgressRoute) {
    return (
      <Routes>
        <Route path="/admin" element={<Admin />} />
        <Route path="/progress" element={<ProgressTracker />} />
        <Route path="/progress/:trackerKey" element={<ProgressTracker />} />
        <Route path="/progress/tracker" element={<ProgressTracker />} />
      </Routes>
    )
  }

  // Main content routes - show loading/error states
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your portfolio...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Unable to Load Portfolio</h1>
          <p className="text-gray-600 mb-6">
            We're having trouble connecting to the server. This could be a temporary issue.
          </p>
          <button
            onClick={() => fetchContent()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
          >
            Try Again
          </button>
          <p className="text-sm text-gray-500 mt-4">
            If this problem persists, please contact the site administrator.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<ContentRoutes />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

function ContentRoutes() {
  const { content } = useContent()
  const enabled = (content && content.layout && Array.isArray(content.layout.sections))
    ? content.layout.sections
    : ['home', 'about', 'experience', 'projects', 'skills', 'contact']

  return (
    <>
      {enabled.includes('home') && <Home />}
      {enabled.includes('about') && <About />}
      {enabled.includes('experience') && <Experience />}
      {enabled.includes('projects') && <Projects />}
      {enabled.includes('skills') && <Skills />}
      {enabled.includes('contact') && <Contact />}
    </>
  )
}
