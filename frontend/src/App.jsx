import { useEffect, useRef, useState } from 'react'
import {
  FiActivity, FiArrowDownRight, FiArrowRight, FiArrowUpRight, FiBell,
  FiChevronDown, FiChevronLeft, FiChevronRight, FiClock, FiCommand,
  FiCompass, FiGlobe, FiLayers, FiMenu, FiMoreHorizontal, FiSearch, FiRefreshCw,
  FiSettings, FiShield, FiZap, FiUser, FiLogOut, FiCheck, FiCheckCircle, FiTrendingUp,
} from 'react-icons/fi'
import { HiOutlineCube, HiOutlineSignal } from 'react-icons/hi2'
import { HiOutlineExclamationTriangle, HiOutlineHeart, HiOutlineCurrencyDollar } from 'react-icons/hi2'
import GlobalMap from './GlobalMap.jsx'
import MarketSignals from './MarketSignals.jsx'
import DecisionLogs from './DecisionLogs.jsx'
import SettingsPage from './SettingsPage.jsx'
import AuthPage from './AuthPage.jsx'
import LoadingState from './components/LoadingState.jsx'
import { apiGet, apiPost, connectLiveStream } from './data/api.js'
import { fetchAgentNetworkData, fetchCommandCenterData, fetchSystemNotifications } from './data/mockApi.js'
import { agents, shipments, signals } from './data/mockData.js'

const navItems = [
  { label: 'Command Center', icon: FiCommand },
  { label: 'Agent Network', icon: FiLayers },
  { label: 'Global Map', icon: FiGlobe },
  { label: 'Market Signals', icon: HiOutlineSignal },
  { label: 'Decision Logs', icon: FiActivity },
]


