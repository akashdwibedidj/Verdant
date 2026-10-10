// Panama Canal drought replay data
// Source: Illustrative benchmark inspired by 2023-24 Panama Canal drought restrictions
// All positions and notices are REPLAYED DATA — not live feeds

module.exports = [
  {
    t_hours: 0,
    event: {
      type: 'transit_drop',
      port: 'Panama Canal',
      severity: 0.8,
      lead_time_penalty_days: 8,
      timestamp: '2023-11-01T00:00:00Z',
      source: 'replayed',
      label: 'Replayed Data - Inspired by 2023-24 Panama Canal drought restrictions'
    }
  },
  {
    t_hours: 12,
    event: {
      type: 'port_disruption',
      port: 'Port of Balboa',
      severity: 0.6,
      lead_time_penalty_days: 4,
      timestamp: '2023-11-01T12:00:00Z',
      source: 'replayed',
      label: 'Replayed Data - Inspired by 2023-24 Panama Canal drought restrictions'
    }
  },
  {
    t_hours: 24,
    event: {
      type: 'transit_drop',
      port: 'Panama Canal',
      severity: 0.9,
      lead_time_penalty_days: 12,
      timestamp: '2023-11-02T00:00:00Z',
      source: 'replayed',
      label: 'Replayed Data - Inspired by 2023-24 Panama Canal drought restrictions'
    }
  },
  {
    t_hours: 36,
    event: {
      type: 'weather_alert',
      port: 'Panama Canal',
      severity: 0.5,
      lead_time_penalty_days: 3,
      timestamp: '2023-11-02T12:00:00Z',
      source: 'replayed',
      label: 'Replayed Data - Inspired by 2023-24 Panama Canal drought restrictions'
    }
  },
  {
    t_hours: 48,
    event: {
      type: 'transit_drop',
      port: 'Panama Canal',
      severity: 0.85,
      lead_time_penalty_days: 10,
      timestamp: '2023-11-03T00:00:00Z',
      source: 'replayed',
      label: 'Replayed Data - Inspired by 2023-24 Panama Canal drought restrictions'
    }
  },
  {
    t_hours: 60,
    event: {
      type: 'port_disruption',
      port: 'Port of Balboa',
      severity: 0.7,
      lead_time_penalty_days: 6,
      timestamp: '2023-11-03T12:00:00Z',
      source: 'replayed',
      label: 'Replayed Data - Inspired by 2023-24 Panama Canal drought restrictions'
    }
  },
  {
    t_hours: 72,
    event: {
      type: 'transit_drop',
      port: 'Panama Canal',
      severity: 0.75,
      lead_time_penalty_days: 8,
      timestamp: '2023-11-04T00:00:00Z',
      source: 'replayed',
      label: 'Replayed Data - Inspired by 2023-24 Panama Canal drought restrictions'
    }
  }
];
