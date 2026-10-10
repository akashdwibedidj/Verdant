import { FiActivity, FiCompass, FiGlobe, FiLayers, FiShield, FiZap } from 'react-icons/fi'
import { HiOutlineCube, HiOutlineCurrencyDollar, HiOutlineSignal } from 'react-icons/hi2'

export const currentUser = {
  name: 'Alex Morgan',
  initials: 'AM',
  email: 'alex.morgan@northstar.example',
  title: 'Supply chain lead',
  team: 'Global Operations',
  accessLevel: 'Workspace administrator',
  workspace: 'Northstar Group',
  timeZone: 'Asia/Kolkata (UTC+05:30)',
  accountStatus: 'Active',
  permissions: ['Approve agent recommendations', 'Manage network units', 'Review decision logs'],
}

export const initialNotifications = [
  { id: 'ntf-port-congestion', type: 'critical', title: 'Port congestion alert', detail: 'Singapore berth wait is up 6.4 hours; 14 shipments may be affected.', section: 'Command Center', ageMinutes: 2 },
  { id: 'ntf-agent-reroute', type: 'decision', title: 'Agent recommendation ready', detail: 'Route Optimizer proposed alternate routing for 8 shipments.', section: 'Decision Logs', ageMinutes: 7 },
  { id: 'ntf-stockout-risk', type: 'warning', title: 'Stockout risk detected', detail: 'Lithium cell inventory at Rotterdam DC-04 may breach safety stock in 5 days.', section: 'Global Map', ageMinutes: 18 },
  { id: 'ntf-market-copper', type: 'market', title: 'Market signal: copper futures', detail: 'Commodity coverage flagged a recent upward move in copper prices.', section: 'Market Signals', ageMinutes: 36 },
]

export const shipments = [
  { name: 'Pacific corridor', detail: 'Shanghai → Los Angeles', value: '84%', tone: 'good', initials: 'PC' },
  { name: 'Suez passage', detail: 'Singapore → Rotterdam', value: '61%', tone: 'watch', initials: 'SP' },
  { name: 'Northern route', detail: 'Hamburg → New York', value: '92%', tone: 'good', initials: 'NR' },
]

export const signals = [
  { category: 'COMMODITY', title: 'Copper futures climbing', detail: 'Demand acceleration · Chile', time: '8 min ago', change: '+4.8%', color: 'amber', icon: '↗' },
  { category: 'WEATHER', title: 'Typhoon watch expanded', detail: 'Port disruption risk · South China Sea', time: '24 min ago', change: 'Elevated', color: 'blue', icon: '◌' },
  { category: 'DEMAND', title: 'EV component orders rising', detail: 'Above seasonal trend · Germany', time: '41 min ago', change: '+12.2%', color: 'green', icon: '↗' },
]

export const agents = [
  { name: 'Route Optimizer', role: 'Logistics · Global', state: 'Optimizing', color: 'violet', icon: FiCompass, metric: '18 routes' },
  { name: 'Demand Forecaster', role: 'Planning · APAC', state: 'Learning', color: 'blue', icon: FiActivity, metric: '94.2% acc.' },
  { name: 'Risk Sentinel', role: 'Risk · Global', state: 'Monitoring', color: 'orange', icon: FiShield, metric: '24/7' },
]

export const initialAlerts = [
  { id: 1, type: 'critical', source: 'PORT DISRUPTION', title: 'Port congestion detected at Port of Singapore', detail: 'Berth wait time is up 6.4 hours, affecting 14 inbound shipments.', location: 'Singapore', time: '2 min ago', action: 'Route Optimizer rerouting 8 shipments' },
  { id: 2, type: 'warning', source: 'INVENTORY RISK', title: 'Low stock threshold projected for lithium cells', detail: 'Current demand trend puts DC-04 below safety stock in 5 days.', location: 'Rotterdam DC', time: '8 min ago', action: 'Demand Forecaster assessing alternatives' },
  { id: 3, type: 'info', source: 'MARKET MOVEMENT', title: 'Ocean freight spot rates rose across Asia–EU lane', detail: 'Rates increased 7.2% since yesterday amid capacity tightening.', location: 'Asia–Europe', time: '16 min ago', action: 'Procurement Sentinel monitoring' },
  { id: 4, type: 'warning', source: 'WEATHER ALERT', title: 'Severe weather may delay Gulf Coast deliveries', detail: 'NOAA advisory indicates a 36-hour disruption window.', location: 'Houston, US', time: '29 min ago', action: 'Risk Sentinel tracking conditions' },
]