function Sidebar({ active, setActive, open, close, user }) {
  return <>
    {open && <button className="sidebar-scrim" aria-label="Close navigation" onClick={close} />}
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="brand-row">
        <div className="brand-mark"><HiOutlineCube size={21} /></div>
        <div className="brand-name">verdant<span>.</span><small>INTELLIGENCE PLATFORM</small></div>
        <button className="icon-button sidebar-close" onClick={close} aria-label="Close menu"><FiChevronLeft /></button>
      </div>
      <div className="workspace-switch">
        <div className="workspace-avatar">N</div>
        <div className="workspace-copy"><strong>{user.workspace}</strong><span>Enterprise workspace</span></div>
        <FiChevronDown className="workspace-chevron" size={15} />
      </div>
      <div className="nav-caption">WORKSPACE</div>
      <nav className="nav-list" aria-label="Main navigation">
        {navItems.map(({ label, icon: Icon, badge, alert }) => <button key={label} onClick={() => { setActive(label); close() }} className={`nav-item ${active === label ? 'nav-active' : ''}`}>
          <Icon size={17} strokeWidth={1.8} /><span>{label}</span>{badge && <span className={`nav-badge ${alert ? 'nav-badge-alert' : ''}`}>{badge}</span>}
        </button>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="upgrade-card">
          <div className="upgrade-icon"><FiZap size={15} /></div>
          <strong>Autonomy, elevated.</strong>
          <p>Your network has made <b>248</b> decisions this week.</p>
          <button onClick={() => setActive('Agent Network')}>Explore agent insights <FiArrowRight size={13} /></button>
          <div className="upgrade-glow" />
        </div>
        <button className="nav-item settings-item" onClick={() => setActive('Settings')}><FiSettings size={17} /><span>Settings</span></button>
        <div className="profile-row">
          <div className="profile-avatar">{user.initials}</div><div className="profile-copy"><strong>{user.name}</strong><span>{user.title}</span></div><FiMoreHorizontal size={19} className="profile-more" />
        </div>
      </div>
    </aside>
  </>
}

function Header({ onMenu, active, onNavigate, onLogout, user }) {
  const [time, setTime] = useState(new Date())
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notificationsLoading, setNotificationsLoading] = useState(true)
  const [readNotificationIds, setReadNotificationIds] = useState(() => new Set())
  const profileRef = useRef(null)
  const notificationsRef = useRef(null)
  useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id) }, [])
  useEffect(() => {
    const closeOnOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false)
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) setNotificationsOpen(false)
    }
    const closeOnEscape = (event) => { if (event.key === 'Escape') { setProfileOpen(false); setNotificationsOpen(false) } }
    document.addEventListener('pointerdown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => { document.removeEventListener('pointerdown', closeOnOutside); document.removeEventListener('keydown', closeOnEscape) }
  }, [])
  useEffect(() => {
    let mounted = true
    const refresh = () => fetchSystemNotifications().then((items) => { if (mounted) { setNotifications(items); setNotificationsLoading(false) } }).catch(() => { if (mounted) setNotificationsLoading(false) })
    refresh()
    const interval = window.setInterval(refresh, 30000)
    return () => { mounted = false; window.clearInterval(interval) }
  }, [])
  const formatted = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(time)
  const unreadCount = notifications.filter((item) => !readNotificationIds.has(item.id)).length
  const markNotificationRead = (id) => setReadNotificationIds((current) => new Set(current).add(id))
  const markAllNotificationsRead = () => setReadNotificationIds((current) => new Set([...current, ...notifications.map((item) => item.id)]))
  const openNotification = (notification) => {
    markNotificationRead(notification.id)
    setNotificationsOpen(false)
    onNavigate(notification.section)
  }
  return <header className="topbar">
    <button className="icon-button mobile-menu" onClick={onMenu} aria-label="Open navigation"><FiMenu /></button>
    <div className="breadcrumb"><span>Workspace</span><FiChevronRight size={14} /><strong>{active}</strong></div>
    <div className="topbar-right">
      <label className="search-box"><FiSearch size={16} /><input placeholder="Search anything..." aria-label="Search" /><kbd>⌘ K</kbd></label>
      <div className="clock-pill"><span className="live-dot" /><FiClock size={15} /><strong>{formatted}</strong><span className="utc-label">UTC</span></div>
      <div className="header-notification-wrap" ref={notificationsRef}>
        <button className="icon-button notification-button" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-haspopup="dialog" aria-expanded={notificationsOpen} onClick={() => { setProfileOpen(false); setNotificationsOpen((open) => !open) }}><FiBell size={18} />{unreadCount > 0 && <span className="notification-count">{unreadCount > 9 ? '9+' : unreadCount}</span>}</button>
        {notificationsOpen && <section className="notification-popover" role="dialog" aria-label="System updates"><div className="notification-popover-head"><div><strong>System updates</strong><span>{unreadCount ? `${unreadCount} unread updates` : 'You’re all caught up'}</span></div><button onClick={markAllNotificationsRead} disabled={!unreadCount}><FiCheck />Mark all read</button></div><div className="notification-list" aria-live="polite">{notificationsLoading && notifications.length === 0 ? <div className="notification-loading"><FiRefreshCw />Fetching system updates…</div> : notifications.map((item) => <button key={item.id} className={`notification-item ${readNotificationIds.has(item.id) ? 'read' : 'unread'}`} onClick={() => openNotification(item)}><span className={`notification-type-icon ${item.type}`}>{item.type === 'critical' ? <HiOutlineExclamationTriangle /> : item.type === 'decision' ? <FiCheckCircle /> : item.type === 'market' ? <FiTrendingUp /> : <FiActivity />}</span><span className="notification-item-copy"><span><strong>{item.title}</strong><small>{relativeTime(item.createdAt)}</small></span><span>{item.detail}</span><em>Open {item.section} <FiArrowRight /></em></span>{!readNotificationIds.has(item.id) && <i className="notification-unread-dot" />}</button>)}</div><div className="notification-popover-foot"><span><i className="live-dot" />Updates refresh automatically</span><span>System feed</span></div></section>}
      </div>
      <div className="header-profile-wrap" ref={profileRef}>
        <button className="header-avatar" aria-label="Open user profile" aria-haspopup="dialog" aria-expanded={profileOpen} onClick={() => setProfileOpen((open) => !open)}>{user.initials}</button>
        {profileOpen && <section className="profile-popover" role="dialog" aria-label="User profile details">
          <div className="profile-popover-head"><div className="profile-avatar-large">{user.initials}</div><div><strong>{user.name}</strong><span>{user.email}</span></div><span className="profile-status-pill"><i />{user.accountStatus}</span></div>
          <div className="profile-role-line"><FiUser /><span>{user.title}</span><i />{user.accessLevel}</div>
          <div className="profile-info-grid"><div><small>WORKSPACE</small><strong>{user.workspace}</strong></div><div><small>TEAM</small><strong>{user.team}</strong></div><div><small>TIME ZONE</small><strong>{user.timeZone}</strong></div><div><small>SESSION</small><strong>Current session</strong></div></div>
          <div className="profile-permissions"><div><FiShield /><strong>Access permissions</strong></div>{user.permissions.map((permission) => <span key={permission}><i />{permission}</span>)}</div>
          <div className="profile-popover-foot"><span>Enterprise account</span><span>Workspace profile</span></div>
          <button className="profile-logout-button" onClick={onLogout}><FiLogOut />Log out of Verdant<FiArrowRight /></button>
        </section>}
      </div>
    </div>
  </header>
}

