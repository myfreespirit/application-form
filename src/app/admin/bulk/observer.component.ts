import { Inject } from '@angular/core';
import { Component } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DialogData {
  tabs: any[],
  exrn: Number,
  exrt: Number
}


@Component({
  selector: 'signup-dialog',
  templateUrl: './observer.component.html',
  styleUrls: ['./observer.component.scss'],
})
export class MarkObserversDialog {
	tabs: any;

	constructor(@Inject(MatDialogRef) public dialogRef: MatDialogRef<MarkObserversDialog>,
			@Inject(MAT_DIALOG_DATA) public data: DialogData)
	{
		this.data['tabs'] = this.data['tabs'].filter(t => t !== 'RESETS' && t !== 'OBSERVERS')
						.map(t => ({ name: t, checked: false }));
	}
}
