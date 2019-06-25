'use strict';

/***********************************************************************************************************************************************
 * NODE-PG-MIGRATE TASKS
 ***********************************************************************************************************************************************
 * @description
 */
const create = require('./create');
const migrate = require('./migrate');
const reset = require('./reset');
const list = require('./list');

/**
 * Tasks
 */
module.exports = {
  create, migrate, reset, list
};
