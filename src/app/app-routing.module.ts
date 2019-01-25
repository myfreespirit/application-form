import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FormComponent } from './form/form.component';
import { StaffComponent } from './staff/staff.component';
import { TestnetComponent } from './testnet/testnet.component';


const routes: Routes = [
	{ path: '', component: FormComponent },
	{ path: 'staff', component: StaffComponent },
	{ path: 'exrt-testnet', component: TestnetComponent }
];

@NgModule({
imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }
