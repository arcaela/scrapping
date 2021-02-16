const fs = require('fs');
const cors = require('cors')
const https = require('https');
const express = require('express')




const app = express()
app.use(cors());
app.get('/:cedula', async ({params:{cedula}}, res) =>{
  res.json(
    await require('./index')({ CC:cedula })
  );
});



https.createServer({
  key: fs.readFileSync('/etc/letsencrypt/live/aurorajs.ml/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/aurorajs.ml/fullchain.pem'),
}, app).listen(3000);