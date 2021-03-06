const fs = require('fs');
const cors = require('cors')
const https = require('https');
const express = require('express')




const app = express()
app.use(cors());
app.get('/:cedula', async ({params:{cedula}}, res) =>{
  if(cedula.match(/^\d+$/))
    res.json( await require('./index')({ cedula }) );
  else res.end("");
});



https.createServer({
  key: fs.readFileSync('/etc/letsencrypt/live/api-dimelo.ml/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/api-dimelo.ml/fullchain.pem'),
}, app).listen(3000);