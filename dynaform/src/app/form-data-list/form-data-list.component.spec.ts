import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormDataListComponent } from './form-data-list.component';

describe('FormDataListComponent', () => {
  let component: FormDataListComponent;
  let fixture: ComponentFixture<FormDataListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FormDataListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormDataListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
