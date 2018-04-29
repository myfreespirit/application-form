//Install express server
const express = require('express');
const path = require('path');
const logger = require('morgan');
const mongoose = require('mongoose');
const signups = require('./routes/signup');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/exrn')
  .then(() => console.log('db connection succesful'))
  .catch((err) => console.error(err));

const app = express();
app.use(logger('dev'));

// Serve only the static files form the dist directory
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/signups', signups);

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
