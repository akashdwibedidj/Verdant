import { alertUpdates, initialAlerts, initialDecisions, initialNotifications, networkAgents, networkEdges, units, volatilityByRange } from './mockData.js'
import { apiGet } from './api.js'

// Async data boundary for the prototype. Replace these mock implementations
// with fetch calls while keeping the view components and response shapes intact.
const simulateNetworkLatency = (value, delay = 450) => new Promise((resolve) => {
  window.setTimeout(() => resolve(value), delay)
})

let refreshTick = 0
let liveUnits = units.map((unit) => ({ ...unit }))
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const vary = (value, step, min, max, tick, phase = 0) => clamp(value + Math.round(Math.sin(tick * 1.13 + phase) * step), min, max)

function updateChartSeries() {
  const phase = refreshTick
  return Object.fromEntries(Object.entries(volatilityByRange).map(([range, series], rangeIndex) => {
    const last = series.supply.length - 1
    const supply = series.supply.map((value, index) => index === last ? vary(value, 2, 40, 98, phase, rangeIndex) : value)
    const market = series.market.map((value, index) => index === last ? vary(value, 3, 10, 90, phase, rangeIndex + 2) : value)
    const days = Number.parseInt(range, 10)
    const labels = series.labels.map((_, index) => {
      const date = new Date()
      date.setDate(date.getDate() - days + Math.round((index * days) / (series.labels.length - 1)))
      return new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short' }).format(date)
    })
    return [range, { ...series, labels, supply, market }]
  }))
}

export async function fetchCommandCenterData() {
  try {
    const [snapshot, decisions, hitl] = await Promise.all([
      apiGet('/api/status'),
      apiGet('/api/decisions?limit=50'),
      apiGet('/api/hitl/pending'),
    ])
    const ports = snapshot.ports || []
    const skus = snapshot.skus || []
    const activeThreats = ports.filter((port) => port.status !== 'operational').length + hitl.length
    const criticalThreats = ports.filter((port) => port.status === 'disrupted').length
    const highRiskSkus = skus.filter((sku) => sku.current_inventory <= sku.reorder_point).length
    const health = Math.max(0, 100 - (activeThreats * 8) - (highRiskSkus * 5))
    return simulateNetworkLatency({
      summary: {
        activeThreats: String(activeThreats).padStart(2, '0'),
        criticalThreats,
        stockoutForecast: { '3D': String(highRiskSkus).padStart(2, '0'), '7D': String(highRiskSkus).padStart(2, '0'), '14D': String(Math.min(skus.length, highRiskSkus + 1)).padStart(2, '0') },
        costVariance: '—',
        savings: `$${Math.round((decisions.data || []).reduce((sum, item) => sum + Number(item.cost_estimate || 0), 0) / 1000)}K`,
        networkHealth: health.toFixed(1),
        healthChange: `${health >= 80 ? '+' : '−'}${Math.abs(health - 80).toFixed(1)}%`,
        systemStatus: activeThreats > 3 ? 'ELEVATED MONITORING' : 'SYSTEMS NOMINAL',
        lastUpdated: new Date().toISOString(),
      },
      chartMetrics: { networkHealth: health.toFixed(1), healthChange: `${health >= 80 ? '+' : '−'}${Math.abs(health - 80).toFixed(1)}%`, marketVolatility: '—', volatilityChange: '—' },
      alerts: ports.filter((port) => port.status !== 'operational').map((port, index) => ({
        id: port.id || index, type: port.status === 'disrupted' ? 'critical' : 'warning', source: 'PORT STATUS',
        title: `${port.name} is ${port.status}`, detail: 'The backend world model reported a non-operational port status.',
        location: port.country || 'Global', time: 'Just now', action: 'Agent network monitoring',
      })),
      alertUpdates,
      volatilityByRange: updateChartSeries(),
    })
  } catch {
    // Keep the existing local dataset available when the backend is offline.
  }
  refreshTick += 1
  const tick = refreshTick
  const health = vary(87.6, 2, 78, 97, tick)
  const threats = vary(7, 1, 3, 13, tick, 1)
  const savings = 284 + Math.round(Math.sin(tick / 2) * 9)
  return simulateNetworkLatency({
    summary: {
      activeThreats: String(threats).padStart(2, '0'), criticalThreats: Math.min(4, Math.max(1, Math.round(threats / 4))),
      stockoutForecast: { '3D': String(vary(4, 1, 1, 8, tick, 2)).padStart(2, '0'), '7D': String(vary(12, 2, 5, 24, tick, 3)).padStart(2, '0'), '14D': String(vary(28, 3, 12, 45, tick, 4)).padStart(2, '0') },
      costVariance: `−${vary(48, 5, 25, 85, tick, 5) / 10}`, savings: `$${savings}K`, networkHealth: health.toFixed(1), healthChange: `${health >= 87.6 ? '+' : '−'}${Math.abs(health - 87.6).toFixed(1)}%`,
      systemStatus: threats > 10 ? 'ELEVATED MONITORING' : 'SYSTEMS NOMINAL',
      lastUpdated: new Date().toISOString(),
    },
    chartMetrics: { networkHealth: health.toFixed(1), healthChange: `${health >= 87.6 ? '+' : '−'}${Math.abs(health - 87.6).toFixed(1)}%`, marketVolatility: vary(34, 4, 20, 55, tick, 7).toFixed(1), volatilityChange: `${tick % 2 ? '−' : '+'}${vary(58, 20, 10, 90, tick, 8) / 10}%` },
    alerts: initialAlerts,
    alertUpdates,
    volatilityByRange: updateChartSeries(),
  })
}

