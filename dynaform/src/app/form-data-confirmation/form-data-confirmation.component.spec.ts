import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormDataConfirmationComponent } from './form-data-confirmation.component';

describe('FormDataConfirmationComponent', () => {
  let component: FormDataConfirmationComponent;
  let fixture: ComponentFixture<FormDataConfirmationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FormDataConfirmationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormDataConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
