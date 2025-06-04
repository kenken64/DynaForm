import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { RecipientsComponent } from './recipients.component';
import { RecipientService } from '../services/recipient.service';
import { RecipientGroupService } from '../services/recipient-group.service';
import { AuthService } from '../auth/auth.service';

describe('RecipientsComponent', () => {
  let component: RecipientsComponent;
  let fixture: ComponentFixture<RecipientsComponent>;
  let mockRecipientService: jasmine.SpyObj<RecipientService>;
  let mockRecipientGroupService: jasmine.SpyObj<RecipientGroupService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    mockRecipientService = jasmine.createSpyObj('RecipientService', ['getRecipients', 'createRecipient', 'updateRecipient', 'deleteRecipient', 'exportRecipients']);
    mockRecipientGroupService = jasmine.createSpyObj('RecipientGroupService', ['getRecipientGroups', 'createRecipientGroup', 'updateRecipientGroup', 'deleteRecipientGroup']);
    mockAuthService = jasmine.createSpyObj('AuthService', ['getCurrentUser', 'logout']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      declarations: [RecipientsComponent],
      providers: [
        { provide: RecipientService, useValue: mockRecipientService },
        { provide: RecipientGroupService, useValue: mockRecipientGroupService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecipientsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with recipients view mode', () => {
    expect(component.viewMode).toBe('recipients');
  });

  it('should switch view modes correctly', () => {
    // Test switching to groups view
    const event = { value: 'groups' };
    mockRecipientGroupService.getRecipientGroups.and.returnValue(of({ 
      success: true,
      groups: [], 
      totalCount: 0, 
      totalPages: 0,
      page: 1,
      pageSize: 10
    }));
    
    component.onViewModeChange(event);
    
    expect(component.viewMode).toBe('groups');
    expect(component.searchTerm).toBe('');
    expect(component.currentPage).toBe(1);
    expect(mockRecipientGroupService.getRecipientGroups).toHaveBeenCalled();
  });

  it('should handle recipient count calculation', () => {
    const group = {
      _id: '1',
      aliasName: 'Test Group',
      description: 'Test Description',
      recipientIds: ['1', '2', '3'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'user1'
    };

    expect(component.getRecipientCount(group)).toBe(3);
  });

  it('should handle empty recipient count', () => {
    const group = {
      _id: '1',
      aliasName: 'Test Group',
      description: 'Test Description',
      recipientIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'user1'
    };

    expect(component.getRecipientCount(group)).toBe(0);
  });
});
