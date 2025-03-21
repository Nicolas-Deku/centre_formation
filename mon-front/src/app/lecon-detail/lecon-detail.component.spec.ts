import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeconDetailComponent } from './lecon-detail.component';

describe('LeconDetailComponent', () => {
  let component: LeconDetailComponent;
  let fixture: ComponentFixture<LeconDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeconDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeconDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