export const alertUpdates = [
  { type: 'info', source: 'SUPPLIER UPDATE', title: 'Tier 1 supplier confirmed production recovery', detail: 'Output is back to 96% capacity after scheduled maintenance.', location: 'Nagoya, Japan', action: 'Supplier Monitor verified recovery' },
  { type: 'warning', source: 'DEMAND SIGNAL', title: 'Demand spike flagged for cold-chain packaging', detail: 'Orders are trending 18% above the weekly forecast.', location: 'Western Europe', action: 'Demand Forecaster recalibrating' },
  { type: 'critical', source: 'TRANSIT DELAY', title: 'Rail connection missed at Duisburg terminal', detail: 'Six containers may miss their onward departure window.', location: 'Duisburg, Germany', action: 'Route Optimizer evaluating options' },
]

export const volatilityByRange = {
  '7D': { labels: ['04 Oct', '05 Oct', '06 Oct', '07 Oct', '08 Oct', '09 Oct', '10 Oct'], supply: [75, 78, 73, 82, 79, 86, 88], market: [49, 58, 53, 68, 61, 72, 66] },
  '14D': { labels: ['27 Sep', '29 Sep', '01 Oct', '03 Oct', '05 Oct', '07 Oct', '10 Oct'], supply: [68, 72, 69, 78, 75, 82, 88], market: [58, 64, 52, 70, 57, 73, 66] },
  '30D': { labels: ['11 Sep', '16 Sep', '21 Sep', '26 Sep', '01 Oct', '05 Oct', '10 Oct'], supply: [62, 67, 59, 73, 70, 81, 88], market: [42, 55, 49, 67, 58, 76, 66] },
}

export const networkAgents = [
  { id: 'signals', name: 'Signal Monitor', task: 'Collects port, weather & market events', status: 'Monitoring', icon: HiOutlineSignal, tone: 'blue', x: 0, y: 13 },
  { id: 'demand', name: 'Demand Forecaster', task: 'Predicts regional demand & stockouts', status: 'Learning', icon: FiActivity, tone: 'violet', x: 28, y: 5 },
  { id: 'risk', name: 'Risk Sentinel', task: 'Scores supplier and route exposure', status: 'Monitoring', icon: FiShield, tone: 'orange', x: 28, y: 36 },
  { id: 'inventory', name: 'Inventory Guardian', task: 'Balances safety stock across hubs', status: 'Optimizing', icon: HiOutlineCube, tone: 'green', x: 28, y: 67 },
  { id: 'route', name: 'Route Optimizer', task: 'Replans lanes as conditions change', status: 'Optimizing', icon: FiCompass, tone: 'violet', x: 55, y: 19 },
  { id: 'procurement', name: 'Procurement Agent', task: 'Finds suppliers & negotiates options', status: 'Coordinating', icon: HiOutlineCurrencyDollar, tone: 'blue', x: 55, y: 57 },
  { id: 'orchestrator', name: 'Network Orchestrator', task: 'Aligns decisions across all agents', status: 'Coordinating', icon: FiLayers, tone: 'dark', x: 78, y: 38 },
]

export const networkEdges = [
  { d: 'M198 107 C220 107 230 65 252 65', delay: '0s' },
  { d: 'M198 117 C220 137 230 191 252 191', delay: '1.1s' },
  { d: 'M198 128 C220 192 230 326 252 326', delay: '2.2s' },
  { d: 'M450 66 C468 66 477 120 495 120', delay: '.4s' },
  { d: 'M450 191 C468 180 477 132 495 127', delay: '1.6s' },
  { d: 'M450 201 C468 220 477 285 495 288', delay: '.8s' },
  { d: 'M450 326 C470 315 477 296 495 292', delay: '2.5s' },
  { d: 'M693 120 C716 126 720 195 702 204', delay: '.2s' },
  { d: 'M693 288 C716 278 720 230 702 211', delay: '1.3s' },
]

