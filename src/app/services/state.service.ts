import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class StateService {

  private messageSource = new BehaviorSubject('');
  userWallet = this.messageSource.asObservable();

  constructor() { }

  changeUserWallet(wallet: string) {
    this.messageSource.next(wallet)
  }

}