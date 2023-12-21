import {Surreal} from "surrealdb.js";

interface SurrealClientOptions {
    debug?:boolean;
    connection?: {
        host?:string;
        user?:string;
        password?:string;
        namespace?:string;
        database?:string;
    }
}

export default class SurrealClient {

    private HOST:string;
    private USER:string;
    private PASSWORD:string;
    private NAMESPACE:string;
    private DATABASE:string;

    private isDebug:boolean = false;

    private client:Surreal;

    private isConnected:boolean = false;

    constructor(options?:SurrealClientOptions) {

        this.HOST = options?.connection?.host || process.env.SURREAL_DB_HOST;
        this.USER = options?.connection?.user || process.env.SURREAL_DB_USER;
        this.PASSWORD = options?.connection?.password || process.env.SURREAL_DB_PASSWORD;
        this.NAMESPACE = options?.connection?.namespace || process.env.SURREAL_DB_NAMESPACE;
        this.DATABASE = options?.connection?.database || process.env.SURREAL_DB_DATABASE;

        this.isDebug = options?.debug || process.env.SURREAL_DB_DEBUG == "true";

        if(this.isDebug){
            console.debug("[SurrealClient] Debug mode enabled");
            console.debug("[SurrealClient] Connection", {
                host: this.HOST,
                user: this.USER,
                password: this.PASSWORD,
                namespace: this.NAMESPACE,
                database: this.DATABASE
            })
        }
    }

    async init(){

        if(this.isConnected && this.client) return this.client;

        this.client = new Surreal({
            onConnect: () => {
                if(this.isDebug){
                    console.debug("[SurrealClient] Connected to Surreal!")
                }
                this.isConnected = true;
            },
            onClose: () => {
                if(this.isDebug){
                    console.debug("[SurrealClient] Disconnected from Surreal!")
                }
                this.isConnected = false;
            },
            onError: () => {
                if(this.isDebug){
                    console.error("[SurrealClient] An error occurred");
                }
            }
        });
        
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
        })

        return this.client;
        
    }

    private debugMessage(message?:any, ...optionalParams: any[]){
        if(!this.isDebug) return;
        console.debug(message, ...optionalParams);
    }


    /**
     * Execute a query and return the first row.
     * If there are multiple queries, it will return the first row of the last query.
     * @param query
     * @param params
     */
    async queryOne<T = any>(query:string, params?:any){
        this.debugMessage("[SurrealClient.queryOne()] Executing query", query, "\n", params);
        let client = await this.init();

        const qResult = await client.query<[any, any]>(query, params);
        await client.close();
        this.debugMessage("[SurrealClient.queryOne()] QueryOne result", qResult);

        if(!qResult.length){
            return undefined;
        }

        const result = qResult[qResult.length - 1]

        if(!Array.isArray(result)){
            return result
        }


        if(!result.length){
            return undefined;
        }

        return result[0] as T;
    }

    /**
     * Execute a query and return many rows.
     * If there are multiple queries, it will return the results of the last query.
     * @param quest
     * @param params
     */
    async queryMany<T = any>(quest:string, params?:any){
        let client = await this.init();

        this.debugMessage("[SurrealClient.queryMany()] Executing query", quest, "\n", params);

        const qResult = await client.query<[any,any]>(quest, params);
        await client.close();
        this.debugMessage("[SurrealClient.queryMany()] QueryMany results", qResult);

        if(!qResult.length){
            return undefined;
        }

        return qResult[qResult.length - 1] as T[];
    }

    /**
     * Create a key with value
     * @param key
     * @param value
     */
    async create<T = any>(key:string, value:any){
        let client = await this.init();
        this.debugMessage("[SurrealClient.create()] Creating key", key, "with value", value);
        let [result] = await client.create<any>(key, value);
        this.debugMessage("[SurrealClient.create()] Create result", result);
        await client.close();
        return result as T;
    }

    /**
     * Fetch a key
     * @param key
     */
    async fetch<T = any>(key:string){
        let client = await this.init();
        this.debugMessage("[SurrealClient.fetch()] Fetching key", key);
        let [result] = await client.select<any>(key);
        this.debugMessage("[SurrealClient.fetch()] Fetch result", result);
        await client.close();
        return result as T;
    }

    /**
     * Fetch many keys from {table}
     * @param {string} table
     */
    async fetchMany<T = any>(table:string){
        let client = await this.init();
        this.debugMessage("[SurrealClient.fetchMany()] Fetching many keys from table", table);
        var results = await this.queryMany<T>(`SELECT * FROM ${table}`)
        await client.close();
        this.debugMessage("[SurrealClient.fetchMany()] FetchMany results", results);
        return results as T[];
    }

    /**
     * Update a key, will merge if it exists, otherwise will create
     * @param key
     * @param value
     */
    async update<T = any>(key:string, value:any){
        this.debugMessage("[SurrealClient.update()] Updating key", key, "with value", value);
        let client = await this.init();
        let [result] = await client.merge<any>(key, value);
        this.debugMessage("[SurrealClient.update()] Update result", result);
        await client.close();
        return result as T;
    }

    /**
     * Delete a key
     * @param key
     */
    async delete(key:string){
        this.debugMessage("[SurrealClient.delete()] Deleting key", key);
        let client = await this.init();
        let [result] = await client.delete<any>(key);
        this.debugMessage("[SurrealClient.delete()] Delete result", result);
        await client.close();
        return result;
    }

    /**
     * Execute a raw query, return the native SurrealDB Library Result
     * @param query
     * @param params
     */
    async execute(query:string, params?:any){
        this.debugMessage("[SurrealClient.execute()] Executing query", query, "\n", params);
        let client = await this.init();
        let result = await client.query(query, params);
        this.debugMessage("[SurrealClient.execute()] Query result", result);
        await client.close();
    }


}

