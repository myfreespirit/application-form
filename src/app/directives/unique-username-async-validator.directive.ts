import { Directive, forwardRef, Injectable, Inject } from '@angular/core';
import { AbstractControl, AsyncValidator, NG_ASYNC_VALIDATORS, ValidationErrors } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, map } from "rxjs/operators";

import { TestnetService } from '../services/testnet.service';


@Injectable({ providedIn: 'root' })
export class UniqueUsernameAsyncValidator implements AsyncValidator {

	constructor(@Inject(TestnetService) private testnetService: TestnetService) { 
	}

	validate(ctrl: AbstractControl): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> {
		return this.testnetService.isUsernameTaken(ctrl.value).pipe(
			map((isTaken: any[]) => (isTaken.length != 0 ? { uniqueUsername: true } : null)),
			catchError(() => { return of({ unknown: true }); })
		);
	}
}


@Directive({
	selector: '[appUniqueUsernameAsyncValidator]',
	providers: [
		{
			provide: NG_ASYNC_VALIDATORS,
			useExisting: forwardRef(() => UniqueUsernameAsyncValidator),
			multi: true
		}
	]
})
export class UniqueUsernameAsyncValidatorDirective {
	constructor(private validator: UniqueUsernameAsyncValidator) {
	}

	validate(control: AbstractControl) {
		this.validator.validate(control);
	}
}
