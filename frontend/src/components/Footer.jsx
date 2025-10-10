export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
      <div className="section py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left: Brand/Made with */}
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">
              Made with ❤️ using React + Flask
            </p>
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              © {new Date().getFullYear()} by arun kuinkel portfolio. Powered and Secured by{' '}
              <a href="#" className="text-primary-600 hover:underline">Wix</a>
            </p>
          </div>

          {/* Center: Contact Info */}
          <div className="text-sm">
            <div className="mb-2">
              <a href="tel:123-456-7890" className="text-primary-600 hover:underline">
                123-456-7890
              </a>
            </div>
            <div className="mb-4">
              <a href="mailto:info@mysite.com" className="text-primary-600 hover:underline">
                info@mysite.com
              </a>
            </div>
            <div className="text-slate-600 dark:text-slate-300">
              <div>500 Terry Francine Street,</div>
              <div>6th Floor, San Francisco,</div>
              <div>CA 94158</div>
            </div>
          </div>

          {/* Right: Links and Social */}
          <div className="text-sm">
            <div className="mb-4 space-y-1">
              <div>
                <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>
              </div>
              <div>
                <a href="#" className="text-primary-600 hover:underline">Accessibility Statement</a>
              </div>
            </div>
            
            {/* Social Icons */}
            <div className="flex gap-3">
              <a href="#" className="w-6 h-6 bg-slate-800 dark:bg-slate-700 rounded-full flex items-center justify-center hover:bg-slate-700 dark:hover:bg-slate-600 transition">
                <span className="text-white text-xs">f</span>
              </a>
              <a href="#" className="w-6 h-6 bg-slate-800 dark:bg-slate-700 rounded-full flex items-center justify-center hover:bg-slate-700 dark:hover:bg-slate-600 transition">
                <span className="text-white text-xs">@</span>
              </a>
              <a href="#" className="w-6 h-6 bg-slate-800 dark:bg-slate-700 rounded-full flex items-center justify-center hover:bg-slate-700 dark:hover:bg-slate-600 transition">
                <span className="text-white text-xs">in</span>
              </a>
              <a href="#" className="w-6 h-6 bg-slate-800 dark:bg-slate-700 rounded-full flex items-center justify-center hover:bg-slate-700 dark:hover:bg-slate-600 transition">
                <span className="text-white text-xs">gh</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
