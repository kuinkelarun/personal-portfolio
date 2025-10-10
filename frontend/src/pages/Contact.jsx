import { useState } from 'react'
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState({ loading: false, error: '', ok: false })

  const submit = async (e) => {
    e.preventDefault()
    setStatus({ loading: true, error: '', ok: false })
    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        const err = data?.errors ? Object.values(data.errors).join(' ') : (data?.message || 'Failed to submit')
        throw new Error(err)
      }
      setStatus({ loading: false, error: '', ok: true })
      setForm({ name: '', email: '', message: '' })
    } catch (err) {
      setStatus({ loading: false, error: err.message, ok: false })
    }
  }

  return (
    <section id="contact" className="section mt-20 mb-20">
      <h2 className="text-2xl font-bold mb-6">Contact</h2>
      <form onSubmit={submit} className="max-w-xl space-y-4">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required minLength={2}
                 className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
                 className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
        </div>
        <div>
          <label className="block text-sm mb-1">Message</label>
          <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required minLength={10}
                    rows={5} className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
        </div>
        <button disabled={status.loading} className="px-4 py-2 rounded bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60">
          {status.loading ? 'Sending…' : 'Send Message'}
        </button>
        {status.error && <p className="text-red-600 text-sm">{status.error}</p>}
        {status.ok && <p className="text-green-600 text-sm">Thanks! I’ll get back to you soon.</p>}
      </form>
    </section>
  )
}
