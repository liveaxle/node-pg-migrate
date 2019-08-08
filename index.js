'use strict';

/***********************************************************************************************************************************************
 * NODE DB MIGRATE
 ***********************************************************************************************************************************************
 * @description
 */
const chalk = require('chalk');
const path = require('path');
const dotenv = require('dotenv').config({path: path.join(process.cwd(), '.env')});
const args = require('minimist')(process.argv.slice(2));
const log = require('log');
const db = require('./db');
const task = args._[0];

/**
 * [LOG_PREFIX description]
 * @type {[type]}
 */
global.LOG_PREFIX = chalk.white.underline(`Node DB Migrate:`) + ' ' + chalk.magenta(task);
global.resolve = (name) => require(path.join(__dirname, name));

/**
 * Load RC
 * @type {[type]}
 */
const RCCONFIG = require('rc')('npgm');

/**
 * Apply default options, override RC if cli args provided.
 */
const OPTIONS = Object.assign({}, RCCONFIG, {
  ordering: args.ordering || RCCONFIG.ordering || 'sequential',
  directory: args.directory || RCCONFIG.directory || 'migrations',
  mode: args.mode || RCCONFIG.mode || 'standard',
  types: args.types && (args.types.constructor !== Array && [args.types]) || RCCONFIG.types || ['schema']
});

/**
 * Main Imports
 * @type {[type]}
 */
const tasks = require('./tasks');


/**
 * [mappings description]
 * @type {Object}
 */
const mappings = {
  'migration:create': tasks.create,
  'migration:up': tasks.migrate,
  'migration:down': tasks.migrate,
  'migration:reset': tasks.reset,
  'migration:clear': tasks.reset,
  'migration:list': tasks.list,
  'migrate:create': tasks.create,
  'migrate:up': tasks.migrate,
  'migrate:down': tasks.migrate,
  'migrate:reset': tasks.reset,
  'migrate:clear': tasks.reset,
  'migrate:list': tasks.list,
  'create': tasks.create,
  'up': tasks.migrate,
  'down': tasks.migrate,
  'reset': tasks.reset,
  'clear': tasks.reset,
  'list': tasks.list,
  unknown: () => {}
};

/**
 * Task Entry
 * @return {[type]} [description]
 */
(async function() {

  // build db arguments so you can build the right clients
  let client = db.client[OPTIONS.mode](args);
  
  try {
    console.log(`${LOG_PREFIX} - starting.`);
    await (mappings[task] || mappings.unknown)(OPTIONS, task, (client.source || client), (client.target || client));
    console.log(`${LOG_PREFIX} - finished.`);
    process.exit(0);
  } catch(e) {
    console.log(`${LOG_PREFIX} - ${chalk.red(`Error - ${e.message}`)}`);
    process.exit(1);
  }
})();