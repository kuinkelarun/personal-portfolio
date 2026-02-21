import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { useContent } from '../contexts/ContentContext'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '')
  const [unlocked, setUnlocked] = useState(!!localStorage.getItem('admin_token'))
  const [activeTab, setActiveTab] = useState('about')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [saving, setSaving] = useState(false)

  const { content, fetchContent, updateKey } = useContent()
  const [editContent, setEditContent] = useState({})
  const [selectedTrackerKey, setSelectedTrackerKey] = useState('progressTracker')
  const [unsavedKeys, setUnsavedKeys] = useState([])

  useEffect(() => {
    if (unlocked && content) {
      setEditContent(content)
    }
  }, [content, unlocked])

  // Ensure a default tracker key exists in editContent for the editor
  useEffect(() => {
    if (unlocked && editContent) {
      const DEFAULT_HEADER = 'DevOps to AI Engineer - 6 Month Journey'
      let changed = false
      const next = { ...editContent }

      // If the key is missing, create an object shape with header + phases
      if (next.progressTracker === undefined || next.progressTracker === null) {
        next.progressTracker = { header: DEFAULT_HEADER, phases: [] }
        changed = true
      } else if (Array.isArray(next.progressTracker)) {
        // convert legacy array shape to object shape
        next.progressTracker = { header: DEFAULT_HEADER, phases: next.progressTracker }
        changed = true
      } else if (typeof next.progressTracker === 'object' && !next.progressTracker.header) {
        next.progressTracker = { ...next.progressTracker, header: DEFAULT_HEADER }
        changed = true
      }

      if (changed) setEditContent(next)
    }
  }, [unlocked, editContent])

  // Navigation guard: warn when leaving page with unsaved changes
  useEffect(() => {
    const handler = (e) => {
      if (unsavedKeys.length > 0) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
      return undefined
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [unsavedKeys])

  useEffect(() => {
    if (unlocked) fetchContent()
  }, [unlocked])

  function saveToken() {
    if (!token.trim()) {
      showMessage('error', 'Please enter an admin token')
      return
    }
    localStorage.setItem('admin_token', token)
    setUnlocked(true)
    showMessage('success', 'Admin access granted')
  }

  function markDirty(key) {
    setUnsavedKeys(prev => {
      if (prev.includes(key)) return prev
      return [...prev, key]
    })
  }

  function discardChanges(key) {
    setEditContent(prev => {
      const next = { ...prev }
      // If key exists in backend content, reset to that value
      if (content && content[key] !== undefined) {
        next[key] = content[key]
      } else {
        // remove the key entirely
        delete next[key]
      }
      return next
    })
    setUnsavedKeys(prev => prev.filter(k => k !== key))
    // if the selected key was removed, switch selection back to default
    if (!content || content[key] === undefined) setSelectedTrackerKey('progressTracker')
  }

  function logout() {
    localStorage.removeItem('admin_token')
    setToken('')
    setUnlocked(false)
    showMessage('info', 'Logged out successfully')
  }

  function showMessage(type, text) {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 4000)
  }

  // If an admin token is provided via URL query (e.g. ?admin_token=...), apply it for this origin.
  // This helps when you open the site under a different host (127.0.0.1 vs localhost).
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const t = params.get('admin_token') || params.get('token')
      if (t) {
        localStorage.setItem('admin_token', t)
        setToken(t)
        setUnlocked(true)
        showMessage('success', 'Admin token applied from URL for this origin')
        // Remove token from URL to avoid leaking in history
        try {
          const u = new URL(window.location.href)
          u.searchParams.delete('admin_token')
          u.searchParams.delete('token')
          window.history.replaceState(null, '', u.pathname + u.search + u.hash)
        } catch (e) {}
      }
    } catch (e) {}
  }, [])

  async function saveSection(section) {
    setSaving(true)
    setMessage({ type: '', text: '' })
    try {
      const result = await updateKey(section, editContent[section], token)
      if (result.success) {
        showMessage('success', `${section.charAt(0).toUpperCase() + section.slice(1)} saved successfully!`)
        // clear unsaved mark for this key
        setUnsavedKeys(prev => prev.filter(k => k !== section))
      } else {
        showMessage('error', 'Failed to save. Please check your token.')
      }
    } catch (err) {
      showMessage('error', 'An error occurred while saving.')
    } finally {
      setSaving(false)
    }
  }

  async function uploadImage(file, section, field) {
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await axios.post(`${API_BASE}/api/upload`, fd, {
        headers: { 'X-ADMIN-TOKEN': token, 'Content-Type': 'multipart/form-data' }
      })
      const url = res.data?.url
      if (url) {
        // If the target section in editContent is an array (e.g., projects),
        // do not overwrite the whole section object — return the URL so the caller
        // can update the array item. For top-level objects (like about), update directly.
        if (Array.isArray(editContent[section])) {
          showMessage('success', 'Image uploaded successfully!')
          return url
        } else {
          // Update local state
          updateSection(section, field, url)
          showMessage('success', 'Image uploaded successfully!')
          
          // Auto-save the section after upload
          setTimeout(async () => {
            setSaving(true)
            try {
              const updatedSection = {
                ...(editContent[section] || {}),
                [field]: url
              }
              const result = await updateKey(section, updatedSection, token)
              if (result.success) {
                showMessage('success', 'Image uploaded and saved!')
                setUnsavedKeys(prev => prev.filter(k => k !== section))
              } else {
                showMessage('error', 'Image uploaded but failed to save. Please click Save button.')
              }
            } catch (err) {
              showMessage('error', 'Image uploaded but failed to save. Please click Save button.')
            } finally {
              setSaving(false)
            }
          }, 100)
          
          return url
        }
      }
      return null
    } catch (err) {
      showMessage('error', 'Failed to upload image')
      return null
    }
  }

  function updateSection(section, field, value) {
    setEditContent(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [field]: value
      }
    }))
  }

  function updateArrayItem(section, index, field, value) {
    setEditContent(prev => {
      const arr = [...(prev[section] || [])]
      arr[index] = { ...arr[index], [field]: value }
      return { ...prev, [section]: arr }
    })
  }

  function addArrayItem(section, template) {
    setEditContent(prev => ({
      ...prev,
      [section]: [...(prev[section] || []), template]
    }))
  }

  function removeArrayItem(section, index) {
    setEditContent(prev => ({
      ...prev,
      [section]: (prev[section] || []).filter((_, i) => i !== index)
    }))
  }

  function addSkill(category, skill) {
    if (!skill.trim()) return
    setEditContent(prev => ({
      ...prev,
      skills: {
        ...(prev.skills || {}),
        [category]: [...((prev.skills || {})[category] || []), skill.trim()]
      }
    }))
  }

  function removeSkill(category, index) {
    setEditContent(prev => ({
      ...prev,
      skills: {
        ...(prev.skills || {}),
        [category]: ((prev.skills || {})[category] || []).filter((_, i) => i !== index)
      }
    }))
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-pink-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-2xl p-8 max-w-md w-full shadow-2xl"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Access</h1>
            <p className="text-gray-600">Enter your admin token to continue</p>
          </div>

          <div className="space-y-4">
            <input
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveToken()}
              placeholder="Enter admin token..."
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
            />
            <button
              onClick={saveToken}
              className="w-full btn-primary"
            >
              Unlock Admin Panel
            </button>
          </div>

          {message.text && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-indigo-50 text-indigo-700'
            }`}>
              {message.text}
            </div>
          )}
        </motion.div>
      </div>
    )
  }

  const tabs = [
    { id: 'about', label: 'About Me', icon: '👤' },
    { id: 'experience', label: 'Experience', icon: '💼' },
    { id: 'projects', label: 'Projects', icon: '💻' },
    { id: 'skills', label: 'Skills', icon: '🎯' },
    { id: 'contact', label: 'Contact', icon: '📧' },
    { id: 'section-headers', label: 'Section Headers', icon: '📝' },
    { id: 'footer', label: 'Footer', icon: '🔗' },
    { id: 'layout', label: 'Layout', icon: '⚙️' },
    { id: 'progress-tracker', label: 'Progress Tracker', icon: '📈' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20">
      <div className="section py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Content Management</h1>
            <p className="text-gray-600">Manage your portfolio content with ease</p>
          </div>
          <button
            onClick={logout}
            className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transform hover:scale-105 transition-all inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
              message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' :
              'bg-blue-50 border border-blue-200 text-blue-700'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                // If leaving the progress-tracker tab while that tracker has unsaved changes, warn the user
                if (activeTab === 'progress-tracker' && tab.id !== 'progress-tracker' && unsavedKeys.includes(selectedTrackerKey)) {
                  const leave = window.confirm('You have unsaved changes in the Progress Tracker. Click OK to discard and continue, or Cancel to stay and save.')
                  if (!leave) return
                  // discard changes and proceed
                  discardChanges(selectedTrackerKey)
                }
                setActiveTab(tab.id)
              }}
              className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap inline-flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="glass-card rounded-2xl p-8">
          {activeTab === 'about' && <AboutTab data={editContent.about || {}} update={updateSection} save={() => saveSection('about')} saving={saving} uploadImage={uploadImage} />}
          {activeTab === 'experience' && <ExperienceTab data={editContent.experience || []} update={(data) => setEditContent(prev => ({...prev, experience: data}))} save={() => saveSection('experience')} saving={saving} addItem={addArrayItem} removeItem={removeArrayItem} updateItem={updateArrayItem} />}
          {activeTab === 'projects' && <ProjectsTab data={editContent.projects || []} update={(data) => setEditContent(prev => ({...prev, projects: data}))} save={() => saveSection('projects')} saving={saving} addItem={addArrayItem} removeItem={removeArrayItem} updateItem={updateArrayItem} uploadImage={uploadImage} token={token} />}
          {activeTab === 'skills' && <SkillsTab data={editContent.skills || {}} update={(data) => setEditContent(prev => ({...prev, skills: data}))} save={() => saveSection('skills')} saving={saving} addSkill={addSkill} removeSkill={removeSkill} />}
          {activeTab === 'contact' && <ContactTab data={editContent.contact || {}} update={updateSection} save={() => saveSection('contact')} saving={saving} />}
          {activeTab === 'section-headers' && <SectionHeadersTab data={editContent.sectionHeaders || {}} update={(data) => setEditContent(prev => ({...prev, sectionHeaders: data}))} save={() => saveSection('sectionHeaders')} saving={saving} />}
          {activeTab === 'footer' && <FooterTab data={editContent.footerLinks || []} update={(data) => setEditContent(prev => ({...prev, footerLinks: data}))} save={() => saveSection('footerLinks')} saving={saving} />}
          {activeTab === 'layout' && <LayoutTab data={editContent.layout || {}} update={(data) => setEditContent(prev => ({...prev, layout: data}))} save={() => saveSection('layout')} saving={saving} />}
          {activeTab === 'progress-tracker' && (
            <div>
              <TrackerSelector
                editContent={editContent}
                selectedKey={selectedTrackerKey}
                setSelectedKey={setSelectedTrackerKey}
                createKey={(key) => {
                  const defaultHeader = 'DevOps to AI Engineer - 6 Month Journey'
                  setEditContent(prev => ({ ...prev, [key]: { header: defaultHeader, phases: [] } }))
                  setSelectedTrackerKey(key)
                  markDirty(key)
                }}
              />
              <ProgressTrackerTab
                data={editContent[selectedTrackerKey] ? (Array.isArray(editContent[selectedTrackerKey]) ? editContent[selectedTrackerKey] : (editContent[selectedTrackerKey].phases || [])) : (editContent.progressTracker || [])}
                update={(data) => { setEditContent(prev => ({ ...prev, [selectedTrackerKey]: { ...(prev[selectedTrackerKey] || {}), phases: data } })); markDirty(selectedTrackerKey) }}
                save={() => saveSection(selectedTrackerKey)}
                saving={saving}
                trackerHeader={(editContent[selectedTrackerKey] && editContent[selectedTrackerKey].header) || ''}
                updateHeader={(h) => { setEditContent(prev => ({ ...prev, [selectedTrackerKey]: { ...(prev[selectedTrackerKey] || {}), header: h } })); markDirty(selectedTrackerKey) }}
                cancel={() => discardChanges(selectedTrackerKey)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Small selector UI for choosing/creating progress trackers
function TrackerSelector({ editContent, selectedKey, setSelectedKey, createKey }) {
  const keys = Object.keys(editContent || {}).filter(k => k.startsWith('progressTracker'))

  const handleAdd = () => {
    // Find next available suffix
    let n = 1
    while (keys.includes(n === 1 ? 'progressTracker' : `progressTracker${n}`)) n++
    const newKey = n === 1 ? 'progressTracker' : `progressTracker${n}`
    createKey(newKey)
  }

  return (
    <div className="flex items-center gap-3 mb-4">
      <label className="text-sm text-gray-600">Select Tracker:</label>
      <select value={selectedKey} onChange={e => setSelectedKey(e.target.value)} className="px-3 py-2 rounded border-2 border-gray-200">
        {keys.length === 0 && <option value="progressTracker">progressTracker</option>}
        {keys.map(k => <option key={k} value={k}>{k}</option>)}
      </select>
      <button onClick={handleAdd} className="btn-secondary">Add Tracker</button>
    </div>
  )
}

// Progress Tracker Admin Tab
function ProgressTrackerTab({ data, update, save, saving, trackerHeader, updateHeader, cancel }) {
  // Default tracker content (copied from the tracker component)
  const DEFAULT_PROGRESS_TRACKER = [
    {
      id: 'phase1',
      name: 'Phase 1: Foundations',
      weeks: '1-6',
      color: 'blue',
      milestones: [
  { id: 'm1', text: 'Complete mathematics refresher (Linear Algebra, Calculus, Probability)', week: '1-2', details: `Week 1-2 — Mathematics Refresher:
