import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiActivity, FiArrowLeft, FiArrowRight, FiBookmark, FiCalendar, FiChevronDown, FiClock, FiExternalLink, FiFilter, FiGlobe, FiMapPin, FiRefreshCw, FiSearch, FiShield, FiTrendingUp, FiTruck } from 'react-icons/fi'
import { HiOutlineExclamationTriangle } from 'react-icons/hi2'

const API_URL = 'https://api.gdeltproject.org/api/v2/doc/doc'
const SUPPLY_QUERY = '("supply chain" OR port OR shipping OR freight OR logistics OR commodity OR supplier) (disruption OR delay OR strike OR shortage OR tariff OR export OR congestion OR closure OR volatility OR sanctions OR blockade)'

function parseDate(value) {
  if (!value) return null
  const normalized = value.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/, '$1-$2-$3T$4:$5:$6Z').replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

function classifySignal(title) {
  const text = title.toLowerCase()
  const matches = (terms) => terms.some((term) => text.includes(term))
  let category = 'Logistics'
  let icon = FiTruck
  let reasons = ['freight and transport conditions']
  if (matches(['tariff', 'sanction', 'border', 'trade war', 'export ban', 'geopolit'])) {
    category = 'Geopolitical'; icon = FiGlobe; reasons = ['trade policy or cross-border movement']
  } else if (matches(['storm', 'hurricane', 'typhoon', 'flood', 'drought', 'earthquake', 'weather', 'wildfire'])) {
    category = 'Weather'; icon = FiActivity; reasons = ['weather-related continuity and transit']
  } else if (matches(['price', 'commodity', 'copper', 'oil', 'gas', 'wheat', 'cocoa', 'market', 'volatility', 'shortage'])) {
    category = 'Commodity markets'; icon = FiTrendingUp; reasons = ['commodity availability and input costs']
  } else if (matches(['supplier', 'factory', 'plant', 'production', 'manufactur'])) {
    category = 'Supplier risk'; icon = FiShield; reasons = ['supplier capacity and production continuity']
  }
  const highTerms = ['strike', 'closed', 'closure', 'halt', 'attack', 'blockade', 'disruption', 'shortage', 'emergency', 'suspend']
  const elevatedTerms = ['delay', 'congestion', 'warning', 'surge', 'tariff', 'sanction', 'storm', 'flood', 'rising', 'volatility']
  const priority = matches(highTerms) ? 'High' : matches(elevatedTerms) ? 'Elevated' : 'Watch'
  if (matches(['port', 'shipping', 'freight', 'container', 'vessel', 'canal', 'rail'])) reasons.push('transport lane availability')
  if (matches(['copper', 'oil', 'gas', 'wheat', 'cocoa', 'lithium', 'commodity'])) reasons.push('raw material cost and sourcing')
  if (matches(['factory', 'production', 'supplier', 'plant'])) reasons.push('supplier output and replenishment')
  return { category, icon, priority, reasons: [...new Set(reasons)] }
}

function normalizeArticle(article, index) {
  const title = article.title?.trim()
  if (!title || !article.url) return null
  const analysis = classifySignal(title)
  return {
    id: article.url,
    title,
    url: article.url,
    source: article.domain || 'News source',
    country: article.sourcecountry || 'Global',
    language: article.language || 'Unknown',
    image: article.socialimage || '',
    date: parseDate(article.seendate),
    ...analysis,
    score: (analysis.priority === 'High' ? 30 : analysis.priority === 'Elevated' ? 18 : 8) + analysis.reasons.length * 5 + Math.max(0, 12 - index),
  }
}

