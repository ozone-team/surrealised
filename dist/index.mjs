// src/index.ts
import { Surreal } from "surrealdb.js";
var SurrealClient = class {
  HOST;
  USER;
  PASSWORD;
  NAMESPACE;
  DATABASE;
  client;
  isDebug = false;
  constructor(options) {
    var _a, _b, _c, _d, _e;
    this.HOST = ((_a = options.connection) == null ? void 0 : _a.host) || process.env.SURREAL_DB_HOST;
    this.USER = ((_b = options.connection) == null ? void 0 : _b.user) || process.env.SURREAL_DB_USER;
    this.PASSWORD = ((_c = options.connection) == null ? void 0 : _c.password) || process.env.SURREAL_DB_PASSWORD;
    this.NAMESPACE = ((_d = options.connection) == null ? void 0 : _d.namespace) || process.env.SURREAL_DB_NAMESPACE;
    this.DATABASE = ((_e = options.connection) == null ? void 0 : _e.database) || process.env.SURREAL_DB_DATABASE;
    this.isDebug = options.debug || false;
    if (this.isDebug) {
      console.debug("[SurrealClient] Debug mode enabled");
      console.debug("[SurrealClient] Connection", {
        host: this.HOST,
        user: this.USER,
        password: this.PASSWORD,
        namespace: this.NAMESPACE,
        database: this.DATABASE
      });
    }
    this.client = new Surreal({
      onConnect: () => {
        if (this.isDebug) {
          console.debug("[SurrealClient] Connected to Surreal!");
        }
      },
      onClose: () => {
        if (this.isDebug) {
          console.debug("[SurrealClient] Disconnected from Surreal!");
        }
      },
      onError: () => {
        if (this.isDebug) {
          console.error("[SurrealClient] An error occurred");
        }
      }
    });
  }
  async init() {
    await this.client.connect(`${this.HOST}`, {
      auth: {
        username: this.USER,
        password: this.PASSWORD
      },
      namespace: this.NAMESPACE,
      database: this.DATABASE
    });
    await this.client.use({
      namespace: this.NAMESPACE,
      database: this.DATABASE
    });
  }
  debugMessage(...message) {
    if (!this.isDebug)
      return;
    console.debug(message);
  }
  /**
   * Execute a query and return the first row.
   * If there are multiple queries, it will return the first row of the last query.
   * @param query
   * @param params
   */
  async queryOne(query, params) {
    await this.init();
    this.debugMessage("[SurrealClient.queryOne()] Executing query", query, "\n", params);
    const qResult = await this.client.query(query, params);
    if (!qResult.length) {
      return void 0;
    }
    return qResult[qResult.length - 1].result[0];
  }
  /**
   * Execute a query and return many rows.
   * If there are multiple queries, it will return the results of the last query.
   * @param quest
   * @param params
   */
  async queryMany(quest, params) {
    await this.init();
    this.debugMessage("[SurrealClient.queryMany()] Executing query", quest, "\n", params);
    const qResult = await this.client.query(quest, params);
    if (!qResult.length) {
      return void 0;
    }
    return qResult[qResult.length - 1].result;
  }
  /**
   * Create a key with value
   * @param key
   * @param value
   */
  async create(key, value) {
    await this.init();
    this.debugMessage("[SurrealClient.create()] Creating key", key, "with value", value);
    let [result] = await this.client.create(key, value);
    return result;
  }
  /**
   * Fetch a key
   * @param key
   */
  async fetch(key) {
    await this.init();
    this.debugMessage("[SurrealClient.fetch()] Fetching key", key);
    let [result] = await this.client.select(key);
    return result;
  }
  /**
   * Fetch many keys from {table}
   * @param {string} table
   */
  async fetchMany(table) {
    await this.init();
    this.debugMessage("[SurrealClient.fetchMany()] Fetching many keys from table", table);
    let [result] = await this.client.select(table);
    return result;
  }
  /**
   * Update a key, will merge if it exists, otherwise will create
   * @param key
   * @param value
   */
  async update(key, value) {
    await this.init();
    this.debugMessage("[SurrealClient.update()] Updating key", key, "with value", value);
    let [result] = await this.client.merge(key, value);
    return result;
  }
  /**
   * Delete a key
   * @param key
   */
  async delete(key) {
    await this.init();
    this.debugMessage("[SurrealClient.delete()] Deleting key", key);
    let [result] = await this.client.delete(key);
    return result;
  }
  /**
   * Execute a raw query, return the native SurrealDB Library Result
   * @param query
   * @param params
   */
  async execute(query, params) {
    await this.init();
    this.debugMessage("[SurrealClient.execute()] Executing query", query, "\n", params);
    return await this.client.query(query, params);
  }
};
export {
  SurrealClient as default
};
//# sourceMappingURL=index.mjs.map