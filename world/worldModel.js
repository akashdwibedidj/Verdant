const pool = require('../db/client');

// Shared world model — loaded once from DB, agents read from this
class WorldModel {
  constructor() {
    this.suppliers = [];
    this.ports = [];
    this.routes = [];
    this.skus = [];
    this.loaded = false;
  }

  async load() {
    const [suppliers, ports, routes, skus] = await Promise.all([
      pool.query('SELECT * FROM suppliers WHERE approved = true'),
      pool.query('SELECT * FROM ports'),
      pool.query('SELECT * FROM routes'),
      pool.query('SELECT * FROM skus')
    ]);
    this.suppliers = suppliers.rows;
    this.ports = ports.rows;
    this.routes = routes.rows;
    this.skus = skus.rows;
    this.loaded = true;
    console.log(`[WorldModel] Loaded: ${this.suppliers.length} suppliers, ${this.ports.length} ports, ${this.skus.length} SKUs`);
  }

  async updatePortStatus(portName, status) {
    await pool.query('UPDATE ports SET status = $1 WHERE name = $2', [status, portName]);
    const port = this.ports.find(p => p.name === portName);
    if (port) port.status = status;
  }

  async updateRouteRisk(routeId, multiplier) {
    await pool.query('UPDATE routes SET risk_multiplier = $1 WHERE id = $2', [multiplier, routeId]);
    const route = this.routes.find(r => r.id === routeId);
    if (route) route.risk_multiplier = multiplier;
  }

  snapshot() {
    return {
      suppliers: this.suppliers,
      ports: this.ports,
      routes: this.routes,
      skus: this.skus
    };
  }
}

module.exports = new WorldModel(); // singleton
