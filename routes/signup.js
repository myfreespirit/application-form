const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Signup = require('../models/signup.js');

/* GET ALL SIGNUPS FOR A SINGLE WALLET */
router.get('/:wallet', function (req, res, next) {
  Signup.find({ wallet: req.params['wallet'] }, (err, document) => {
    if (err) return next(err);
    res.json(document);
  });
});

/* SAVE A SIGNUP FOR A SINGLE WALLET */
router.put('/:wallet/:total/:team', function (req, res, next) {
  const obj = { totalEXRN: req.params['total'], teamEXRN: req.params['team'] };
  Signup.findOneAndUpdate({ wallet: req.params['wallet'] },
                          { $push: { signups: obj } },
                          { upsert: true, new : true },
                          (err, document) => {
    if (err) return next(err);
    res.json(document);
  });
});

module.exports = router;
