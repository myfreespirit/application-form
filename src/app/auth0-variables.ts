interface AuthConfig {
  clientID: string;
  domain: string;
  redirectUri: string;
  audience: string;
}

export const AUTH_CONFIG: AuthConfig = {
  clientID: 'fyTIVe5MunpoamUevDhYsANVJDLz5Bw3',
  domain: 'delicate-silence-4570.eu.auth0.com',
  redirectUri: 'https://testeddefault.herokuapp.com/admin',
  audience: 'https://testeddefault.herokuapp.com/testnet'
};