\n**Linear Algebra (Critical)**
- Khan Academy: Vectors, matrices, matrix operations, eigenvalues/eigenvectors
- 3Blue1Brown "Essence of Linear Algebra" (YouTube series—watch all 15 videos)
- Practice: NumPy exercises implementing matrix operations from scratch
\n**Calculus & Optimization**
- Review derivatives, partial derivatives, chain rule, gradient descent
- Khan Academy Multivariable Calculus (first 5 sections)
- Focus on: Why gradients matter for training neural networks
\n**Probability & Statistics**
- Distributions (normal, binomial), expected value, variance
- Bayes' theorem, conditional probability
- StatQuest YouTube channel (Josh Starmer)—watch ML prerequisites playlist
\n**Daily Commitment:** 2-3 hours` },
  { id: 'm2', text: 'Master NumPy, Pandas, Matplotlib', week: '3-4', details: `Week 3-4 — Python for ML & Core Libraries:
\n**Deep Python Skills**
- Object-oriented programming, decorators, generators, context managers
- Book: "Effective Python" by Brett Slatkin (skim relevant chapters)
\n**NumPy Mastery**
- Array operations, broadcasting, vectorization
- Practice: Implement matrix multiplication, dot products without loops
- NumPy official tutorials: https://numpy.org/learn/
\n**Pandas for Data Manipulation**
- DataFrames, indexing, groupby, merge/join operations
- Kaggle's Pandas micro-course (4 hours)
\n**Matplotlib & Seaborn**
- Data visualization fundamentals
- Practice: Visualize different data distributions and model results` },
  { id: 'm3', text: 'Implement Linear Regression from scratch', week: '3-4', details: `Week 3-4 — Project: Implement Linear Regression from Scratch:
