/*
 * Installs express server that will be responsible for internal API calls.
 */
const bodyParser = require('body-parser');
const express = require('express');
const logger = require('morgan');
const mongoose = require('mongoose');
const path = require('path');

const contributions = require('./routes/contributions');
const distributions = require('./routes/distributions');
const signups = require('./routes/signups');

// database connection preparation
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/exrn')
  .then(() => console.log('db connection succesful'))
  .catch((err) => console.error(err));

const app = express();
app.use(logger('dev'));

// parse application/x-www-form-urlencoded & application/json with large limits
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(bodyParser.json({limit: '50mb'}));

// Serve only the static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/signups', signups);
app.use('/contributions', contributions);
app.use('/distributions', distributions);

app.use((req, res) => res.sendfile(__dirname + '/dist/index.html'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
