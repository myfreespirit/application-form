import { Inject } from '@angular/core';
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';


@Component({
  selector: 'signup-dialog',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})


export class SignupSuccessDialog {
	data: any;

	constructor(@Inject(MatDialogRef) public dialogRef: MatDialogRef<SignupSuccessDialog>) {}
}
