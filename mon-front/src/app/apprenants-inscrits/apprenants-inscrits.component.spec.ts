import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApprenantsInscritsComponent } from './apprenants-inscrits.component';

describe('ApprenantsInscritsComponent', () => {
  let component: ApprenantsInscritsComponent;
  let fixture: ComponentFixture<ApprenantsInscritsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApprenantsInscritsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApprenantsInscritsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
