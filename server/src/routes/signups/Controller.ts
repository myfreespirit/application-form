import * as express from 'express';
import { Round } from '../../models/round';
import { Signup } from '../../models/signup';
import { Md5 } from 'ts-md5/dist/md5';


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


	// retrieve most recent signup after a specific date for each wallet
	this.router.get('/after/:date', (req, res, next) => {
	  Signup.find({}, { 'signups': { '$slice': -1 } })
		.then(documents => {
			documents = documents.filter(entry => {
				return entry.signups[0].date > req.params['date'];
			}).map(entry => {
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


	// retrieve all signups for a given wallet
	this.router.get('/:wallet', (req, res, next) => {
	  Signup.find({ wallet: req.params['wallet'] }, (err, document) => {
	    if (err) return next(err);
	    res.json(document);
	  });
	});


	// save signup details for given wallet
	this.router.put('/save/:wallet/:totalEXRN/:teamEXRN', (req, res, next) => {
	  let endOfRound = 0;

	  Round.find({ }, (err, documents) => {
	    if (err) return next(err);

	    endOfRound = documents[documents.length - 1].end;
            if (+new Date() > +new Date(endOfRound)) {
		return res.status(403).send("Round was already closed - update your local clock please!");
            }

	    const obj = { totalEXRN: req.params['totalEXRN'], teamEXRN: req.params['teamEXRN'], md5HashedIP: Md5.hashStr(req.ip) };
            Signup.findOneAndUpdate({ wallet: req.params['wallet'] },
					  { $push: { signups: obj } },
					  { upsert: true, new : true },
					  (err, document) => {
		if (err) return next(err);
		res.json(document);
	    });
          });
	});


	// save transfers of a given wallet
	this.router.put('/transfers/save/:wallet', (req, res, next) => {
		if (req.body['result'] == null) {
			res.json("BAD api call");
			// TODO handle
			return;
		}

		if (req.body['result'].length === 0) {
			res.json("OK transfers empty");
			return;
		}
		
		let bulk = Signup.collection.initializeOrderedBulkOp();

		req.body['result'].forEach(transfer => {
			let obj = {
				blockNumber: transfer.blockNumber,
				timeStamp: transfer.timeStamp,
				from: transfer.from,
				to: transfer.to,
				value: transfer.value
			};

			bulk.find({ wallet: req.params['wallet'] })
			    .update({ $push: { moves: obj } });
		});

		bulk.execute(err => {
			if (err) return next(err);
			res.json("OK transfer bulk");
		});
	});


	// retrieve all transfers of given wallet
	this.router.get('/transfers/:wallet', (req, res, next) => {
	  Signup.find({ 'wallet': req.params['wallet'] }, { 'wallet': 1, 'moves': 1 })
		.then(documents => {
			console.log("routes", JSON.stringify("transfers after update", documents));
			/*
			documents = documents.map(entry => {
				let obj = {
					wallet: entry.wallet,
					blockNumber: entry.moves[0] ? entry.moves[0].blockNumber + 1 : 0,
					moves: entry.moves
				};
				return obj;
			});
			*/
			res.json(documents);
		})
		.catch(err => next(err));
	});



	return this.router;
  }
}

export default new Controller();
