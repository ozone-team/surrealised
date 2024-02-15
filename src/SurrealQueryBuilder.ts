import SurrealClient from "./index";

interface OrderByField {
    field: string;
    direction?: "ASC" | "DESC";
}

export class SurrealQueryBuilder {
    private table: string;
    private fields: string[] = [];
    private omitFields: string[] = [];
    private whereClauses: string[] = [];
    private currentClauseGroup: string[] = [];

    private orderByFields: OrderByField[] = [];

    private grouping: boolean = false;
    private fetchItems: string[] = [];
    private splitItems: string[] = [];
    private groupByItems: string[] = [];
    private withIndex: string[] = [];
    private offsetClause?: number = 0;
    private limitClause?: number = undefined;

    constructor(table: string) {
        this.table = table;
    }

    select(...fields: string[]): this {
        this.fields = fields;
        return this;
    }

    where(condition: string): this {
        if (this.grouping) {
            this.currentClauseGroup.push(condition);
        } else {
            this.whereClauses.push(condition);
        }
        return this;
    }

    and(condition: string): this {
        return this.where(condition);
    }

    or(condition: string): this {
        if (this.grouping) {
            const groupedConditions = this.currentClauseGroup.join(' AND ');
            this.whereClauses.push(`(${groupedConditions})`);
            this.currentClauseGroup = []; // Reset for the next grouping
        }

        this.grouping = true; // Start new grouping
        this.currentClauseGroup.push(condition);
        return this;
    }

    endGroup(): this {
        if (this.grouping && this.currentClauseGroup.length > 0) {
            const groupedConditions = this.currentClauseGroup.join(' AND ');
            this.whereClauses.push(`(${groupedConditions})`);
            this.grouping = false;
            this.currentClauseGroup = [];
        }
        return this;
    }

    fetch(...fields: string[]): this {
        this.fetchItems = fields;
        return this;
    }

    offset(n: number){
        this.offsetClause = n;
        return this;
    }

    limit(n: number){
        this.limitClause = n;
        return this;
    }

    groupBy(...fields: string[]): this {
        this.groupByItems = fields;
        return this;
    }

    orderBy(...fields: OrderByField[]){
        this.orderByFields = fields;
        return this;
    }

    split(...fields: string[]): this {
        this.splitItems = fields;
        return this;
    }

    index(...indexes: string[]): this {
        this.withIndex = indexes;
        return this;
    }

    build(): string {
        let query = `SELECT ${this.fields.length > 0 ? this.fields.join(', ') : '*'}`;

        if(this.omitFields.length){
            query += ` OMIT ${this.omitFields.join(', ')}`;
        }

        query += ` FROM ${this.table}`

        if(this.withIndex.length){
            query += `WITH INDEX ${this.withIndex.join(', ')}`;
        }
        if (this.whereClauses.length > 0) {
            query += ` WHERE ${this.whereClauses.join(' OR ')}`;
        }
        if(this.splitItems.length > 0){
            query += ` SPLIT ${this.splitItems.join(', ')}`;
        }
        if(this.groupByItems.length > 0){
            query += ` GROUP BY ${this.groupByItems.join(', ')}`;
        }
        if(this.orderByFields.length > 0){
            query += ` ORDER BY ${this.orderByFields.map(f => `${f.field} ${f.direction || 'ASC'}`).join(', ')}`;
        }
        if(this.limitClause){
            query += ` LIMIT ${this.limitClause}`;
        }
        if(this.offsetClause){
            query += ` START ${this.offsetClause}`;
        }
        if(this.fetchItems.length > 0){
            query += ` FETCH ${this.fetchItems.join(', ')}`;
        }

        return query;
    }

    async queryOne<T>(params: Record<string, any>): Promise<T> {
        let q = this.build();
        const surreal = new SurrealClient();
        return await surreal.queryOne<T>(q, params);
    }

    async queryMany<T>(params: Record<string, any>): Promise<T[]> {
        let q = this.build();
        const surreal = new SurrealClient();
        return await surreal.queryMany<T>(q, params);
    }

    async execute(params: Record<string, any>): Promise<void> {
        let q = this.build();
        const surreal = new SurrealClient();
        return await surreal.execute(q, params);
    }
}

export default SurrealQueryBuilder;