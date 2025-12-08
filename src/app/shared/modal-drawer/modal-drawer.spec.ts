import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalDrawer } from './modal-drawer';

describe('ModalDrawer', () => {
  let component: ModalDrawer;
  let fixture: ComponentFixture<ModalDrawer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalDrawer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalDrawer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
