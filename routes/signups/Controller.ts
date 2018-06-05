import * as express from 'express';
import { Signup } from '../../models/signup';


class Controller {

  private router: any;

  constructor() {
    this.router = express.Router();
  }

  public routes() {
	// retrieve most recent signup for each wallet
	this.router.get('/all', (req, res, next) => {
	  Signup.find({}, { 'signups': { '$slice': -1 } })
		.then(documents => {
			documents = documents.map(entry => {
				let obj = {
					wallet: entry.wallet,
					date: entry.signups[0].date,
					total: entry.signups[0].totalEXRN,
					team: entry.signups[0].teamEXRN
				};

				return obj;
			});
			res.json(documents);
		})
		.catch(err => next(err));
	});


	// retrieve block / time of most recent transfer for each wallet
	this.router.get('/transfers', (req, res, next) => {
	  Signup.find({}, { 'wallet': 1, 'moves': { '$slice': -1 } })
		.then(documents => {
			documents = documents.map(entry => {
				let obj = {
					wallet: entry.wallet,
					blockNumber: entry.moves[0].blockNumber,
					timeStamp: entry.moves[0].timeStamp
				};

				return obj;
			});
			res.json(documents);
		})
		.catch(err => next(err));
	});


	// retrieve all signups for a given wallet
	this.router.get('/:wallet', (req, res, next) => {
	  Signup.find({ wallet: req.params['wallet'] }, (err, document) => {
	    if (err) return next(err);
	    res.json(document);
	  });
	});


	// save signup details for given wallet
	this.router.put('/save/:wallet/:totalEXRN/:teamEXRN', (req, res, next) => {
	  const obj = { totalEXRN: req.params['totalEXRN'], teamEXRN: req.params['teamEXRN'] };

	  Signup.findOneAndUpdate({ wallet: req.params['wallet'] },
				  { $push: { signups: obj } },
				  { upsert: true, new : true },
				  (err, document) => {
	    if (err) return next(err);
	    res.json(document);
	  });
	});


	return this.router;
  }
}

export default new Controller();
