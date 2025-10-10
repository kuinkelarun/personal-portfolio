import { motion } from 'framer-motion'

export default function Home() {
  return (
    <section id="home" className="section pt-20 sm:pt-28">
      <div className="flex flex-col sm:flex-row items-center gap-8">
        <div className="flex-1">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-5xl font-bold tracking-tight"
          >
            Hi, I’m Arun Kuinkel
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-slate-600 dark:text-slate-300"
          >
            I build data-driven applications and useful tools like a Nepali Date Converter and an interactive Nepali Calendar.
          </motion.p>
          <div className="mt-6 flex gap-3">
            <a href="#projects" className="px-4 py-2 rounded bg-primary-600 text-white hover:bg-primary-700">View Projects</a>
            <a href="#contact" className="px-4 py-2 rounded border border-slate-300 dark:border-slate-700">Contact Me</a>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex-1 w-full max-w-sm mx-auto relative"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-lg">
            <img 
              src="/hero.png" 
              alt="Arun Kuinkel - Full Stack Developer" 
              className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-all duration-300 rounded-2xl"
              onError={(e) => { e.target.style.display = 'none' }}
            />
            {/* Subtle overlay for better integration */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-white/5 dark:from-black/10 dark:via-transparent dark:to-white/5 pointer-events-none rounded-2xl"></div>
          </div>
          {/* Decorative elements */}
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary-500/20 rounded-full animate-pulse"></div>
          <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-purple-500/15 rounded-full animate-pulse delay-500"></div>
        </motion.div>
      </div>
    </section>
  )
}
