"use strict";

const app = require('./app.js');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

mongoose.connect(
  process.env.MONGODB_URI,
  {
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(db => {
    console.log('DB is connected.');
    
    // Starting the server
    try {
      app.listen(process.env.SERVER_PORT, () => {
        console.log(`Server on port ${process.env.SERVER_PORT}.`);
      });
    } catch (e) {
      console.error(e);
    }
  })
  .catch(err => console.error(err));