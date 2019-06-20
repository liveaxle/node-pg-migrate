'use strict';

/***********************************************************************************************************************************************
 * NODE-PG-MIGRATE TASKS
 ***********************************************************************************************************************************************
 * @description
 */
const create = require('./create');
const migrate = require('./migrate');
const clear = require('./clear');
const list = require('./list');

/**
 * Tasks
 */
module.exports = {
  create, migrate, clear, list
};