function MetricCard({ title, value, suffix, change, positive, icon: Icon, chart }) {
  return <article className="metric-card">
    <div className="metric-top"><span>{title}</span><div className="metric-icon"><Icon size={17} /></div></div>
    <div className="metric-value">{value}<small>{suffix}</small></div>
    <div className="metric-bottom"><span className={`metric-change ${positive ? 'change-up' : 'change-down'}`}>{positive ? <FiArrowUpRight /> : <FiArrowDownRight />}{change}</span><span className="metric-period">vs last week</span>{chart && <svg className="sparkline" viewBox="0 0 96 32" preserveAspectRatio="none"><path d={chart} /></svg>}</div>
  </article>
}

function MapCard() {
  return <article className="panel map-panel">
    <div className="panel-heading"><div><h2>Global operations</h2><p>Your supply network at a glance</p></div><button className="select-button">Live view <span className="live-dot" /><FiChevronDown size={14} /></button></div>
    <div className="map-wrap">
      <svg className="world-map" viewBox="0 0 760 330" role="img" aria-label="Map showing global supply routes and active shipment locations">
        <defs><pattern id="dots" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="1.2" cy="1.2" r="1" fill="#c9d3c8" /></pattern><linearGradient id="route" x1="0" x2="1"><stop stopColor="#75ad74" /><stop offset="1" stopColor="#8abcc0" /></linearGradient></defs>
        <path className="continent" d="M65 82l25-16 31 5 14 16 27 2 17 21-11 15 4 18-15 9-10 29-25 7-8-17-19-4-8-19-22-10-9-18-22-8 9-17-4-13 17-10 9-20z M182 191l24 1 18 17 7 27-12 20-2 29-13 25-10-10-3-29-12-15-2-20-17-16 6-17z M347 82l21-18 46-4 20 12 20-2 24 15-3 11 26 6 12 19-11 16-27 0-20 11-5 18-22 8-15-16-21-3-15-17-18-4-8-23-25-7-12-22z M393 182l25-10 21 8 7 23-12 23-7 35-21 21-10-17-16-8-8-29 10-19z M530 85l38-13 40 9 34-8 38 15-4 16-28 7-20 19-25-3-16 15-25-9-13-22-21-4-12-22z M632 216l25-8 25 12-6 23-21 11-22-14z" fill="url(#dots)" />
        <g className="route-lines"><path d="M159 137 Q260 68 383 130"/><path d="M383 130 Q476 146 565 128"/><path d="M383 130 Q470 222 551 186"/><path d="M159 137 Q320 256 551 186"/></g>
        <g className="map-node node-pulse"><circle cx="159" cy="137" r="7"/><circle cx="159" cy="137" r="13"/></g><g className="map-node"><circle cx="383" cy="130" r="7"/><circle cx="383" cy="130" r="13"/></g><g className="map-node node-pulse"><circle cx="565" cy="128" r="7"/><circle cx="565" cy="128" r="13"/></g><g className="map-node"><circle cx="551" cy="186" r="7"/><circle cx="551" cy="186" r="13"/></g>
        <g className="map-label"><rect x="111" y="152" width="92" height="24" rx="7"/><text x="157" y="168" textAnchor="middle">Los Angeles</text></g><g className="map-label"><rect x="348" y="146" width="72" height="24" rx="7"/><text x="384" y="162" textAnchor="middle">Singapore</text></g><g className="map-label"><rect x="533" y="91" width="68" height="24" rx="7"/><text x="567" y="107" textAnchor="middle">Shanghai</text></g><g className="map-label"><rect x="517" y="198" width="68" height="24" rx="7"/><text x="551" y="214" textAnchor="middle">Rotterdam</text></g>
      </svg>
      <div className="map-legend"><span><i className="legend-route" /> Active route</span><span><i className="legend-node" /> Key hub</span></div>
      <div className="map-controls"><button aria-label="Zoom in">+</button><button aria-label="Zoom out">−</button></div>
    </div>
    <div className="corridor-list">{shipments.map((s) => <div className="corridor-row" key={s.name}><div className={`corridor-avatar ${s.tone}`}>{s.initials}</div><div className="corridor-name"><strong>{s.name}</strong><span>{s.detail}</span></div><div className="corridor-progress"><div><span style={{ width: s.value }} /></div><small>{s.value}</small></div><span className={`status-dot ${s.tone}`} /></div>)}</div>
    <button className="panel-footer-link">View global map <FiArrowRight size={14} /></button>
  </article>
}