export async function fetchAgentNetworkData() {
  refreshTick += 1
  const tick = refreshTick
  const messages = vary(1482, 130, 900, 2200, tick)
  const response = vary(240, 28, 140, 380, tick, 2)
  const agents = networkAgents.map((agent, index) => ({
    ...agent,
    status: agent.id === 'demand' && tick % 3 === 0 ? 'Optimizing' : agent.id === 'demand' ? 'Learning' : agent.status,
    lastActivity: new Date(Date.now() - ((tick + index) % 4) * 1000).toISOString(),
  }))
  return simulateNetworkLatency({
    agents,
    edges: networkEdges,
    stats: { active: agents.length, total: agents.length, messagesPerMinute: messages.toLocaleString('en-US'), messageChange: `${messages >= 1482 ? '+' : '−'}${Math.abs((messages / 1482 - 1) * 100).toFixed(1)}%`, responseMs: response, decisionsToday: (3846 + Math.max(0, tick - 1) * 3).toLocaleString('en-US'), lastUpdated: new Date().toISOString() },
  })
}

export async function fetchGlobalUnits() {
  try {
    const snapshot = await apiGet('/api/status')
    const ports = snapshot.ports || []
    if (ports.length) return ports.map((port, index) => ({
      id: port.id,
      name: port.name,
      short: port.name,
      type: 'Port',
      region: port.country || 'Global',
      city: port.country || 'Global',
      coordinates: [[25.2048, 55.2708], [1.2903, 103.8519], [33.7405, -118.2775], [19.076, 72.8777]][index % 4],
      status: port.status === 'disrupted' ? 'At risk' : port.status === 'congested' ? 'Watch' : 'Operational',
      shipments: 0,
      capacity: port.status === 'operational' ? 70 : 90,
      inventory: '—',
      risk: port.status === 'operational' ? 'Low' : 'Elevated',
      manager: 'Network Operations',
      lastUpdate: 'Just now',
      alerts: port.status === 'operational' ? 0 : 1,
    }))
  } catch {
    // Keep the existing local dataset available when the backend is offline.
  }
  refreshTick += 1
  liveUnits = liveUnits.map((unit, index) => {
    const capacity = vary(unit.capacity, 2, 45, 99, refreshTick, index)
    const inventoryValue = clamp(parseInt(unit.inventory, 10) + Math.round(Math.sin(refreshTick + index) * 2), 35, 100)
    const status = unit.status === 'At risk' && capacity < 93 ? 'At risk' : capacity > 95 ? 'Watch' : unit.status === 'At risk' && refreshTick % 3 === 0 ? 'Watch' : unit.status === 'Watch' && refreshTick % 4 === 0 ? 'Operational' : unit.status
    return { ...unit, capacity, inventory: `${inventoryValue}%`, status, lastUpdate: 'Just now' }
  })
  return simulateNetworkLatency(liveUnits.map((unit) => ({ ...unit })))
}

export async function fetchDecisionLogs() {
  try {
    const result = await apiGet('/api/decisions?limit=50')
    return result.data.map((decision) => ({
      id: decision.id,
      title: decision.decision || `${decision.agent} ${decision.event_type}`,
      severity: Number(decision.cost_estimate || 0) > 10000 ? 'High' : 'Medium',
      status: decision.autonomy_level === 'hitl_required' ? 'Pending approval' : decision.autonomy_level === 'hitl_approved' ? 'Approved' : 'Executed',
      confidence: 80,
      created: new Date(decision.timestamp).toLocaleString(),
      category: decision.agent,
      trigger: decision.input_summary || 'Agent decision recorded by the backend.',
      triggerSource: `${decision.agent} · ${decision.event_type}`,
      agents: [{ name: decision.agent, role: decision.event_type, contribution: decision.decision || 'Decision recorded.', data: 'Backend decision log' }],
      recommendation: decision.decision || 'No recommendation details recorded.',
      approvedBy: decision.autonomy_level === 'hitl_approved' ? 'Workspace administrator' : null,
      approvalTime: null,
      outcome: [{ label: 'Estimated cost', value: `$${Number(decision.cost_estimate || 0).toLocaleString()}`, trend: 'caution' }],
      timeline: [{ time: new Date(decision.timestamp).toLocaleString(), title: 'Decision recorded', detail: decision.predicted_outcome || 'Backend event processed.', actor: decision.agent, type: 'agent' }],
    }))
  } catch {
    return simulateNetworkLatency(initialDecisions)
  }
}

export async function fetchSystemNotifications() {
  const now = Date.now()
  return simulateNetworkLatency(initialNotifications.map((notification) => ({
    ...notification,
    createdAt: new Date(now - notification.ageMinutes * 60 * 1000).toISOString(),
  })))
}
