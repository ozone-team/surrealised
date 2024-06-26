var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  SurrealQueryBuilder: () => SurrealQueryBuilder2,
  default: () => SurrealClient
});
module.exports = __toCommonJS(src_exports);
var import_surrealdb = require("surrealdb.js");

// src/SurrealQueryBuilder.ts
var SurrealQueryBuilder = class {
  table;
  fields = [];
  omitFields = [];
  whereClauses = [];
  currentClauseGroup = [];
  group_all = false;
  orderByFields = [];
  isInWhereClause = false;
  grouping = false;
  fetchItems = [];
  splitItems = [];
  groupByItems = [];
  withIndex = [];
  offsetClause = 0;
  limitClause = void 0;
  variables = {};
  constructor(table) {
    this.table = table;
  }
  /**
   * Select fields to return
   * https://docs.surrealdb.com/docs/surrealql/statements/select#basic-usage
   * @param fields
   */
  select(...fields) {
    this.fields = fields;
    return this;
  }
  /**
   * Start a condition, MUST be present before any AND or OR statements
   * https://docs.surrealdb.com/docs/surrealql/statements/select#filter-queries-using-the-where-clause
   * @param condition
   */
  where(condition) {
    if (this.isInWhereClause) {
      this.endGroup();
    }
    this.currentClauseGroup.push(condition);
    this.isInWhereClause = true;
    return this;
  }
  /**
   * Add conditions to the query
   * https://docs.surrealdb.com/docs/surrealql/statements/select#connect-targets-using-the-fetch-clause
   * @param condition
   */
  and(condition) {
    console.debug("AND", condition);
    return this.where(condition);
  }
  /**
   * Or what?
   * https://docs.surrealdb.com/docs/surrealql/statements/select#connect-targets-using-the-fetch-clause
   * @param condition
   */
  or(condition) {
    if (!this.isInWhereClause) {
      throw new Error("You must call where() before calling or()");
    }
    this.currentClauseGroup.push(condition);
    return this;
  }
  endGroup() {
    if (this.currentClauseGroup.length > 0) {
      const groupedConditions = this.currentClauseGroup.join(" OR ");
      this.whereClauses.push(`(${groupedConditions})`);
      this.grouping = false;
      this.currentClauseGroup = [];
    }
    return this;
  }
  /**
   * Specify record joins to fetch the details of
   * https://docs.surrealdb.com/docs/surrealql/statements/select#connect-targets-using-the-fetch-clause
   * @param fields
   */
  fetch(...fields) {
    this.fetchItems = fields;
    return this;
  }
  /**
   * Offset the results by a number
   * https://docs.surrealdb.com/docs/surrealql/statements/select#the-limit-clause
   * @param n
   */
  offset(n) {
    this.offsetClause = n;
    return this;
  }
  /**
   * Limit the number of results
   * https://docs.surrealdb.com/docs/surrealql/statements/select#the-limit-clause
   * @param n - the number to limit it to
   */
  limit(n) {
    this.limitClause = n;
    return this;
  }
  /**
   * Group the results by a field or set of fields
   * https://docs.surrealdb.com/docs/surrealql/statements/select#the-group-by-and-group-all-clause
   * @param fields
   */
  groupBy(...fields) {
    this.groupByItems = fields;
    return this;
  }
  /**
   * Group all results
   * https://docs.surrealdb.com/docs/surrealql/statements/select#the-group-by-and-group-all-clause
   */
  groupAll() {
    this.group_all = true;
    return this;
  }
  /**
   * Order the results by a set of fields
   * https://docs.surrealdb.com/docs/surrealql/statements/select#sort-records-using-the-order-by-clause
   * @param fields
   */
  orderBy(...fields) {
    this.orderByFields = fields;
    return this;
  }
  /**
   * Split the query results via a field
   * https://docs.surrealdb.com/docs/surrealql/statements/select#the-split-clause
   * @param fields
   */
  split(...fields) {
    this.splitItems = fields;
    return this;
  }
  /**
   * Add indexes to the query
   * https://docs.surrealdb.com/docs/surrealql/statements/select#the-with-clause
   * @param indexes
   */
  index(...indexes) {
    this.withIndex = indexes;
    return this;
  }
  /**
   * Omit fields from the result, these are still used in conditionals (I think?)
   * @param fields
   */
  omit(...fields) {
    this.omitFields = fields;
    return this;
  }
  assertClauseGroup() {
    if (this.isInWhereClause) {
      this.endGroup();
    }
    console.log(this.whereClauses);
  }
  /**
   * Construct the query string
   */
  build(ignore_pagination, ignore_filters) {
    this.assertClauseGroup();
    let query = `SELECT ${this.fields.length > 0 ? this.fields.join(", ") : "*"}`;
    if (this.omitFields.length) {
      query += ` OMIT ${this.omitFields.join(", ")}`;
    }
    query += ` FROM ${this.table}`;
    if (this.withIndex.length) {
      query += `WITH INDEX ${this.withIndex.join(", ")}`;
    }
    if (this.whereClauses.length > 0 && !ignore_filters) {
      let hasORClauses = this.whereClauses.some((c) => c.includes(" OR "));
      if (!hasORClauses) {
        this.whereClauses = this.whereClauses.map((c) => c.replace(/\(/g, "").replace(/\)/g, ""));
      }
      query += ` WHERE ${this.whereClauses.join(" AND ")}`;
    }
    if (this.splitItems.length > 0) {
      query += ` SPLIT ${this.splitItems.join(", ")}`;
    }
    if (this.group_all) {
      query += ` GROUP ALL`;
    } else if (this.groupByItems.length > 0) {
      query += ` GROUP BY ${this.groupByItems.join(", ")}`;
    }
    if (this.orderByFields.length > 0) {
      query += ` ORDER BY ${this.orderByFields.map((f) => {
        let key = Object.keys(f)[0];
        let value = f[key];
        return `${key} ${value}`;
      }).join(", ")}`;
    }
    if (this.limitClause && !ignore_pagination) {
      query += ` LIMIT ${this.limitClause}`;
    }
    if (this.offsetClause && !ignore_pagination) {
      query += ` START ${this.offsetClause}`;
    }
    if (this.fetchItems.length > 0) {
      query += ` FETCH ${this.fetchItems.join(", ")}`;
    }
    return query;
  }
  /**
   * Execute the query and return a single row (or none)
   * @param params
   */
  async queryOne(params) {
    let q = this.build();
    let variables = {
      ...this.variables,
      ...params
    };
    const surreal = new SurrealClient();
    return await surreal.queryOne(q, variables);
  }
  /**
   * Execute the query and return many rows
   * @param params
   */
  async queryMany(params) {
    let q = this.build();
    const surreal = new SurrealClient();
    let variables = {
      ...this.variables,
      ...params
    };
    return await surreal.queryMany(q, variables);
  }
  /**
   * Add a variable to the query for execution.
   * @param key
   * @param value
   */
  addVariable(key, value) {
    this.variables[key] = value;
    return this;
  }
  /**
   * Remove a variable from the query
   * @param key
   */
  removeVariable(key) {
    delete this.variables[key];
    return this;
  }
  /**
   * Clear all variables from the query
   */
  clearVariables() {
    this.variables = {};
    return this;
  }
  /**
   * Get the total number of rows that would be returned by the query, by default this ignore pagination
   * @param ignoreFilter - ignore WHERE clauses
   */
  async total(ignoreFilter = false) {
    let query = this.build(true, ignoreFilter);
    const surreal = new SurrealClient();
    let result = await surreal.queryMany(query, this.variables);
    return result.length;
  }
};
var SurrealQueryBuilder_default = SurrealQueryBuilder;

