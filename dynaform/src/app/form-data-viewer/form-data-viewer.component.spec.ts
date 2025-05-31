import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormDataViewerComponent } from './form-data-viewer.component';

describe('FormDataViewerComponent', () => {
  let component: FormDataViewerComponent;
  let fixture: ComponentFixture<FormDataViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FormDataViewerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormDataViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
