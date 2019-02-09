import * as express from 'express';
import { Testnet } from '../../models/testnet';
import { exec } from 'child_process';


class Controller {

  private router: any;

  constructor() {
    this.router = express.Router();
  }

  public routes() {
	// retrieve testnet registrations by wallet
	this.router.get('/wallet/:wallet', (req, res, next) => {
	Testnet.find({ wallet: req.params['wallet'] }, 'wallet states', (err, document) => {
		    if (err) return next(err);
		    res.json(document);
		});
	});


	// retrieve testnet registrations by username 
	this.router.get('/username/:username', (req, res, next) => {
		Testnet.find({ username: req.params['username'] }, 'username', (err, document) => {
		    if (err) return next(err);
		    res.json(document);
		});
	});


	// save registration details for a given wallet
	this.router.put('/save', (req, res, next) => {
		let obj = {};
		obj['wallet'] = req.body['wallet'];
		obj['telegram'] = req.body['telegram'];
		obj['username'] = req.body['username'];
		obj['hash'] = req.body['hash'];
		obj['motivation'] = req.body['motivation'];
		obj['states'] = [ {status: 'APPLIED', telegram: req.body['telegram']} ];

		Testnet.findOneAndUpdate({ wallet: req.body['wallet'] },
					{ $set: obj },
					{ upsert: true, new: true },
					(err, document) => {
						if (err) return next(err);
						res.json(document);
		});
	});


	// save registration reset request for a given wallet and telegram username
	this.router.put('/reset/request', (req, res, next) => {
		let state = { status: 'RESET REQUEST', telegram: req.body['telegram'] };

		Testnet.findOneAndUpdate({ wallet: req.body['wallet'] },
					{ $push: { states: state } },
					{ upsert: true, new: true },
					(err, document) => {
						if (err) return next(err);
						res.json(document);
		});
	});


	this.router.post('/hash/', (req, res, next) => {
		exec('openssl passwd -apr1 -salt ' + req.body['salt'] + ' ' + req.body['pass'], (err, out) => {
			if (err) {
				console.error(err)
				next(err);
			} else {
				//console.log(out)
				res.json(out);
			}
		})
	});


	return this.router;
  }
}

export default new Controller();
