import { motion } from 'framer-motion'
import { useContent } from '../contexts/ContentContext'

export default function About() {
  const { content } = useContent()
  const about = content?.about || {}
  const headers = content?.sectionHeaders || {}

  const highlights = about.highlights || [
    { icon: '🎯', title: 'Focused', description: 'Dedicated to delivering high-quality solutions' },
    { icon: '🚀', title: 'Innovative', description: 'Always exploring new technologies and approaches' },
    { icon: '💡', title: 'Creative', description: 'Thinking outside the box to solve problems' },
    { icon: '🤝', title: 'Collaborative', description: 'Working effectively with teams and stakeholders' }
  ]

  return (
    <section id="about" className="section py-20 bg-white">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl sm:text-5xl font-bold mb-4">
          <span className="text-gray-900">{headers.aboutTitle || 'About'} </span>
          <span className="gradient-text">{headers.aboutSubtitle || 'Me'}</span>
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {about.subtitle || "Get to know more about my background and what drives me"}
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
        {/* Profile Image or Placeholder */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          {about.profileImage ? (
            <div className="relative max-w-md mx-auto">
              <img
                src={about.profileImage}
                alt="Profile"
                className="rounded-2xl shadow-2xl w-full h-auto object-cover"
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-pink-500/20"></div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-12 text-center max-w-md mx-auto">
              <div className="w-48 h-48 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-100 to-pink-100 flex items-center justify-center">
                <span className="text-8xl">👨‍💻</span>
              </div>
              <p className="text-gray-600 italic">Profile image coming soon</p>
            </div>
          )}
        </motion.div>

        {/* About Content */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {(about.aboutHeadline || about.headline) && (
            <h3 className="text-3xl font-bold text-gray-900 mb-6">
              {about.aboutHeadline || about.headline}
            </h3>
          )}
          <div className="prose prose-lg text-gray-600 space-y-4">
            <p>
              {about.bio || "I'm passionate about building innovative solutions that make a difference. With a strong foundation in software development and a keen eye for design, I create applications that are both functional and beautiful."}
            </p>
            {about.bio2 && <p>{about.bio2}</p>}
            {about.bio3 && <p>{about.bio3}</p>}
          </div>

          {/* Quick Stats */}
          {about.stats && (
            <div className="grid grid-cols-3 gap-4 mt-8">
              {about.stats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="text-center p-4 glass-card rounded-xl"
                >
                  <div className="text-3xl font-bold gradient-text mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Highlights/Values */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="mb-16"
      >
        <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
          {headers.aboutHighlights || 'What I Bring to the Table'}
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {highlights.map((highlight, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="glass-card rounded-xl p-6 text-center hover:shadow-xl transform hover:-translate-y-2"
            >
              <div className="text-4xl mb-4">{highlight.icon}</div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                {highlight.title}
              </h4>
              <p className="text-sm text-gray-600">
                {highlight.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
