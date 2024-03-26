# Surrealised

<table>
    <tbody>
        <tr>
            <td>
                <img alt="NPM Downloads" src="https://img.shields.io/npm/dt/surrealised">
            </td>
            <td>
                <img alt="NPM Version" src="https://img.shields.io/npm/v/surrealised">
            </td>
        </tr>
    </tbody>
</table>

A basic SurrealDB Server-Side Client Library for NodeJS. It acts more akin to tranditional database connections, and is designed to be used in a similar way to other SQL libraries.
If you have any problems, or suggestions, please [open an issue](https://github.com/ozone-team/surrealised/issues). 

## Installation

```bash
yarn add surrealised@latest
```

## Usage

```javascript
const Surrealised = require('surrealised');

let surrealClient = new Surrealised();

let results = await surrealClient.query('SELECT * FROM users');
```

## Configuration

Configuration is set either via Environment Variables, or via the class initialisation.

### Environment Variables

```dotenv
SURREAL_DB_HOST=http://localhost:8000/rpc
SURREAL_DB_USER=your_user
SURREAL_DB_PASSWORD=your_password
SURREAL_DB_NAMESPACE=your_namespace
SURREAL_DB_DATABASE=your_database
SURREAL_DB_DEBUG=false   #show debug output in the console logs
```

### Class Initialisation

```javascript
const Surrealised = require('surrealised');

let surrealClient = new Surrealised({
    debug: true,
    connection: {
        host: 'http://localhost:8000/rpc',
        user: 'your_user',
        password: 'your_password',
        namespace: 'your_namespace',
        database: 'your_database'
    } 
});

// The rest of your code

```

## Methods

I have neatened up the methods to make them more intuitive and easier to use (akin to other SQL libraries or ORMs out there)

### QueryOne

Return the first row of the last query given.
```javascript
let result:User = await surrealClient.queryOne<User>('SELECT * FROM users WHERE email = $email', {
    email: 'user@company.com'
});
```

### QueryMany

Return all the results from the last query given.
```javascript
let results:User[] = await surrealClient.queryMany<User>('SELECT * FROM users WHERE email contains $domain', {
    domain: 'company.com'
});
```

### FetchOne

Fetch a record via it's ID field
```javascript
let user:User = await surrealClient.fetch<User>('user:bob');
```

### FetchMany

Fetch all records from a table
```javascript
let users:User[] = await surrealClient.fetchMany<User>('user');
```

### Create

Create a record

```javascript
let user:User = await surrealClient.create<User>('user', {
    name: 'Bob',
    email: 'bob@company.com',
    age: 30
});
```
### Update

Update a record, merges if it exists, create a new record if it doesn't

```javascript
let user:User = await surrealClient.update<User>('user:bob', {
    age: 31
});
```

### Delete

Delete a record

```javascript
await surrealClient.delete('user:bob');
// #RIP Bob :(
```

### Execute

Execute a native surrealdb.js query, will return an array of results for each query in the query string.

```javascript
let results = await surrealClient.execute('SELECT * FROM users');
```

## Using a Static Class Handler

If you want to instantiate the class once and use it throughout your application, keeping the same connection, you can construct a "master class" to handle it.
This is *not recommended* due to SurrealDBs use of Websockets to maintain a connection, and the fact that NodeJS is single threaded, but it is possible if you have a slow(ish) influx of instructions.

```javascript
// surrealClient.ts
const Surrealised = require('surrealised');
let surrealClient = new Surrealised();
module.exports = surrealClient;
```
```javascript
// index.ts (or whatever)
const surrealClient = require('./surrealClient');
let users = surrealClient.queryMany<User>('SELECT * FROM users');
```

---

# SurrealQueryBuilder Usage Guide

The `SurrealQueryBuilder` class provides a fluent interface for constructing and executing queries against a SurrealDB database. This guide will walk you through the instantiation of the query builder and the use of its major functions.

## Instantiation

To create a new instance of the `SurrealQueryBuilder`, you need to provide the name of the table you'll be querying:

```javascript
const query = new SurrealQueryBuilder("table_name");
```

## Major Functions

### select(...fields: string[])

Selects fields to return from the query. If no fields are specified, `*` is used to select all fields.

**Example:**

```javascript
query.select("id", "name", "age");
```

### where(condition: string)

Starts a condition. Must be present before any `AND` or `OR` statements. Adds a condition to the `WHERE` clause of the query.

**Example:**

```javascript
query.where("age > 18");
```

### and(condition: string)

Adds an `AND` condition to the query. It's essentially an alias to the `where` method for chaining conditions.

**Example:**

```javascript
query.where("age > 18").and("active = true");
```

### or(condition: string)

Starts a new condition group with an `OR` operator. Useful for grouping conditions together.

**Example:**

```javascript
query.where("age < 18").or("guardian_approved = true");
```

### endGroup()

Ends a condition group started with `or`. Necessary to close the grouping of conditions.

**Example:**

```javascript
query.where("age < 18").or("guardian_approved = true").endGroup();
```

### fetch(...fields: string[])

Specifies record joins to fetch details of related records.

**Example:**

```javascript
query.fetch("profile", "contacts");
```

### offset(n: number)

Offsets the results by a specified number, for pagination.

**Example:**

```javascript
query.offset(10);
```

### limit(n: number)

Limits the number of results returned by the query.

**Example:**

```javascript
query.limit(5);
```

### groupBy(...fields: string[])

Groups the results by one or more fields.

**Example:**

```javascript
query.groupBy("department");
```

### orderBy(...fields: OrderByField[])

Orders the results by one or more fields, with optional direction (`ASC` or `DESC`).

**Example:**

```javascript
query.orderBy({ field: "name", direction: "ASC" });
```

### split(...fields: string[])

Splits the query results by specified fields.

**Example:**

```javascript
query.split("category");
```

### index(...indexes: string[])

Adds indexes to the query to optimize its execution.

**Example:**

```javascript
query.index("index_on_name");
```

### build(): string

Constructs and returns the query string based on the specified parameters.

**Example:**

```javascript
const queryString = query.build();
```

### queryOne<T>(params: Record<string, any>)

Executes the query and returns a single row or none. It can take a parameter object for any variables within the query.

**Example:**

```javascript
query.select("id", "name").where("id = $id").queryOne<{ id: string, name: string }>({ id: "someId" });
```

### queryMany<T>(params: Record<string, any>)

Executes the query and returns many rows. Similar to `queryOne`, but for retrieving multiple records.

**Example:**

```javascript
query.select("id", "name").where("active = true").queryMany<{ id: string, name: string }>();
```
## Variables

You can access the `variables` dictionary directly to modify, remove or add variables to the query.

```javascript
query.variables = {
    user: "user:123456",
    date: new Date(),
    count: 10
}
```
I have also included some helper functions to make this easier:

### addVariable(key: string, value: any)

Add a variable to be passed to the query. If the variable already exists, it will be overwritten.

```javascript
query.addVariable("user", "user:123456")
//... other operations
query.where('created_by = $user')
```

### removeVariable(key: string)

Remove a variable from the query.

```javascript
query.removeVariable("user")
```

### clearVariables()

Clear all variables from the query.

```javascript
query.clearVariables()
```