function SignalCard() {
  return <article className="panel signal-panel"><div className="panel-heading"><div><h2>Market signals</h2><p>Emerging shifts across your network</p></div><button className="text-button">View all <FiArrowRight size={14} /></button></div>
    <div className="signal-list">{signals.map((s) => <div className="signal-row" key={s.title}><div className={`signal-icon ${s.color}`}>{s.icon}</div><div className="signal-copy"><span className="signal-category">{s.category}</span><strong>{s.title}</strong><small>{s.detail}</small></div><div className="signal-meta"><span className={`signal-change ${s.color}`}>{s.change}</span><small>{s.time}</small></div></div>)}</div>
    <button className="panel-footer-link">Explore market intelligence <FiArrowRight size={14} /></button>
  </article>
}

function AgentPanel() {
  return <article className="panel agent-panel"><div className="panel-heading"><div><h2>Agent network</h2><p>Self-learning agents working for you</p></div><button className="agent-count"><span className="live-dot" /> 12 active</button></div>
    <div className="agent-grid">{agents.map(({ name, role, state, color, icon: Icon, metric }) => <div className="agent-card" key={name}><div className={`agent-icon ${color}`}><Icon size={17} /></div><span className="agent-status"><i />{state}</span><strong>{name}</strong><small>{role}</small><div className="agent-card-foot"><span>{metric}</span><button aria-label={`Open ${name}`}><FiArrowRight size={14} /></button></div></div>)}</div>
    <button className="panel-footer-link">Manage agent network <FiArrowRight size={14} /></button>
  </article>
}

function ActivityPanel() {
  return <article className="panel activity-panel"><div className="panel-heading"><div><h2>Network performance</h2><p>Operational efficiency over time</p></div><button className="select-button period-button">Last 7 days <FiChevronDown size={14} /></button></div>
    <div className="chart-summary"><strong>87.6<span>%</span></strong><span className="metric-change change-up"><FiArrowUpRight /> 3.2%</span><small>network efficiency</small></div>
    <div className="chart-area"><div className="chart-ylabels"><span>100</span><span>75</span><span>50</span><span>25</span></div><svg viewBox="0 0 520 142" preserveAspectRatio="none" className="performance-chart" aria-label="Network performance chart"><defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#80b48a" stopOpacity=".2"/><stop offset="1" stopColor="#80b48a" stopOpacity="0"/></linearGradient></defs><path className="grid-line" d="M0 14H520M0 51H520M0 88H520M0 125H520"/><path className="chart-fill" d="M0 100 C28 92 34 99 56 81 S88 88 107 68 S140 76 164 61 S196 70 216 52 S253 66 275 48 S308 57 329 37 S366 51 386 34 S420 41 439 28 S480 38 520 15 V142 H0Z"/><path className="chart-line" d="M0 100 C28 92 34 99 56 81 S88 88 107 68 S140 76 164 61 S196 70 216 52 S253 66 275 48 S308 57 329 37 S366 51 386 34 S420 41 439 28 S480 38 520 15"/><circle cx="520" cy="15" r="4" className="chart-point"/></svg><div className="chart-xlabels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></div>
  </article>
}


function SummaryCard({ icon: Icon, label, value, unit, note, tone, children }) {
  return <article className="cc-summary-card"><div className="cc-summary-head"><span className={`cc-summary-icon ${tone}`}><Icon size={18} /></span><span className="cc-card-label">{label}</span></div><div className="cc-summary-value">{value}<small>{unit}</small></div><div className="cc-summary-note">{note}</div>{children}</article>
}

function StockoutRange({ value, onChange }) {
  return <div className="stockout-range" role="group" aria-label="Predicted stockout forecast range">{['3D', '7D', '14D'].map((range) => <button key={range} className={value === range ? 'selected' : ''} onClick={() => onChange(range)}>{range}</button>)}</div>
}

