/*
  weatherpi.js
*/

const express = require('express');
const server = express();
const http = require('http').createServer(server);
const io = require('socket.io')(http);
const dotenv = require('dotenv');
const db = require('diskdb');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const fetch = require ('node-fetch');

// requires a .env file to be created
try {
  dotenv.config();
} catch(e) {
  console.log('.env not configured');
}

/*
  .env file should include:
  PORT={integer}
  NOAA_URL={string}
  NOAA_INTERVAL={integer}
*/
const port = process.env.PORT == undefined ? 4000 : process.env.PORT;
const noaaUrl = process.env.NOAA_URL;
const noaaInterval = process.env.NOAA_INTERVAL == undefined ? 60000 : process.env.NOAA_INTERVAL;
const secondsInDay = 86400000;

server.use(express.json());
server.use(express.static('public'));

try {
  if (!fs.existsSync(path.join(__dirname, 'db'))) {
    fs.mkdirSync(path.join(__dirname, 'db'));
  }
  db.connect('db', ['temperature']);
} catch(e) {
  console.log('An error occured accessing database');
}

/*
  Retreives data from NOAA/NWS at regular intervals.
  Uses the api.wather.gov/grindpoints endpoint to retreive hourly forecast data.
  https://www.weather.gov/documentation/services-web-api#/default/get_gridpoints__wfo___x___y__forecast_hourly
*/
let noaaCurrent = null;
if(noaaUrl != undefined) {
  fetchNOAA();
  setInterval(fetchNOAA, noaaInterval);
}

/*
  Fetch data from NOAA/NWS
*/
function fetchNOAA() {
  fetch(noaaUrl)
    .then(res => res.json())
    .then(json => parseNOAA(json));
}

/*
  Parse data from NOAA/NWS
*/
function parseNOAA(json) {
  let date = new Date();
  let periods = json.properties.periods;
  let current = periods.filter((x) => {
    let start = new Date(x.startTime);
    let end = new Date(x.endTime);
    return start <= date && end >= date;
  });
  noaaCurrent = current[0];
  console.log(noaaCurrent);
}

/*
  JSON data should include temp key with a value that is a valid number
  Other key/value pairs can be included
  A UNIX timestamp will be added automatically when saving to the db
*/
server.post('/temp/', (req, res) => {
  let reqBody = req.body;
  if(typeof reqBody.temp == 'number') {
    let date = Date.now();
    reqBody.noaaTemp = noaaCurrent.temperature;
    reqBody.ts = date;
    console.log(reqBody);
    db.temperature.save(reqBody);
    res.json({ status: 1, msg: 'data added'});
    io.emit('tempUpdate', reqBody);
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

/*
  Return the last 24 hours of data.
*/
server.get('/temp/24hours', (req, res) => {
  let date = Date.now() - secondsInDay;
  let output = db.temperature.find().filter((x) => {
    return x.ts >= date;
  });
  res.json(output);
});

/*
  Return html page for most recent posted temperature
*/
server.get('/latest', (req, res) => {
  res.sendFile('public/latest.html', {root: __dirname});
});

io.on('connection', (socket) => {
  console.log(socket.id);
});

http.listen(port, () => {
  console.log(`Server listening at ${port}`);
});
