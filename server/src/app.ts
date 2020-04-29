/*
 * Installs express server that will be responsible for internal API calls.
 */
import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as expressJwt from 'express-jwt';
import * as jwt from 'jsonwebtoken';
import * as jwks from 'jwks-rsa';
import * as logger from 'morgan';
import * as mongoose from 'mongoose';
import * as path from 'path';

import api from './routes/api/Controller';
import backends from './routes/backends/Controller';
import balances from './routes/balances/Controller';
import cron from './routes/cron/Controller';
import ethers from './routes/ethers/Controller';
import prices from './routes/prices/Controller';
import rounds from './routes/rounds/Controller';
import signups from './routes/signups/Controller';
import testnet from './routes/testnet/Controller';
import transfers from './routes/transfers/Controller';

import * as dotenv from "dotenv";
dotenv.config({path:'.env'});

class App {
	jwksJsonUri = (process.env.AUTH0_DOMAIN !== undefined ?
				'https://' + process.env.AUTH0_DOMAIN + '/.well-known/jwks.json' :
				'https://delicate-silence-4570.eu.auth0.com/.well-known/jwks.json')
	jwtCheck = expressJwt({
	    secret: jwks.expressJwtSecret({
		cache: true,
		rateLimit: true,
		jwksRequestsPerMinute: 1000,
		jwksUri: this.jwksJsonUri
	    }),
	    aud: process.env.AUTH0_AUDIENCE,
	    algorithms: ['RS256']
	});

	constructor() {
		this.app = express();

		this.config();
		this.routes();
	}

	public app: express.Application;

	private config() {
		this.app.use((req, res, next) => {
			// Website you wish to allow to connect
			// res.setHeader('Access-Control-Allow-Origin', 'https://signups-exrt.herokuapp.com/');

			// Request methods you wish to allow
			res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

			// Request headers you wish to allow
			res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

			// Set to true if you need the website to include cookies in the requests sent
			// to the API (e.g. in case you use sessions)
			// res.setHeader('Access-Control-Allow-Credentials', <string>'true');

			// Pass to next layer of middleware
			next();
		});


		// parse application/x-www-form-urlencoded & application/json with large limits
		this.app.use(bodyParser.json({ limit: '200mb' }));
		this.app.use(bodyParser.urlencoded({ limit: '200mb', extended: true }));

		this.app.use(logger('dev'));

		this.app.enable('trust proxy');
	}

	private routes() {
		// Serve only the static files from the dist directory
		this.app.use(express.static(path.resolve('dist')));

		this.app.use('/backends', backends.routes());
		this.app.use('/balances', balances.routes());
		this.app.use('/cron', cron.routes());
		this.app.use('/ethers', ethers.routes());
		this.app.use('/prices', prices.routes());
		this.app.use('/rounds', rounds.routes());
		this.app.use('/signups', signups.routes());
		this.app.use('/testnet', testnet.routes());
		this.app.use('/transfers', transfers.routes());
		this.app.use('/api', this.jwtCheck, api.routes());


		this.app.use(function(err, req, res, next) {
		    if(!err) return next();
		    res.status(500).send({ status:"error", message: err.message });
		});

		this.app.use((req, res) => res.sendFile(path.resolve('dist/index.html')));
	}
}


export default new App().app;
