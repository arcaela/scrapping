const express = require('express')
const cors = require('cors')
const app = express()
const findClient = require('./plugins/cne')


app.use(cors());
app.use(async ({path}, res, next) =>{

  console.log(path)
  if(!path.match(/\d+/gi)) next();
  else res.json(await findClient(path));
});

app.listen(8080, console.log);
// server = require('http').createServer(app)
// server.listen(8080, console.log);