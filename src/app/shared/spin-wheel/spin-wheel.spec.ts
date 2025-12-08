import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpinWheel } from './spin-wheel';

describe('SpinWheel', () => {
  let component: SpinWheel;
  let fixture: ComponentFixture<SpinWheel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpinWheel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpinWheel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
