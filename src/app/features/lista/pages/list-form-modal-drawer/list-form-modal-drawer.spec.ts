import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListFormModalDrawer } from './list-form-modal-drawer';

describe('ListFormModalDrawer', () => {
  let component: ListFormModalDrawer;
  let fixture: ComponentFixture<ListFormModalDrawer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListFormModalDrawer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListFormModalDrawer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
