# node-pg-migrate

![npm url](https://img.shields.io/npm/v/@liveaxle/node-pg-migrate.svg)
![downloads](https://img.shields.io/npm/dw/@liveaxle/node-pg-migrate.svg)
![build badge](https://img.shields.io/circleci/build/gh/liveaxle/node-pg-migrate.svg)
![greenkeeper](https://badges.greenkeeper.io/liveaxle/node-pg-migrate.svg)
[![codecov](https://codecov.io/gh/liveaxle/node-pg-migrate/branch/master/graph/badge.svg)](https://codecov.io/gh/liveaxle/node-pg-migrate)


This is a cli module that assists in creating and running Postgres Migrations using async/await.

## How it works.
This module will generate template migration files in a directory of your choosing that contain empty function closures for `up` and `down` migrations. These closure will be given a knex client connection per your provided data base configuration.

Running a migration creates a table on your database's `public` schema called `node_pg_migrate` that tracks the state of any migrations executed.

You'll notice all migrations generated are `async` functions. This does mean at least Node 7 is required. This is because the module will parse and sort migrations into a sequence and run them synchronously. This gives you, the migration author, control over what actually comprises your migration and allows you to capture errors for 'optional' or failure-allowed migrations.

### Why *another* migration library.

I (@ktstowell) personally dislike the fragmentation of javascript libraries, however I felt compelled to make this based on the following reasons:

* `async/await`
  * Every other library I found was still using promises, and even a single global promise per execution instance - I weighed the cost of trying to PR a change to those libraries versus making a new library from scratch. Obviously I favoured making a new library.
* Exception management
  * At the time i was looking for a migration library, I needed something that would let me choose how to handle exceptions in my migrations. It seemed that even if I attempted to catch/swallow them the runner would still abort the process.
* Exclusions
  * I needed the ability in some circumstances to exclude some migrations from running. The use case was, locally, using docker, I didn't need to run certain low-level setup migrations as docker does that for you if you provide the right environment variables. I'm also very adverse to having anything like `if env==='local'` in my code. That should be the responsibility of whatever is orchestrating the migrations. Now in my npm scripts I have `npm run migrate` and `npm run migrate:local` so the code itself remains environment agnostic.
* Schema vs Data
  * In many situations the need to decouple migration a schema change versus data is important. I wanted to be able to represent that structurally. With our `types` api you can specificy what kinds of migrations you want and it will create sub folders for them.
* High Availability.
  * Many systems implement a migration process that involves provisioning a new database on the fly, running migrations on the new target and then importing existing data from the source. I wanted to represent this as well with our `mode:'high-availability'` option. This will inject a `target` and `source` connection into your migration files.

## Installation

`npm install @liveaxle/node-pg-migrate`

## Usage

Add `"npgm": "node ./node_modules/@liveaxle/node-pg-migrate"` to the `scripts` section of your application's package.json so you don't have to type the whole binary path.

## Contributing

If you see any issues feel free to report them to the issues tab on this repo. If you have an improvement/change you'd like to make please submit a PR.

If approved and the PR is merged to master, we will determine where the change falls under the Semver convention and update the package version and publish accordingly.

## Configuration

* `.npgmrc` files are supported and can contain the following global options:
  * `ordering`:
    * `sequential`: default option. Will create files numbered as `01.<name>.migration.js`
    * `timestamp`: Will create files as `<Date.now()>.<name>.migration.js`
  * `directory`: folder where your migrations will live. Will be created for you if it doesn't exist.

### Database Configuration

Database connection config can be loaded in one of two ways:

* Environment variables:

  * We use the `dotenv` package to load any `.env` that exists in `process.cwd()` - which is the root of the project you are invoking this module from. We support the following variable names:

  ```
  POSTGRES_HOST=
  POSTGRES_PORT=
  POSTGRES_DB= | POSTGRES_DATABASE=
  POSTGRES_PASSWORD=
  POSTGRES_USER=
  POSTGRES_SCHEMA=
  ```

* Alternatively, we accept command line arguments as well that will be used before any environment variables if provided.
  * --user
  * --host
  * --port
  * --database
  * --password
  * --schema

* You can also just pass these in as `--connection` as a postgres connection string.

## Commands

### Global Arguments

These arguments can be passed as `--<arg name>` to *all* cli methods.

| Name  | values  | required  | default  |
|---|---|---|---|
| user  | db user name  | yes, here or in .env  | null  |
| host  | db host  | yes, here or in .env  | null  |
| port  | db port  | yes, here or in .env  | null  |
| password  | db password  | yes, here or in .env  | null  |
| schema  | db schema  | yes, here or in .env  | null  |
| connection  | db conn string  | this or as above args  | null  |

---

### Create a migration

* `npm run npgm create (<name> | --name)`

| Name  | values  | required  | default  |
|---|---|---|---|
|ordering | sequential,timestamp  | no  | sequential  |
|directory | path to your migrations dir  | yes, can be in .rc  | 'migrations'  |
|types | schema, data | no | schema |
|mode | standard, high-availability | no | 'standard' |

#### Create a migration before another existing migration

* `npm run npgm create -- --name <name> --before <othername>`

### Run UP migrations

* `npm run npgm up`

| Name  | values  | required  | default  |
|---|---|---|---|
|include | any specific migrations to run, if empty will run all. Use one --flag per migration  | no  | []  |
|exclude | any specific migrations to ignore, if empty will run all.  Use one --flag per migration | no  | []  |

### Run DOWN migrations

* `npm run npgm down`

| Name  | values  | required  | default  |
|---|---|---|---|
|directory | path to your migrations dir  | yes, can be in .rc  | 'migrations'  |
|include | any specific migrations to run, if empty will run all. Use one --flag per migration  | no  | []  |
|exclude | any specific migrations to ignore, if empty will run all.  Use one --flag per migration | no  | []  |


### Reset migrations

* `npm run npgm reset`

Will simply drop the migrations table from your database. DOES NOT run `down` migrations. This is typicall most useful in a development setting.


## Example - Standard

In your repository where migrations will be stored:

`npm run npgm create foo`

This will create:

`./migrations/<timestamp>.foo.js`

The file will contain:

```
'use strict';

/***********************************************************************************************************************************************
 * NODE DB MIGRATE - FOO
 ***********************************************************************************************************************************************
 * @author File generated by @liveaxle/node-pg-migrate
 * @description
 * 
 */

/**
 * [exports description]
 * @type {Object}
 */
module.exports = {
  up, down
};

/**
 * [up description]
 * @return {[type]} [description]
 */
async function up(client) {
  
}

/**
 * [down description]
 * @return {[type]} [description]
 */
async function down(client) {

}
```

In each of the above functions you now can write whatever the "foo" migration means to your application. Down migrations should be the opposite, in action and order, from what your up migrations are.

Then, at some later point when you actually need to execute your migrations, you can run `npm run npgm up` and it will execute the sql in the `up` closure above in sequence.

## Example - High Availability

`npgm create foo --mode=high-availability`

```
'use strict';

/***********************************************************************************************************************************************
 * NODE DB MIGRATE - FOO
 ***********************************************************************************************************************************************
 * @author File generated by @liveaxle/node-pg-migrate
 * @description
 * 
 */

/**
 * [exports description]
 * @type {Object}
 */
module.exports = {
  up, down
};

/**
 * [up description]
 * @return {[type]} [description]
 */
async function up(target, source) {
  
}

/**
 * [down description]
 * @return {[type]} [description]
 */
async function down(target, source) {

}
```
The intent of this `mode` is to inject your two db clients into to your migration closure to enable you to export data from the target and apply it to the source.

## Example - Schema and Data

`npgm create foo --types=data --types=schema`

This will create a migration folder structure like:

```
/migrations
  /data
    <ordering>.foo.migration.js
  /schema
    <ordering>.foo.migration.js
```

