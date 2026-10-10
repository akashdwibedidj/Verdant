// Zod schemas for all inter-agent typed messages
const { z } = require('zod');

const Event = z.object({
  type: z.enum(['transit_drop', 'port_disruption', 'weather_alert', 'labor_strike']),
  port: z.string(),
  severity: z.number().min(0).max(1),
  lead_time_penalty_days: z.number(),
  timestamp: z.string(),
  source: z.literal('replayed'),
  label: z.string()
});

const Forecast = z.object({
  sku_id: z.string().uuid(),
  sku_name: z.string(),
  stockout_risk: z.number().min(0).max(1),
  hours_to_stockout: z.number(),
  confidence: z.enum(['low', 'medium', 'high'])
});

const Plan = z.object({
  action_type: z.enum(['emergency_po', 'reroute', 'buffer_stock', 'supplier_switch']),
  supplier_id: z.string().uuid().optional(),
  route_id: z.string().uuid().optional(),
  cost_estimate: z.number(),
  lead_time_days: z.number(),
  description: z.string()
});

const Action = z.object({
  plan: Plan,
  autonomy_level: z.enum(['autonomous', 'hitl_required']),
  reason: z.string()
});

const GeminiPlan = z.object({
  action_type: z.enum(['emergency_po', 'reroute', 'buffer_stock', 'supplier_switch']),
  cost_estimate: z.number(),
  lead_time_days: z.number(),
  description: z.string()
});

module.exports = { Event, Forecast, Plan, Action, GeminiPlan };
