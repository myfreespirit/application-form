const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Signup = require('../models/signup.js');


// retrieve most recent signup for each wallet
router.get('/all', (req, res, next) => {
  Signup.find({}, { 'signups': { '$slice': -1 } })
	.then(documents => {
		documents = documents.map(entry => {
			let obj = {};
			obj.wallet = entry.wallet;
			obj.date = entry.signups[0].date;
			obj.total = entry.signups[0].totalEXRN;
			obj.team = entry.signups[0].teamEXRN;

			return obj;
		});
		res.json(documents);
	})
	.catch(err => next(err));
});


// retrieve all signups for a given wallet
router.get('/:wallet', (req, res, next) => {
  Signup.find({ wallet: req.params['wallet'] }, (err, document) => {
    if (err) return next(err);
    res.json(document);
  });
});


// save signup details for given wallet
router.put('/save/:wallet/:totalEXRN/:teamEXRN', (req, res, next) => {
  const obj = { totalEXRN: req.params['totalEXRN'], teamEXRN: req.params['teamEXRN'] };

  Signup.findOneAndUpdate({ wallet: req.params['wallet'] },
                          { $push: { signups: obj } },
                          { upsert: true, new : true },
                          (err, document) => {
    if (err) return next(err);
    res.json(document);
  });
});

module.exports = router;
