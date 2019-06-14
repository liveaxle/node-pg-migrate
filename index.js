'use strict';

/***********************************************************************************************************************************************
 * NODE DB MIGRATE
 ***********************************************************************************************************************************************
 * @description
 */
const dotenv = require('dotenv').config();
const chalk = require('chalk');
const path = require('path');
const args = require('minimist')(process.argv.slice(2));
const log = require('log');
const db = require('./db');
const task = args._[0];

/**
 * [LOG_PREFIX description]
 * @type {[type]}
 */
global.LOG_PREFIX = chalk.white.underline(`Node DB Migrate:`) + ' ' + chalk.magenta(task);
global.resolve = (name) => require(path.join(process.cwd(), name));

/**
 * Load RC
 * @type {[type]}
 */
const CNFG = require('rc')('npgm', {
  ordering: 'sequential',
  directory: 'migrations'
});

/**
 * Main Imports
 * @type {[type]}
 */
const tasks = require('./tasks');

// Comands to support
// migration:create <name> | --path --ordering
// migration:up all | --include | --exlcude --connection
// migration:down all | -- include | --exlude | --connection
// migration:clear --connection
//
// Migration rc config
// ordering : sequential, timestamp
// directory : <path> ./migrations


/**
 * [mappings description]
 * @type {Object}
 */
const mappings = {
  'migration:create': tasks.create,
  'migration:up': tasks.migrate,
  'migration:down': tasks.migrate,
  'migration:clear': tasks.clear,
  unknown: () => {}
};

/**
 * Task Entry
 * @return {[type]} [description]
 */
(async function() {

  let client = db.client(args);
  

  try {
    console.log(`${LOG_PREFIX} - starting.`)
    await (mappings[task] || mappings.unknown)(Object.assign({}, CNFG, args), client, task);
    console.log(`${LOG_PREFIX} - finished.`)
    process.exit(0);
  } catch(e) {
    console.log(`${LOG_PREFIX} - ${chalk.red(`Error - ${e.message}`)}`)
    process.exit(1);
  }
})();
