import { useState } from 'react'
import { FiArrowRight, FiEye, FiEyeOff, FiGlobe, FiLayers, FiLock, FiMail, FiShield, FiZap } from 'react-icons/fi'
import { HiOutlineCube } from 'react-icons/hi2'
import { demoLogin, demoSignUp } from './data/authApi.js'

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [workspace, setWorkspace] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const isSignup = mode === 'signup'

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (isSignup && password !== confirmPassword) { setError('Your passwords do not match.'); return }
    if (password.length < 8) { setError('Use a password with at least 8 characters.'); return }
    setSubmitting(true)
    try {
      const sessionUser = isSignup
        ? await demoSignUp({ name, workspace, email, password })
        : await demoLogin({ email, password })
      onAuthenticated(sessionUser)
    } catch (err) {
      setError(err?.message || 'We could not start your demo session. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function changeMode(nextMode) {
    setError('')
    setMode(nextMode)
  }

  return <main className="auth-page">
    <section className="auth-showcase"><div className="auth-brand"><span className="brand-mark"><HiOutlineCube size={21} /></span><strong>verdant<span>.</span></strong></div><div className="auth-showcase-copy"><div className="auth-eyebrow"><i /> GLOBAL SUPPLY CHAIN INTELLIGENCE</div><h1>See the whole network.<br /><em>Move with clarity.</em></h1><p>Bring your people, agents, and operations into one live command center.</p><div className="auth-graphic"><div className="auth-orbit orbit-one"/><div className="auth-orbit orbit-two"/><div className="auth-orbit orbit-three"/><span className="auth-orbit-core"><HiOutlineCube /></span><i className="auth-node node-one"><FiGlobe /></i><i className="auth-node node-two"><FiLayers /></i><i className="auth-node node-three"><FiZap /></i><span className="auth-flow flow-one"/><span className="auth-flow flow-two"/></div><div className="auth-feature-row"><span><FiGlobe />Global visibility</span><span><FiShield />Human governed</span><span><FiZap />Agent powered</span></div></div><div className="auth-showcase-footer"><span>© 2026 Verdant Intelligence</span><span>Built for complex supply chains</span></div></section>
    <section className="auth-form-side"><div className="auth-form-wrap"><div className="auth-mobile-brand"><span className="brand-mark"><HiOutlineCube size={21} /></span><strong>verdant<span>.</span></strong></div><div className="auth-form-heading"><span className="auth-form-kicker">{isSignup ? 'CREATE YOUR WORKSPACE' : 'WELCOME BACK'}</span><h2>{isSignup ? 'Create your account' : 'Sign in to Verdant'}</h2><p>{isSignup ? 'Set up your workspace and start with a clear view.' : 'Enter your details to access your supply chain workspace.'}</p></div>
      <div className="auth-mode-tabs" role="tablist" aria-label="Account access"> <button role="tab" aria-selected={!isSignup} className={!isSignup ? 'selected' : ''} onClick={() => changeMode('login')}>Sign in</button><button role="tab" aria-selected={isSignup} className={isSignup ? 'selected' : ''} onClick={() => changeMode('signup')}>Create account</button></div>
      <form className="auth-form" onSubmit={handleSubmit}>
        {isSignup && <><label className="auth-field"><span>Full name</span><div><FiShield /><input autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Alex Morgan" /></div></label><label className="auth-field"><span>Organization</span><div><FiGlobe /><input autoComplete="organization" required value={workspace} onChange={(event) => setWorkspace(event.target.value)} placeholder="Your company name" /></div></label></>}
        <label className="auth-field"><span>Work email</span><div><FiMail /><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" /></div></label>
        <label className="auth-field"><span>Password</span><div><FiLock /><input type={showPassword ? 'text' : 'password'} autoComplete={isSignup ? 'new-password' : 'current-password'} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /><button type="button" className="auth-password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <FiEyeOff /> : <FiEye />}</button></div></label>
        {isSignup && <label className="auth-field"><span>Confirm password</span><div><FiLock /><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter your password again" /></div></label>}
        {error && <div className="auth-error" role="alert">{error}</div>}
        {!isSignup && <div className="auth-form-options"><label><input type="checkbox" />Remember this device</label><button type="button" onClick={() => setError('Password recovery will be available when authentication is connected.')}>Forgot password?</button></div>}
        <button className="auth-submit" type="submit" disabled={submitting}>{submitting ? <><span className="auth-submit-spinner" />{isSignup ? 'Creating workspace…' : 'Signing in…'}</> : <>{isSignup ? 'Create account' : 'Sign in'} <FiArrowRight /></>}</button>
      </form>
      <div className="auth-demo-note" onClick={() => { if (!isSignup) { setEmail('demo@verdant.ai'); setPassword('password123'); } }} style={{ cursor: isSignup ? 'default' : 'pointer' }} title={isSignup ? '' : 'Click to autofill demo credentials'}>
        <FiShield />
        <p>
          <strong>Demo credentials: demo@verdant.ai / password123</strong>
          <span>{isSignup ? 'Your session is issued by the connected backend.' : 'Click to autofill demo administrator credentials.'}</span>
        </p>
      </div>
      <div className="auth-form-footer"><span>Secure workspace access</span><span>Privacy · Terms</span></div>
    </div></section>
  </main>
}
