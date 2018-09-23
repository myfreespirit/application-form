import { AppRoutingModule } from './app-routing.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CountdownModule } from "ng2-countdown-timer";
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MaterialModule } from './material.module';
import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PapaParseModule } from 'ngx-papaparse';

import { DataService } from './data.service';

import { AppComponent } from './app.component';
import { FormComponent } from './form/form.component';
import { StaffComponent } from './staff/staff.component';

@NgModule({
  bootstrap: [AppComponent],
  declarations: [
    AppComponent,
    FormComponent,
    StaffComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
    CountdownModule,
    FormsModule,
    HttpClientModule,
    MaterialModule,
    NgbModule.forRoot(),
    PapaParseModule
  ],
  providers: [
    DataService
  ]
})
export class AppModule { }
