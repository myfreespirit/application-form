import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExrtDistroGraphComponent } from './exrt-distro-graph.component';

describe('ExrtDistroGraphComponent', () => {
  let component: ExrtDistroGraphComponent;
  let fixture: ComponentFixture<ExrtDistroGraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExrtDistroGraphComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExrtDistroGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
