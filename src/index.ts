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

    private client:Surreal;

    private isDebug:boolean = false;

    constructor(options:SurrealClientOptions) {

        this.HOST = options.connection?.host || process.env.SURREAL_DB_HOST;
        this.USER = options.connection?.user || process.env.SURREAL_DB_USER;
        this.PASSWORD = options.connection?.password || process.env.SURREAL_DB_PASSWORD;
        this.NAMESPACE = options.connection?.namespace || process.env.SURREAL_DB_NAMESPACE;
        this.DATABASE = options.connection?.database || process.env.SURREAL_DB_DATABASE;

        this.isDebug = options.debug || false;

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


        this.client = new Surreal({
            onConnect: () => {
                if(this.isDebug){
                    console.debug("[SurrealClient] Connected to Surreal!")
                }
            },
            onClose: () => {
                if(this.isDebug){
                    console.debug("[SurrealClient] Disconnected from Surreal!")
                }
            },
            onError: () => {
                if(this.isDebug){
                    console.error("[SurrealClient] An error occurred");
                }
            }
        });
    }

    async init(){
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
    }

    private debugMessage(...message: string[]){
        if(!this.isDebug) return;
        console.debug(message);
    }


    /**
     * Execute a query and return the first row.
     * If there are multiple queries, it will return the first row of the last query.
     * @param query
     * @param params
     */
    async queryOne<T = any>(query:string, params?:any){
        await this.init();
        this.debugMessage("[SurrealClient.queryOne()] Executing query", query, "\n", params);

        const qResult = await this.client.query<[any, any]>(query, params);

        if(!qResult.length){
            return undefined;
        }

        return qResult[qResult.length - 1].result[0] as T;
    }

    /**
     * Execute a query and return many rows.
     * If there are multiple queries, it will return the results of the last query.
     * @param quest
     * @param params
     */
    async queryMany(quest:string, params?:any){
        await this.init();

        this.debugMessage("[SurrealClient.queryMany()] Executing query", quest, "\n", params);

        const qResult = await this.client.query<[any,any]>(quest, params);

        if(!qResult.length){
            return undefined;
        }

        return qResult[qResult.length - 1].result;
    }

    /**
     * Create a key with value
     * @param key
     * @param value
     */
    async create<T = any>(key:string, value:any){
        await this.init();
        this.debugMessage("[SurrealClient.create()] Creating key", key, "with value", value);
        let [result] = await this.client.create<any>(key, value);
        return result as T;
    }

    /**
     * Fetch a key
     * @param key
     */
    async fetch(key:string){
        await this.init();
        this.debugMessage("[SurrealClient.fetch()] Fetching key", key);
        let [result] = await this.client.select<any>(key);
        return result;
    }

    /**
     * Fetch many keys from {table}
     * @param {string} table
     */
    async fetchMany(table:string){
        await this.init();
        this.debugMessage("[SurrealClient.fetchMany()] Fetching many keys from table", table);
        let [result] = await this.client.select<any>(table);
        return result;
    }

    /**
     * Update a key, will merge if it exists, otherwise will create
     * @param key
     * @param value
     */
    async update(key:string, value:any){
        await this.init();
        this.debugMessage("[SurrealClient.update()] Updating key", key, "with value", value);
        let [result] = await this.client.merge<any>(key, value);
        return result;
    }

    /**
     * Delete a key
     * @param key
     */
    async delete(key:string){
        await this.init();
        this.debugMessage("[SurrealClient.delete()] Deleting key", key);
        let [result] = await this.client.delete<any>(key);
        return result;
    }

    /**
     * Execute a raw query, return the native SurrealDB Library Result
     * @param query
     * @param params
     */
    async execute(query:string, params?:any){
        await this.init();
        this.debugMessage("[SurrealClient.execute()] Executing query", query, "\n", params);
        return await this.client.query(query, params);
    }


}

