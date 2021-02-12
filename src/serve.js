const express = require('express')
const cors = require('cors')
const app = express()
const findClient = require('./plugins/cne')


app.use(cors());
app.get('/:cedula', async ({params}, res) =>{
  if(!isNaN(params.cedula*1))
    res.json(await findClient(params.cedula));
  else res.end(null);
});
// app.listen(8080, () => {
//   console.log('CORS-enabled web server listening on port 80')
// })

server = require('http').createServer(app)
server.listen(8080, console.log);