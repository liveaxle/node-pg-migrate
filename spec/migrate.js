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

/**
 * 
 */
describe('Migrate', () => {

  before((done) => {
    global.runner.reset(done);
  });

  describe('Create',  () => {
    it('Should create a migration with a timestamp.',  (done) => {
      exec('node ./ create timestamp', (err, stdout, stderr) => {
        let file =  stdout.match(/[0-9].*.timestamp.migration.js/gi);

        assert.lengthOf(file, 1, 'File was not created.');
        assert.isNumber(parseInt(file[0].split('.')[0]));

        global.runner.reset(done);
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

    it('Should run created migrations' ,(done) => {
      exec('node ./ up --user=postgres', (err, stdout, stderr) => {
        console.log(err, stdout, stderr);
      })
    });
  });
});