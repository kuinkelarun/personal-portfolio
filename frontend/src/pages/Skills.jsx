import { motion } from 'framer-motion'
import { useContent } from '../contexts/ContentContext'

export default function Skills() {
  const { content } = useContent()
  const skills = content?.skills || {
    technical: ['JavaScript', 'Python', 'React', 'Node.js'],
    tools: ['Git', 'Docker', 'VS Code'],
    soft: ['Communication', 'Problem Solving', 'Teamwork']
  }
  const headers = content?.sectionHeaders || {}

  const skillCategories = [
    {
      title: 'Technical Skills',
      icon: '💻',
      skills: skills.technical || [],
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      title: 'Tools & Frameworks',
      icon: '🛠️',
      skills: skills.tools || [],
      gradient: 'from-pink-500 to-rose-500'
    },
    {
      title: 'Soft Skills',
      icon: '🤝',
      skills: skills.soft || [],
      gradient: 'from-blue-500 to-cyan-500'
    }
  ]

  return (
    <section id="skills" className="section py-20 bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl sm:text-5xl font-bold mb-4">
          <span className="text-gray-900">{headers.skillsTitle || 'My'} </span>
          <span className="gradient-text">{headers.skillsSubtitle || 'Skills'}</span>
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          A comprehensive set of skills and expertise I bring to every project
        </p>
      </motion.div>

      {/* Skills Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {skillCategories.map((category, idx) => (
          <motion.div
            key={category.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: idx * 0.2 }}
            className="glass-card rounded-2xl p-8 hover:shadow-2xl"
          >
            {/* Category Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center text-2xl shadow-lg`}>
                {category.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900">{category.title}</h3>
            </div>

            {/* Skills List */}
            <div className="flex flex-wrap gap-2">
              {category.skills.map((skill, skillIdx) => (
                <motion.span
                  key={skill}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 + skillIdx * 0.05 }}
                  className="skill-badge"
                >
                  {skill}
                </motion.span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Additional Skills Section */}
      {skills.other && skills.other.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="glass-card rounded-2xl p-8"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Additional Expertise
          </h3>
          <div className="flex flex-wrap gap-3 justify-center">
            {skills.other.map((skill) => (
              <span key={skill} className="skill-badge">
                {skill}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </section>
  )
}
