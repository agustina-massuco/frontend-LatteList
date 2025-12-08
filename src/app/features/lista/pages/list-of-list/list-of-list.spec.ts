import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListOfList } from './list-of-list';

describe('ListOfList', () => {
  let component: ListOfList;
  let fixture: ComponentFixture<ListOfList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListOfList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListOfList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
