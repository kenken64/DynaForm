import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { SideMenuComponent } from './side-menu.component';
import { FormsService } from '../services/forms.service';

describe('SideMenuComponent', () => {
  let component: SideMenuComponent;
  let fixture: ComponentFixture<SideMenuComponent>;
  let formsService: jasmine.SpyObj<FormsService>;

  const mockFormsResponse = {
    success: true,
    count: 2,
    totalCount: 2,
    totalPages: 1,
    currentPage: 1,
    pageSize: 10,
    forms: [
      {
        _id: '1',
        formData: [
          { name: 'Name', type: 'textbox', value: '' }
        ],
        fieldConfigurations: {},
        metadata: {
          createdAt: '2023-01-01T00:00:00Z',
          formName: 'Test Form 1',
          version: '1.0.0'
        }
      },
      {
        _id: '2',
        formData: [
          { name: 'Email', type: 'textbox', value: '' }
        ],
        fieldConfigurations: {},
        metadata: {
          createdAt: '2023-01-02T00:00:00Z',
          formName: 'Test Form 2',
          version: '1.0.0'
        }
      }
    ]
  };

  beforeEach(async () => {
    const formsServiceSpy = jasmine.createSpyObj('FormsService', ['getForms', 'searchForms', 'deleteForm']);

    await TestBed.configureTestingModule({
      declarations: [SideMenuComponent],
      imports: [
        HttpClientTestingModule,
        MatIconModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressSpinnerModule,
        FormsModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: FormsService, useValue: formsServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SideMenuComponent);
    component = fixture.componentInstance;
    formsService = TestBed.inject(FormsService) as jasmine.SpyObj<FormsService>;
    
    formsService.getForms.and.returnValue(of(mockFormsResponse));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load forms on init', () => {
    component.ngOnInit();
    expect(formsService.getForms).toHaveBeenCalledWith(1, 10);
    expect(component.forms.length).toBe(2);
  });

  it('should emit form selected event', () => {
    spyOn(component.formSelected, 'emit');
    const testForm = mockFormsResponse.forms[0];
    
    component.onFormClick(testForm);
    
    expect(component.formSelected.emit).toHaveBeenCalledWith(testForm);
  });

  it('should toggle sidebar', () => {
    spyOn(component.toggleSidebar, 'emit');
    
    component.onToggleSidebar();
    
    expect(component.toggleSidebar.emit).toHaveBeenCalled();
  });

  it('should format date correctly', () => {
    const dateString = '2023-01-01T00:00:00Z';
    const formatted = component.formatDate(dateString);
    
    expect(formatted).toContain('Jan');
    expect(formatted).toContain('2023');
  });

  it('should count form fields correctly', () => {
    const form = mockFormsResponse.forms[0];
    const count = component.getFormFieldsCount(form);
    
    expect(count).toBe(1);
  });

  it('should track forms by id', () => {
    const form = mockFormsResponse.forms[0];
    const trackResult = component.trackByFormId(0, form);
    
    expect(trackResult).toBe('1');
  });
});
