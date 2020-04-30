import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdminComponent } from './admin/admin.component';
import { EntryComponent } from './entry/entry.component';
import { FormComponent } from './form/form.component';
import { RewardsComponent } from './rewards/rewards.component';
import { StaffComponent } from './staff/staff.component';
import { SignupsHistoryComponent } from './signups-history/signups-history.component';
import { TestnetComponent } from './testnet/testnet.component';


const routes: Routes = [
	{
		path: '',
		component: EntryComponent,
		resolve: {
			url: 'externalUrlRedirectResolver'
		},
		data: {
			externalUrl: 'https://signups-exrt-gcp.ew.r.appspot.com'
		}
	},
	{ path: 'admin', component: AdminComponent },
	{ 
		path: 'exrt-testnet',
		component: TestnetComponent,
		resolve: {
			url: 'externalUrlRedirectResolver'
		},
		data: {
			externalUrl: 'https://signups-exrt-gcp.ew.r.appspot.com/exrt-testnet'
		}
	},
	{ path: 'main', component: FormComponent },
	{ path: 'rewards', component: RewardsComponent },
	{ path: 'signups-history', component: SignupsHistoryComponent },
	{ path: 'staff', component: StaffComponent }
];

@NgModule({
imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }
