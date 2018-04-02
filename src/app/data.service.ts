import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

const httpOptions = {
    headers: new HttpHeaders({'Content-type': 'application/json'})
};

const contractAddress = "0xe469c4473af82217b30cf17b10bcdb6c8c796e75";


@Injectable()
export class DataService {

  constructor(private http:HttpClient) { }

  getTotalTokens(wallet) {
    const url = "https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress="+contractAddress+"&address="+wallet+"&tag=latest&apikey=YourApiKeyToken";

    return this.http.get(url);
  }
}
