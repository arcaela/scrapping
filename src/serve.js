const fs = require('fs');
const cors = require('cors')
const https = require('https');
const express = require('express')


const app = express()
const findClient = require('./plugins/cne')


app.use(cors());
app.get('/:cedula', async ({params:{cedula}}, res) =>{
    res.json(await findClient(cedula));
});
// app.listen(8080, () => {
//   console.log('CORS-enabled web server listening on port 80')
// })
https.createServer({
  key: fs.readFileSync('/etc/letsencrypt/live/aurorajs.ml/privkey.pem; '),
  cert: fs.readFileSync('/etc/letsencrypt/live/aurorajs.ml/fullchain.pem'),
}, app).listen(3000);