- Use only NumPy (no scikit-learn)
- Implement gradient descent manually
- Visualize loss function convergence
- Compare your implementation to scikit-learn's version
\n**Deliverables & Notes:**
- Jupyter notebook with code and plots
- Clear explanation of gradient descent, learning rate selection, and testing results
- Aim for correctness and understanding rather than library shortcuts` },
  { id: 'm4', text: 'Complete Fast.ai ML course', week: '5-6', details: `Week 5-6 — Classical Machine Learning (Fast.ai + algorithms):
\n**Course: Fast.ai "Introduction to Machine Learning for Coders"**
- Focus on practical implementation
- Complete all coding exercises
\n**Core Algorithms to Implement**
1. Linear Regression (already done)
2. Logistic Regression
3. Decision Trees
4. Random Forests
5. K-Means Clustering
6. Principal Component Analysis (PCA)
\n**Scikit-learn Deep Dive**
- Model training, evaluation, hyperparameter tuning
- Cross-validation, train/test splits
- Pipelines and preprocessing` },
  { id: 'm5', text: 'Implement 5+ classical ML algorithms from scratch', week: '5-6', details: `Week 5-6 — Practical Algorithms & Practice:
- Implement the classical ML algorithms listed above from scratch or using scikit-learn to compare performance
- Practice cross-validation and hyperparameter search
- Build pipelines for data preprocessing and model evaluation
- Focus on interpretability and proper evaluation metrics` },
  { id: 'm6', text: 'PROJECT: End-to-end ML pipeline with deployment', week: '5-6', details: `Week 5-6 — Project: End-to-End ML Pipeline:
- Pick a Kaggle dataset (e.g., Titanic, House Prices)
- Data cleaning, feature engineering, model selection
- Compare 3-5 different algorithms
- Document your process in a Jupyter notebook
- Deploy a simple prediction API using Flask
- Leverage your DevOps skills: Dockerize it, add CI/CD
\n**Daily Commitment:** 3-4 hours` }
      ]
    },
    {
      id: 'phase2',
      name: 'Phase 2: Deep Learning Fundamentals',
      weeks: '7-12',
      color: 'purple',
      milestones: [
  { id: 'm7', text: 'Complete Fast.ai DL Part 1 (lessons 1-7)', week: '7-8', details: `Weeks 7-8 — Neural Networks Foundation:
- Fast.ai Part 1 lessons 1-7 (top-down approach).
- Andrew Ng: basics of backprop and network design.
- Deliverable: small models, understanding of training loops.` },
  { id: 'm8', text: 'Complete Andrew Ng DL Course 1', week: '7-8', details: `Andrew Ng DL Course 1:
- Study forward/backprop, activations, loss functions, optimizers.
- Implement from-scratch examples for clarity.` },
  { id: 'm9', text: 'PROJECT: Neural Network from scratch (NumPy only)', week: '7-8', details: `Project — Neural Network from scratch:
