import { AppRoutingModule } from './app-routing.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CountdownModule } from "ng2-countdown-timer";
import { HttpClientModule } from '@angular/common/http';
import { MaterialModule } from './material.module';
import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PapaParseModule } from 'ngx-papaparse';
import { ToastrModule } from 'ngx-toastr';

import { AuthService } from './services/auth.service';
import { DataService } from './services/data.service';
import { StateService } from './services/state.service';
import { TestnetService } from './services/testnet.service';

import { UniqueUsernameAsyncValidatorDirective } from './directives/unique-username-async-validator.directive';
import { UniqueWalletAsyncValidatorDirective } from './directives/unique-wallet-async-validator.directive';

import { AdminComponent } from './admin/admin.component';
import { AppComponent } from './app.component';
import { EntryComponent } from './entry/entry.component';
import { FormComponent } from './form/form.component';
import { RewardsComponent } from './rewards/rewards.component';
import { SignupsHistoryComponent } from './signups-history/signups-history.component';
import { StaffComponent } from './staff/staff.component';
import { TestnetComponent } from './testnet/testnet.component';

import { MarkObserversDialog } from './admin/bulk/observer.component';
import { SignupSuccessDialog } from './signup/signup.component';

import { JwtModule } from '@auth0/angular-jwt';

export function tokenGetter() {
	if (window.self !== window.top) {
		return "";  // skip iframe
	}

	return localStorage.getItem('id_token');
}


@NgModule({
  bootstrap: [AppComponent],
  declarations: [
    AdminComponent,
    AppComponent,
	EntryComponent,
    FormComponent,
    MarkObserversDialog,
    RewardsComponent,
    SignupsHistoryComponent,
    SignupSuccessDialog,
    StaffComponent,
    TestnetComponent,
    UniqueUsernameAsyncValidatorDirective,
    UniqueWalletAsyncValidatorDirective
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
    CountdownModule,
    HttpClientModule,
    MaterialModule,
    NgbModule.forRoot(),
    PapaParseModule,
    ToastrModule.forRoot(),
    JwtModule.forRoot({
        config: {
            tokenGetter: tokenGetter,
            blacklistedRoutes: ['']
        }
    })
  ],
  entryComponents: [
    MarkObserversDialog,
    SignupSuccessDialog
  ],
  providers: [
    AuthService,
    DataService,
	StateService,
    TestnetService
  ]
})
export class AppModule { }
