'use strict';

/***********************************************************************************************************************************************
 * MIGRATION CLEAR
 ***********************************************************************************************************************************************
 * @description
 */
const db = resolve('db');
const chalk = require('chalk');
const Table = require('cli-table-redemption');

/**
 * 
 */
module.exports = async function(args, task, client) {
  let rows = (await db.migrations.list(client));

  let table = new Table({
    head: [chalk.cyan('Name'), chalk.cyan('State'), chalk.cyan('Date')],
    colWidths: [60, 10, 80]
  });
 

  rows.forEach(row => {
    table.push([row.name, row.state, row.created]);
  });

  console.log(table.toString());
}