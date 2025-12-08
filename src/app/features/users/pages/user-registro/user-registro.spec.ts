import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserRegistro } from './user-registro';

describe('UserRegistro', () => {
  let component: UserRegistro;
  let fixture: ComponentFixture<UserRegistro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserRegistro]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserRegistro);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
