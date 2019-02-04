interface AuthConfig {
  clientID: string;
  domain: string;
  callbackURL: string;
  apiUrl: string;
}

export const AUTH_CONFIG: AuthConfig = {
  clientID: 'QacT9hipz4g06kUuzTr_NurHE4vcjkNB',
  domain: 'delicate-silence-4570.eu.auth0.com',
  callbackURL: 'https://testeddefault.herokuapp.com/admin',
  apiUrl: 'https://delicate-silence-4570.eu.auth0.com/api/v2/'
};
