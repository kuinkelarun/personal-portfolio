import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Projects from './pages/Projects.jsx'
import About from './pages/About.jsx'
import Experience from './pages/Experience.jsx'
import Skills from './pages/Skills.jsx'
import Contact from './pages/Contact.jsx'
import Admin from './pages/Admin.jsx'
import { Routes, Route } from 'react-router-dom'
import { ContentProvider } from './contexts/ContentContext'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <ContentProvider>
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<>
              <Home />
              <About />
              <Experience />
              <Projects />
              <Skills />
              <Contact />
            </>} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
        <Footer />
      </ContentProvider>
    </div>
  )
}
