const express = require("express");
const app = express();
const port = process.env.PORT || 3001;
const serviceAccount = require('FIREBASE_ENV.json');

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Allow requests from any origin
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get("/", (req, res) => res.send({"message": "hello fucker"}));

const test = process.env.TEST;
app.get('/test', (req, res) => {
  res.send({"testEnv": test});
  console.log(typeof serviceAccount);
  console.log(serviceAccount);
});

const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;

