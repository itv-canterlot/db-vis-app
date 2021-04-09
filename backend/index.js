const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Not implemented')
})

app.listen(port, () => {
  console.log(`Background app listening at http://localhost:${port}`)
})