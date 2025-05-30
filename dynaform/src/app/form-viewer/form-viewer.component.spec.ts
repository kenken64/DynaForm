import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormViewerComponent } from './form-viewer.component';

describe('FormViewerComponent', () => {
  let component: FormViewerComponent;
  let fixture: ComponentFixture<FormViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FormViewerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
