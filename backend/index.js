const express = require('express')
const app = express()
const port = 3000
const pgconnect = require('./pgconnect.js');

app.get('/', (req, res) => {
  res.send('Not implemented')
})

app.get('/temp-db-table-list', (req, res) => {
  pgconnect.getTableNames().then(tabRes => {
    res.send(tabRes);
  });
})

app.get('/temp-db-schema', (req, res) => {
  pgconnect.getTableInfo().then(tabRes => {
    res.send(tabRes);
  });
})

app.listen(port, () => {
  console.log(`Background app listening at http://localhost:${port}`)
})