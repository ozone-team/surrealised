import SurrealClient from "./index";

type OrderByField = Record<string, "ASC" | "DESC">

class SurrealQueryBuilder {
    private table: string;
    private fields: string[] = [];
    private omitFields: string[] = [];
    private whereClauses: string[] = [];
    private currentClauseGroup: string[] = [];
    private group_all: boolean = false;

    private orderByFields: OrderByField[] = [];

    private isInWhereClause: boolean = false;

    private grouping: boolean = false;
    private fetchItems: string[] = [];
    private splitItems: string[] = [];
    private groupByItems: string[] = [];
    private withIndex: string[] = [];
    private offsetClause?: number = 0;
    private limitClause?: number = undefined;

    public variables: Record<string, any> = {};

    constructor(table: string) {
        this.table = table;
    }

    /**
     * Select fields to return
     * https://docs.surrealdb.com/docs/surrealql/statements/select#basic-usage
     * @param fields
     */
    select(...fields: string[]): this {
        this.fields = fields;
        return this;
    }

    /**
     * Start a condition, MUST be present before any AND or OR statements
     * https://docs.surrealdb.com/docs/surrealql/statements/select#filter-queries-using-the-where-clause
     * @param condition
     */
    where(condition: string): this {

        if(this.isInWhereClause){
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
    and(condition: string): this {
        console.debug("AND", condition);
        return this.where(condition);
    }

    /**
     * Or what?
     * https://docs.surrealdb.com/docs/surrealql/statements/select#connect-targets-using-the-fetch-clause
     * @param condition
     */
    or(condition: string): this {

        if(!this.isInWhereClause){
            throw new Error("You must call where() before calling or()");
        }

        this.currentClauseGroup.push(condition);

        return this;
    }

    endGroup(): this {
        if (this.currentClauseGroup.length > 0) {
            const groupedConditions = this.currentClauseGroup.join(' OR ');
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
    fetch(...fields: string[]): this {
        this.fetchItems = fields;
        return this;
    }

    /**
     * Offset the results by a number
     * https://docs.surrealdb.com/docs/surrealql/statements/select#the-limit-clause
     * @param n
     */
    offset(n: number){
        this.offsetClause = n;
        return this;
    }

    /**
     * Limit the number of results
     * https://docs.surrealdb.com/docs/surrealql/statements/select#the-limit-clause
     * @param n - the number to limit it to
     */
    limit(n: number){
        this.limitClause = n;
        return this;
    }

    /**
     * Group the results by a field or set of fields
     * https://docs.surrealdb.com/docs/surrealql/statements/select#the-group-by-and-group-all-clause
     * @param fields
     */
    groupBy(...fields: string[]): this {
        this.groupByItems = fields;
        return this;
    }

    /**
     * Group all results
     * https://docs.surrealdb.com/docs/surrealql/statements/select#the-group-by-and-group-all-clause
     */
    groupAll(): this {
        this.group_all = true;
        return this;
    }

    /**
     * Order the results by a set of fields
     * https://docs.surrealdb.com/docs/surrealql/statements/select#sort-records-using-the-order-by-clause
     * @param fields
     */
    orderBy(...fields: OrderByField[]){
        this.orderByFields = fields;
        return this;
    }

    /**
     * Split the query results via a field
     * https://docs.surrealdb.com/docs/surrealql/statements/select#the-split-clause
     * @param fields
     */
    split(...fields: string[]): this {
        this.splitItems = fields;
        return this;
    }

    /**
     * Add indexes to the query
     * https://docs.surrealdb.com/docs/surrealql/statements/select#the-with-clause
     * @param indexes
     */
    index(...indexes: string[]): this {
        this.withIndex = indexes;
        return this;
    }

    /**
     * Omit fields from the result, these are still used in conditionals (I think?)
     * @param fields
     */
    omit(...fields: string[]): this {
        this.omitFields = fields;
        return this;
    }

    private assertClauseGroup(){
        if(this.isInWhereClause){
            this.endGroup();
        }

        console.log(this.whereClauses);
    }

    /**
     * Construct the query string
     */
    build(ignore_pagination?: boolean, ignore_filters?: boolean): string {

        this.assertClauseGroup();

        let query = `SELECT ${this.fields.length > 0 ? this.fields.join(', ') : '*'}`;

        if(this.omitFields.length){
            query += ` OMIT ${this.omitFields.join(', ')}`;
        }

        query += ` FROM ${this.table}`

        if(this.withIndex.length){
            query += `WITH INDEX ${this.withIndex.join(', ')}`;
        }

        if (this.whereClauses.length > 0 && !ignore_filters) {

            // if there are no OR clauses, we need to remove all the brackets
            let hasORClauses = this.whereClauses.some((c) => c.includes(' OR '));
            if(!hasORClauses){
                this.whereClauses = this.whereClauses.map((c) => c.replace(/\(/g, '').replace(/\)/g, ''));
            }

            query += ` WHERE ${this.whereClauses.join(' AND ')}`;
        }
        if(this.splitItems.length > 0){
            query += ` SPLIT ${this.splitItems.join(', ')}`;
        }

        if(this.group_all){
            query += ` GROUP ALL`;
        } else if(this.groupByItems.length > 0){
            query += ` GROUP BY ${this.groupByItems.join(', ')}`;
        }

        if(this.orderByFields.length > 0){
            query += ` ORDER BY ${this.orderByFields.map((f) => {
                let key = Object.keys(f)[0];
                let value = f[key];
                return `${key} ${value}`;
            }).join(', ')}`;
        }

        if(this.limitClause && !ignore_pagination){
            query += ` LIMIT ${this.limitClause}`;
        }
        if(this.offsetClause && !ignore_pagination){
            query += ` START ${this.offsetClause}`;
        }
        if(this.fetchItems.length > 0){
            query += ` FETCH ${this.fetchItems.join(', ')}`;
        }

        return query;
    }

    /**
     * Execute the query and return a single row (or none)
     * @param params
     */
    async queryOne<T>(params?: Record<string, any>): Promise<T> {
        let q = this.build();

        let variables = {
            ...this.variables,
            ...params,
        }

        const surreal = new SurrealClient();
        return await surreal.queryOne<T>(q, variables);
    }

    /**
     * Execute the query and return many rows
     * @param params
     */
    async queryMany<T>(params?: Record<string, any>): Promise<T[]> {
        let q = this.build();
        const surreal = new SurrealClient();

        let variables = {
            ...this.variables,
            ...params,
        }

        return await surreal.queryMany<T>(q, variables);
    }

    /**
     * Add a variable to the query for execution.
     * @param key
     * @param value
     */
    addVariable(key: string, value: any){
        this.variables[key] = value;
        return this;
    }

    /**
     * Remove a variable from the query
     * @param key
     */
    removeVariable(key: string){
        delete this.variables[key];
        return this;
    }

    /**
     * Clear all variables from the query
     */
    clearVariables(){
        this.variables = {};
        return this;
    }

    /**
     * Get the total number of rows that would be returned by the query, by default this ignore pagination
     * @param ignoreFilter - ignore WHERE clauses
     */
    async total(ignoreFilter: boolean = false){

        let query = this.build(true, ignoreFilter);
        const surreal = new SurrealClient();

        let result = await surreal.queryMany(query, this.variables);
        return result.length;
    }

}

export default SurrealQueryBuilder;