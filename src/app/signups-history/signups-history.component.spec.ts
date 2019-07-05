import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SignupsHistoryComponent } from './signups-history.component';

describe('SignupsHistoryComponent', () => {
  let component: SignupsHistoryComponent;
  let fixture: ComponentFixture<SignupsHistoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SignupsHistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SignupsHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
