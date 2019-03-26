import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, timer } from 'rxjs';
import { flatMap } from 'rxjs/operators';
import auth0 from 'auth0-js';


@Injectable()
export class AuthService {

  auth0: any;
  auth0_audience: string;
  refreshSubscription: any;


  constructor(@Inject(Router) public router: Router,
		  @Inject(HttpClient) private http: HttpClient)
  {
  }

  public login(): void {
    this.auth0.authorize();
  }

  public handleAuthentication(): void {
	this.http.get('/backends/auth0').subscribe((data: any) => {
		this.auth0_audience = data.audience;
		this.auth0 = new auth0.WebAuth({
			clientID: data.clientID,
			domain: data.domain,
			responseType: 'token id_token',
			redirectUri: data.redirectUri
		});

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
	});
  }

  private setSession(authResult): void {
    // Set the time that the Access Token will expire at
    const expiresAt = JSON.stringify((authResult.expiresIn * 1000) + new Date().getTime());

    // If there is a value on the `scope` param from the authResult,
    // use it to set scopes in the session for the user. Otherwise
    // use the scopes as requested. If no scopes were requested,
    // set it to nothing
    const scopes = authResult.scope || '';

    if (window.self === window.top) {
	    localStorage.setItem('access_token', authResult.accessToken);
	    localStorage.setItem('id_token', authResult.idToken);
	    localStorage.setItem('expires_at', expiresAt);
	    localStorage.setItem('scopes', JSON.stringify(scopes));
	    this.scheduleRenewal();
    }
  }

  public logout(): void {
    // Remove tokens and expiry time from localStorage

    if (window.self === window.top) {
	    localStorage.removeItem('access_token');
	    localStorage.removeItem('id_token');
	    localStorage.removeItem('expires_at');
	    localStorage.removeItem('scopes');
    }

    // Go back to the home route
    this.router.navigate(['/admin']);
  }

  public isAuthenticated(): boolean {
    if (window.self !== window.top)
        return false;

    // Check whether the current time is past the
    // Access Token's expiry time
    const expiresAt = JSON.parse(localStorage.getItem('expires_at'));
    return new Date().getTime() < expiresAt;
  }

  public userHasScopes(scopes: Array<string>): boolean {
     if (window.self !== window.top)
        return false;

    const grantedScopes = JSON.parse(localStorage.getItem('scopes')).split(' ');
    return scopes.every(scope => grantedScopes.includes(scope));
  }

  public renewToken() {
    this.auth0.checkSession({
        audience: this.auth0_audience
      }, (err, result) => {
        if (!err) {
          this.setSession(result);
        }
      }
    );
  }

  public scheduleRenewal() {
    if (window.self !== window.top)
        return;

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
