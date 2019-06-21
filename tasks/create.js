'use strict';

/***********************************************************************************************************************************************
 * MIGRATION CREATE
 ***********************************************************************************************************************************************
 * @description
 */
const log = require('log');
const joi = require('joi');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const template = resolve(path.join('templates', 'migration.js'));

/**
 * [schema description]
 * @type {[type]}
 */
const schema = joi.object().keys({
  ordering: joi.string().required().allow('timestamp', 'sequential'),
  directory: joi.string().required(),
  name: joi.string().required()
}).unknown();

/**
 * [migrationNameMappings description]
 * @type {Object}
 */
const migrationNameMappings = {
  sequential: generateSequentialName,
  timestamp: generateTimestampName
};

/**
 * [description]
 * @param  {Object} [args={}] [description]
 * @return {[type]}           [description]
 */
module.exports = async function(args={}) {
  let model = Object.assign({}, {name: args.name || args._[1]}, args);
  let {error, value} = joi.validate(model, schema);

  // Validate CLI params
  if(error) {
    throw new Error(error.message);
  }

  // Build migrations path
  let dir = path.join(process.cwd(), value.directory);

  // Check if dir exists - if not make it
  let exists = fs.existsSync(dir);

  if(!exists) {
    fs.mkdirSync(dir);
  };

  let name = migrationNameMappings[value.ordering](value.name.replace(/\s/gi, '-'), dir);
  let content = template(value.name);

  try {
    fs.writeFileSync(path.join(dir, name), content, {encoding: 'UTF-8'});
  } catch(e) {
    throw new Error(`Could not create file: ${e.message}`);
  }

  console.log(`${LOG_PREFIX} - ${chalk.green('created')} migration in: ${chalk.yellow(path.join(dir, name))}`);
}

/**
 * [generateSequentialName description]
 * @param  {[type]} name [description]
 * @return {[type]}      <number>.<name>.migration.js
 */
function generateSequentialName(name, dir) {
  // Get array of all files in migration dir
  let files = fs.readdirSync(dir);
  let sequence = files.length && files.map((file='') => parseInt(file.split('.')[0] || 0)).sort((a, b) => a-b) || [0];
  let next = (sequence.reverse()[0] += 1) + '';
  
  // Add leading 0 for file system sorting
  if(next.length === 1) next = '0' + next;

  return `${next}.${name}.migration.js`;
}

/**
 * [generateTimestampName description]
 * @param  {[type]} name [description]
 * @param  {[type]} dir  [description]
 * @return {[type]}      <timestamp>.<name>.migration.js
 */
function generateTimestampName(name, dir) {
  return `${Date.now()}.${name}.migration.js`;
}
