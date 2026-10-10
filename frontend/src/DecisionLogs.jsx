import { useEffect, useMemo, useState } from 'react'
import { FiActivity, FiArrowDownRight, FiArrowLeft, FiArrowRight, FiArrowUpRight, FiCheck, FiCheckCircle, FiClock, FiDollarSign, FiExternalLink, FiGlobe, FiLayers, FiMapPin, FiShield, FiTruck, FiUser, FiX } from 'react-icons/fi'
import { HiOutlineExclamationTriangle } from 'react-icons/hi2'
import { fetchDecisionLogs } from './data/mockApi.js'
import LoadingState from './components/LoadingState.jsx'


const statusList = ['All statuses', 'Pending approval', 'Approved', 'Executed', 'Review requested', 'Declined', 'Resolved']

function statusClass(status) { return status.toLowerCase().replaceAll(' ', '-') }

function DecisionLogs() {
  const [decisions, setDecisions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [query, setQuery] = useState('')
  useEffect(() => {
    let mounted = true
    fetchDecisionLogs().then((result) => { if (mounted) { setDecisions(result); setLoading(false) } }).catch(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])
  const updateDecision = (id, nextStatus, title, detail, actor = 'Alex Morgan') => {
    const now = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()) + ' UTC'
    setDecisions((current) => current.map((decision) => decision.id === id ? { ...decision, status: nextStatus, ...(nextStatus === 'Approved' ? { approvedBy: actor, approvalTime: now } : {}), timeline: [...decision.timeline, { time: now, title, detail, actor, type: nextStatus === 'Approved' ? 'human' : nextStatus === 'Executed' ? 'executed' : nextStatus === 'Resolved' ? 'resolved' : nextStatus === 'Declined' ? 'declined' : 'pending' }] } : decision))
  }
  const filtered = useMemo(() => decisions.filter((decision) => {
    const statusMatches = statusFilter === 'All statuses' || (statusFilter === 'Pending approval' ? ['Pending approval', 'Review requested'].includes(decision.status) : decision.status === statusFilter)
    return statusMatches && `${decision.title} ${decision.id} ${decision.category} ${decision.trigger}`.toLowerCase().includes(query.toLowerCase())
  }), [decisions, statusFilter, query])
  const selected = decisions.find((decision) => decision.id === selectedId)
  const stats = { pending: decisions.filter((decision) => ['Pending approval', 'Review requested'].includes(decision.status)).length, approved: decisions.filter((decision) => decision.status === 'Approved').length, executed: decisions.filter((decision) => ['Executed', 'Resolved'].includes(decision.status)).length }

  if (loading) return <div className="page-content decision-page"><LoadingState title="Loading decision logs" detail="Fetching decision history, evidence, and approvals." /></div>
  if (selected) return <DecisionDetail decision={selected} onBack={() => setSelectedId(null)} onUpdate={(...args) => updateDecision(selected.id, ...args)} />
  return <div className="page-content decision-page">
    <div className="welcome-row"><div><div className="eyebrow"><span className="live-dot" /> AUDIT TRAIL <span className="eyebrow-divider">·</span> AGENT DECISIONS</div><h1>Decision logs <span>✳</span></h1><p>Review the signals, evidence, approvals, and outcomes behind agent decisions.</p></div><span className="decision-demo-tag">DEMO WORKSPACE</span></div>
    <section className="decision-stats"><div><span className="decision-stat-icon pending"><FiClock /></span><span><small>AWAITING REVIEW</small><strong>{stats.pending}</strong></span></div><div><span className="decision-stat-icon approved"><FiCheckCircle /></span><span><small>APPROVED</small><strong>{stats.approved}</strong></span></div><div><span className="decision-stat-icon executed"><FiActivity /></span><span><small>EXECUTED / RESOLVED</small><strong>{stats.executed}</strong></span></div><div className="decision-audit-note"><FiShield />Decision history is retained for administrator review.</div></section>
    <div className="decision-list-toolbar"><label><FiActivity /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search decisions, triggers, or IDs..." aria-label="Search decision logs" /></label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter decisions by status">{statusList.map((status) => <option key={status}>{status}</option>)}</select></div>
    <section className="decision-list-section"><div className="decision-list-title"><div><h2>Decision history</h2><p>Open any decision to inspect its full evidence trail</p></div><span>{filtered.length} records</span></div><div className="decision-card-list">{filtered.map((decision) => <DecisionCard key={decision.id} decision={decision} onClick={() => setSelectedId(decision.id)} />)}{filtered.length === 0 && <div className="decision-empty">No decisions match your search.</div>}</div></section>
    <footer className="page-footer"><span>© 2026 Verdant Intelligence</span><span><i className="live-dot" /> Decision audit trail active</span><button>Platform status <FiArrowRight size={12} /></button></footer>
  </div>
}

function DecisionCard({ decision, onClick }) {
  const Icon = decision.severity === 'High' ? HiOutlineExclamationTriangle : FiActivity
  return <button className="decision-card" onClick={onClick}><span className={`decision-card-icon ${decision.severity.toLowerCase()}`}><Icon /></span><span className="decision-card-content"><span className="decision-card-meta"><span className={`decision-severity ${decision.severity.toLowerCase()}`}>{decision.severity} impact</span><span>{decision.category}</span><span className="decision-record-id">{decision.id}</span></span><strong>{decision.title}</strong><small>{decision.trigger}</small><span className="decision-card-foot"><span className={`decision-status ${statusClass(decision.status)}`}><i />{decision.status}</span><span><FiLayers />{decision.agents.length} agents</span><span><FiClock />{decision.created}</span>{decision.approvedBy && <span className="decision-human-approved"><FiUser />Approved by {decision.approvedBy}</span>}<FiArrowRight className="decision-card-arrow" /></span></span></button>
}

function DecisionDetail({ decision, onBack, onUpdate }) {
  const canApprove = ['Pending approval', 'Review requested'].includes(decision.status)
  const canExecute = decision.status === 'Approved'
  const canResolve = decision.status === 'Executed'
  const Icon = decision.severity === 'High' ? HiOutlineExclamationTriangle : FiActivity
  return <div className="page-content decision-page decision-detail-page">
    <button className="decision-back" onClick={onBack}><FiArrowLeft />Back to decision logs</button>
    <div className="decision-detail-header"><div><div className="decision-card-meta"><span className={`decision-severity ${decision.severity.toLowerCase()}`}>{decision.severity} impact</span><span>{decision.category}</span><span className="decision-record-id">{decision.id}</span></div><h1>{decision.title}</h1><p>Created {decision.created} <span>·</span> {decision.agents.length} agents contributed <span>·</span> {decision.confidence}% model confidence</p></div><span className={`decision-status detail-status ${statusClass(decision.status)}`}><i />{decision.status}</span></div>
    <div className="decision-action-bar"><div><FiShield /><span><strong>Administrator controls</strong><small>Actions update this local demo record.</small></span></div><div className="decision-action-buttons">{canApprove && <><button className="decision-button primary" onClick={() => onUpdate('Approved', 'Approved by administrator', 'Recommendation approved for execution.')}><FiCheck />Approve recommendation</button><button className="decision-button" onClick={() => onUpdate('Review requested', 'Escalated for review', 'Decision escalated for additional human review.', 'Alex Morgan')}><FiUser />Request review</button><button className="decision-button danger" onClick={() => onUpdate('Declined', 'Recommendation declined', 'Administrator declined the proposed action.')}><FiX />Decline</button></>}{canExecute && <button className="decision-button primary" onClick={() => onUpdate('Executed', 'Action marked executed', 'Administrator recorded the recommended action as executed.')}><FiCheckCircle />Mark as executed</button>}{canResolve && <button className="decision-button primary" onClick={() => onUpdate('Resolved', 'Decision resolved', 'Administrator marked the decision as resolved.')}><FiCheckCircle />Resolve decision</button>}{!canApprove && !canExecute && !canResolve && <span className="decision-closed-note">This decision is {decision.status.toLowerCase()}.</span>}</div></div>
    <div className="decision-detail-grid"><div className="decision-detail-main">
      <section className="panel decision-detail-section"><div className="decision-section-heading"><span className="trigger-icon"><Icon /></span><div><h2>Triggering issue or signal</h2><p>{decision.triggerSource}</p></div></div><p className="decision-trigger-copy">{decision.trigger}</p><div className="decision-trigger-foot"><span><FiMapPin />Supply network exposure</span><span><FiClock />Signal detected {decision.timeline[0].time}</span></div></section>
      <section className="panel decision-detail-section"><div className="decision-section-title"><span className="decision-section-icon"><FiLayers /></span><div><h2>Agent contributions &amp; evidence</h2><p>What each agent contributed to this recommendation</p></div></div><div className="decision-agent-list">{decision.agents.map((agent, index) => <div className="decision-agent-row" key={agent.name}><span className={`decision-agent-number agent-tone-${index % 3}`}>{index + 1}</span><div className="decision-agent-info"><div><strong>{agent.name}</strong><small>{agent.role}</small></div><p>{agent.contribution}</p><span className="decision-data-source"><FiActivity />Data used: {agent.data}</span></div></div>)}</div><div className="decision-confidence"><span>Combined recommendation confidence</span><strong>{decision.confidence}%</strong><div><i style={{ width: `${decision.confidence}%` }} /></div></div></section>
      <section className="panel decision-detail-section"><div className="decision-section-title"><span className="decision-section-icon recommendation"><FiTruck /></span><div><h2>Recommended action</h2><p>Proposed by the agent network</p></div></div><p className="decision-recommendation-copy">{decision.recommendation}</p><div className="decision-approval-row"><span className={`approval-avatar ${decision.approvedBy ? 'approved' : ''}`}>{decision.approvedBy ? <FiCheck /> : <FiClock />}</span><span><small>HUMAN APPROVAL</small><strong>{decision.approvedBy ? `Approved by ${decision.approvedBy}` : 'Awaiting administrator decision'}</strong></span><span className={`decision-status ${decision.approvedBy ? 'approved' : 'pending-approval'}`}><i />{decision.approvedBy ? decision.approvalTime : 'Pending'}</span></div></section>
      <section className="panel decision-detail-section"><div className="decision-section-title"><span className="decision-section-icon outcome"><FiActivity /></span><div><h2>Outcome &amp; impact</h2><p>Recorded or projected operational effects</p></div></div><div className="decision-outcome-grid">{decision.outcome.map((item) => <div className={`decision-outcome ${item.trend}`} key={item.label}><span>{item.label}</span><strong>{item.trend === 'good' ? <FiArrowDownRight /> : <FiArrowUpRight />}{item.value}</strong></div>)}</div><small className="decision-outcome-disclaimer">Outcome values are sample operational figures for this demo workspace.</small></section>
    </div><aside className="decision-detail-aside"><section className="panel decision-timeline"><div className="decision-section-title"><span className="decision-section-icon timeline"><FiClock /></span><div><h2>Decision timeline</h2><p>End-to-end audit trail</p></div></div><div className="decision-timeline-list">{decision.timeline.map((entry, index) => <div className="decision-timeline-item" key={`${entry.time}-${index}`}><span className={`decision-timeline-marker ${entry.type}`} />{index < decision.timeline.length - 1 && <i className="decision-timeline-line" />}<div><small>{entry.time}</small><strong>{entry.title}</strong><p>{entry.detail}</p><em>{entry.actor}</em></div></div>)}</div></section><section className="panel decision-governance"><span className="governance-kicker">GOVERNANCE</span><h2>Human oversight</h2><p>Agents can assess signals and propose actions. Administrator controls record approval and execution state in this workspace.</p><div><FiShield />Audit record {decision.id}</div></section></aside></div>
    <footer className="page-footer"><span>© 2026 Verdant Intelligence</span><span><i className="live-dot" /> Decision audit trail active</span><button>Platform status <FiArrowRight size={12} /></button></footer>
  </div>
}

export default DecisionLogs