function LiveAlertFeed({ initialAlerts: alertRecords, alertUpdates: updateRecords }) {
  const [alerts, setAlerts] = useState(alertRecords)
  const [live, setLive] = useState(true)
  useEffect(() => {
    if (!live) return undefined
    let index = 0
    const timer = setInterval(() => {
      const update = updateRecords[index % updateRecords.length]
      index += 1
      setAlerts((current) => [{ ...update, id: Date.now(), time: 'Just now' }, ...current].slice(0, 5))
    }, 18000)
    return () => clearInterval(timer)
  }, [live, updateRecords])
  return <article className="panel cc-alert-panel">
    <div className="cc-panel-heading"><div><div className="cc-title-line"><h2>Live alert feed</h2><span className="cc-live-tag"><i />LIVE</span></div><p>Disruptions detected across your network</p></div><button className={`cc-feed-toggle ${live ? 'is-live' : ''}`} onClick={() => setLive((current) => !current)}><span />{live ? 'Live' : 'Paused'}</button></div>
    <div className="cc-alert-list" aria-live="polite">{alerts.map((alert) => <div className="cc-alert" key={alert.id}><div className={`cc-alert-symbol ${alert.type}`}>{alert.type === 'critical' ? <HiOutlineExclamationTriangle /> : alert.type === 'warning' ? <FiActivity /> : <FiGlobe />}</div><div className="cc-alert-content"><div className="cc-alert-meta"><span className={`cc-alert-type ${alert.type}`}>{alert.source}</span><time>{alert.time}</time></div><h3>{alert.title}</h3><p>{alert.detail}</p><div className="cc-alert-bottom"><span className="cc-location"><FiGlobe />{alert.location}</span><span className="cc-agent-response"><i />{alert.action}</span></div></div></div>)}</div>
    <button className="cc-view-alerts">View all alerts <FiArrowRight /></button>
  </article>
}

