const express = require('express')
const cors = require('cors')
const app = express()
const findClient = require('./plugins/cne')


app.use(cors());
app.get('/:cedula', async ({params}, res) =>{
    res.end(await findClient(params.cedula));
});


app.listen(8080, console.log);
// server = require('http').createServer(app)
// server.listen(8080, console.log);