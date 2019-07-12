'use strict';

/***********************************************************************************************************************************************
 * MIGRATION UP
 ***********************************************************************************************************************************************
 * @description
 */
const log = require('log');
const joi = require('joi');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const db = resolve('db');


/**
 * [schema description]
 * @type {[type]}
 */
const schema = joi.object().keys({
  ordering: joi.string().required().allow('timestamp', 'sequential'),
  directory: joi.string().required(),
  include: joi.array().default([]),
  exclude: joi.array().default([])
}).unknown();

/**
 * Task mappings
 */
const mappings = {
  'migration:up': 'up',
  'migration:down': 'down',
  'up': 'up',
  'down': 'down'
};

/**
 * Task ordering
 */
const order = {
  'up': migrateUp,
  'down': migrateDown
};

/**
 * Up
 */
module.exports = async function(args={}, client, task) {
  let model = Object.assign({}, {name: args.name || args._[1]}, args);
  let {error, value} = joi.validate(model, schema);
  // grab files in each directory
  // check for existence of migrations table
  //  run sync for loop
  // call all up functions - log each progress
  // after each one, save to migrations table

  // Build migrations path
  let dir = path.join(process.cwd(), value.directory);

  // Check if dir exists - if not make it
  let exists = fs.existsSync(dir);

  if(!exists) {
    throw new Error('No migrations detected. Run migration:create.');
  };

  // Get all migrations in folder.
  let files = fs.readdirSync(dir);

  // Does DB exist
  let table = await db.migrations.exists(client);
  
  // create if not
  if(!table) await db.migrations.create(client);

  // Run migrations sequentially
  await order[mappings[task]](files.length, async index => {
    let file = files[index];
    let name = file.split('.')[1];

    // If includes were specified and name wasn't found, skip.
    if(value.include.length && value.include.indexOf(name) === -1) return;

    // If exludes has length and name is found, skip;
    if(value.exclude.length && value.exclude.indexOf(name) !== -1) return;

    // Require each file
    let fn = require(path.join(dir, file));

    try {
      // Output Status
      console.log(`${LOG_PREFIX} - running '${mappings[task]}' migration for: [${chalk.cyan(file)}]`);

      // Check if migration has been run
      let state = (await db.migrations.status(file, client));
      // If state is same as current task, migration has been performed, skip.
      if(state === mappings[task]) {
        // Output Status
        console.log(`${LOG_PREFIX} - '${mappings[task]}' migration for: [${chalk.cyan(file)}] exists - ${chalk.yellow('skipping')}.`);
        return;
      }

      // Run Migration
      let result = (await fn[mappings[task]](client));
      // Output Status
      console.log(`${LOG_PREFIX} - '${mappings[task]}' migration for: [${chalk.cyan(file)}] - ${chalk.green('successful')} \n`);

      // Save migration run to migrations table
      return await db.migrations.save(file, mappings[task], client);
    } catch(e) {
      throw new Error(`'${mappings[task]}' migration for: [${file}] - ${chalk.red('failed')}: ${e.message}`);
    }
  });
}

/**
 * migrateUp - Runs the migration callback in sequential order.
 * @param {int} max 
 * @param {Function} callback 
 */
async function migrateUp(max, callback) {
  for(let i=0; i<max; i++) {
    await callback(i);
  }
}

/**
 * migrateDown - Runs the migration callback in reverse sequential order.
 * @param {int} max 
 * @param {Function} callback 
 */
async function migrateDown(max, callback) {
  for(let i=max-1; i>=0; i--) {
    await callback(i);
  }
}