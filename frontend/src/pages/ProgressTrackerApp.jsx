import React, { useState, useEffect } from 'react'
import { CheckCircle2, Circle, Calendar, TrendingUp, Target, Award, BookOpen, Code, Rocket } from 'lucide-react'
import { useContent } from '../contexts/ContentContext'

// Storage wrapper: use window.storage if present (e.g. extension environment), otherwise fallback to localStorage
const storageWrapper = {
  async get(key) {
    try {
      if (typeof window !== 'undefined' && window.storage && typeof window.storage.get === 'function') {
        return await window.storage.get(key)
      }
      const v = localStorage.getItem(key)
      return v ? { value: v } : null
    } catch (e) {
      return null
    }
  },
  async set(key, value) {
    try {
      if (typeof window !== 'undefined' && window.storage && typeof window.storage.set === 'function') {
        return await window.storage.set(key, value)
      }
      localStorage.setItem(key, value)
    } catch (e) {
      console.warn('Failed to persist storage', e)
    }
  }
}

export default function ProgressTrackerApp() {
  // Add attributes/classes to <a> tags so links open in new tab and are styled
  const transformLinksForRender = (html) => {
    if (!html || typeof html !== 'string') return html
    // Add target and rel if not present, and add a Tailwind-friendly class for color/underline
    try {
      // Add class + target+rel only when <a doesn't already have target/rel
      return html.replace(/<a(?![^>]*\btarget=)(?![^>]*\brel=)(?![^>]*\bclass=)/gi, '<a class="text-blue-300 underline" target="_blank" rel="noopener noreferrer"')
                 .replace(/<a(?![^>]*\btarget=)(?![^>]*\brel=)(?=[^>]*\bclass=)/gi, '<a target="_blank" rel="noopener noreferrer"')
    } catch (e) {
      return html
    }
  }
  const [progress, setProgress] = useState({})
  const [activePhase, setActivePhase] = useState(0)
  const [dailyLogs, setDailyLogs] = useState([])
  const [newLog, setNewLog] = useState({ hours: '', activity: '', notes: '' })

  useEffect(() => {
    const loadData = async () => {
      try {
        const progressData = await storageWrapper.get('ai-progress')
        const logsData = await storageWrapper.get('ai-daily-logs')

        if (progressData) {
          const raw = progressData.value ?? progressData
          setProgress(JSON.parse(raw))
        }
        if (logsData) {
          const raw = logsData.value ?? logsData
          setDailyLogs(JSON.parse(raw))
        }
      } catch (error) {
        console.log('Starting fresh', error)
      }
    }
    loadData()
  }, [])

  const saveProgress = async (newProgress) => {
    setProgress(newProgress)
    await storageWrapper.set('ai-progress', JSON.stringify(newProgress))
  }

  const saveDailyLogs = async (logs) => {
    setDailyLogs(logs)
    await storageWrapper.set('ai-daily-logs', JSON.stringify(logs))
  }

  const phases = [
    {
      id: 'phase1',
      name: 'Phase 1: Foundations',
      weeks: '1-6',
      color: 'blue',
      icon: BookOpen,
      milestones: [
        { id: 'm1', text: 'Complete mathematics refresher (Linear Algebra, Calculus, Probability)', week: '1-2' },
        { id: 'm2', text: 'Master NumPy, Pandas, Matplotlib', week: '3-4' },
        { id: 'm3', text: 'Implement Linear Regression from scratch', week: '3-4' },
        { id: 'm4', text: 'Complete Fast.ai ML course', week: '5-6' },
        { id: 'm5', text: 'Implement 5+ classical ML algorithms from scratch', week: '5-6' },
        { id: 'm6', text: 'PROJECT: End-to-end ML pipeline with deployment', week: '5-6' }
      ]
    },
    {
      id: 'phase2',
      name: 'Phase 2: Deep Learning Fundamentals',
      weeks: '7-12',
      color: 'purple',
      icon: Code,
      milestones: [
        { id: 'm7', text: 'Complete Fast.ai DL Part 1 (lessons 1-7)', week: '7-8' },
        { id: 'm8', text: 'Complete Andrew Ng DL Course 1', week: '7-8' },
        { id: 'm9', text: 'PROJECT: Neural Network from scratch (NumPy only)', week: '7-8' },
        { id: 'm10', text: 'Master PyTorch fundamentals', week: '9-10' },
        { id: 'm11', text: 'Build CNN for CIFAR-10', week: '9-10' },
        { id: 'm12', text: 'PROJECT: Computer Vision app with deployment', week: '9-10' },
        { id: 'm13', text: 'Complete Andrew Ng DL Courses 2, 4, 5', week: '11-12' },
        { id: 'm14', text: 'PROJECT: Sequence-to-Sequence model', week: '11-12' }
      ]
    },
    {
      id: 'phase3',
      name: 'Phase 3: Modern AI & LLMs',
      weeks: '13-18',
      color: 'green',
      icon: Rocket,
      milestones: [
        { id: 'm15', text: 'Complete Andrej Karpathy "Neural Networks: Zero to Hero"', week: '13-14' },
        { id: 'm16', text: 'Complete Hugging Face NLP Course', week: '13-14' },
        { id: 'm17', text: 'PROJECT: Build mini-GPT from scratch', week: '13-14' },
        { id: 'm18', text: 'Master Hugging Face Transformers library', week: '15-16' },
        { id: 'm19', text: 'Learn LangChain & LlamaIndex', week: '15-16' },
        { id: 'm20', text: 'PROJECT: Production RAG system with monitoring', week: '15-16' },
        { id: 'm21', text: 'Learn fine-tuning techniques (LoRA, QLoRA)', week: '17-18' },
        { id: 'm22', text: 'PROJECT: Fine-tune and deploy 7B LLM', week: '17-18' }
      ]
    },
    {
      id: 'phase4',
      name: 'Phase 4: Elite-Level Skills',
      weeks: '19-24',
      color: 'orange',
      icon: Award,
      milestones: [
        { id: 'm23', text: 'Master MLOps tools (MLflow, W&B)', week: '19-20' },
        { id: 'm24', text: 'PROJECT: Complete MLOps platform', week: '19-20' },
        { id: 'm25', text: 'Deep dive into chosen specialization', week: '21-22' },
        { id: 'm26', text: 'Implement 2-3 SOTA models from papers', week: '21-22' },
        { id: 'm27', text: 'Write 3-4 technical blog posts', week: '23-24' },
        { id: 'm28', text: 'Build portfolio website', week: '23-24' },
        { id: 'm29', text: 'Start job applications (5-10/week)', week: '23-24' },
        { id: 'm30', text: 'Target: 5-10 onsites scheduled', week: '23-24' }
      ]
    }
  ]

  // Prefer admin-provided content.progressTracker when available
  const { content } = useContent()
  const displayedPhases = (content && Array.isArray(content.progressTracker) && content.progressTracker.length)
    ? content.progressTracker.map(p => ({ ...p, milestones: p.milestones || [] }))
    : phases

  // Expanded state for milestone details (click milestone to expand)
  const [expanded, setExpanded] = useState({})

  const toggleExpand = (milestoneId) => {
    setExpanded(prev => ({ ...prev, [milestoneId]: !prev[milestoneId] }))
  }

  // Toggle completion (kept as a separate control inside the milestone)
  const toggleCompletion = (phaseId, milestoneId) => {
    const newProgress = { ...progress }
    const key = `${phaseId}-${milestoneId}`
    newProgress[key] = !newProgress[key]
    saveProgress(newProgress)
  }

  const addDailyLog = async () => {
    if (newLog.hours && newLog.activity) {
      const log = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        hours: parseFloat(newLog.hours),
        activity: newLog.activity,
        notes: newLog.notes
      }
      const updatedLogs = [log, ...dailyLogs]
      await saveDailyLogs(updatedLogs)
      setNewLog({ hours: '', activity: '', notes: '' })
    }
  }

  const deleteDailyLog = async (id) => {
    const updatedLogs = dailyLogs.filter(log => log.id !== id)
    await saveDailyLogs(updatedLogs)
  }

  const getPhaseProgress = (phase) => {
    const completed = phase.milestones.filter(m => progress[`${phase.id}-${m.id}`]).length
    return Math.round((completed / phase.milestones.length) * 100)
  }

  const getTotalProgress = () => {
    const totalMilestones = displayedPhases.reduce((sum, phase) => sum + (phase.milestones || []).length, 0)
    const completedMilestones = displayedPhases.reduce((sum, phase) => {
      return sum + (phase.milestones || []).filter(m => progress[`${phase.id}-${m.id}`]).length
    }, 0)
    return totalMilestones === 0 ? 0 : Math.round((completedMilestones / totalMilestones) * 100)
  }

  const getTotalHours = () => {
    return dailyLogs.reduce((sum, log) => sum + log.hours, 0).toFixed(1)
  }

  const getWeeklyHours = () => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    return dailyLogs
      .filter(log => new Date(log.date) >= oneWeekAgo)
      .reduce((sum, log) => sum + log.hours, 0)
      .toFixed(1)
  }

  const colorMap = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500'
  }

  const textColorMap = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
    orange: 'text-orange-400'
  }

  // Detailed text for each milestone mapped from TransformationPlan.txt
  const milestoneDetails = {
    // Phase 1
    m1: `Week 1-2 — Mathematics Refresher:\n\n**Linear Algebra (Critical)**\n- Khan Academy: Vectors, matrices, matrix operations, eigenvalues/eigenvectors\n- 3Blue1Brown "Essence of Linear Algebra" (YouTube series—watch all 15 videos)\n- Practice: NumPy exercises implementing matrix operations from scratch\n\n**Calculus & Optimization**\n- Review derivatives, partial derivatives, chain rule, gradient descent\n- Khan Academy Multivariable Calculus (first 5 sections)\n- Focus on: Why gradients matter for training neural networks\n\n**Probability & Statistics**\n- Distributions (normal, binomial), expected value, variance\n- Bayes' theorem, conditional probability\n- StatQuest YouTube channel (Josh Starmer)—watch ML prerequisites playlist\n\n**Daily Commitment:** 2-3 hours`,

    m2: `Week 3-4 — Python for ML & Core Libraries:\n\n**Deep Python Skills**\n- Object-oriented programming, decorators, generators, context managers\n- Book: "Effective Python" by Brett Slatkin (skim relevant chapters)\n\n**NumPy Mastery**\n- Array operations, broadcasting, vectorization\n- Practice: Implement matrix multiplication, dot products without loops\n- NumPy official tutorials: https://numpy.org/learn/\n\n**Pandas for Data Manipulation**\n- DataFrames, indexing, groupby, merge/join operations\n- Kaggle's Pandas micro-course (4 hours)\n\n**Matplotlib & Seaborn**\n- Data visualization fundamentals\n- Practice: Visualize different data distributions and model results`,

    m3: `Week 3-4 — Project: Implement Linear Regression from Scratch:\n- Use only NumPy (no scikit-learn)\n- Implement gradient descent manually\n- Visualize loss function convergence\n- Compare your implementation to scikit-learn's version\n\n**Deliverables & Notes:**\n- Jupyter notebook with code and plots\n- Clear explanation of gradient descent, learning rate selection, and testing results\n- Aim for correctness and understanding rather than library shortcuts`,

    m4: `Week 5-6 — Classical Machine Learning (Fast.ai + algorithms):\n\n**Course: Fast.ai "Introduction to Machine Learning for Coders"**\n- Focus on practical implementation\n- Complete all coding exercises\n\n**Core Algorithms to Implement**\n1. Linear Regression (already done)\n2. Logistic Regression\n3. Decision Trees\n4. Random Forests\n5. K-Means Clustering\n6. Principal Component Analysis (PCA)\n\n**Scikit-learn Deep Dive**\n- Model training, evaluation, hyperparameter tuning\n- Cross-validation, train/test splits\n- Pipelines and preprocessing`,

    m5: `Week 5-6 — Practical Algorithms & Practice:\n- Implement the classical ML algorithms listed above from scratch or using scikit-learn to compare performance\n- Practice cross-validation and hyperparameter search\n- Build pipelines for data preprocessing and model evaluation\n- Focus on interpretability and proper evaluation metrics`,

    m6: `Week 5-6 — Project: End-to-End ML Pipeline:\n- Pick a Kaggle dataset (e.g., Titanic, House Prices)\n- Data cleaning, feature engineering, model selection\n- Compare 3-5 different algorithms\n- Document your process in a Jupyter notebook\n- Deploy a simple prediction API using Flask\n- Leverage your DevOps skills: Dockerize it, add CI/CD\n\n**Daily Commitment:** 3-4 hours`,

    // Phase 2
    m7: `Weeks 7-8 — Neural Networks Foundation:\n- Fast.ai Part 1 lessons 1-7 (top-down approach).\n- Andrew Ng: basics of backprop and network design.\n- Deliverable: small models, understanding of training loops.`,
    m8: `Andrew Ng DL Course 1:\n- Study forward/backprop, activations, loss functions, optimizers.\n- Implement from-scratch examples for clarity.`,
    m9: `Project — Neural Network from scratch:\n- Build a 2-layer NN using NumPy and train on MNIST.\n- Goal: >90% accuracy. Then re-implement in PyTorch.`,
    m10: `Master PyTorch fundamentals:\n- Tensors, autograd, nn.Module, DataLoader, training loops.\n- Save/load models, checkpointing, and GPU usage.`,
    m11: `Build CNN for CIFAR-10:\n- Implement conv nets, data augmentation, training/validation pipelines.\n- Evaluate with confusion matrices and error analysis.`,
    m12: `Project — Computer Vision app with deployment:\n- Use transfer learning (ResNet/EfficientNet), augment data.\n- Track with TensorBoard or W&B; deploy with containers.`,
    m13: `Complete Andrew Ng Courses 2/4/5:\n- Improving deep nets, CNNs, sequence models.\n- Focus on architecture details and training tips.`,
    m14: `Project — Sequence-to-Sequence model:\n- Build a translation or chatbot model with attention.\n- Compare LSTM vs Transformer approaches; deploy as API.`,

    // Phase 3
    m15: `Weeks 13-14 — Transformer deep dive:\n- Study self-attention, positional encodings, decoder-only vs encoder-decoder.\n- Follow Karpathy's "build GPT" tutorial for hands-on experience.`,
    m16: `Complete Hugging Face NLP Course:\n- Tokenizers, transformers API, pipelines, and fine-tuning basics.`,
    m17: `Project — Build mini-GPT:\n- Implement a small character/word level transformer and train on a corpus.\n- Deliverable: training code and sample generations.`,
    m18: `Master Hugging Face Transformers:\n- Loading models, training loops, adapters/PEFT, and inference.`,
    m19: `Learn LangChain & LlamaIndex:\n- Build RAG pipelines, embeddings, vector stores, and QA flows.`,
    m20: `Project — Production RAG system:\n- Build document ingestion, chunking, embeddings, vector search.\n- Add monitoring, caching, rate-limiting for production readiness.`,
    m21: `Learn fine-tuning techniques:\n- LoRA, QLoRA, PEFT methods and quantization strategies.\n- Practice efficient fine-tuning on smaller hardware.`,
    m22: `Project — Fine-tune and deploy 7B LLM:\n- Prepare dataset, apply QLoRA/LoRA, evaluate changes vs baseline.\n- Deploy with optimized inference (vLLM/TGI).`,

    // Phase 4
    m23: `Weeks 19-20 — MLOps Excellence:\n- Experiment tracking (MLflow/W&B), model registry, monitoring, drift detection.`,
    m24: `Project — Complete MLOps platform:\n- Build end-to-end platform: experiment tracking, model serving, retraining pipelines, dashboards.`,
    m25: `Deep dive into chosen specialization:\n- Pick CV / NLP / RL and implement state-of-the-art models and projects.`,
    m26: `Implement SOTA models from papers:\n- Reproduce 2-3 recent papers; focus on understanding implementation details.`,
    m27: `Write technical blog posts:\n- Draft 3-4 in-depth posts sharing experiments, findings, and code samples.`,
    m28: `Build portfolio website:\n- Showcase projects, deploy demos and APIs, and include documentation.`,
    m29: `Start job applications:\n- Apply 5-10/week; tailor resume and cover letters to each role.`,
    m30: `Target onsites scheduled:\n- Prepare interview problems, system design for ML, and behavioral prep; aim for 5-10 onsites.`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            AI Engineer Transformation Tracker
          </h1>
          <p className="text-slate-400">DevOps to Elite AI Engineer - 6 Month Journey</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Total Progress</span>
              <Target className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold">{getTotalProgress()}%</div>
            <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${getTotalProgress()}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Total Hours</span>
              <Calendar className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold">{getTotalHours()}</div>
            <div className="text-slate-400 text-sm mt-2">Logged study time</div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">This Week</span>
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-3xl font-bold">{getWeeklyHours()}h</div>
            <div className="text-slate-400 text-sm mt-2">Last 7 days</div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Current Phase</span>
              <Award className="w-5 h-5 text-orange-400" />
            </div>
            <div className="text-3xl font-bold">{activePhase + 1}</div>
            <div className="text-slate-400 text-sm mt-2">of 4 phases</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-2xl font-bold mb-6">Milestones & Progress</h2>

              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {displayedPhases.map((phase, idx) => {
                  const Icon = phase.icon || BookOpen
                  const phaseProgress = getPhaseProgress(phase)
                  return (
                    <button
                      key={phase.id}
                      onClick={() => setActivePhase(idx)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                        activePhase === idx
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      Phase {idx + 1}
                      <span className="text-xs ml-1">({phaseProgress}%)</span>
                    </button>
                  )
                })}
              </div>

              {displayedPhases.map((phase, idx) => {
                if (idx !== activePhase) return null
                const Icon = phase.icon || BookOpen
                const phaseProgress = getPhaseProgress(phase)

                return (
                  <div key={phase.id} className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Icon className={`w-6 h-6 ${textColorMap[phase.color]}`} />
                        <div>
                          <h3 className="text-xl font-bold">{phase.name}</h3>
                          <p className="text-slate-400 text-sm">Weeks {phase.weeks}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{phaseProgress}%</div>
                        <div className="text-slate-400 text-sm">Complete</div>
                      </div>
                    </div>

                    <div className="w-full bg-slate-700 rounded-full h-3 mb-6">
                      <div
                        className={`${colorMap[phase.color]} h-3 rounded-full transition-all duration-500`}
                        style={{ width: `${phaseProgress}%` }}
                      />
                    </div>

                    <div className="space-y-3">
                      {phase.milestones.map((milestone) => {
                        const isCompleted = progress[`${phase.id}-${milestone.id}`]
                        const isExpanded = !!expanded[milestone.id]
                        const detailText = (milestone && milestone.details) || milestoneDetails[milestone.id] || ''
                        return (
                          <div
                            key={milestone.id}
                            onClick={() => toggleExpand(milestone.id)}
                            className={`flex flex-col gap-3 p-4 rounded-lg cursor-pointer transition-all ${
                              isCompleted
                                ? 'bg-slate-700/50 border border-green-500/30'
                                : 'bg-slate-700/30 border border-slate-600 hover:bg-slate-700/50'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleCompletion(phase.id, milestone.id) }}
                                className="flex-shrink-0 mt-0.5"
                                aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                                ) : (
                                  <Circle className="w-6 h-6 text-slate-500" />
                                )}
                              </button>

                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className={`font-medium ${isCompleted ? 'text-slate-300 line-through' : 'text-white'}`}>
                                      {milestone.text}
                                    </p>
                                    <p className="text-slate-400 text-sm mt-1">Week {milestone.week}</p>
                                  </div>
                                  <div className="text-sm text-slate-400 ml-4">{isExpanded ? 'Hide details' : 'Show details'}</div>
                                </div>

                                        {isExpanded && (
                                          <div className="mt-3 bg-slate-800 p-3 rounded border border-slate-700 text-slate-300">
                                            {milestone && milestone.details ? (
                                              // If the admin-saved details contain HTML tags, render as HTML.
                                              // Otherwise fall back to treating it as plain text with newlines.
                                              /<[^>]+>/.test(milestone.details) ? (
                                                <div className="text-slate-300">
                                                  <div dangerouslySetInnerHTML={{ __html: transformLinksForRender(milestone.details) }} />
                                                </div>
                                              ) : (
                                                detailText.split('\n').map((line, i) => {
                                                  const trimmed = line.trim()
                                                  if (trimmed.startsWith('- ')) {
                                                    return <div key={i} className="ml-2">• {trimmed.slice(2)}</div>
                                                  }
                                                  return <p key={i} className="mb-1">{trimmed}</p>
                                                })
                                              )
                                            ) : (detailText ? (
                                              detailText.split('\n').map((line, i) => {
                                                const trimmed = line.trim()
                                                if (trimmed.startsWith('- ')) {
                                                  return <div key={i} className="ml-2">• {trimmed.slice(2)}</div>
                                                }
                                                return <p key={i} className="mb-1">{trimmed}</p>
                                              })
                                            ) : (
                                              <p className="text-slate-400">No additional details available.</p>
                                            ))}
                                          </div>
                                        )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-6">
              <h2 className="text-xl font-bold mb-4">Daily Log</h2>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Hours Studied</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newLog.hours}
                    onChange={(e) => setNewLog({...newLog, hours: e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="3.5"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Activity</label>
                  <input
                    type="text"
                    value={newLog.activity}
                    onChange={(e) => setNewLog({...newLog, activity: e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Completed linear algebra course"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Notes (Optional)</label>
                  <textarea
                    value={newLog.notes}
                    onChange={(e) => setNewLog({...newLog, notes: e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 h-20 resize-none"
                    placeholder="Key learnings or challenges..."
                  />
                </div>

                <button
                  onClick={addDailyLog}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg px-4 py-2 font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  Add Log Entry
                </button>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {dailyLogs.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-4">No logs yet. Start tracking your progress!</p>
                ) : (
                  dailyLogs.map((log) => (
                    <div key={log.id} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-white">{log.activity}</p>
                          <p className="text-slate-400 text-sm mt-1">{log.date}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-blue-400 font-bold">{log.hours}h</span>
                          <button
                            onClick={() => deleteDailyLog(log.id)}
                            className="text-slate-400 hover:text-red-400 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      {log.notes && (
                        <p className="text-slate-400 text-sm mt-2 border-t border-slate-600 pt-2">
                          {log.notes}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-bold mb-3">💡 Progress Tips</h3>
          <ul className="text-slate-300 text-sm space-y-2">
            <li>• <strong>Consistency beats intensity:</strong> Aim for 3-5 hours daily rather than marathon sessions</li>
            <li>• <strong>Track everything:</strong> Log your hours and activities to stay accountable</li>
            <li>• <strong>Build in public:</strong> Share your milestones on LinkedIn to build your brand</li>
            <li>• <strong>Don't rush:</strong> Understanding &gt; completion. Make sure you truly grasp each concept</li>
            <li>• <strong>Your advantage:</strong> Always emphasize your production deployment skills in projects</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
