import { motion } from 'framer-motion'

export default function About() {
  const experience = [
    {
      role: "Senior Data Analyst",
      company: "Tech Corp",
      period: "2022 - Present",
      summary: "Leading data analytics initiatives and building scalable data pipelines that serve millions of users daily."
    },
    {
      role: "Full Stack Developer",
      company: "StartupXYZ",
      period: "2020 - 2022", 
      summary: "Developed end-to-end web applications using React, Node.js, and cloud infrastructure on AWS."
    },
    {
      role: "Data Scientist",
      company: "Analytics Inc",
      period: "2019 - 2020",
      summary: "Built machine learning models for predictive analytics and automated reporting systems."
    },
    {
      role: "Software Engineer",
      company: "DevCorp",
      period: "2018 - 2019",
      summary: "Implemented robust backend services and collaborated on cross-functional product development."
    }
  ];

  const skills = [
    { name: 'Python', icon: '🐍' },
    { name: 'Flask', icon: '🌶️' },
    { name: 'Pandas', icon: '🐼' },
    { name: 'scikit-learn', icon: '🤖' },
    { name: 'JavaScript', icon: '⚡' },
    { name: 'React', icon: '⚛️' },
    { name: 'Tailwind', icon: '🎨' },
    { name: 'Git', icon: '📝' },
    { name: 'SQL', icon: '🗃️' }
  ]
  
  return (
    <section id="about" className="section py-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 via-primary-600 to-purple-600 dark:from-slate-100 dark:via-primary-400 dark:to-purple-400 bg-clip-text text-transparent mb-4">
          About Me
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Passionate about creating impactful solutions through code.
        </p>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-xl text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
            I'm passionate about building useful tools and data-driven applications. I enjoy working across the full stack, from data pipelines to beautiful user interfaces.
          </p>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Always learning, always building, always improving.
          </p>
        </motion.div>

        {/* Experience Section */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-center mb-8 text-slate-900 dark:text-slate-100">
            Professional Experience
          </h3>
          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
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
                      <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                        {item.role}
                      </h4>
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
        </div>
        
        <div>
          <h3 className="text-2xl font-bold text-center mb-8 text-slate-900 dark:text-slate-100">
            Skills & Technologies
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {skills.map((skill, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                whileHover={{ scale: 1.05 }}
                className="group relative px-6 py-3 rounded-2xl bg-gradient-to-r from-primary-100 to-purple-100 dark:from-primary-900/30 dark:to-purple-900/30 border border-primary-200/50 dark:border-primary-800/50 hover:shadow-lg hover:shadow-primary-500/20 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg group-hover:scale-110 transition-transform duration-200">
                    {skill.icon}
                  </span>
                  <span className="font-medium text-primary-700 dark:text-primary-300">
                    {skill.name}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}