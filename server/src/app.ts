/*
 * Installs express server that will be responsible for internal API calls.
 */
import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as logger from 'morgan';
import * as mongoose from 'mongoose';
import * as path from 'path';
import cron from './cronJobs/Controller';

import signups from './routes/signups/Controller';
import ethers from './routes/ethers/Controller';
import transfers from './routes/transfers/Controller';


class App {

	constructor() {
		this.app = express();
		this.config();
		this.routes();
		cron.init();
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
		this.app.use(bodyParser.json({ limit: '50mb' }));
		this.app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

		this.app.use(logger('dev'));
	}

	private routes() {
		// Serve only the static files from the dist directory
		this.app.use(express.static(path.resolve('dist')));

		this.app.use('/signups', signups.routes());
		this.app.use('/ethers', ethers.routes());
		this.app.use('/transfers', transfers.routes());

		this.app.use((req, res) => res.sendFile(path.resolve('dist/index.html')));
	}
}


export default new App().app;
