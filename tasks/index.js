'use strict';

/***********************************************************************************************************************************************
 * NODE-PG-MIGRATE TASKS
 ***********************************************************************************************************************************************
 * @description
 */
const create = require('./create');
const migrate = require('./migrate');
const clear = require('./clear');

/**
 * Tasks
 */
module.exports = {
  create, migrate, clear
};
