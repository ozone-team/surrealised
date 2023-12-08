# Surrealised

## Description

A basic SurrealDB Client Library for NodeJS.

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
