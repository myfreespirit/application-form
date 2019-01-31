import { Directive, forwardRef, Injectable, Inject } from '@angular/core';
import { AbstractControl, AsyncValidator, NG_ASYNC_VALIDATORS, ValidationErrors } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, map } from "rxjs/operators";

import { TestnetService } from '../services/testnet.service';


@Injectable({ providedIn: 'root' })
export class UniqueWalletAsyncValidator implements AsyncValidator {

	constructor(@Inject(TestnetService) private testnetService: TestnetService) { 
	}

	validate(ctrl: AbstractControl): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> {
		return this.testnetService.getApplicationByWallet(ctrl.value).pipe(
			map((isTaken: any[]) => (isTaken.length != 0 ? { uniqueWallet: true } : null)),
			catchError(() => { return of({ unknown: true }); })
		);
	}
}


@Directive({
	selector: '[appUniqueWalletAsyncValidator]',
	providers: [
		{
			provide: NG_ASYNC_VALIDATORS,
			useExisting: forwardRef(() => UniqueWalletAsyncValidator),
			multi: true
		}
	]
})
export class UniqueWalletAsyncValidatorDirective {
	constructor(private validator: UniqueWalletAsyncValidator) {
	}

	validate(control: AbstractControl) {
		this.validator.validate(control);
	}
}
