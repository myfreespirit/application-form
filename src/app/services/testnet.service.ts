import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from "rxjs/operators";


@Injectable()
export class TestnetService {

	constructor(@Inject(HttpClient) private http: HttpClient) { }


	getAllRegistrations() {
		return this.http.get('/testnet/all/');
	}


	getApplicationByWallet(wallet: string) {
		return this.http.get('/testnet/wallet/' + wallet.toLowerCase());
	}


	isUsernameTaken(username: string) {
		return this.http.get('/testnet/username/' + username.toLowerCase());
	}


	save(wallet: string, telegram: string, username: string, hash: string, motivation: string) {
		const req = {};
		req['wallet'] = wallet.toLowerCase();
		req['telegram'] = telegram;
		req['username'] = username.toLowerCase();
		req['hash'] = hash;
		req['motivation'] = motivation;

		return this.http.put('/testnet/save/', req);
	}


	hashIt(salt, pass) {
		const req = {};
		req['salt'] = salt;
		req['pass'] = pass;

		return this.http.post('/testnet/hash/', req);
	}


	getHistory(wallet: string) {
		return this.http.get('/testnet/history/' + wallet.toLowerCase());
	}


	resetRequest(wallet: string, telegram: string) {
		const req = {};
		req['wallet'] = wallet.toLowerCase();
		req['telegram'] = telegram;

		return this.http.put('/testnet/reset/request', req);
	}
}
