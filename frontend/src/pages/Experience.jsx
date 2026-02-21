import { motion } from 'framer-motion'
import experienceData from '../data/experience'
import { useContent } from '../contexts/ContentContext'

export default function Experience() {
  const { content } = useContent()
  const experience = content?.experience ?? experienceData
  const headers = content?.sectionHeaders || {}
  
  return (
    <section id="experience" className="section py-20 bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl sm:text-5xl font-bold mb-4">
          <span className="text-gray-900">{headers.experienceTitle || 'Professional'} </span>
          <span className="gradient-text">{headers.experienceSubtitle || 'Experience'}</span>
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          My journey in software development and the milestones I've achieved
        </p>
      </motion.div>

      {/* Timeline */}
      <div className="max-w-4xl mx-auto">
        {experience.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: idx * 0.1 }}
            className="relative mb-12 last:mb-0"
          >
            {/* Timeline Line */}
            {idx !== experience.length - 1 && (
              <div className="absolute left-8 top-20 w-0.5 h-full bg-gradient-to-b from-indigo-500 to-pink-500 opacity-30"></div>
            )}

            <div className="flex gap-6">
              {/* Timeline Dot */}
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center shadow-lg z-10">
                  <span className="text-2xl">💼</span>
                </div>
              </div>

              {/* Content Card */}
              <div className="flex-1 glass-card rounded-2xl p-8 hover:shadow-2xl transform hover:-translate-y-1">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {item.role}
                    </h3>
                    <p className="text-lg text-indigo-600 font-semibold">
                      {item.company}
                    </p>
                  </div>
                  <span className="px-4 py-2 bg-gradient-to-r from-indigo-100 to-pink-100 text-indigo-700 rounded-full text-sm font-semibold">
                    {item.period || item.range}
                  </span>
                </div>

                <p className="text-gray-600 leading-relaxed mb-4">
                  {item.summary || item.desc}
                </p>

                {/* Responsibilities/Achievements */}
                {item.responsibilities && (
                  <ul className="space-y-2 mb-4">
                    {item.responsibilities.map((resp, respIdx) => (
                      <li key={respIdx} className="flex items-start gap-2 text-gray-600">
                        <svg className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Technologies Used */}
                {item.technologies && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {item.technologies.map((tech, techIdx) => (
                      <span
                        key={techIdx}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
