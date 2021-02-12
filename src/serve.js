const express = require('express')
const cors = require('cors')
const app = express()
const findClient = require('./plugins/cne')


app.use(cors());
app.get('/:cedula',async ({params:{cedula}}, res, next) =>{
  if(!cedula.match(/\d+/gi)) next();
  else res.json(await findClient(cedula));
});

// app.listen(8080, console.log);
server = require('http').createServer(app)
server.listen(8080, console.log);