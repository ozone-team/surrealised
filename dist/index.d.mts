import * as surrealdb_js_script_types from 'surrealdb.js/script/types';
import { LiveQueryResponse } from 'surrealdb.js/script/types';
import { Surreal } from 'surrealdb.js';

interface SurrealClientOptions {
    debug?: boolean;
    connection?: {
        host?: string;
        user?: string;
        password?: string;
        namespace?: string;
        database?: string;
    };
}
declare class SurrealClient {
    private HOST;
    private USER;
    private PASSWORD;
    private NAMESPACE;
    private DATABASE;
    private isDebug;
    private client;
    private isConnected;
    constructor(options?: SurrealClientOptions);
    init(): Promise<Surreal>;
    private debugMessage;
    connect(): Promise<void>;
    /**
     * Execute a query and return the first row.
     * If there are multiple queries, it will return the first row of the last query.
     * @param query
     * @param params
     */
    queryOne<T = any>(query: string, params?: any): Promise<any>;
    /**
     * Execute a query and return many rows.
     * If there are multiple queries, it will return the results of the last query.
     * @param quest
     * @param params
     */
    queryMany<T = any>(quest: string, params?: any): Promise<T[]>;
    /**
     * Create a key with value
     * @param key
     * @param value
     */
    create<T = any>(key: string, value: any): Promise<T>;
    /**
     * Fetch a key
     * @param key
     */
    fetch<T = any>(key: string): Promise<T>;
    /**
     * Fetch many keys from {table}
     * @param {string} table
     */
    fetchMany<T = any>(table: string): Promise<T[]>;
    /**
     * Update a key, will merge if it exists, otherwise will create
     * @param key
     * @param value
     */
    update<T = any>(key: string, value: any): Promise<T>;
    /**
     * Delete a key
     * @param key
     */
    delete(key: string): Promise<any>;
    /**
     * Execute a raw query, return the native SurrealDB Library Result
     * @param query
     * @param params
     */
    execute(query: string, params?: any): Promise<void>;
    /**
     * Relate two records together using a join table
     * @param table - The join table name (i.e. "visited")
     * @param from - The key of the record to relate from (i.e. "user:1")
     * @param to - The key of the record to relate to (i.e. "office:sydney")
     * @param value - The value to store in the join table (i.e. "{visitedAt: '2021-01-01', ...}")
     */
    relate(table: string, from: string, to: string, value?: Record<string, any>): Promise<void>;
    begin(): Promise<void>;
    commit(): Promise<surrealdb_js_script_types.RawQueryResult[]>;
    close(): Promise<void>;
    live(table: string, callback: (data: LiveQueryResponse<Record<string, any>>) => any): Promise<void>;
}

export { SurrealClient as default };
