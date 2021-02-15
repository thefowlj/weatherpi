/*
  weatherpi.js
*/

const express = require('express');
const server = express();
const http = require('http').createServer(server);
const dotenv = require('dotenv');
const db = require('diskdb');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// requires a .env file to be created
try {
  dotenv.config();
} catch(e) {
  console.log('.env not configured');
}

// .env file should include PORT=#
const port = process.env.PORT == undefined ? 4000 : process.env.PORT;

server.use(express.json());
server.use(express.static('public'));

try {
  if (!fs.existsSync(path.join(__dirname, 'db'))) {
    fs.mkdirSync(path.join(__dirname, 'db'));
  }
  db.connect('db', ['temperature']);
} catch(e) {
  console.log('An error occured accessing database')
}

/*
  JSON data should include temp key with a value that is a valid number
  Other key/value pairs can be included
  A UNIX timestamp will be added automatically when saving to the db
*/
server.post('/temp/', (req, res) => {
  let reqBody = req.body;
  if(typeof reqBody.temp == 'number') {
    reqBody.ts = Date.now();
    console.log(reqBody);
    db.temperature.save(reqBody);
    res.json({ status: 1, msg: 'data added'});
  } else {
    let response =  { status: 0, msg: 'data not valid', body: reqBody };
    console.log(response);
    res.json(response);
  }
});

/*
  Return all entries in the temperature db
*/
server.get('/temp/all', (req, res) => {
  res.json(db.temperature.find());
});

/*
  Return the most recent measurement posted to the database, based on timestamp.
*/
server.get('/temp/latest', (req, res) => {
  res.json(
    db.temperature.find().sort((a, b) => {
      return b.ts - a.ts
    }
  )[0]);
});

server.listen(port, () => {
  console.log(`Server listening at ${port}`);
});