// src/index.ts
var SurrealClient = class {
  HOST;
  USER;
  PASSWORD;
  NAMESPACE;
  DATABASE;
  isDebug = false;
  client = void 0;
  isConnected = false;
  constructor(options) {
    var _a, _b, _c, _d, _e;
    this.HOST = ((_a = options == null ? void 0 : options.connection) == null ? void 0 : _a.host) || process.env.SURREAL_DB_HOST || process.env.NEXT_PUBLIC_SURREAL_DB_HOST;
    this.USER = ((_b = options == null ? void 0 : options.connection) == null ? void 0 : _b.user) || process.env.SURREAL_DB_USER || process.env.NEXT_PUBLIC_SURREAL_DB_USER;
    this.PASSWORD = ((_c = options == null ? void 0 : options.connection) == null ? void 0 : _c.password) || process.env.SURREAL_DB_PASSWORD || process.env.NEXT_PUBLIC_SURREAL_DB_PASSWORD;
    this.NAMESPACE = ((_d = options == null ? void 0 : options.connection) == null ? void 0 : _d.namespace) || process.env.SURREAL_DB_NAMESPACE || process.env.NEXT_PUBLIC_SURREAL_DB_NAMESPACE;
    this.DATABASE = ((_e = options == null ? void 0 : options.connection) == null ? void 0 : _e.database) || process.env.SURREAL_DB_DATABASE || process.env.NEXT_PUBLIC_SURREAL_DB_DATABASE;
    this.isDebug = (options == null ? void 0 : options.debug) || process.env.SURREAL_DB_DEBUG == "true" || process.env.NEXT_PUBLIC_SURREAL_DB_DEBUG == "true";
    if (this.isDebug) {
      console.debug("[SurrealClient] Version: 1.1.5");
      console.debug("[SurrealClient] Debug mode enabled");
      console.debug("[SurrealClient] Connection", {
        host: this.HOST,
        user: this.USER,
        password: this.PASSWORD,
        namespace: this.NAMESPACE,
        database: this.DATABASE
      });
    }
    this.client = new import_surrealdb.Surreal();
    this.debugMessage("[SurrealClient] Client created");
  }
  async init() {
    try {
      await this.connect();
      return this.client;
    } catch (e) {
      console.error("[SurrealClient.init()] Error connecting to SurrealDB", e);
      throw e;
    }
  }
  debugMessage(message, ...optionalParams) {
    if (!this.isDebug)
      return;
    console.debug(message, ...optionalParams);
  }
  async connect() {
    let opts = {
      auth: {
        username: this.USER,
        password: this.PASSWORD
      },
      namespace: this.NAMESPACE,
      database: this.DATABASE
    };
    this.debugMessage("[SurrealClient.init()] Connecting to SurrealDB\n", { ...opts, host: this.HOST });
    await this.client.connect(this.HOST, opts);
    this.debugMessage("[SurrealClient.init()] Connected to SurrealDB");
    await this.client.use({
      namespace: this.NAMESPACE,
      database: this.DATABASE
    });
  }
  /**
   * Execute a query and return the first row.
   * If there are multiple queries, it will return the first row of the last query.
   * @param query
   * @param params
   */
  async queryOne(query, params) {
    this.debugMessage("[SurrealClient.queryOne()] Executing query", query, "\n", params);
    let client = await this.init();
    const qResult = await client.query(query, params);
    await client.close();
    this.debugMessage("[SurrealClient.queryOne()] QueryOne result", qResult);
    if (!qResult.length) {
      return void 0;
    }
    const result = qResult[qResult.length - 1];
    if (!Array.isArray(result)) {
      return result;
    }
    if (!result.length) {
      return void 0;
    }
    return result[0];
  }
  /**
   * Execute a query and return many rows.
   * If there are multiple queries, it will return the results of the last query.
   * @param quest
   * @param params
   */
  async queryMany(quest, params) {
    let client = await this.init();
    this.debugMessage("[SurrealClient.queryMany()] Executing query", quest, "\n", params);
    const qResult = await client.query(quest, params);
    await client.close();
    this.debugMessage("[SurrealClient.queryMany()] QueryMany results", qResult);
    if (!qResult.length) {
      return void 0;
    }
    return qResult[qResult.length - 1];
  }
  /**
   * Create a key with value
   * @param key
   * @param value
   */
  async create(key, value) {
    let client = await this.init();
    this.debugMessage("[SurrealClient.create()] Creating key", key, "with value", value);
    let [result] = await client.create(key, value);
    this.debugMessage("[SurrealClient.create()] Create result", result);
    await client.close();
    return result;
  }
  /**
   * Fetch a key
   * @param key
   */
  async fetch(key) {
    let client = await this.init();
    this.debugMessage("[SurrealClient.fetch()] Fetching key", key);
    let [result] = await client.select(key);
    this.debugMessage("[SurrealClient.fetch()] Fetch result", result);
    await client.close();
    return result;
  }
  /**
   * Fetch many keys from {table}
   * @param {string} table
   */
  async fetchMany(table) {
    let client = await this.init();
    this.debugMessage("[SurrealClient.fetchMany()] Fetching many keys from table", table);
    var results = await this.queryMany(`SELECT * FROM ${table}`);
    await client.close();
    this.debugMessage("[SurrealClient.fetchMany()] FetchMany results", results);
    return results;
  }
  /**
   * Update a key, will merge if it exists, otherwise will create
   * @param key
   * @param value
   */
  async update(key, value) {
    this.debugMessage("[SurrealClient.update()] Updating key", key, "with value", value);
    let client = await this.init();
    let [result] = await client.merge(key, value);
    this.debugMessage("[SurrealClient.update()] Update result", result);
    await client.close();
    return result;
  }
  /**
   * Delete a key
   * @param key
   */
  async delete(key) {
    this.debugMessage("[SurrealClient.delete()] Deleting key", key);
    let client = await this.init();
    let [result] = await client.delete(key);
    this.debugMessage("[SurrealClient.delete()] Delete result", result);
    await client.close();
    return result;
  }
  /**
   * Execute a raw query, return the native SurrealDB Library Result
   * @param query
   * @param params
   */
  async execute(query, params) {
    this.debugMessage("[SurrealClient.execute()] Executing query", query, "\n", params);
    let client = await this.init();
    let result = await client.query(query, params);
    this.debugMessage("[SurrealClient.execute()] Query result", result);
  }
  /**
   * Relate two records together using a join table
   * @param table - The join table name (i.e. "visited")
   * @param from - The key of the record to relate from (i.e. "user:1")
   * @param to - The key of the record to relate to (i.e. "office:sydney")
   * @param value - The value to store in the join table (i.e. "{visitedAt: '2021-01-01', ...}")
   */
  async relate(table, from, to, value) {
    this.debugMessage("[SurrealClient.relate()] Relating", from, "to", to, "with value", value);
    let qRelate = `RELATE ${from}->${table}->${to}`;
    if (value) {
      qRelate = `RELATE ${from}->${table}->${to} CONTENT $content`;
    }
    let result = await this.execute(qRelate, { content: value });
    this.debugMessage("[SurrealClient.relate()] Relate result", result);
  }
  async begin() {
    this.debugMessage("[SurrealClient.begin()] Beginning transaction");
    let client = await this.init();
    let result = await client.query(`BEGIN TRANSACTION;`);
    this.debugMessage("[SurrealClient.begin()] Begin result", result);
  }
  async commit() {
    this.debugMessage("[SurrealClient.commit()] Committing transaction");
    let client = await this.init();
    let result = await client.query(`COMMIT TRANSACTION;`);
    this.debugMessage("[SurrealClient.commit()] Commit result", result);
    return result;
  }
  async close() {
    this.debugMessage("[SurrealClient.close()] Closing connection");
    let client = await this.init();
    await client.close();
    this.debugMessage("[SurrealClient.close()] Connection closed");
  }
  async live(table, callback) {
    this.debugMessage("[SurrealClient.live()] Checking connection");
    let client = await this.init();
    await client.live(table, (d) => callback(d));
  }
};
var SurrealQueryBuilder2 = SurrealQueryBuilder_default;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SurrealQueryBuilder
});
//# sourceMappingURL=index.js.map