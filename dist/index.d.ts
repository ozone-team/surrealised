import * as surrealdb_js_script_types from 'surrealdb.js/script/types';

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
    private client;
    private isDebug;
    constructor(options: SurrealClientOptions);
    init(): Promise<void>;
    private debugMessage;
    /**
     * Execute a query and return the first row.
     * If there are multiple queries, it will return the first row of the last query.
     * @param query
     * @param params
     */
    queryOne<T = any>(query: string, params?: any): Promise<T>;
    /**
     * Execute a query and return many rows.
     * If there are multiple queries, it will return the results of the last query.
     * @param quest
     * @param params
     */
    queryMany(quest: string, params?: any): Promise<any>;
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
    fetch(key: string): Promise<any>;
    /**
     * Fetch many keys from {table}
     * @param {string} table
     */
    fetchMany(table: string): Promise<any>;
    /**
     * Update a key, will merge if it exists, otherwise will create
     * @param key
     * @param value
     */
    update(key: string, value: any): Promise<any>;
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
    execute(query: string, params?: any): Promise<surrealdb_js_script_types.RawQueryResult[]>;
}

export { SurrealClient as default };