- Build a 2-layer NN using NumPy and train on MNIST.
- Goal: >90% accuracy. Then re-implement in PyTorch.` },
  { id: 'm10', text: 'Master PyTorch fundamentals', week: '9-10', details: `Master PyTorch fundamentals:
- Tensors, autograd, nn.Module, DataLoader, training loops.
- Save/load models, checkpointing, and GPU usage.` },
  { id: 'm11', text: 'Build CNN for CIFAR-10', week: '9-10', details: `Build CNN for CIFAR-10:
- Implement conv nets, data augmentation, training/validation pipelines.
- Evaluate with confusion matrices and error analysis.` },
  { id: 'm12', text: 'PROJECT: Computer Vision app with deployment', week: '9-10', details: `Project — Computer Vision app with deployment:
- Use transfer learning (ResNet/EfficientNet), augment data.
- Track with TensorBoard or W&B; deploy with containers.` },
  { id: 'm13', text: 'Complete Andrew Ng DL Courses 2, 4, 5', week: '11-12', details: `Complete Andrew Ng Courses 2/4/5:
- Improving deep nets, CNNs, sequence models.
- Focus on architecture details and training tips.` },
  { id: 'm14', text: 'PROJECT: Sequence-to-Sequence model', week: '11-12', details: `Project — Sequence-to-Sequence model:
- Build a translation or chatbot model with attention.
- Compare LSTM vs Transformer approaches; deploy as API.` }
      ]
    },
    {
      id: 'phase3',
      name: 'Phase 3: Modern AI & LLMs',
      weeks: '13-18',
      color: 'green',
      milestones: [
  { id: 'm15', text: 'Complete Andrej Karpathy "Neural Networks: Zero to Hero"', week: '13-14', details: `Weeks 13-14 — Transformer deep dive:
