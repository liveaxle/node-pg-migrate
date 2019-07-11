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

## Installation

`npm install @liveaxle/node-pg-migrate`

## Usage

Add `"npgm": "node ./node_modules/@liveaxle/node-pg-migrate"` to the `scripts` section of your application's package.json so you don't have to type the whole binary path.

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

These arguments can be passed as `--<arg name>` to all cli methods.

| Name  | values  | required  | default  |
|---|---|---|---|
| user  | db user name  | yes, here or in .env  | null  |
| host  | db host  | yes, here or in .env  | null  |
| port  | db port  | yes, here or in .env  | null  |
| password  | db password  | yes, here or in .env  | null  |
| schema  | db schema  | yes, here or in .env  | null  |
| connection  | db conn string  | this or as above args  | null  |

### Create a migration

* `npm run npgm create (<name> | --name)`

| Name  | values  | required  | default  |
|---|---|---|---|
|ordering | sequential,timestamp  | no  | sequential  |
|directory | path to your migrations dir  | yes, can be in .rc  | 'migrations'  |

### Create a migration before another existing migration

* `npm run npgm create -- --name <name> --before <othername>`

| Name  | values  | required  | default  |
|---|---|---|---|
|ordering | sequential  | no  | sequential  |
|directory | path to your migrations dir  | yes, can be in .rc  | 'migrations'  |

### Run UP migrations

* `npm run npgm up`

| Name  | values  | required  | default  |
|---|---|---|---|
|directory | path to your migrations dir  | yes, can be in .rc  | 'migrations'  |
|include | any specific migrations to run, if empty will run all. Use one --flag per migration  | no  | []  |
|exclude | any specific migrations to ignore, if empty will run all.  Use one --flag per migration | no  | []  |

### Run DOWN migrations

* `npm run npgm down`

| Name  | values  | required  | default  |
|---|---|---|---|
|directory | path to your migrations dir  | yes, can be in .rc  | 'migrations'  |
|include | any specific migrations to run, if empty will run all. Use one --flag per migration  | no  | []  |
|exclude | any specific migrations to ignore, if empty will run all.  Use one --flag per migration | no  | []  |


### Rest migrations

* `npm run npgm reset`

Will simply drop the migrations table from your database. DOES NOT run `down` migrations. This is typicall most useful in a development setting.

