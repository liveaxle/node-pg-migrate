'use	strict';

/***********************************************************************************************************************************************
  MIGRATE SPEC
  ***********************************************************************************************************************************************
  *	@description
  */
const chai = require('chai');
const path = require('path');
const fs = require('fs');
const {exec} = require('child_process');

//
// Chai constants
//------------------------------------------------------------------------------------------//
// @description
//
const expect = chai.expect;
const assert = chai.assert;


function reset(cb) {
  exec('rm -rf ./migrations', () => {
    setTimeout(() => {
      cb();
    }, 250);
  });
}
  
  
/**
 * 
 */
describe('Migrate', () => {

  before((done) => {
    reset(done);
  });

  describe('Create',  () => {
    it('Should create a migration with a timestamp.',  (done) => {
      exec('node ./ create timestamp', (err, stdout, stderr) => {
        let file =  stdout.match(/[0-9].*.timestamp.migration.js/gi);

        assert.lengthOf(file, 1, 'File was not created.');
        assert.isNumber(parseInt(file[0].split('.')[0]));

        reset(done);
      });
    });

    it('Should create an ordered migration.',  (done) => {
      exec('node ./ create ordered --ordering sequential', (err, stdout, stderr) => {
        let matched = stdout.match(/01.ordered.migration.js/gi);

        assert.lengthOf(matched, 1, 'File was not created.');
        done();
      });
    });

    it('Should create an ordered migration and it should be numbered after the previous one.',  (done) => {
      exec('node ./ create ordered --ordering=sequential', (err, stdout, stderr) => {
        let matched = stdout.match(/02.ordered.migration.js/gi);

        assert.lengthOf(matched, 1, 'File was not created.');
        done();
      });
    });

    it('Should run up created migrations - sequential' ,(done) => {
      exec('node ./ up --directory=./test/migrations/sequential --ordering=sequential', (err, stdout, stderr) => {
        done();
      })
    });

    it('Should list migrations' ,(done) => {
      exec('node ./ list', (err, stdout, stderr) => {
        done();
      })
    });
  });
});