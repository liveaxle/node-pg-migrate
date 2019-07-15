'use	strict';

/***********************************************************************************************************************************************
  MIGRATE SPEC
  ***********************************************************************************************************************************************
  *	@description
  */
const chai = require('chai');
const path = require('path');
const dotenv = require('dotenv').config({path: path.join(process.cwd(), '.env')});
const fs = require('fs');
const {exec} = require('child_process');
const {client} = require('../db');
const args = require('minimist')(process.argv.slice(2));

console.log(args)
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
    exec('pwd && ls -l', (err, stdout) => {
      console.log(stdout)
    })
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

    it('Should run up created migrations - sequential' , (done) => {
      exec('node ./ up --directory=test/migrations/sequential --ordering=sequential', (err, stdout, stderr) => {
        let db = client(args);
        console.log(err);
        console.log(stdout);
        console.log(stderr);
        
        db.schema.raw(`SELECT * FROM pg_catalog.pg_tables;`).then(res => {console.log(res)});

        db('users').select('*').then(rows => {
          assert.lengthOf(rows, 3);
        }).then(() => {
          return db('books').select('*');
        }).then(rows => {
          assert.lengthOf(rows, 3);
        }).then(() => {
          return db('authors').select('*');
        }).then(rows => {
          assert.lengthOf(rows, 3);
        }).then(done).catch(e => {
          console.log(e.message);
        });;
      })
    });

    it('Should should skip any migrations that have already been executed - sequential' , (done) => {
      exec('node ./ up --directory=test/migrations/sequential --ordering=sequential', (err, stdout, stderr) => {
        let db = client(args);

        db('users').select('*').then(rows => {
          assert.lengthOf(rows, 3);
        }).then(() => {
          return db('books').select('*');
        }).then(rows => {
          assert.lengthOf(rows, 3);
        }).then(() => {
          return db('authors').select('*');
        }).then(rows => {
          assert.lengthOf(rows, 3);
        }).then(done).catch(e => {
          console.log(e.message);
          
        });
      })
    });

    it('Should run down migrations - sequential' , (done) => {
      exec('node ./ down --directory=test/migrations/sequential --ordering=sequential', (err, stdout, stderr) => {
        let db = client(args);

        db('users').select('*').then(rows => {
          if(rows.length) throw new Error('Users Table was not dropped - down migration unsuccessful');
        }, (e) => {
          assert.isNotNull(e);
        });
        
        db('books').select('*').then(rows => {
          if(rows.length) throw new Error('Users Table was not dropped - down migration unsuccessful');
        }, (e) => {
          assert.isNotNull(e);
        });

        db('authors').select('*').then(rows => {
          if(rows.length) throw new Error('Users Table was not dropped - down migration unsuccessful');
        }, (e) => {
          assert.isNotNull(e);
        }).then(done);
      })
    });


    it('Should list migrations' ,() => {
      exec('node ./ list', (err, stdout, stderr) => {
        assert.isNotNull(stdout.match(/users/gi))
        assert.isNotNull(stdout.match(/books/gi))
        assert.isNotNull(stdout.match(/authors/gi));
        process.exit(0)
      })
    });
  });
});