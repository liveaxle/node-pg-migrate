'use strict';

/***********************************************************************************************************************************************
 * NODE DB MIGRATE - DB
 ***********************************************************************************************************************************************
 * @description
 */

const knex = require('knex');
const MIGRATION_TABLE_NAME = 'node_pg_migrate';

/**
 * 
 */
module.exports = {
  client: {
    standard: getDbClient,
    'high-availability': getHighAvailabilityDbClient
  },
  migrations: {
    exists: doesMigrationTableExist,
    create: createMigrationTable,
    status: getMigrationStatus,
    save: saveMigration,
    clear: clearMigrations,
    list: listMigrations
  }
};

/**
 * Get client
 * @param {*} args 
 */
function getDbClient(args={}, opts={}) {
  return knex({
    client: 'pg',
    connection: args.connection || {
      host: args.host || process.env.POSTGRES_HOST,
      port: args.port || process.env.POSTGRES_PORT,
      user: args.user || process.env.POSTGRES_USER,
      password: args.password || process.env.POSTGRES_PASSWORD,
      database: args.database || process.env.POSTGRES_DATABASE || process.env.POSTGRES_DB,
      schema: args.schema || process.env.POSTGRES_SCHEMA
    }
  });
};

/**
 * Return KNEX connection instances for target and source databases.
 * 
 * @TODO - All of the conditions in here feel a little brittle. Look into a way to simplify this.
 */
function getHighAvailabilityDbClient(args={}) {
  if(!args.connection && (!process.env.POSTGRES_TARGET_HOST || !process.env.POSTGRES_SOURCE_HOST)) {
    throw new Error(`High-Availability mode requires connection information for 'source' and 'target' databases`);
  } else if(args.connection) {
    if(!args.connection.target || !args.connection.source) {
      throw new Error(`High-Availability mode requires connection information for 'source' and 'target' databases`);
    }
  }

  let config = Object.assign({}, {
    connection: {},
    target: {},
    source: {}
  }, args);

  return {
    target: knex({
      client: 'pg',
      connection: config.connection && config.connection.target || {
        host: config.target.host || process.env.POSTGRES_TARGET_HOST,
        port: config.target.port || process.env.POSTGRES_TARGET_PORT,
        user: config.target.user || process.env.POSTGRES_TARGET_USER,
        password: config.target.password || process.env.POSTGRES_TARGET_PASSWORD,
        database: config.target.database || process.env.POSTGRES_TARGET_DATABASE || process.env.POSTGRES_TARGET_DB,
        schema: config.target.schema || process.env.POSTGRES_TARGET_SCHEMA
      }
    }),
    source: knex({
      client: 'pg',
      connection: config.connection && config.connection.source || {
        host: config.source.host || process.env.POSTGRES_SOURCE_HOST,
        port: config.source.port || process.env.POSTGRES_SOURCE_PORT,
        user: config.source.user || process.env.POSTGRES_SOURCE_USER,
        password: config.source.password || process.env.POSTGRES_SOURCE_PASSWORD,
        database: config.source.database || process.env.POSTGRES_SOURCE_DATABASE || process.env.POSTGRES_SOURCE_DB,
        schema: config.source.schema || process.env.POSTGRES_SOURCE_SCHEMA
      }
    })
  }
}

/**
 * Check for the existence of the migration table.
 * @param {*} name 
 */
async function doesMigrationTableExist(client) {
  return !!(await (
    client.raw(`SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = '${MIGRATION_TABLE_NAME}'
    );`)
  )).rows[0].exists;
};

/**
 * Creaes migration table.
 * @param {*} name 
 */
async function createMigrationTable(client) {
  return (await (client.schema.withSchema('public').raw(`CREATE TABLE ${MIGRATION_TABLE_NAME} (
    "id" serial primary key, "name" text, "state" text, "created" timestamp default NOW()
  );`)));
};

/**
 * Retrieves the migration status of a migration
 * @param {*} file 
 * @param {*} client 
 */
async function getMigrationStatus(file, client) {
  let result = (await client.schema.withSchema('public').raw(`
    SELECT state
    FROM ${MIGRATION_TABLE_NAME}
    WHERE name = '${file}';
  `)).rows[0];

  return (result && result.state) || null;
}

/**
 * Saves migration state by effectively performing an upsert.
 * @param {*} file 
 * @param {*} state 
 * @param {*} client 
 */
async function saveMigration(file, state, client) {
  return (await client.schema.withSchema('public').raw(`
    WITH upsert AS (
      UPDATE "${MIGRATION_TABLE_NAME}" SET state = '${state}' WHERE name = '${file}' returning *
    )
    INSERT into "${MIGRATION_TABLE_NAME}" ("name", "state")
    SELECT '${file}', '${state}'
    WHERE NOT EXISTS (SELECT * from upsert);
  `));
}

/**
 * Drops migration table
 * @param {*} client 
 */
async function clearMigrations(client) {
  return (await client.schema.withSchema('public').dropTable(MIGRATION_TABLE_NAME));
}

/**
 * Retrieves the list of migrations
 * @param {*} file 
 * @param {*} client 
 */
async function listMigrations(client) {
  return (await client.schema.withSchema('public').raw(`
    SELECT *
    FROM ${MIGRATION_TABLE_NAME};
  `)).rows;
}