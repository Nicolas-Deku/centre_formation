import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageFormationsComponent } from './manage-formations.component';

describe('ManageFormationsComponent', () => {
  let component: ManageFormationsComponent;
  let fixture: ComponentFixture<ManageFormationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageFormationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageFormationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
