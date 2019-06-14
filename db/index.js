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
  client: getDbClient,
  migrations: {
    exists: doesMigrationTableExist,
    create: createMigrationTable,
    status: getMigrationStatus,
    save: saveMigration,
    clear: clearMigrations
  }
};

/**
 * Get client
 * @param {*} args 
 */
function getDbClient(args) {
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