import { motion } from 'framer-motion'
import experience from '../data/experience'

export default function Experience() {
  return (
    <section id="experience" className="section py-20 bg-slate-50/50 dark:bg-slate-900/20">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 via-primary-600 to-purple-600 dark:from-slate-100 dark:via-primary-400 dark:to-purple-400 bg-clip-text text-transparent mb-4">
          Professional Experience
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          My journey in software development and data science.
        </p>
      </div>
      
      <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {experience.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="group relative rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                    {item.role}
                  </h3>
                  <p className="text-primary-600 dark:text-primary-400 font-medium">
                    {item.company}
                  </p>
                </div>
                <div className="text-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                  💼
                </div>
              </div>
              
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 font-medium">
                {item.period}
              </p>
              
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {item.summary}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
