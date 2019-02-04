import { AppRoutingModule } from './app-routing.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CountdownModule } from "ng2-countdown-timer";
import { HttpClientModule } from '@angular/common/http';
import { MaterialModule } from './material.module';
import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PapaParseModule } from 'ngx-papaparse';

import { AuthService } from './services/auth.service';
import { DataService } from './services/data.service';
import { TestnetService } from './services/testnet.service';

import { UniqueUsernameAsyncValidatorDirective } from './directives/unique-username-async-validator.directive';
import { UniqueWalletAsyncValidatorDirective } from './directives/unique-wallet-async-validator.directive';

import { AppComponent } from './app.component';
import { FormComponent } from './form/form.component';
import { SignupSuccessDialog } from './signup/signup.component';
import { StaffComponent } from './staff/staff.component';
import { TestnetComponent } from './testnet/testnet.component';
import { AdminComponent } from './admin/admin.component';

import { JwtModule } from '@auth0/angular-jwt';

export function tokenGetter() {
  return localStorage.getItem('access_token');
}


@NgModule({
  bootstrap: [AppComponent],
  declarations: [
    AppComponent,
    FormComponent,
    SignupSuccessDialog,
    StaffComponent,
    TestnetComponent,
    AdminComponent,
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
    JwtModule.forRoot({
        config: {
            tokenGetter: tokenGetter,
            blacklistedRoutes: ['']
        }
    })
  ],
  entryComponents: [
    SignupSuccessDialog
  ],
  providers: [
    AuthService,
    DataService,
    TestnetService
  ]
})
export class AppModule { }