export const units = [
  { id: 'shanghai', name: 'Shanghai Distribution Hub', short: 'Shanghai Hub', type: 'Distribution center', region: 'Asia Pacific', city: 'Shanghai, China', coordinates: [31.2304, 121.4737], status: 'Operational', shipments: 248, capacity: 82, inventory: '94%', risk: 'Low', manager: 'Lin Wei', lastUpdate: '2 min ago', alerts: 0 },
  { id: 'singapore', name: 'Singapore Regional Port', short: 'Singapore Port', type: 'Port & cross-dock', region: 'Asia Pacific', city: 'Singapore', coordinates: [1.2903, 103.8519], status: 'At risk', shipments: 186, capacity: 96, inventory: '78%', risk: 'Elevated', manager: 'Amara Tan', lastUpdate: 'Just now', alerts: 2 },
  { id: 'rotterdam', name: 'Rotterdam Logistics Center', short: 'Rotterdam Center', type: 'Distribution center', region: 'Europe', city: 'Rotterdam, Netherlands', coordinates: [51.9244, 4.4777], status: 'Operational', shipments: 214, capacity: 68, inventory: '91%', risk: 'Low', manager: 'Eva Jansen', lastUpdate: '4 min ago', alerts: 0 },
  { id: 'hamburg', name: 'Hamburg Supplier Cluster', short: 'Hamburg Suppliers', type: 'Supplier network', region: 'Europe', city: 'Hamburg, Germany', coordinates: [53.5511, 9.9937], status: 'Watch', shipments: 92, capacity: 74, inventory: '63%', risk: 'Moderate', manager: 'Noah Fischer', lastUpdate: '6 min ago', alerts: 1 },
  { id: 'los-angeles', name: 'Los Angeles Gateway', short: 'Los Angeles Gateway', type: 'Port & cross-dock', region: 'North America', city: 'Los Angeles, US', coordinates: [33.7405, -118.2775], status: 'Operational', shipments: 172, capacity: 71, inventory: '88%', risk: 'Low', manager: 'Jordan Lee', lastUpdate: '3 min ago', alerts: 0 },
  { id: 'chicago', name: 'Chicago Fulfillment Center', short: 'Chicago Center', type: 'Fulfillment center', region: 'North America', city: 'Chicago, US', coordinates: [41.8781, -87.6298], status: 'Watch', shipments: 131, capacity: 89, inventory: '56%', risk: 'Moderate', manager: 'Morgan Reed', lastUpdate: '5 min ago', alerts: 1 },
  { id: 'sao-paulo', name: 'São Paulo Manufacturing Unit', short: 'São Paulo Plant', type: 'Manufacturing', region: 'South America', city: 'São Paulo, Brazil', coordinates: [-23.5505, -46.6333], status: 'Operational', shipments: 83, capacity: 77, inventory: '86%', risk: 'Low', manager: 'Rafaela Costa', lastUpdate: '8 min ago', alerts: 0 },
  { id: 'mumbai', name: 'Mumbai Supplier Network', short: 'Mumbai Suppliers', type: 'Supplier network', region: 'Asia Pacific', city: 'Mumbai, India', coordinates: [19.076, 72.8777], status: 'Operational', shipments: 157, capacity: 63, inventory: '92%', risk: 'Low', manager: 'Arjun Mehta', lastUpdate: '1 min ago', alerts: 0 },
  { id: 'dubai', name: 'Dubai Consolidation Hub', short: 'Dubai Hub', type: 'Distribution center', region: 'Middle East & Africa', city: 'Dubai, UAE', coordinates: [25.2048, 55.2708], status: 'At risk', shipments: 105, capacity: 91, inventory: '71%', risk: 'Elevated', manager: 'Layla Hassan', lastUpdate: 'Just now', alerts: 2 },
]

