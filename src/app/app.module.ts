import { AppRoutingModule } from './app-routing.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MaterialModule } from './material.module';
import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { DataService } from './data.service';

import { AppComponent } from './app.component';
import { FormComponent } from './form/form.component';

@NgModule({
  bootstrap: [AppComponent],
  declarations: [
    AppComponent,
    FormComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    MaterialModule,
    NgbModule.forRoot()
  ],
  providers: [DataService]
})
export class AppModule { }