function makeLine(values, width = 600, height = 200) {
  const min = 20
  const max = 100
  return values.map((value, index) => {
    const x = index * (width / (values.length - 1))
    const y = height - ((value - min) / (max - min)) * height
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

function VolatilityChart({ volatilityByRange, metrics, lastUpdated }) {
  const [range, setRange] = useState('30D')
  const data = volatilityByRange[range]
  const supply = data.supply
  const supplyPath = makeLine(supply)
  const marketPath = makeLine(data.market)
  return <article className="panel cc-chart-panel">
    <div className="cc-panel-heading"><div><div className="cc-title-line"><h2>Network &amp; market volatility</h2><span className="cc-live-tag"><i />LIVE DATA</span></div><p>Supply chain stability against market volatility</p></div><button className="cc-chart-more" aria-label="More chart options"><FiMoreHorizontal /></button></div>
    <div className="cc-chart-toolbar"><div className="cc-chart-legend"><span><i className="legend-supply" />Supply chain health</span><span><i className="legend-volatility" />Market volatility</span></div><div className="cc-range-select" role="group" aria-label="Chart time range">{['7D', '14D', '30D'].map((item) => <button key={item} className={range === item ? 'selected' : ''} onClick={() => setRange(item)}>{item}</button>)}</div></div>
    <div className="cc-chart-stats"><div><span>SUPPLY CHAIN HEALTH</span><strong>{metrics.networkHealth}<small>/100</small></strong><em>{metrics.healthChange} <FiArrowUpRight /></em></div><div><span>MARKET VOLATILITY</span><strong>{metrics.marketVolatility}<small>/100</small></strong><em className="stable">{metrics.volatilityChange} <FiArrowDownRight /></em></div><div className="cc-updated"><i />Updated {relativeTime(lastUpdated)}</div></div>
    <div className="cc-chart-wrap"><div className="cc-y-axis"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div><svg className="cc-volatility-svg" viewBox="0 0 600 200" preserveAspectRatio="none" role="img" aria-label={`Live supply chain health and market volatility for the last ${range === '30D' ? '30 days' : range === '14D' ? '14 days' : '7 days'}`}>
      <defs><linearGradient id="supplyArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#6b9b70" stopOpacity=".15"/><stop offset="1" stopColor="#6b9b70" stopOpacity="0"/></linearGradient></defs>
      {[0, 50, 100, 150, 200].map((y) => <path key={y} className="cc-chart-grid" d={`M0 ${y}H600`} />)}
      <path className="cc-supply-area" d={`${supplyPath} L600,200 L0,200 Z`} /><path className="cc-supply-path" d={supplyPath} /><path className="cc-volatility-path" d={marketPath} />
      <circle className="cc-last-point" cx="600" cy={200 - ((supply.at(-1) - 20) / 80) * 200} r="4" />
    </svg><div className="cc-x-axis">{data.labels.map((label) => <span key={label}>{label}</span>)}</div></div>
    <div className="cc-chart-footnote"><span><FiActivity /> Volatility index uses a 0–100 composite of freight, commodity, and FX movement.</span><span className="cc-footnote-refresh">Refreshes every 15 sec <FiArrowRight /></span></div>
  </article>
}

function relativeTime(value) {
  const elapsed = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000))
  return elapsed < 60 ? 'just now' : `${Math.floor(elapsed / 60)} min ago`
}

function CommandCenter({ user }) {
  const [data, setData] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [stockoutRange, setStockoutRange] = useState('7D')
  const [replayState, setReplayState] = useState('idle')
  const [liveEventCount, setLiveEventCount] = useState(0)
  useEffect(() => {
    let mounted = true
    let loaded = false
    const refresh = () => fetchCommandCenterData().then((result) => { if (mounted) { loaded = true; setLoadError(false); setData(result) } }).catch(() => { if (mounted && !loaded) setLoadError(true) })
    refresh()
    const timer = window.setInterval(refresh, 15000)
    return () => { mounted = false; window.clearInterval(timer) }
  }, [])
  useEffect(() => connectLiveStream((event) => {
    if (event.type !== 'connected') setLiveEventCount((count) => count + 1)
  }, (status) => {
    if (status === 'disconnected' && replayState === 'running') setReplayState('idle')
  }), [replayState])
  async function toggleReplay() {
    if (replayState === 'running') {
      await apiPost('/api/replay/stop', {})
      setReplayState('idle')
      return
    }
    setReplayState('starting')
    try {
      await apiPost('/api/replay/start', {})
      setReplayState('running')
    } catch {
      setReplayState('idle')
      setLoadError(true)
    }
  }
  if (!data && !loadError) return <div className="page-content command-center-content"><LoadingState title="Loading command center" detail="Fetching threat, inventory, cost, and network data." /></div>
  if (loadError) return <div className="page-content command-center-content"><LoadingState title="Command center data unavailable" detail="The data source could not be reached. Reload the view to try again." /></div>
  const { summary } = data
  const currentDate = new Date()
  const dateLabel = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(currentDate).toUpperCase()
  const dateButtonLabel = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(currentDate)
  const greeting = currentDate.getHours() < 12 ? 'Good morning' : currentDate.getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const stockoutDescription = { '3D': '3-day forecast window', '7D': '7-day forecast window', '14D': '14-day forecast window' }
  return <div className="page-content command-center-content">
    <div className="welcome-row"><div><div className="eyebrow"><span className="live-dot" /> {summary.systemStatus} <span className="eyebrow-divider">·</span> {dateLabel}</div><h1>{greeting}, {user?.name || 'there'} <span>✳</span></h1><p>Your supply network is being monitored in real time.</p></div><div><button className="date-button" onClick={toggleReplay}>{replayState === 'running' ? 'Stop AI replay' : replayState === 'starting' ? 'Starting replay…' : 'Run AI replay'} <FiZap size={15} /></button><small>{liveEventCount ? `${liveEventCount} live agent events received` : `Today, ${dateButtonLabel}`}</small></div></div>
    <section className="cc-summary-grid" aria-label="Command center summary">
      <SummaryCard icon={HiOutlineExclamationTriangle} label="Active supply chain threats" value={summary.activeThreats} note={<><b className="cc-note-warn">{summary.criticalThreats} critical</b> need attention</>} tone="rose" />
      <SummaryCard icon={HiOutlineCube} label="Predicted stockouts" value={summary.stockoutForecast[stockoutRange]} unit=" SKUs" note={stockoutDescription[stockoutRange]} tone="amber"><StockoutRange value={stockoutRange} onChange={setStockoutRange} /></SummaryCard>
      <SummaryCard icon={HiOutlineCurrencyDollar} label="Cost variance" value={summary.costVariance} unit="%" note={<><b className="cc-note-good">{summary.savings} saved</b> vs. monthly plan</>} tone="blue" />
      <SummaryCard icon={HiOutlineHeart} label="Network health score" value={summary.networkHealth} unit="/100" note={<><b className="cc-note-good">{summary.healthChange}</b> from last month</>} tone="green"><div className="cc-health-track"><span style={{ width: `${summary.networkHealth}%` }} /></div></SummaryCard>
    </section>
    <section className="cc-main-grid" aria-label="Live operations and market data"><LiveAlertFeed initialAlerts={data.alerts} alertUpdates={data.alertUpdates} /><VolatilityChart volatilityByRange={data.volatilityByRange} metrics={data.chartMetrics} lastUpdated={summary.lastUpdated} /></section>
    <footer className="page-footer"><span>© 2026 Verdant Intelligence</span><span><i className="live-dot" /> All systems operational</span><button>Platform status <FiArrowRight size={12} /></button></footer>
  </div>
}


function AgentNetwork() {
  const [data, setData] = useState(null)
  const [selected, setSelected] = useState(null)
  const [flowing, setFlowing] = useState(true)
  const [filter, setFilter] = useState('All agents')
  useEffect(() => {
    let mounted = true
    const refresh = () => fetchAgentNetworkData().then((result) => { if (mounted) setData(result) })
    refresh()
    const timer = window.setInterval(refresh, 10000)
    return () => { mounted = false; window.clearInterval(timer) }
  }, [])
  if (!data) return <div className="page-content network-page"><LoadingState title="Loading agent network" detail="Fetching agent roles, topology, and activity." /></div>
  const { agents: networkAgents, edges: networkEdges, stats } = data
  const visibleAgents = networkAgents.filter((agent) => filter === 'All agents' || agent.status === filter)
  return <div className="page-content network-page">
    <div className="welcome-row network-welcome"><div><div className="eyebrow"><span className="live-dot" /> NETWORK OPERATIONAL <span className="eyebrow-divider">·</span> {stats.active} AGENTS ACTIVE</div><h1>Agent network <span>✳</span></h1><p>Specialist agents share live intelligence to coordinate supply chain decisions.</p></div><button className={`network-flow-toggle ${flowing ? 'active' : ''}`} onClick={() => setFlowing((value) => !value)}><i />Data flow {flowing ? 'active' : 'paused'}</button></div>
    <section className="network-kpis" aria-label="Agent network status"><div><span className="network-kpi-icon green"><FiActivity /></span><div><small>ACTIVE AGENTS</small><strong>{stats.active} <em>of {stats.total}</em></strong></div></div><div><span className="network-kpi-icon blue"><FiZap /></span><div><small>MESSAGES / MIN</small><strong>{stats.messagesPerMinute} <em className="kpi-up">{stats.messageChange}</em></strong></div></div><div><span className="network-kpi-icon violet"><FiClock /></span><div><small>AVG. RESPONSE</small><strong>{stats.responseMs}<em> ms</em></strong></div></div><div><span className="network-kpi-icon amber"><FiShield /></span><div><small>DECISIONS TODAY</small><strong>{stats.decisionsToday}</strong></div></div></section>
    <section className="panel network-map-panel"><div className="network-map-heading"><div><h2>Coordination topology</h2><p>Agent roles and the intelligence flowing between them</p></div><div className="network-map-tools"><label><span className="sr-only">Filter agents</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option>All agents</option><option>Monitoring</option><option>Learning</option><option>Optimizing</option><option>Coordinating</option></select><FiChevronDown /></label><span className="flow-legend"><i /> Live data flow</span><span className="network-refresh-time">Updated {relativeTime(stats.lastUpdated)}</span></div></div>
      <div className="network-stage-scroll"><div className={`network-stage ${flowing ? 'flowing' : ''}`}>
        <svg className="network-connections" viewBox="0 0 900 440" preserveAspectRatio="none" aria-label="Animated connections between supply chain agents"><defs><linearGradient id="networkFlow" x1="0" x2="1"><stop stopColor="#a3c694"/><stop offset="1" stopColor="#75a99a"/></linearGradient></defs>{networkEdges.map((edge, index) => <g key={index}><path className="network-edge" d={edge.d} /><path id={`network-edge-${index}`} d={edge.d} fill="none" stroke="none"/><circle className="network-particle" r="3"><animateMotion dur={`${3.4 + (index % 3) * .8}s`} repeatCount="indefinite" begin={edge.delay}><mpath href={`#network-edge-${index}`} /></animateMotion></circle></g>)}</svg>
        {networkAgents.map(({ id, name, task, status, icon: Icon, tone, x, y }) => <button key={id} className={`network-agent-node ${tone} ${selected === id ? 'selected' : ''} ${!visibleAgents.some((agent) => agent.id === id) ? 'filtered-out' : ''}`} style={{ left: `${x}%`, top: `${y}%` }} onClick={() => setSelected(selected === id ? null : id)} aria-pressed={selected === id}><span className="network-node-icon"><Icon size={18} /></span><span className="network-node-copy"><strong>{name}</strong><small>{task}</small></span><span className="network-node-status"><i />{status}</span><FiArrowRight className="network-node-arrow" /></button>)}
        <div className="network-stage-label source-label">INTELLIGENCE INPUTS</div><div className="network-stage-label response-label">COORDINATED ACTIONS</div>
        {selected && <div className="network-selection-note"><span className="live-dot" />{networkAgents.find((agent) => agent.id === selected)?.name} selected <button onClick={() => setSelected(null)} aria-label="Clear selection">×</button></div>}
      </div></div>
      <div className="network-map-footer"><span><i className="network-footer-dot" />Agents exchange event context, forecasts, and proposed actions.</span><button onClick={() => setSelected(null)}>Reset view <FiArrowRight /></button></div></section>
    <section className="network-agent-directory"><div className="network-directory-heading"><div><h2>Specialist agents</h2><p>Dedicated roles across the supply chain</p></div><span>Showing {visibleAgents.length} of {networkAgents.length}</span></div><div className="network-directory-grid">{visibleAgents.map(({ id, name, task, status, icon: Icon, tone }) => <button className={`network-directory-card ${selected === id ? 'selected' : ''}`} key={id} onClick={() => setSelected(selected === id ? null : id)}><span className={`network-directory-icon ${tone}`}><Icon /></span><span className="network-directory-copy"><strong>{name}</strong><small>{task}</small></span><span className="network-directory-status"><i />{status}</span></button>)}</div></section>
    <footer className="page-footer"><span>© 2026 Verdant Intelligence</span><span><i className="live-dot" /> All systems operational</span><button>Platform status <FiArrowRight size={12} /></button></footer>
  </div>
}

function App() {
  const [active, setActive] = useState('Command Center')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sessionUser, setSessionUser] = useState(() => {
    try { return JSON.parse(window.localStorage.getItem('verdant-session') || 'null') } catch { return null }
  })
  const [sessionChecked, setSessionChecked] = useState(false)
  useEffect(() => {
    let mounted = true
    if (!sessionUser) {
      setSessionChecked(true)
      return () => { mounted = false }
    }
    apiGet('/api/auth/me')
      .then(({ user }) => { if (mounted) { setSessionUser(user); setSessionChecked(true) } })
      .catch(() => { if (mounted) { window.localStorage.removeItem('verdant-session'); setSessionUser(null); setSessionChecked(true) } })
    return () => { mounted = false }
  }, [])
  const [theme, setTheme] = useState(() => window.localStorage.getItem('verdant-theme') || 'light')
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('verdant-theme', theme)
  }, [theme])
  const authenticate = (user) => { window.localStorage.setItem('verdant-session', JSON.stringify(user)); setSessionUser(user) }
  const logout = async () => {
    try { await apiPost('/api/auth/logout', {}) } finally {
      window.localStorage.removeItem('verdant-session')
      setSessionUser(null)
    }
  }
  if (!sessionChecked) return <LoadingState title="Checking secure session" detail="Verifying your workspace access." />
  if (!sessionUser) return <AuthPage onAuthenticated={authenticate} />
  return <div className="app-shell">
    <Sidebar active={active} setActive={setActive} open={sidebarOpen} close={() => setSidebarOpen(false)} user={sessionUser} />
    <main className="main-shell"><Header active={active} onMenu={() => setSidebarOpen(true)} onNavigate={setActive} onLogout={logout} user={sessionUser} />
      {active === 'Agent Network' ? <AgentNetwork /> : active === 'Global Map' ? <GlobalMap /> : active === 'Market Signals' ? <MarketSignals /> : active === 'Decision Logs' ? <DecisionLogs /> : active === 'Settings' ? <SettingsPage theme={theme} onThemeChange={setTheme} /> : <CommandCenter user={sessionUser} />}
    </main>
  </div>
}

export default App