export const initialDecisions = [
  {
    id: 'DL-2841', title: 'Reroute 8 shipments around Singapore port congestion', severity: 'High', status: 'Approved', confidence: 94, created: '4 min ago', category: 'Route optimization',
    trigger: 'Port dwell time at Singapore increased by 6.4 hours, placing 14 inbound shipments at risk of missing delivery windows.', triggerSource: 'Live alert · Port congestion · Singapore',
    agents: [{ name: 'Signal Monitor', role: 'Detected disruption', contribution: 'Flagged berth wait time exceeding the 6-hour threshold.', data: 'Port congestion feed · 10:42 UTC' }, { name: 'Risk Sentinel', role: 'Assessed exposure', contribution: 'Identified 8 shipments with a high probability of delay over 24 hours.', data: 'Shipment ETAs · Port dwell history · 10:43 UTC' }, { name: 'Route Optimizer', role: 'Proposed action', contribution: 'Compared alternate transshipment routes and selected the lowest-delay option.', data: 'Carrier schedules · Route capacity · Freight rates · 10:44 UTC' }],
    recommendation: 'Reroute 8 priority shipments through Busan and Kaohsiung. Keep 6 shipments on the current route and monitor berth conditions.', approvedBy: 'Alex Morgan', approvalTime: '10:46 UTC',
    outcome: [{ label: 'Projected delay avoided', value: '2.1 days', trend: 'good' }, { label: 'Estimated incremental cost', value: '+$18.4K', trend: 'caution' }, { label: 'Shipment risk', value: 'High → Low', trend: 'good' }],
    timeline: [{ time: '10:42 UTC', title: 'Signal detected', detail: 'Port congestion threshold crossed at Singapore.', actor: 'Signal Monitor', type: 'signal' }, { time: '10:43 UTC', title: 'Risk assessment completed', detail: '8 shipments identified as exposed.', actor: 'Risk Sentinel', type: 'agent' }, { time: '10:44 UTC', title: 'Recommendation generated', detail: 'Alternate routing proposed for priority shipments.', actor: 'Route Optimizer', type: 'agent' }, { time: '10:46 UTC', title: 'Approved by Alex Morgan', detail: 'Reroute recommendation approved for execution.', actor: 'Human approval', type: 'human' }],
  },
  {
    id: 'DL-2839', title: 'Expedite lithium cell replenishment for Rotterdam DC-04', severity: 'High', status: 'Executed', confidence: 89, created: '21 min ago', category: 'Inventory protection',
    trigger: 'Current order velocity and inbound lead times indicate DC-04 may fall below its safety stock threshold in 5 days.', triggerSource: 'Inventory risk · Rotterdam DC-04',
    agents: [{ name: 'Demand Forecaster', role: 'Forecasted demand', contribution: 'Projected a 16% demand increase over the next 7 days.', data: 'Order history · Promotion calendar · 10:18 UTC' }, { name: 'Inventory Guardian', role: 'Checked stock position', contribution: 'Calculated 5.2 days of cover against a 7-day supplier lead time.', data: 'Warehouse inventory · Purchase orders · 10:19 UTC' }, { name: 'Procurement Agent', role: 'Found supply options', contribution: 'Compared expedited supply from 3 approved suppliers.', data: 'Supplier catalog · Contract pricing · 10:20 UTC' }],
    recommendation: 'Release an expedited replenishment order for 1,200 units from the approved Lyon supplier. Maintain the existing order as buffer stock.', approvedBy: 'Alex Morgan', approvalTime: '10:24 UTC',
    outcome: [{ label: 'Projected stockout', value: 'Avoided', trend: 'good' }, { label: 'Expedite premium', value: '+$6.2K', trend: 'caution' }, { label: 'Coverage after arrival', value: '11 days', trend: 'good' }],
    timeline: [{ time: '10:18 UTC', title: 'Stockout risk detected', detail: 'Forecast showed safety stock breach in 5 days.', actor: 'Demand Forecaster', type: 'signal' }, { time: '10:20 UTC', title: 'Supplier options compared', detail: 'Three approved supply options reviewed.', actor: 'Procurement Agent', type: 'agent' }, { time: '10:24 UTC', title: 'Approved by Alex Morgan', detail: 'Expedited replenishment authorized.', actor: 'Human approval', type: 'human' }, { time: '10:27 UTC', title: 'Purchase order released', detail: 'PO sent to Lyon supplier.', actor: 'Procurement Agent', type: 'executed' }],
  },
  {
    id: 'DL-2836', title: 'Hold new copper commitments pending price review', severity: 'Medium', status: 'Review requested', confidence: 76, created: '48 min ago', category: 'Procurement strategy',
    trigger: 'Copper futures moved 4.8% above the 14-day average while two major suppliers revised near-term quotes.', triggerSource: 'Market signal · Copper price movement',
    agents: [{ name: 'Market Watcher', role: 'Tracked commodity movement', contribution: 'Detected a rapid price move and increased news coverage across copper markets.', data: 'Futures feed · News coverage · 09:51 UTC' }, { name: 'Procurement Agent', role: 'Estimated cost exposure', contribution: 'Estimated a $42K variance if the next planned purchase executes at current quotes.', data: 'Supplier quotations · Procurement plan · 09:54 UTC' }, { name: 'Risk Sentinel', role: 'Checked supply risk', contribution: 'Found no immediate shortage signal; advised review before changing contracted volumes.', data: 'Supplier performance · Inventory cover · 09:56 UTC' }],
    recommendation: 'Pause discretionary spot purchases for 24 hours. Keep contracted volumes unchanged and request updated quotes from approved suppliers.', approvedBy: null, approvalTime: null,
    outcome: [{ label: 'Potential cost exposure', value: '$42K', trend: 'caution' }, { label: 'Inventory cover', value: '23 days', trend: 'good' }, { label: 'Supply continuity risk', value: 'Low', trend: 'good' }],
    timeline: [{ time: '09:51 UTC', title: 'Commodity movement flagged', detail: 'Copper price exceeded the review threshold.', actor: 'Market Watcher', type: 'signal' }, { time: '09:54 UTC', title: 'Cost exposure estimated', detail: 'Potential $42K variance identified.', actor: 'Procurement Agent', type: 'agent' }, { time: '10:02 UTC', title: 'Review requested', detail: 'Awaiting procurement lead decision.', actor: 'Network Orchestrator', type: 'pending' }],
  },
  {
    id: 'DL-2834', title: 'Increase safety stock for Gulf Coast packaging materials', severity: 'Medium', status: 'Resolved', confidence: 82, created: '2 hr ago', category: 'Inventory planning',
    trigger: 'A severe weather advisory indicated a potential 36-hour disruption window for Houston-area deliveries.', triggerSource: 'Weather alert · Gulf Coast, US',
    agents: [{ name: 'Signal Monitor', role: 'Tracked weather advisory', contribution: 'Matched the regional alert to two supplier facilities and 4 inbound loads.', data: 'Weather advisory · Supplier locations · 08:12 UTC' }, { name: 'Inventory Guardian', role: 'Modeled coverage', contribution: 'Found 9 days of current cover, with replenishment exposure if transit is interrupted.', data: 'Inventory levels · Replenishment schedule · 08:16 UTC' }, { name: 'Risk Sentinel', role: 'Estimated disruption risk', contribution: 'Rated short-term stockout risk moderate and recommended a temporary buffer.', data: 'Weather severity · Lane history · 08:18 UTC' }],
    recommendation: 'Temporarily increase the safety stock target by 8% at Houston DC. Review the adjustment after the weather advisory expires.', approvedBy: 'Alex Morgan', approvalTime: '08:24 UTC',
    outcome: [{ label: 'Service level maintained', value: '99.1%', trend: 'good' }, { label: 'Temporary buffer used', value: '6%', trend: 'good' }, { label: 'Disruption exposure', value: 'Cleared', trend: 'good' }],
    timeline: [{ time: '08:12 UTC', title: 'Weather alert matched', detail: 'Supplier and delivery exposure found in Houston region.', actor: 'Signal Monitor', type: 'signal' }, { time: '08:24 UTC', title: 'Safety stock change approved', detail: 'Temporary 8% buffer authorized.', actor: 'Alex Morgan', type: 'human' }, { time: '12:10 UTC', title: 'Weather advisory expired', detail: 'No delivery interruption recorded.', actor: 'Risk Sentinel', type: 'executed' }, { time: '12:18 UTC', title: 'Decision resolved', detail: 'Temporary buffer returned to baseline.', actor: 'Inventory Guardian', type: 'resolved' }],
  },
]
