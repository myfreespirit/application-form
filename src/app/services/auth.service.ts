import { Injectable, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { AUTH_CONFIG } from '../auth0-variables';
import { of, timer } from 'rxjs';
import { flatMap } from 'rxjs/operators';
import auth0 from 'auth0-js';


@Injectable()
export class AuthService {

  userProfile: any;
  refreshSubscription: any;
  requestedScopes: string = 'openid';

  auth0 = new auth0.WebAuth({
    clientID: AUTH_CONFIG.clientID,
    domain: AUTH_CONFIG.domain,
    responseType: 'token id_token',
    redirectUri: AUTH_CONFIG.callbackURL
  });

  constructor(@Inject(Router) public router: Router) {
  }

  public login(): void {
    this.auth0.authorize();
  }

  public handleAuthentication(): void {
    this.auth0.parseHash((err, authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        window.location.hash = '';
        this.setSession(authResult);
        this.router.navigate(['/admin']);
      } else if (err) {
        this.router.navigate(['/admin']);
        console.log(err);
        alert('Error: ${err.error}. Check the console for further details.');
      }
    });
  }

  private setSession(authResult): void {
    // Set the time that the Access Token will expire at
    const expiresAt = JSON.stringify((authResult.expiresIn * 1000) + new Date().getTime());

    // If there is a value on the `scope` param from the authResult,
    // use it to set scopes in the session for the user. Otherwise
    // use the scopes as requested. If no scopes were requested,
    // set it to nothing
    const scopes = authResult.scope || this.requestedScopes || '';

    localStorage.setItem('access_token', authResult.accessToken);
    localStorage.setItem('id_token', authResult.idToken);
    localStorage.setItem('expires_at', expiresAt);
    localStorage.setItem('scopes', JSON.stringify(scopes));
    this.scheduleRenewal();
  }

  public logout(): void {
    // Remove tokens and expiry time from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('expires_at');
    localStorage.removeItem('scopes');
    // Go back to the home route
    this.router.navigate(['/admin']);
  }

  public isAuthenticated(): boolean {
    // Check whether the current time is past the
    // Access Token's expiry time
    const expiresAt = JSON.parse(localStorage.getItem('expires_at'));
    return new Date().getTime() < expiresAt;
  }

  public userHasScopes(scopes: Array<string>): boolean {
    const grantedScopes = JSON.parse(localStorage.getItem('scopes')).split(' ');
    return scopes.every(scope => grantedScopes.includes(scope));
  }

  public renewToken() {
    this.auth0.checkSession({
        audience: AUTH_CONFIG.apiUrl
      }, (err, result) => {
        if (!err) {
          this.setSession(result);
        }
      }
    );
  }

  public scheduleRenewal() {
    if (!this.isAuthenticated()) return;

    const expiresAt = JSON.parse(window.localStorage.getItem('expires_at'));

    const source = of(expiresAt).pipe(
    	flatMap(
	      expiresAt => {

		const now = Date.now();

		// Use the delay in a timer to
		// run the refresh at the proper time
		var refreshAt = expiresAt - (1000 * 30); // Refresh 30 seconds before expiry
		return timer(Math.max(1, refreshAt - now));
	})
    );

    // Once the delay time from above is
    // reached, get a new JWT and schedule
    // additional refreshes
    this.refreshSubscription = source.subscribe(() => {
      this.renewToken();
    });
  }

  public unscheduleRenewal() {
    if (!this.refreshSubscription) return;
    this.refreshSubscription.unsubscribe();
  }
}
