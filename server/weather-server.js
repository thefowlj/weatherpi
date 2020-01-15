/*
  weatherpi.js
*/

const express = require('express');
const server = express();
const http = require('http').createServer(server);
const dotenv = require('dotenv');
const db = require('diskdb');
const bodyParser = require('body-parser');

// requires a .env file to be created
dotenv.config();

// .env file should include PORT=#
const port = process.env.PORT;

server.use(express.json());
server.use(express.static('public'));

db.connect('db', ['temperature']);

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

server.listen(port, () => {
  console.log(`Server listening at ${port}`);
});
