'use strict';

/***********************************************************************************************************************************************
 * @LIVEAXLE/NODE-PG-MIGRATE - SPEC
 ***********************************************************************************************************************************************
 * @description
 */
const path = require('path');
const Mocha = require('mocha');
const fs = require('fs');
const mocha = new Mocha({reporter: 'mochawesome', fullTrace: false});
const args = require('minimist')(process.argv.slice(2));
const {exec} = require('child_process');

/**
 * Global helper api.
 */
global.runner = {
  stub: notYetImplementedStub,
  reset: (cb) => {
    exec('rm -rf ./migrations', () => {
      setTimeout(cb, 1000);
    });
  }
};

//
// SPECS
//------------------------------------------------------------------------------------------//
// @description
//
const specs = {
  migrate: path.join(__dirname, 'migrate.js')
};

//
// RUNNER
//------------------------------------------------------------------------------------------//
// @description
Object.keys(specs).forEach(spec => mocha.addFile(specs[spec]));

// Run specs
mocha.run((failures=0) => {
  // essentially, for CI we can opt in to break the process on test fails,
  //but for dev it's a little tedious
  if(!args['brk-failures']) return;

  process.on('exit', function () {
    process.exit(failures);  // exit with non-zero status if there were failures - mainly for CI.
  });
});


//
// RUNNER HELPERS
//------------------------------------------------------------------------------------------//
// @description
//
function notYetImplementedStub(done) {
  throw new Error('Test not yet implemented');
  // done();
}