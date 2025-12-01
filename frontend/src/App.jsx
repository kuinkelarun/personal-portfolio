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
import { Routes, Route } from 'react-router-dom'
import { ContentProvider } from './contexts/ContentContext'
import { useContent } from './contexts/ContentContext'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <ContentProvider>
        <Navbar />
        <main className="flex-1">
          <ContentRoutes />
        </main>
        <Footer />
      </ContentProvider>
    </div>
  )
}

function ContentRoutes() {
  const { content } = useContent()
  const enabled = (content && content.layout && Array.isArray(content.layout.sections))
    ? content.layout.sections
    : ['home', 'about', 'experience', 'projects', 'skills', 'contact']

  return (
    <Routes>
      <Route path="/" element={<>
        {enabled.includes('home') && <Home />}
        {enabled.includes('about') && <About />}
        {enabled.includes('experience') && <Experience />}
        {enabled.includes('projects') && <Projects />}
        {enabled.includes('skills') && <Skills />}
        {enabled.includes('contact') && <Contact />}
      </>} />
      <Route path="/admin" element={<Admin />} />
      {/* Progress tracker routes: default, specific tracker key, and legacy path */}
      <Route path="/progress" element={<ProgressTracker />} />
      <Route path="/progress/:trackerKey" element={<ProgressTracker />} />
      <Route path="/progress/tracker" element={<ProgressTracker />} />
    </Routes>
  )
}
