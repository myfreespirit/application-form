import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class StateService {

  private messageSrcUserWallet = new BehaviorSubject('');
  private messageSrcSignups = new BehaviorSubject([]);
  
  userWallet = this.messageSrcUserWallet.asObservable();
  signups = this.messageSrcSignups.asObservable();
  
  
  constructor() { }

  changeUserWallet(wallet: string) {
    this.messageSrcUserWallet.next(wallet);
  }
  
  changeSignups(signups: any[]) {
    this.messageSrcSignups.next(signups);
  }
}