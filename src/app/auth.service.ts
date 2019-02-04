import { Injectable, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import * as auth0 from 'auth0-js';

@Injectable()
export class AuthService {

  private _idToken: string;
  private _accessToken: string;
  private _expiresAt: number;

  auth0 = new auth0.WebAuth({
    clientID: 'QacT9hipz4g06kUuzTr_NurHE4vcjkNB',
    domain: 'delicate-silence-4570.eu.auth0.com',
    responseType: 'token id_token',
    redirectUri: 'https://testeddefault.herokuapp.com/admin',
    scope: 'openid'
  });


  constructor(@Inject(Router) public router: Router) {
    this._idToken = '';
    this._accessToken = '';
    this._expiresAt = 0;
  }


  get accessToken(): string {
    return this._accessToken;
  }


  get idToken(): string {
    return this._idToken;
  }


  public login(): void {
    this.auth0.authorize();
  }


  public handleAuthentication(): void {
    this.auth0.parseHash((err, authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        window.location.hash = '';
        this.localLogin(authResult);
        this.router.navigate(['/admin']);
      } else if (err) {
        this.router.navigate(['/admin']);
        console.log(err);
      }
    });
  }


  private localLogin(authResult): void {
    localStorage.setItem('isLoggedIn', 'true');
    
    this._accessToken = authResult.accessToken;
    this._idToken = authResult.idToken;
    this._expiresAt = (authResult.expiresIn * 1000) + new Date().getTime();
  }


  public renewTokens(): void {
    this.auth0.checkSession({}, (err, authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        this.localLogin(authResult);
      } else if (err) {
        alert(`Could not get a new token (${err.error}: ${err.error_description}).`);
        this.logout();
      }
    });
  }


  public logout(): void {
    this._accessToken = '';
    this._idToken = '';
    this._expiresAt = 0;
    
    localStorage.removeItem('isLoggedIn');

    this.router.navigate(['/admin']);
  }


  public isAuthenticated(): boolean {
    return new Date().getTime() < this._expiresAt;
  }
}
