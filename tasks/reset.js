'use strict';

/***********************************************************************************************************************************************
 * MIGRATION CLEAR
 ***********************************************************************************************************************************************
 * @description
 */
const db = resolve('db');

/**
 * Resets the migration table.
 */
module.exports = async function(args, task, client) {
  return (await db.migrations.clear(client));
}