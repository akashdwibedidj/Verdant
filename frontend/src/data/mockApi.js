import { alertUpdates, initialAlerts, initialDecisions, initialNotifications, networkAgents, networkEdges, units, volatilityByRange } from './mockData.js'

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
  return simulateNetworkLatency(initialDecisions)
}

export async function fetchSystemNotifications() {
  const now = Date.now()
  return simulateNetworkLatency(initialNotifications.map((notification) => ({
    ...notification,
    createdAt: new Date(now - notification.ageMinutes * 60 * 1000).toISOString(),
  })))
}
