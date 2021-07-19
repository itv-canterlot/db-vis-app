const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch')

const app = express()
const port = 3000
const pgconnect = require('./pgconnect.js');
app.use(express.json());

const currentPath = path.resolve(__dirname);

app.get('/', (req, res) => {
  res.send('Not implemented')
});

app.get('/tables', (_, webRes, next) => {
  console.debug("GET /tables")
  pgconnect.getTableMetatdata().then(tabRes => {
    webRes.send(tabRes);
  }).catch(err => {
    next(new ErrorHandler(503, err.message))
  });

});

app.post('/table-dist-counts', (req, res) => {
  console.debug("POST /table-dist-counts")
  let reqBody = req.body;
  pgconnect.getTableDistinctColumnCountByColumnName(reqBody["tableName"], reqBody["columnNames"]).then(tabRes => {
    res.send(tabRes);
  });
});

app.post('/data-match-attrs', async (req, res, next) => {
  console.debug("POST /data-match-attrs")
  try {
    let {attrs, foreignKeys, parentTableName, primaryKeys} = req.body;
    pgconnect.getDataMultiTable(attrs, foreignKeys, parentTableName, primaryKeys)
      .then(tabRes => {
        if (tabRes instanceof Error) {
          next(new ErrorHandler(500, tabRes.message));
        }
        else {
          return res.send(tabRes);
        }
      })
      .catch(err => {
        next(new ErrorHandler(500, err.message))
      });
  } catch (err) {
    next(new ErrorHandler(500, err.message));
  }
});

app.post('/test-test-test', async (req, res, next) => {
  console.debug("POST /test-test-test")
  try {
    let {foreignKeys, primaryKeys, tableNames} = req.body;
    console.log(primaryKeys);
    console.log(tableNames)
    pgconnect.getDataRelationshipBased(undefined, foreignKeys, tableNames, primaryKeys)
      .then(tabRes => {

      })
  } catch (err) {
    next(new ErrorHandler(500, err.message));
  }
});

app.post('/temp-db-table-foreign-keys', (req, res) => {
  var baseResponse = {};
  pgconnect.getTableForeignKeys(req.body["oid"]).then(tabRes => {
    baseResponse["tableForeignKeys"] = tabRes;
    return pgconnect.getTableAttributes(req.body["oid"]);
  }).then(attrRes => {
    baseResponse["tableAttributes"] = attrRes;
    return pgconnect.getTablePrimaryKeys(req.body["oid"]);
  }).then(attrRes => {
    // Attributes for the current table
    baseResponse["tablePrimaryKeys"] = attrRes;
    
    // Generating attributes for the corresponding referenced tables
    var attrPromises = [];

    baseResponse["tableForeignKeys"].forEach((val => {
      let foreignTableOID = val["confrelid"];      
      attrPromises.push(pgconnect.getTableAttributes(foreignTableOID));
    }));
    
    return Promise.all(attrPromises);
  }).then(attrRes => {
    // Filter the list of attributes based on foreign key, and affix to response
    attrRes = attrRes.map((val, idx) => {
      let foreignTableKey = baseResponse["tableForeignKeys"][idx]["confkey"];
      foreignTableKey = foreignTableKey.map(v => v - 1); // pgsql is 1-indexed
      return val.filter((_, attrIdx) => foreignTableKey.some(ftki => ftki == attrIdx));
    })
    baseResponse["frelAtts"] = attrRes;
    res.send(baseResponse);
  }).catch(err => {
    next(new ErrorHandler(500, err.message));
  });
})

app.get('/table-attributes', (req, webRes) => {
  console.debug("GET /table-attributes")
  try {
    pgconnect.getTableAttributes(req.body["oid"]).then(tabRes => {
      webRes.send(tabRes);
    }).catch(err => {
      next(new ErrorHandler(500, err.message));
    });
  } catch (err) {
    next(err);
  }
});

app.get('/vis-encodings', (req, res) => {
  console.debug("GET /vis-encodings");
  const encodingPath = currentPath + "/vis-encodings/";

  fs.readdir(encodingPath)
    .then((files => {
      return Promise.all(
        files.map(f => {
          return fs.lstat(encodingPath + f).then(stat => {
            if (stat.isFile()) {
              if (!f.endsWith(".json")) return null;
              return fs.readFile(encodingPath + f, {encoding: 'utf8'})
            } else {
              return null;
            }
          })
        }))
    })).then(files => {
      const ret = files
        .filter(f => f != null)
        .map(f => JSON.parse(f));
      res.send(ret);
    }).catch(err => {
      next(new ErrorHandler(500, err.message));
    });
})

app.use((err, req, res, next) => {
  handleError(err, res);
})

app.listen(port, () => {
  console.log(`Background app listening at http://localhost:${port}`)
})

class ErrorHandler extends Error {
  constructor(statusCode, message) {
    super();
    this.statusCode = statusCode;
    this.message = message;
  }
}

const handleError = (err, res) => {
  const {statusCode, message} = err;
  res.status(statusCode).json({
    status: "error",
    statusCode,
    message
  })
}