function timeAgo(date) {
  if (!date) return 'Time unavailable'
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

function SignalPriority({ priority }) {
  return <span className={`signal-priority ${priority.toLowerCase()}`}><i />{priority} priority</span>
}

function SignalDetail({ signal, onBack }) {
  const Icon = signal.icon
  const actionByCategory = {
    Logistics: 'Review affected lanes and shipment ETAs. Check whether alternate carriers or routings are available.',
    Geopolitical: 'Check exposure by country of origin, customs route, and supplier jurisdiction before committing new orders.',
    Weather: 'Review facility and lane exposure against the official local advisory. Confirm contingency and inventory coverage.',
    'Commodity markets': 'Compare the reported movement against current contracts, procurement windows, and substitute materials.',
    'Supplier risk': 'Confirm the report with the supplier and review dependencies, available capacity, and recovery timing.',
  }
  return <div className="page-content market-page signal-detail-page">
    <button className="signal-back" onClick={onBack}><FiArrowLeft />Back to market signals</button>
    <div className="signal-detail-layout"><article className="panel signal-detail-main"><div className="signal-detail-meta"><span className="signal-category-pill"><Icon />{signal.category}</span><SignalPriority priority={signal.priority} /><span className="signal-detail-time"><FiClock />{timeAgo(signal.date)}</span></div><h1>{signal.title}</h1><div className="signal-source-line"><span className="source-monogram">{signal.source.slice(0, 1).toUpperCase()}</span><span><strong>{signal.source}</strong><small>{signal.country} · {signal.language}</small></span><a href={signal.url} target="_blank" rel="noreferrer">Open original article <FiExternalLink /></a></div><div className="signal-detail-rule" />
      <section className="signal-analysis-block"><div className="signal-analysis-heading"><span><FiActivity /></span><div><h2>Supply chain relevance</h2><small>Automated first-pass screening</small></div></div><p>This report was matched to supply chain monitoring topics. Based on the headline and source metadata, it may be relevant to {signal.reasons.join(' and ')}.</p><div className="signal-topic-tags">{signal.reasons.map((reason) => <span key={reason}>{reason}</span>)}</div><div className="signal-analysis-note"><HiOutlineExclamationTriangle /> This is a screening assessment from article metadata, not a verified impact forecast. Open the original report for full context.</div></section>
      <section className="signal-action-block"><div className="signal-analysis-heading"><span><FiShield /></span><div><h2>Suggested review</h2><small>Recommended next step for the supply chain team</small></div></div><p>{actionByCategory[signal.category]}</p></section>
      <div className="signal-detail-footer"><span><FiCalendar />Reported {signal.date ? new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(signal.date) + ' UTC' : 'time not provided'}</span><a href={signal.url} target="_blank" rel="noreferrer">Read source coverage <FiArrowRight /></a></div>
    </article><aside className="panel signal-detail-aside"><span className="signal-aside-kicker">SIGNAL SNAPSHOT</span><h2>Impact screening</h2><p>Initial relevance score from article metadata</p><div className="signal-impact-score"><strong>{Math.min(98, signal.score + 36)}</strong><span>/100</span><i><b style={{ width: `${Math.min(98, signal.score + 36)}%` }} /></i><small>{signal.priority} relevance</small></div><div className="signal-aside-row"><span>Signal category</span><strong>{signal.category}</strong></div><div className="signal-aside-row"><span>Reported region</span><strong>{signal.country}</strong></div><div className="signal-aside-row"><span>Publisher</span><strong>{signal.source}</strong></div><div className="signal-aside-disclaimer">Relevance score prioritizes review; it does not represent confirmed operational impact.</div></aside></div>
  </div>
}

export default function MarketSignals() {
  const [signals, setSignals] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All signals')
  const [priority, setPriority] = useState('All priorities')
  const [selected, setSelected] = useState(null)
  const [saved, setSaved] = useState(() => new Set())

  const refresh = useCallback(async (isMounted = () => true) => {
    if (isMounted()) { setStatus('loading'); setError('') }
    const url = new URL(API_URL)
    url.search = new URLSearchParams({ query: SUPPLY_QUERY, mode: 'ArtList', format: 'json', timespan: '24h', maxrecords: '75', sort: 'datedesc' })
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`News provider returned ${response.status}`)
      const data = await response.json()
      const normalized = (data.articles || []).map(normalizeArticle).filter(Boolean)
      if (isMounted()) { setSignals(normalized); setStatus(normalized.length ? 'ready' : 'empty') }
    } catch (fetchError) {
      if (isMounted()) { setError(fetchError.message || 'Could not reach the news provider.'); setStatus('error') }
    }
  }, [])

  useEffect(() => {
    let alive = true
    refresh(() => alive)
    const timer = setInterval(() => refresh(() => alive), 5 * 60 * 1000)
    return () => { alive = false; clearInterval(timer) }
  }, [refresh])

  const filteredSignals = useMemo(() => signals.filter((signal) => {
    const text = `${signal.title} ${signal.source} ${signal.country} ${signal.category}`.toLowerCase()
    return text.includes(query.toLowerCase()) && (category === 'All signals' || signal.category === category) && (priority === 'All priorities' || signal.priority === priority)
  }).sort((a, b) => b.score - a.score || (b.date?.getTime() || 0) - (a.date?.getTime() || 0)), [signals, query, category, priority])

  if (selected) return <SignalDetail signal={selected} onBack={() => setSelected(null)} />

  const highPriority = signals.filter((signal) => signal.priority === 'High').length
  const categories = ['All signals', 'Logistics', 'Geopolitical', 'Weather', 'Commodity markets', 'Supplier risk']
  return <div className="page-content market-page">
    <div className="welcome-row market-welcome"><div><div className="eyebrow"><span className="live-dot" /> NEWS INTELLIGENCE <span className="eyebrow-divider">·</span> GDELT GLOBAL COVERAGE</div><h1>Market signals <span>✳</span></h1><p>Global news screened for events that may affect your supply network.</p></div><button className="market-refresh" onClick={() => refresh()} disabled={status === 'loading'}><FiRefreshCw className={status === 'loading' ? 'spinning' : ''} />Refresh signals</button></div>
    <section className="market-summary-grid"><div><span className="market-summary-icon"><FiGlobe /></span><span><small>ARTICLES SCREENED</small><strong>{signals.length}<em>last 24 hours</em></strong></span></div><div><span className="market-summary-icon high"><HiOutlineExclamationTriangle /></span><span><small>HIGH PRIORITY</small><strong>{highPriority}<em>review first</em></strong></span></div><div><span className="market-summary-icon green"><FiActivity /></span><span><small>TOPIC CATEGORIES</small><strong>{new Set(signals.map((signal) => signal.category)).size}<em>across the network</em></strong></span></div><div className="market-updated"><i />{status === 'ready' ? 'Updates every 5 minutes' : status === 'loading' ? 'Connecting to news sources…' : 'News feed unavailable'}</div></section>
    <section className="market-workspace"><div className="market-feed-column"><div className="market-toolbar"><label className="market-search"><FiSearch /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search headlines, sources, regions..." aria-label="Search market signals" /></label><label className="market-priority-select"><FiFilter /><select value={priority} onChange={(event) => setPriority(event.target.value)} aria-label="Filter by priority"><option>All priorities</option><option>High</option><option>Elevated</option><option>Watch</option></select><FiChevronDown /></label></div>
      <div className="market-category-tabs" role="tablist" aria-label="Signal categories">{categories.map((item) => <button role="tab" aria-selected={category === item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div>
      <div className="market-feed-heading"><div><h2>Priority-ranked signals</h2><p>Highest potential supply-chain relevance first</p></div><span>{filteredSignals.length} results</span></div>
      <div className="market-signal-list" aria-live="polite">{status === 'loading' && signals.length === 0 && <div className="market-state"><span className="market-loading-mark"><FiRefreshCw /></span><strong>Scanning global coverage</strong><p>Looking for recent logistics, trade, weather, and commodity signals.</p></div>}{status === 'error' && signals.length === 0 && <div className="market-state"><span className="market-error-mark"><FiGlobe /></span><strong>Couldn’t load global coverage</strong><p>{error} Check your connection and try again.</p><button onClick={() => refresh()}>Retry <FiRefreshCw /></button></div>}{status === 'empty' && signals.length === 0 && <div className="market-state"><span className="market-loading-mark"><FiSearch /></span><strong>No matching coverage found</strong><p>There were no matching reports in the last 24 hours. Try again later.</p></div>}{status !== 'loading' && filteredSignals.length === 0 && signals.length > 0 && <div className="market-state compact"><strong>No signals match those filters</strong><p>Try a different search or category.</p></div>}{filteredSignals.map((signal, index) => <SignalCard key={signal.id} signal={signal} index={index} saved={saved.has(signal.id)} onSelect={() => setSelected(signal)} onSave={() => setSaved((current) => { const next = new Set(current); next.has(signal.id) ? next.delete(signal.id) : next.add(signal.id); return next })} />)}</div>
      </div><aside className="market-side-column"><article className="panel market-priority-panel"><div className="market-side-heading"><span className="market-side-icon high"><HiOutlineExclamationTriangle /></span><div><h2>Needs attention</h2><p>Highest priority signals</p></div></div>{signals.filter((signal) => signal.priority === 'High').sort((a,b) => b.score-a.score).slice(0,4).map((signal) => <button className="market-priority-item" key={signal.id} onClick={() => setSelected(signal)}><span className="priority-item-dot" /><span><strong>{signal.title}</strong><small>{signal.source} · {timeAgo(signal.date)}</small></span><FiArrowRight /></button>)}{highPriority === 0 && <div className="market-no-priority">No high-priority signals detected in the current feed.</div>}</article><article className="panel market-method-panel"><span className="market-method-kicker">SIGNAL SCREENING</span><h2>How signals are prioritized</h2><p>Recent global news headlines are matched to supply chain topics, then ranked by potential severity and relevance indicators.</p><div><span><FiClock />Rolling 24-hour window</span><span><FiShield />Headline-level screening</span><span><FiExternalLink />Original publisher linked</span></div><small>Coverage: The GDELT Project, a global news monitoring dataset. Article content and interpretations belong to their publishers.</small></article></aside>
    </section><footer className="page-footer"><span>© 2026 Verdant Intelligence</span><span><i className="live-dot" /> Signal screening active</span><a href="https://www.gdeltproject.org/" target="_blank" rel="noreferrer">About news coverage <FiExternalLink /></a></footer>
  </div>
}

function SignalCard({ signal, index, saved, onSelect, onSave }) {
  const Icon = signal.icon
  return <article className={`panel market-signal-card ${index === 0 ? 'top-ranked' : ''}`}><div className={`market-signal-icon ${signal.priority.toLowerCase()}`}><Icon /></div><div className="market-signal-content"><div className="market-signal-meta"><span className="signal-category-pill"><Icon />{signal.category}</span><SignalPriority priority={signal.priority} /><span className="market-signal-time">{timeAgo(signal.date)}</span></div><button className="market-signal-title" onClick={onSelect}>{signal.title}</button><div className="market-signal-foot"><span className="market-source"><span>{signal.source.slice(0,1).toUpperCase()}</span>{signal.source}</span><span className="market-location"><FiMapPin />{signal.country}</span><span className="market-relevance"><FiActivity />{Math.min(98, signal.score + 36)} relevance</span><button className={`market-save ${saved ? 'saved' : ''}`} onClick={onSave} aria-label={saved ? 'Remove saved signal' : 'Save signal'}><FiBookmark /></button></div></div></article>
}
