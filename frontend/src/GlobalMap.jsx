import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { FiActivity, FiArrowRight, FiBox, FiChevronDown, FiClock, FiGlobe, FiMapPin, FiSearch, FiTruck } from 'react-icons/fi'
import { HiOutlineExclamationTriangle } from 'react-icons/hi2'
import { fetchGlobalUnits } from './data/mockApi.js'
import LoadingState from './components/LoadingState.jsx'


function unitIcon(status) {
  const color = status === 'At risk' ? 'risk' : status === 'Watch' ? 'watch' : 'healthy'
  return L.divIcon({
    className: 'unit-marker-shell',
    html: `<span class="unit-marker ${color}"><i></i></span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })
}

function FocusSelectedUnit({ unit }) {
  const map = useMap()
  const unitId = unit?.id
  const latitude = unit?.coordinates[0]
  const longitude = unit?.coordinates[1]
  useEffect(() => {
    if (unitId && latitude !== undefined && longitude !== undefined) map.flyTo([latitude, longitude], Math.max(map.getZoom(), 5), { duration: 0.8 })
  }, [unitId, latitude, longitude, map])
  return null
}

function UnitDetail({ unit }) {
  if (!unit) return <div className="global-unit-empty"><span><FiMapPin /></span><strong>Select a map unit</strong><p>Choose a marker or unit in the list to see its operational data.</p></div>
  return <div className="global-unit-detail">
    <div className="global-unit-detail-head"><span className={`global-unit-status-icon ${unit.status === 'At risk' ? 'risk' : unit.status === 'Watch' ? 'watch' : 'healthy'}`}><FiMapPin /></span><span className={`global-status-pill ${unit.status.toLowerCase().replace(' ', '-')}`}><i />{unit.status}</span></div>
    <h3>{unit.name}</h3><p className="global-unit-location"><FiMapPin />{unit.city}</p>
    <div className="global-unit-type">{unit.type}<span>·</span>{unit.region}</div>
    <div className="global-detail-divider" />
    <div className="global-unit-metrics"><div><span><FiTruck />Active shipments</span><strong>{unit.shipments}</strong></div><div><span><FiActivity />Capacity used</span><strong>{unit.capacity}<small>%</small></strong></div><div><span><FiBox />Inventory health</span><strong>{unit.inventory}</strong></div><div><span><HiOutlineExclamationTriangle />Risk level</span><strong className={`risk-text ${unit.risk.toLowerCase()}`}>{unit.risk}</strong></div></div>
    <div className="global-unit-manager"><div className="global-manager-avatar">{unit.manager.split(' ').map((part) => part[0]).join('')}</div><div><span>UNIT MANAGER</span><strong>{unit.manager}</strong></div><FiArrowRight /></div>
    <div className="global-detail-updated"><FiClock />Updated {unit.lastUpdate}<span>{unit.alerts ? `${unit.alerts} open alerts` : 'No open alerts'}</span></div>
  </div>
}

export default function GlobalMap() {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [region, setRegion] = useState('All regions')
  const [query, setQuery] = useState('')
  useEffect(() => {
    let mounted = true
    const refresh = () => fetchGlobalUnits().then((result) => {
      if (!mounted) return
      setUnits(result)
      setSelectedId((current) => current || result.find((unit) => unit.status === 'At risk')?.id || result[0]?.id || null)
      setLoading(false)
    }).catch(() => { if (mounted) setLoading(false) })
    refresh()
    const timer = window.setInterval(refresh, 15000)
    return () => { mounted = false; window.clearInterval(timer) }
  }, [])
  const selectedUnit = units.find((unit) => unit.id === selectedId)
  const visibleUnits = useMemo(() => units.filter((unit) => {
    const matchesRegion = region === 'All regions' || unit.region === region
    const searchText = `${unit.name} ${unit.city} ${unit.type}`.toLowerCase()
    return matchesRegion && searchText.includes(query.toLowerCase())
  }), [region, query])
  if (loading) return <div className="page-content global-map-page"><LoadingState title="Loading global units" detail="Fetching facility locations and operational status." /></div>
  if (units.length === 0) return <div className="page-content global-map-page"><LoadingState title="Global unit data unavailable" detail="The unit data source could not be reached. Reload the view to try again." /></div>
  const regionCount = new Set(units.map((unit) => unit.region)).size
  const operationalCount = units.filter((unit) => unit.status === 'Operational').length
  const atRiskCount = units.filter((unit) => unit.status === 'At risk').length
  const watchCount = units.filter((unit) => unit.status === 'Watch').length
  return <div className="page-content global-map-page">
    <div className="welcome-row"><div><div className="eyebrow"><span className="live-dot" /> GLOBAL NETWORK <span className="eyebrow-divider">·</span> 9 UNITS</div><h1>Global map <span>✳</span></h1><p>Explore facilities worldwide and inspect each unit’s operational status.</p></div><div className="global-map-live"><span className="live-dot" /> Network data updated continuously</div></div>
    <section className="global-map-summary"><div><span className="global-summary-icon"><FiGlobe /></span><span><small>NETWORK UNITS</small><strong>{String(units.length).padStart(2, '0')} <em>across {regionCount} regions</em></strong></span></div><div><span className="global-summary-icon healthy"><FiActivity /></span><span><small>OPERATIONAL</small><strong>{String(operationalCount).padStart(2, '0')} <em>units stable</em></strong></span></div><div><span className="global-summary-icon risk"><HiOutlineExclamationTriangle /></span><span><small>NEED ATTENTION</small><strong>{String(atRiskCount + watchCount).padStart(2, '0')} <em>{atRiskCount} at risk · {watchCount} watch</em></strong></span></div></section>
    <section className="global-map-layout">
      <div className="panel global-map-card"><div className="global-map-toolbar"><div className="global-map-search"><FiSearch /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a unit or city..." aria-label="Find a unit or city" /></div><label className="global-region-select"><select value={region} onChange={(event) => setRegion(event.target.value)} aria-label="Filter by region"><option>All regions</option><option>Asia Pacific</option><option>Europe</option><option>North America</option><option>South America</option><option>Middle East & Africa</option></select><FiChevronDown /></label><span className="global-map-count">{visibleUnits.length} units</span></div>
        <div className="global-map-canvas"><MapContainer center={[23, 8]} zoom={2} minZoom={2} maxZoom={12} scrollWheelZoom zoomControl className="leaflet-supply-map"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><FocusSelectedUnit unit={selectedUnit} />{visibleUnits.map((unit) => <Marker key={unit.id} position={unit.coordinates} icon={unitIcon(unit.status)} eventHandlers={{ click: () => setSelectedId(unit.id) }} title={unit.name} />)}</MapContainer><div className="global-map-legend"><span><i className="legend-healthy" />Operational</span><span><i className="legend-watch" />Watch</span><span><i className="legend-risk" />At risk</span></div></div>
        <div className="global-unit-list-heading"><div><strong>Network units</strong><span>Click a unit to locate it on the map</span></div><FiArrowRight /></div><div className="global-unit-list">{visibleUnits.map((unit) => <button key={unit.id} className={`global-unit-row ${selectedId === unit.id ? 'selected' : ''}`} onClick={() => setSelectedId(unit.id)}><span className={`global-unit-dot ${unit.status.toLowerCase().replace(' ', '-')}`} /><span className="global-unit-row-copy"><strong>{unit.short}</strong><small>{unit.city}</small></span><span className="global-unit-row-count">{unit.shipments} <small>shipments</small></span><FiArrowRight /></button>)}</div>
      </div>
      <aside className="panel global-unit-inspector"><div className="global-inspector-heading"><div><h2>Unit overview</h2><p>Selected facility intelligence</p></div><span><i className="live-dot" />LIVE</span></div><UnitDetail unit={selectedUnit} /></aside>
    </section>
    <footer className="page-footer"><span>© 2026 Verdant Intelligence</span><span><i className="live-dot" /> All systems operational</span><button>Platform status <FiArrowRight size={12} /></button></footer>
  </div>
}
