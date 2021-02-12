const express = require('express')
const cors = require('cors')
const app = express()
const findClient = require('./plugins/cne')


app.use(cors());
app.get('/:cedula', async ({params:{cedula}}, res) =>{
    res.json(await findClient(cedula));
});
// app.listen(8080, () => {
//   console.log('CORS-enabled web server listening on port 80')
// })

server = require('http').createServer(app)
server.listen(443, console.log);