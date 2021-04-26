const express = require('express');

const app = express()
const port = 3000
const pgconnect = require('./pgconnect.js');
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Not implemented')
});

app.get('/tables', (_, webRes) => {
  console.debug("GET /tables")
  pgconnect.getTableMetatdata().then(tabRes => {
    webRes.send(tabRes);
  });
});

app.get('/temp-db-table-list', (req, res) => {
  pgconnect.getTableNames().then(tabRes => {
    res.send(tabRes);
  });
});

app.get('/temp-db-schema', (req, res) => {
  pgconnect.getTableInfo().then(tabRes => {
    res.send(tabRes);
  });
});

app.post('/temp-data-table-name-fields', (req, res) => {
  let fields = req.body["fields"];
  let tableName = req.body["tableName"];
  if (!fields || !tableName) {
    return res.status(400).json("Input format error");
  }

  pgconnect.getDataByTableNameAndFields(tableName, fields).then(tabRes => {
    if (tabRes instanceof Error) {
      return res.status(402).json("Internal error: " + tabRes.message);
    }
    else {
      return res.send(tabRes);
    }
  });
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
  })
})

app.get('/table-attributes', (req, webRes) => {
  console.debug("GET /table-attributes")
  pgconnect.getTableAttributes(req.body["oid"]).then(tabRes => {
    webRes.send(tabRes);
  });
});

app.listen(port, () => {
  console.log(`Background app listening at http://localhost:${port}`)
})