- Study self-attention, positional encodings, decoder-only vs encoder-decoder.
- Follow Karpathy's "build GPT" tutorial for hands-on experience.` },
  { id: 'm16', text: 'Complete Hugging Face NLP Course', week: '13-14', details: `Complete Hugging Face NLP Course:
- Tokenizers, transformers API, pipelines, and fine-tuning basics.` },
  { id: 'm17', text: 'PROJECT: Build mini-GPT from scratch', week: '13-14', details: `Project — Build mini-GPT:
- Implement a small character/word level transformer and train on a corpus.
- Deliverable: training code and sample generations.` },
  { id: 'm18', text: 'Master Hugging Face Transformers library', week: '15-16', details: `Master Hugging Face Transformers:
- Loading models, training loops, adapters/PEFT, and inference.` },
  { id: 'm19', text: 'Learn LangChain & LlamaIndex', week: '15-16', details: `Learn LangChain & LlamaIndex:
- Build RAG pipelines, embeddings, vector stores, and QA flows.` },
  { id: 'm20', text: 'PROJECT: Production RAG system with monitoring', week: '15-16', details: `Project — Production RAG system:
- Build document ingestion, chunking, embeddings, vector search.
- Add monitoring, caching, rate-limiting for production readiness.` },
  { id: 'm21', text: 'Learn fine-tuning techniques (LoRA, QLoRA)', week: '17-18', details: `Learn fine-tuning techniques:
- LoRA, QLoRA, PEFT methods and quantization strategies.
- Practice efficient fine-tuning on smaller hardware.` },
  { id: 'm22', text: 'PROJECT: Fine-tune and deploy 7B LLM', week: '17-18', details: `Project — Fine-tune and deploy 7B LLM:
- Prepare dataset, apply QLoRA/LoRA, evaluate changes vs baseline.
- Deploy with optimized inference (vLLM/TGI).` }
      ]
    },
    {
      id: 'phase4',
      name: 'Phase 4: Elite-Level Skills',
      weeks: '19-24',
      color: 'orange',
      milestones: [
  { id: 'm23', text: 'Master MLOps tools (MLflow, W&B)', week: '19-20', details: `Weeks 19-20 — MLOps Excellence:
- Experiment tracking (MLflow/W&B), model registry, monitoring, drift detection.` },
  { id: 'm24', text: 'PROJECT: Complete MLOps platform', week: '19-20', details: `Project — Complete MLOps platform:
- Build end-to-end platform: experiment tracking, model serving, retraining pipelines, dashboards.` },
  { id: 'm25', text: 'Deep dive into chosen specialization', week: '21-22', details: `Deep dive into chosen specialization:
- Pick CV / NLP / RL and implement state-of-the-art models and projects.` },
  { id: 'm26', text: 'Implement 2-3 SOTA models from papers', week: '21-22', details: `Implement SOTA models from papers:
- Reproduce 2-3 recent papers; focus on understanding implementation details.` },
  { id: 'm27', text: 'Write 3-4 technical blog posts', week: '23-24', details: `Write technical blog posts:
- Draft 3-4 in-depth posts sharing experiments, findings, and code samples.` },
  { id: 'm28', text: 'Build portfolio website', week: '23-24', details: `Build portfolio website:
- Showcase projects, deploy demos and APIs, and include documentation.` },
  { id: 'm29', text: 'Start job applications (5-10/week)', week: '23-24', details: `Start job applications:
- Apply 5-10/week; tailor resume and cover letters to each role.` },
  { id: 'm30', text: 'Target: 5-10 onsites scheduled', week: '23-24', details: `Target onsites scheduled:
- Prepare interview problems, system design for ML, and behavioral prep; aim for 5-10 onsites.` }
      ]
    }
  ]

  // Ensure array shape
  const phases = Array.isArray(data) ? data : (data ? Object.values(data) : [])

  // Auto-populate editor with defaults when no data exists (doesn't save to backend until you click Save)
  useEffect(() => {
    // Auto-populate when data is null/undefined OR an empty array
    if (((data === undefined || data === null) || (Array.isArray(data) && data.length === 0)) && typeof update === 'function') {
      update(DEFAULT_PROGRESS_TRACKER)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAddPhase = () => {
    const newPhase = { id: `phase-${Date.now()}`, name: 'New Phase', weeks: '', color: 'blue', milestones: [] }
    update([...phases, newPhase])
  }

  const updatePhase = (idx, field, value) => {
    const newData = [...phases]
    newData[idx] = { ...newData[idx], [field]: value }
    update(newData)
  }

  const removePhase = (idx) => {
    const newData = phases.filter((_, i) => i !== idx)
    update(newData)
  }

  const addMilestone = (phaseIdx) => {
    const newData = [...phases]
    const ms = newData[phaseIdx].milestones || []
    const newMs = { id: `m-${Date.now()}`, text: 'New milestone', week: '', details: '' }
    newData[phaseIdx] = { ...newData[phaseIdx], milestones: [...ms, newMs] }
    update(newData)
  }

  const updateMilestone = (phaseIdx, msIdx, field, value) => {
    const newData = [...phases]
    const ms = [...(newData[phaseIdx].milestones || [])]
    ms[msIdx] = { ...ms[msIdx], [field]: value }
    newData[phaseIdx] = { ...newData[phaseIdx], milestones: ms }
    update(newData)
  }

  const removeMilestone = (phaseIdx, msIdx) => {
    const newData = [...phases]
    const ms = (newData[phaseIdx].milestones || []).filter((_, i) => i !== msIdx)
    newData[phaseIdx] = { ...newData[phaseIdx], milestones: ms }
    update(newData)
  }

  // Per-milestone rich-text editor that keeps local state to avoid caret reset
  function MilestoneEditor({ value = '', onChange }) {
    const ref = useRef(null)
    const [focused, setFocused] = useState(false)

    // When value changes from props and editor not focused, update DOM
    useEffect(() => {
      const el = ref.current
      if (!el) return
      if (!focused) el.innerHTML = value || ''
    }, [value, focused])

    const runCmd = (cmd, val) => {
      const el = ref.current
      if (!el) return
      try { document.execCommand(cmd, false, val || null) } catch (e) { console.warn('execCommand failed', e) }
    }

    // clearFormatting removed per request

    return (
      <div className="w-full">
        <div className="flex gap-2 mb-2">
          <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => runCmd('bold')} className="px-2 py-1 border rounded">B</button>
          <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => runCmd('italic')} className="px-2 py-1 border rounded">I</button>
          <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => runCmd('underline')} className="px-2 py-1 border rounded">U</button>
          {/* Unordered/Ordered list buttons removed per request */}
          <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => {
            const url = window.prompt('Enter URL (https://...)')
            if (url) runCmd('createLink', url)
          }} className="px-2 py-1 border rounded">Link</button>
          {/* Clear button removed per request */}
        </div>

        <div
          ref={ref}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onChange && onChange(ref.current ? ref.current.innerHTML : '') }}
          contentEditable
          suppressContentEditableWarning
          className="w-full min-h-[3rem] px-3 py-2 rounded border-2 border-gray-200 whitespace-pre-wrap break-words"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Progress Tracker</h2>
          <input type="text" value={trackerHeader || ''} onChange={e => updateHeader && updateHeader(e.target.value)} placeholder="Tracker heading (visible to viewers)" className="mt-2 px-3 py-2 rounded border-2 border-gray-200 w-full" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleAddPhase} className="btn-secondary inline-flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Phase
          </button>
        </div>
      </div>

      {phases.map((phase, pIdx) => (
        <div key={phase.id || pIdx} className="p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">{phase.name || `Phase ${pIdx + 1}`}</h3>
            <button onClick={() => removePhase(pIdx)} className="text-red-500 hover:text-red-700">Remove Phase</button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <input type="text" value={phase.name || ''} onChange={e => updatePhase(pIdx, 'name', e.target.value)} placeholder="Phase title" className="px-4 py-2 rounded-lg border-2 border-gray-200" />
            <input type="text" value={phase.weeks || ''} onChange={e => updatePhase(pIdx, 'weeks', e.target.value)} placeholder="Weeks (e.g., 1-6)" className="px-4 py-2 rounded-lg border-2 border-gray-200" />
            <select value={phase.color || 'blue'} onChange={e => updatePhase(pIdx, 'color', e.target.value)} className="px-4 py-2 rounded-lg border-2 border-gray-200">
              <option value="blue">Blue</option>
              <option value="purple">Purple</option>
              <option value="green">Green</option>
              <option value="orange">Orange</option>
            </select>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold mb-2">Milestones</h4>
            {(phase.milestones || []).map((ms, msIdx) => (
              <div key={ms.id || msIdx} className="p-3 bg-white rounded-lg border-2 border-gray-100 mb-3">
                <div className="flex items-start justify-between mb-2">
                  <input type="text" value={ms.text || ''} onChange={e => updateMilestone(pIdx, msIdx, 'text', e.target.value)} placeholder="Milestone title" className="flex-1 px-3 py-2 rounded border-2 border-gray-200 mr-3" />
                  <input type="text" value={ms.week || ''} onChange={e => updateMilestone(pIdx, msIdx, 'week', e.target.value)} placeholder="Week" className="w-36 px-3 py-2 rounded border-2 border-gray-200 mr-3" />
                  <button onClick={() => removeMilestone(pIdx, msIdx)} className="text-red-600">Remove</button>
                </div>
                <MilestoneEditor
                  value={ms.details || ''}
                  onChange={(html) => updateMilestone(pIdx, msIdx, 'details', html)}
                />
              </div>
            ))}

            <div>
              <button onClick={() => addMilestone(pIdx)} className="btn-secondary">Add Milestone</button>
            </div>
          </div>
        </div>
      ))}

      <div className="flex gap-3 pt-6 border-t border-gray-200">
        {typeof cancel === 'function' && (
          <button onClick={cancel} className="btn-secondary">Cancel</button>
        )}
        <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Progress Tracker'}
        </button>
      </div>
    </div>
  )
}

