export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-200 shadow-sm">
      <div className="section flex items-center justify-between py-4">
        <a href="#home" className="text-xl font-bold gradient-text hover:opacity-90 transition-opacity">
          Portfolio
        </a>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#home" className="text-gray-700 hover:text-indigo-600 font-medium transition-colors duration-300 relative group">
            Home
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-600 to-pink-600 group-hover:w-full transition-all duration-300"></span>
          </a>
          <a href="#about" className="text-gray-700 hover:text-indigo-600 font-medium transition-colors duration-300 relative group">
            About
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-600 to-pink-600 group-hover:w-full transition-all duration-300"></span>
          </a>
          <a href="#experience" className="text-gray-700 hover:text-indigo-600 font-medium transition-colors duration-300 relative group">
            Experience
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-600 to-pink-600 group-hover:w-full transition-all duration-300"></span>
          </a>
          <a href="#projects" className="text-gray-700 hover:text-indigo-600 font-medium transition-colors duration-300 relative group">
            Projects
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-600 to-pink-600 group-hover:w-full transition-all duration-300"></span>
          </a>
          <a href="#skills" className="text-gray-700 hover:text-indigo-600 font-medium transition-colors duration-300 relative group">
            Skills
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-600 to-pink-600 group-hover:w-full transition-all duration-300"></span>
          </a>
          <a href="#contact" className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all">
            Contact
          </a>
        </nav>
      </div>
    </header>
  )
}