// Footer Tab - manage footer social link blocks
function FooterTab({ data, update, save, saving }) {
  const handleAdd = () => {
    const item = { id: Date.now(), provider: 'custom', label: 'Custom', url: '' }
    update([...(data || []), item])
  }

  const updateItem = (idx, field, value) => {
    const newData = [...(data || [])]
    newData[idx] = { ...newData[idx], [field]: value }
    update(newData)
  }

  const removeItem = (idx) => {
    update((data || []).filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Footer Social Links</h2>
        <button onClick={handleAdd} className="btn-secondary inline-flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Link
        </button>
      </div>

      {(data || []).map((item, idx) => (
        <div key={item.id || idx} className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
          <div className="grid md:grid-cols-3 gap-3">
            <select value={item.provider || 'custom'} onChange={e => updateItem(idx, 'provider', e.target.value)} className="px-3 py-2 rounded border-2 border-gray-200">
              <option value="github">GitHub</option>
              <option value="linkedin">LinkedIn</option>
              <option value="twitter">Twitter</option>
              <option value="custom">Custom</option>
            </select>

            <input type="text" value={item.label || ''} onChange={e => updateItem(idx, 'label', e.target.value)} placeholder="Label (e.g., GitHub)" className="px-3 py-2 rounded border-2 border-gray-200" />

            <input type="url" value={item.url || ''} onChange={e => updateItem(idx, 'url', e.target.value)} placeholder="https://..." className="px-3 py-2 rounded border-2 border-gray-200" />
          </div>

          <div className="flex justify-end mt-3">
            <button onClick={() => removeItem(idx)} className="text-red-600 hover:text-red-800">Remove</button>
          </div>
        </div>
      ))}

      <div className="flex gap-3 pt-6 border-t border-gray-200">
        <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Footer Links'}
        </button>
      </div>
    </div>
  )
}

// About Tab
function AboutTab({ data, update, save, saving, uploadImage }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">About Me Content</h2>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
          <input
            type="text"
            value={data.name || ''}
            onChange={e => update('about', 'name', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
            placeholder="Your Full Name"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Intro Greeting
            <span className="text-xs text-gray-500 ml-2 font-normal">(Shows before your name on homepage)</span>
          </label>
          <input
            type="text"
            value={data.greeting || ''}
            onChange={e => update('about', 'greeting', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
            placeholder="Hi, I'm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Tagline
          <span className="text-xs text-gray-500 ml-2 font-normal">(Shows below your name on homepage)</span>
        </label>
        <input
          type="text"
          value={data.tagline || ''}
          onChange={e => update('about', 'tagline', e.target.value)}
          className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
          placeholder="Your professional tagline"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Home Intro Text
          <span className="text-xs text-gray-500 ml-2 font-normal">(Shows on the homepage intro section)</span>
        </label>
        <textarea
          value={data.summary || ''}
          onChange={e => update('about', 'summary', e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none resize-none"
          placeholder="A brief intro text for your homepage (e.g., 'Building modern web applications with clean code...')"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          About Section Headline
          <span className="text-xs text-gray-500 ml-2 font-normal">(Shows above bio in About section - leave blank to hide)</span>
        </label>
        <input
          type="text"
          value={data.headline || ''}
          onChange={e => update('about', 'headline', e.target.value)}
          className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
          placeholder="Optional headline for About section"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          About Me Bio
          <span className="text-xs text-gray-500 ml-2 font-normal">(Shows on the About page)</span>
        </label>
        <textarea
          value={data.bio || ''}
          onChange={e => update('about', 'bio', e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none resize-none"
          placeholder="A detailed bio about yourself for the About page..."
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Profile Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={e => e.target.files[0] && uploadImage(e.target.files[0], 'about', 'profileImage')}
          className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
        />
        {data.profileImage && (
          <div className="mt-4 flex items-center gap-4">
            <img src={data.profileImage} alt="Profile" className="w-32 h-32 object-cover rounded-lg" />
            <div className="flex flex-col gap-2">
              <button
                onClick={() => update('about', 'profileImage', '')}
                className="btn-secondary"
                type="button"
              >
                Remove Image
              </button>
              <div className="text-sm text-gray-500">Click Remove Image then Save to persist.</div>
            </div>
          </div>
        )}
      </div>

      <div>
        <h4 className="mt-4 mb-2 font-semibold text-gray-800">Social Links</h4>
        <div className="grid md:grid-cols-3 gap-4">
          <input
            type="url"
            value={(data.socialLinks && data.socialLinks.github) || ''}
            onChange={e => update('about', 'socialLinks', { ...(data.socialLinks || {}), github: e.target.value })}
            placeholder="GitHub URL"
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
          />
          <input
            type="url"
            value={(data.socialLinks && data.socialLinks.linkedin) || ''}
            onChange={e => update('about', 'socialLinks', { ...(data.socialLinks || {}), linkedin: e.target.value })}
            placeholder="LinkedIn URL"
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
          />
          <input
            type="url"
            value={(data.socialLinks && data.socialLinks.twitter) || ''}
            onChange={e => update('about', 'socialLinks', { ...(data.socialLinks || {}), twitter: e.target.value })}
            placeholder="Twitter URL"
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* What I Bring to the Table / Highlights */}
      <div>
        <h4 className="mt-6 mb-3 font-semibold text-gray-800">What I Bring to the Table</h4>
        <p className="text-sm text-gray-600 mb-4">Add highlights that showcase your strengths (max 4 recommended)</p>
        
        {(data.highlights || []).map((highlight, idx) => (
          <div key={idx} className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200 mb-3">
            <div className="flex items-start justify-between mb-3">
              <h5 className="font-semibold text-gray-900">Highlight #{idx + 1}</h5>
              <button
                onClick={() => {
                  const newHighlights = (data.highlights || []).filter((_, i) => i !== idx)
                  update('about', 'highlights', newHighlights)
                }}
                className="text-red-500 hover:text-red-700"
                type="button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <input
                type="text"
                value={highlight.icon || ''}
                onChange={(e) => {
                  const newHighlights = [...(data.highlights || [])]
                  newHighlights[idx] = { ...newHighlights[idx], icon: e.target.value }
                  update('about', 'highlights', newHighlights)
                }}
                placeholder="Emoji (e.g., 🎯)"
                className="px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
              />
              <input
                type="text"
                value={highlight.title || ''}
                onChange={(e) => {
                  const newHighlights = [...(data.highlights || [])]
                  newHighlights[idx] = { ...newHighlights[idx], title: e.target.value }
                  update('about', 'highlights', newHighlights)
                }}
                placeholder="Title"
                className="px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
              />
              <input
                type="text"
                value={highlight.description || ''}
                onChange={(e) => {
                  const newHighlights = [...(data.highlights || [])]
                  newHighlights[idx] = { ...newHighlights[idx], description: e.target.value }
                  update('about', 'highlights', newHighlights)
                }}
                placeholder="Description"
                className="px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
        ))}
        
        <button
          onClick={() => {
            const newHighlights = [...(data.highlights || []), { icon: '', title: '', description: '' }]
            update('about', 'highlights', newHighlights)
          }}
          className="btn-secondary inline-flex items-center gap-2"
          type="button"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Highlight
        </button>
      </div>

      <div className="flex gap-3 pt-6 border-t border-gray-200">
        <button
          onClick={save}
          disabled={saving}
          className="btn-primary disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save About Section'}
        </button>
      </div>
    </div>
  )
}

// Experience Tab
function ExperienceTab({ data, update, save, saving, addItem, removeItem, updateItem }) {
  const handleAdd = () => {
    const newExp = { company: '', role: '', period: '', summary: '', responsibilities: [], technologies: [] }
    update([...data, newExp])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Experience</h2>
        <button onClick={handleAdd} className="btn-secondary inline-flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Experience
        </button>
      </div>

      {data.map((exp, idx) => (
        <div key={idx} className="p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Experience #{idx + 1}</h3>
            <button
              onClick={() => update(data.filter((_, i) => i !== idx))}
              className="text-red-500 hover:text-red-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              value={exp.company || ''}
              onChange={e => {
                const newData = [...data]
                newData[idx] = { ...newData[idx], company: e.target.value }
                update(newData)
              }}
              placeholder="Company Name"
              className="px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
            />
            <input
              type="text"
              value={exp.role || ''}
              onChange={e => {
                const newData = [...data]
                newData[idx] = { ...newData[idx], role: e.target.value }
                update(newData)
              }}
              placeholder="Job Title"
              className="px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
            />
          </div>

          <input
            type="text"
            value={exp.period || ''}
            onChange={e => {
              const newData = [...data]
              newData[idx] = { ...newData[idx], period: e.target.value }
              update(newData)
            }}
            placeholder="Time Period (e.g., 2020 - 2023)"
            className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none mb-4"
          />

          <textarea
            value={exp.summary || ''}
            onChange={e => {
              const newData = [...data]
              newData[idx] = { ...newData[idx], summary: e.target.value }
              update(newData)
            }}
            rows={3}
            placeholder="Job summary..."
            className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none resize-none mb-4"
          />

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Responsibilities/Achievements
              <span className="text-xs text-gray-500 ml-2 font-normal">(One per line)</span>
            </label>
            <textarea
              value={(exp.responsibilities || []).join('\n')}
              onChange={e => {
                const newData = [...data]
                newData[idx] = { 
                  ...newData[idx], 
                  responsibilities: e.target.value.split('\n')
                }
                update(newData)
              }}
              rows={4}
              placeholder="Developed and maintained web applications&#10;Led a team of developers&#10;Implemented CI/CD pipelines"
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Technologies/Skills
              <span className="text-xs text-gray-500 ml-2 font-normal">(Comma-separated)</span>
            </label>
            <input
              type="text"
              value={(exp.technologies || []).join(', ')}
              onChange={e => {
                const newData = [...data]
                newData[idx] = { 
                  ...newData[idx], 
                  technologies: e.target.value.split(',').map(t => t.trim())
                }
                update(newData)
              }}
              placeholder="React, Node.js, PostgreSQL, Docker"
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
            />
          </div>
        </div>
      ))}

      <div className="flex gap-3 pt-6 border-t border-gray-200">
        <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Experience'}
        </button>
      </div>
    </div>
  )
}

// Projects Tab
function ProjectsTab({ data, update, save, saving, uploadImage, token }) {
  // Ensure `projects` is always an array. Some stored content may be an object
  // (e.g., keyed by id) — coerce to an array for the admin UI to avoid runtime errors.
  const projects = Array.isArray(data) ? data : (data ? Object.values(data) : [])

  const handleAdd = () => {
    const newProject = { id: Date.now(), title: '', description: '', tech: [], demo: '', github: '', image: '' }
    update([...projects, newProject])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
        <button onClick={handleAdd} className="btn-secondary inline-flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Project
        </button>
      </div>

      {projects.map((project, idx) => (
        <div key={project.id || idx} className="p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Project #{idx + 1}</h3>
            <button
              onClick={() => update(projects.filter((_, i) => i !== idx))}
              className="text-red-500 hover:text-red-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          <input
            type="text"
            value={project.title || ''}
            onChange={e => {
              const newData = [...projects]
              newData[idx] = { ...newData[idx], title: e.target.value }
              update(newData)
            }}
            placeholder="Project Title"
            className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none mb-4"
          />

          <textarea
            value={project.description || ''}
            onChange={e => {
              const newData = [...projects]
              newData[idx] = { ...newData[idx], description: e.target.value }
              update(newData)
            }}
            rows={3}
            placeholder="Project description..."
            className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none resize-none mb-4"
          />

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              value={project.demo || ''}
              onChange={e => {
                const newData = [...projects]
                newData[idx] = { ...newData[idx], demo: e.target.value }
                update(newData)
              }}
              placeholder="Demo URL"
              className="px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
            />
            <input
              type="text"
              value={project.github || ''}
              onChange={e => {
                const newData = [...projects]
                newData[idx] = { ...newData[idx], github: e.target.value }
                update(newData)
              }}
              placeholder="GitHub URL"
              className="px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
            />
          </div>

          <input
            type="text"
            value={(project.tech || []).join(', ')}
            onChange={e => {
              const newData = [...projects]
              newData[idx] = { ...newData[idx], tech: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }
              update(newData)
            }}
            placeholder="Technologies (comma-separated)"
            className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none mb-4"
          />

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Project Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => {
                if (e.target.files[0]) {
                  uploadImage(e.target.files[0], 'projects', 'image').then(url => {
                    if (url) {
                      const newData = [...projects]
                      newData[idx] = { ...newData[idx], image: url }
                      update(newData)
                    }
                  })
                }
              }}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
            />
            {project.image && (
              <img src={project.image} alt={project.title} className="mt-2 w-full h-32 object-cover rounded-lg" />
            )}
          </div>
        </div>
      ))}

      <div className="flex gap-3 pt-6 border-t border-gray-200">
        <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Projects'}
        </button>
      </div>
    </div>
  )
}

// Skills Tab
function SkillsTab({ data, update, save, saving, addSkill, removeSkill }) {
  const [newSkills, setNewSkills] = useState({ technical: '', tools: '', soft: '', other: '' })

  const categories = [
    { key: 'technical', label: 'Technical Skills', icon: '💻' },
    { key: 'tools', label: 'Tools & Frameworks', icon: '🛠️' },
    { key: 'soft', label: 'Soft Skills', icon: '🤝' },
    { key: 'other', label: 'Other Skills', icon: '🎯' }
  ]

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Skills Management</h2>

      {categories.map(cat => (
        <div key={cat.key} className="p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </h3>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newSkills[cat.key]}
              onChange={e => setNewSkills(prev => ({...prev, [cat.key]: e.target.value}))}
              onKeyDown={e => {
                if (e.key === 'Enter' && newSkills[cat.key].trim()) {
                  addSkill(cat.key, newSkills[cat.key])
                  setNewSkills(prev => ({...prev, [cat.key]: ''}))
                }
              }}
              placeholder={`Add ${cat.label.toLowerCase()}...`}
              className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
            />
            <button
              onClick={() => {
                if (newSkills[cat.key].trim()) {
                  addSkill(cat.key, newSkills[cat.key])
                  setNewSkills(prev => ({...prev, [cat.key]: ''}))
                }
              }}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
            >
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {(data[cat.key] || []).map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-indigo-200 text-indigo-700 rounded-full font-medium"
              >
                {skill}
                <button
                  onClick={() => removeSkill(cat.key, idx)}
                  className="hover:text-red-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      ))}

      <div className="flex gap-3 pt-6 border-t border-gray-200">
        <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Skills'}
        </button>
      </div>
    </div>
  )
}

// Contact Tab
function ContactTab({ data, update, save, saving }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={data.email || ''}
            onChange={e => update('contact', 'email', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
          <input
            type="tel"
            value={data.phone || ''}
            onChange={e => update('contact', 'phone', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
            placeholder="+1 (555) 123-4567"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
        <input
          type="text"
          value={data.location || ''}
          onChange={e => update('contact', 'location', e.target.value)}
          className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
          placeholder="City, Country"
        />
      </div>

      <div className="flex gap-3 pt-6 border-t border-gray-200">
        <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Contact Info'}
        </button>
      </div>
    </div>
  )
}

// Section Headers Tab
function SectionHeadersTab({ data, update, save, saving }) {
  const sections = [
    { key: 'about', label: 'About Section', defaultTitle: 'About', defaultSubtitle: 'Me' },
    { key: 'aboutHighlights', label: 'What I Bring to the Table', defaultTitle: 'What I Bring to the Table', defaultSubtitle: '' },
    { key: 'experience', label: 'Experience Section', defaultTitle: 'Professional', defaultSubtitle: 'Experience' },
    { key: 'projects', label: 'Projects Section', defaultTitle: 'Featured', defaultSubtitle: 'Projects' },
    { key: 'skills', label: 'Skills Section', defaultTitle: 'My', defaultSubtitle: 'Skills' },
    { key: 'contact', label: 'Contact Section', defaultTitle: 'Get In', defaultSubtitle: 'Touch' }
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Section Headers</h2>
      <p className="text-gray-600 mb-6">Customize the title for each section of your portfolio. Leave blank to use defaults.</p>

      {sections.map((section) => (
        <div key={section.key} className="p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
          <h3 className="font-bold text-gray-900 mb-4">{section.label}</h3>
          
          {section.key === 'aboutHighlights' ? (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Section Title
                <span className="text-xs text-gray-500 ml-2 font-normal">(Default: {section.defaultTitle})</span>
              </label>
              <input
                type="text"
                value={data[section.key] || ''}
                onChange={e => update({ ...data, [section.key]: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
                placeholder={section.defaultTitle}
              />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Part (Normal)
                  <span className="text-xs text-gray-500 ml-2 font-normal">(Default: {section.defaultTitle})</span>
                </label>
                <input
                  type="text"
                  value={data[`${section.key}Title`] || ''}
                  onChange={e => update({ ...data, [`${section.key}Title`]: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
                  placeholder={section.defaultTitle}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Second Part (Gradient)
                  <span className="text-xs text-gray-500 ml-2 font-normal">(Default: {section.defaultSubtitle})</span>
                </label>
                <input
                  type="text"
                  value={data[`${section.key}Subtitle`] || ''}
                  onChange={e => update({ ...data, [`${section.key}Subtitle`]: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 outline-none"
                  placeholder={section.defaultSubtitle}
                />
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="flex gap-3 pt-6 border-t border-gray-200">
        <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Section Headers'}
        </button>
      </div>
    </div>
  )
}

// Layout Tab
function LayoutTab({ data, update, save, saving }) {
  const sections = ['home', 'about', 'experience', 'projects', 'skills', 'contact']
  const enabledSections = data.sections || sections

  const toggleSection = (section) => {
    const newSections = enabledSections.includes(section)
      ? enabledSections.filter(s => s !== section)
      : [...enabledSections, section]
    update({ ...data, sections: newSections })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Layout Configuration</h2>

      <div className="p-6 bg-gray-50 rounded-xl">
        <h3 className="font-bold text-gray-900 mb-4">Section Visibility</h3>
        <p className="text-sm text-gray-600 mb-4">Toggle sections on/off to control what appears on your portfolio</p>

        <div className="space-y-3">
          {sections.map(section => (
            <label key={section} className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={enabledSections.includes(section)}
                onChange={() => toggleSection(section)}
                className="w-5 h-5 text-indigo-600 rounded"
              />
              <span className="font-medium text-gray-900 capitalize">{section}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-6 border-t border-gray-200">
        <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Layout'}
        </button>
      </div>
    </div>
  )
}
