import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { FormsService } from '../services/forms.service';
import { AuthService } from '../auth/auth.service';
import { GeneratedForm, FormField, FieldConfiguration } from '../interfaces/form.interface';
import { FormSaveConfirmationDialogComponent, FormSaveConfirmationData } from '../form-save-confirmation-dialog/form-save-confirmation-dialog.component';

export interface FormElementType {
  id: string;
  type: string;
  label: string;
  icon: string;
  description: string;
}

export interface DragFormField extends FormField {
  id: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  validation?: string;
  position?: number;
}

@Component({
  selector: 'app-form-editor',
  templateUrl: './form-editor.component.html',
  styleUrls: ['./form-editor.component.css']
})
export class FormEditorComponent implements OnInit, OnDestroy {
  // Form data
  formId: string | null = null;
  editingFormId: string | null = null;
  form: GeneratedForm | null = null;
  formTitle = 'Untitled Form';
  formDescription = '';
  
  // Form builder
  editorForm: FormGroup;
  
  // Drag and drop
  availableElements: FormElementType[] = [
    { id: 'text', type: 'text', label: 'Text Input', icon: 'text_fields', description: 'Single line text input' },
    { id: 'textarea', type: 'textarea', label: 'Paragraph', icon: 'notes', description: 'Multi-line text input' },
    { id: 'select', type: 'select', label: 'Dropdown', icon: 'arrow_drop_down_circle', description: 'Dropdown selection' },
    { id: 'radio', type: 'radio', label: 'Multiple Choice', icon: 'radio_button_checked', description: 'Single selection from options' },
    { id: 'checkbox', type: 'checkbox', label: 'Checkboxes', icon: 'check_box', description: 'Multiple selection from options' },
    { id: 'number', type: 'number', label: 'Number', icon: 'numbers', description: 'Numeric input' },
    { id: 'email', type: 'email', label: 'Email', icon: 'email', description: 'Email address input' },
    { id: 'date', type: 'date', label: 'Date', icon: 'calendar_today', description: 'Date picker' },
    { id: 'file', type: 'file', label: 'File Upload', icon: 'cloud_upload', description: 'File upload field' },
    { id: 'label', type: 'label', label: 'Label', icon: 'label', description: 'Text label or heading' }
  ];
  
  formElements: DragFormField[] = [];
  selectedElement: DragFormField | null = null;
  
  // State management
  loading = false;
  saving = false;
  autoSaving = false;
  error = '';
  
  // Subscriptions
  private routeSubscription: Subscription = new Subscription();
  private destroy$ = new Subject<void>();
  
  // Debounced form title updates
  private titleSubject = new Subject<string>();
  private descriptionSubject = new Subject<string>();
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private formsService: FormsService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    this.editorForm = this.fb.group({
      title: [this.formTitle, Validators.required],
      description: [this.formDescription]
    });
    
    // Set up debounced auto-save for form title
    this.titleSubject.pipe(
      debounceTime(1000), // Wait 1 second after user stops typing
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(title => {
      this.formTitle = title;
      if (this.editingFormId && title) {
        this.autoSaveFormInfo();
      }
    });
    
    // Set up debounced auto-save for form description
    this.descriptionSubject.pipe(
      debounceTime(1000),
      distinctUntilChanged(), 
      takeUntil(this.destroy$)
    ).subscribe(description => {
      this.formDescription = description;
      if (this.editingFormId) {
        this.autoSaveFormInfo();
      }
    });
  }

  ngOnInit(): void {
    // Subscribe to route params and query params
    this.routeSubscription.add(
      this.route.params.subscribe(params => {
        if (params['id']) {
          this.formId = params['id'];
          this.editingFormId = params['id'];
          if (this.formId) {
            this.loadForm(this.formId);
          }
        }
      })
    );
    
    this.routeSubscription.add(
      this.route.queryParams.subscribe(params => {
        if (params['editForm']) {
          this.formId = params['editForm'];
          this.editingFormId = params['editForm'];
          if (this.formId) {
            this.loadForm(this.formId);
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadForm(formId: string): void {
    this.loading = true;
    this.error = '';
    
    this.formsService.getForm(formId).subscribe({
      next: (form: GeneratedForm) => {
        console.log('=== FORM LOADING DEBUG ===');
        console.log('Loaded form:', form);
        console.log('Form ID:', formId);
        console.log('FormData array:', form.formData);
        console.log('FieldConfigurations:', form.fieldConfigurations);
        
        this.loading = false;
        this.form = form;
        this.formTitle = form.metadata.formName || 'Untitled Form';
        this.formDescription = ''; // Add description field to form interface if needed
        
        // Convert form fields to drag form fields
        this.formElements = (form.formData || []).map((field, index) => {
          console.log(`Processing field ${index}:`, field);
          const mappedType = this.mapFieldType(field.type);
          const requiredStatus = this.getFieldMandatoryStatus(form.fieldConfigurations, field.name);
          const extractedOptions = this.extractOptionsFromValue(field);
          
          console.log(`- Original type: ${field.type} -> Mapped type: ${mappedType}`);
          console.log(`- Required status: ${requiredStatus}`);
          console.log(`- Extracted options:`, extractedOptions);
          console.log(`- Field options:`, field.options);
          
          const dragField = {
            ...field,
            id: `field_${index}_${Date.now()}`,
            type: mappedType, // Map field types to supported types
            label: field.name,
            position: index,
            required: requiredStatus,
            options: extractedOptions || field.options // Extract options from field.value or use field.options directly
          };
          
          console.log(`- Final drag field:`, dragField);
          return dragField;
        });
        
        console.log('Final formElements array:', this.formElements);
        console.log('=== END FORM LOADING DEBUG ===');
        
        // Update form controls
        this.editorForm.patchValue({
          title: this.formTitle,
          description: this.formDescription
        });
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Failed to load form';
        console.error('Error loading form:', error);
        this.snackBar.open('Failed to load form', 'Close', { duration: 3000 });
      }
    });
  }

  // Drag and drop handlers
  onElementDrop(event: CdkDragDrop<any[]>): void {
    console.log('=== DROP EVENT TRIGGERED ===');
    console.log('Event object:', event);
    console.log('Previous container ID:', event.previousContainer.id);
    console.log('Current container ID:', event.container.id);
    console.log('Previous index:', event.previousIndex);
    console.log('Current index:', event.currentIndex);
    console.log('Previous container data:', event.previousContainer.data);
    console.log('Current container data:', event.container.data);
    console.log('Item data:', event.item.data);
    console.log('Event item element:', event.item.element);
    
    if (event.previousContainer === event.container) {
      // Reorder within form elements
      console.log('🔄 REORDERING within form elements');
      moveItemInArray(this.formElements, event.previousIndex, event.currentIndex);
      this.updateElementPositions();
      this.cdr.detectChanges();
    } else {
      // Add new element from palette
      console.log('➕ ADDING new element from palette');
      
      // Get the element type from drag data with multiple fallback strategies
      let elementType: FormElementType | null = null;
      
      // Strategy 1: Try to get from event item data
      if (event.item.data) {
        elementType = event.item.data;
        console.log('✅ Element type from item data:', elementType);
      }
      
      // Strategy 2: Fallback to container data
      if (!elementType && event.previousContainer.data && event.previousContainer.data[event.previousIndex]) {
        elementType = event.previousContainer.data[event.previousIndex];
        console.log('✅ Element type from container data:', elementType);
      }
      
      // Strategy 3: Try to extract from available elements array
      if (!elementType && event.previousIndex >= 0 && event.previousIndex < this.availableElements.length) {
        elementType = this.availableElements[event.previousIndex];
        console.log('✅ Element type from available elements:', elementType);
      }
      
      if (!elementType) {
        console.error('❌ No element type found. Event details:', {
          event,
          previousIndex: event.previousIndex,
          itemData: event.item.data,
          containerData: event.previousContainer.data,
          availableElements: this.availableElements
        });
        return;
      }
      
      try {
        const newElement = this.createElement(elementType);
        console.log('✅ Created new element:', newElement);
        
        // Insert at specific position
        if (event.currentIndex >= 0 && event.currentIndex <= this.formElements.length) {
          // Insert at specific position & ensure change detection
          const updatedFormElements = [...this.formElements];
          updatedFormElements.splice(event.currentIndex, 0, newElement);
          this.formElements = updatedFormElements;
          console.log('✅ Inserted at position:', event.currentIndex);
        } else {
          // Add to end if index is invalid
          this.formElements = [...this.formElements, newElement];
          console.log('✅ Added to end');
        }
        
        console.log('Updated form elements array:', this.formElements);
        console.log('Form elements length:', this.formElements.length);
        
        this.updateElementPositions();
        
        // Auto-select the new element
        this.selectedElement = newElement;
        console.log('✅ Selected element:', this.selectedElement);
        
        // Manually trigger change detection
        this.cdr.detectChanges();
        console.log('✅ Change detection triggered');
        
      } catch (error) {
        console.error('❌ Error creating element:', error);
      }
    }
    
    console.log('=== DROP EVENT COMPLETE ===');
  }

  // Additional drag event handlers for debugging
  onDragStarted(event: any): void {
    console.log('🚀 DRAG STARTED:', {
      event,
      source: event.source,
      item: event.source.data,
      element: event.source.element.nativeElement
    });
  }

  onDragEnded(event: any): void {
    console.log('🏁 DRAG ENDED:', {
      event,
      source: event.source,
      distance: event.distance,
      dropPoint: event.dropPoint
    });
  }

  onDragEntered(event: any): void {
    console.log('📥 DRAG ENTERED drop zone:', {
      event,
      container: event.container,
      containerData: event.container.data,
      item: event.item
    });
  }

  onDragExited(event: any): void {
    console.log('📤 DRAG EXITED drop zone:', {
      event,
      container: event.container
    });
  }

  private createElement(elementType: FormElementType): DragFormField {
    const id = `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const baseField: DragFormField = {
      // DragFormField specific properties
      id,
      label: elementType.label,
      placeholder: `Enter ${elementType.label.toLowerCase()}`,
      required: false,
      position: this.formElements.length,
      validation: '', // Initialize validation string

      // FormField inherited properties
      name: `field_${this.formElements.length + 1}`, // This is FormField's 'name'
      type: elementType.type,                       // This is FormField's 'type'
      value: null,                                  // Default value, will be overridden by type-specific logic below
      options: undefined,                           // Default options, will be overridden for relevant types
      configuration: undefined                      // Not setting this directly, as saveForm synthesizes it
    };

    // Add type-specific properties
    switch (elementType.type) {
      case 'text':
      case 'textarea':
      case 'number':
      case 'email':
      case 'date':
        baseField.value = ''; // Empty string for text-based inputs
        break;
      case 'select':
      case 'radio':
        baseField.options = ['Option 1', 'Option 2', 'Option 3'];
        // baseField.value remains null (no initial selection)
        break;
      case 'checkbox':
        baseField.options = ['Option 1', 'Option 2', 'Option 3'];
        baseField.value = {}; // Initialize as an empty object
        // Populate value object with options set to false
        if (baseField.options && Array.isArray(baseField.options)) {
          for (const opt of baseField.options) {
            if (typeof opt === 'string') {
              (baseField.value as Record<string, boolean>)[opt] = false;
            }
          }
        }
        break;
      case 'file':
        // baseField.value remains null
        break;
      case 'label':
        baseField.label = 'New Label'; // Override default label for 'Label' type
        baseField.placeholder = '';    // Labels don't have placeholders
        // baseField.value remains null as labels don't typically have a submittable value
        baseField.required = false;    // Labels are not 'required' in a form validation sense
        break;
    }

    return baseField;
  }

  private updateElementPositions(): void {
    this.formElements.forEach((element, index) => {
      element.position = index;
    });
  }

  // Element selection and editing
  selectElement(element: DragFormField): void {
    this.selectedElement = element;
  }

  deleteElement(element: DragFormField): void {
    const index = this.formElements.findIndex(el => el.id === element.id);
    if (index > -1) {
      this.formElements.splice(index, 1);
      this.updateElementPositions();
      
      if (this.selectedElement?.id === element.id) {
        this.selectedElement = null;
      }
    }
  }

  duplicateElement(element: DragFormField): void {
    const duplicated = {
      ...element,
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${element.name}_copy`,
      label: `${element.label} (Copy)`
    };
    
    const index = this.formElements.findIndex(el => el.id === element.id);
    this.formElements.splice(index + 1, 0, duplicated);
    this.updateElementPositions();
  }

  // Form element property updates
  updateElementProperty(element: DragFormField, property: string, value: any): void {
    if (element) {
      (element as any)[property] = value;
    }
  }

  addOption(element: DragFormField): void {
    if (!element.options) {
      element.options = [];
    }
    element.options.push(`Option ${element.options.length + 1}`);
  }

  removeOption(element: DragFormField, index: number): void {
    if (element.options && element.options.length > 1) {
      element.options.splice(index, 1);
    }
  }

  updateOption(element: DragFormField, index: number, value: string): void {
    if (element.options && element.options[index] !== undefined) {
      element.options[index] = value;
    }
  }

  // Form management
  updateFormInfo(): void {
    // Don't override the current values - they're already up to date via ngModel
    // Just update the form controls to match the current values
    this.editorForm.patchValue({
      title: this.formTitle,
      description: this.formDescription
    });
    
    // Auto-save form title and description changes if editing an existing form
    if (this.editingFormId && this.formTitle) {
      this.autoSaveFormInfo();
    }
  }
  
  onTitleChange(title: string): void {
    this.titleSubject.next(title);
    // Keep form control in sync
    this.editorForm.patchValue({ title: title });
  }
  
  onDescriptionChange(description: string): void {
    this.descriptionSubject.next(description);
    // Keep form control in sync
    this.editorForm.patchValue({ description: description });
  }

  private autoSaveFormInfo(): void {
    if (!this.editingFormId) return;

    this.autoSaving = true;

    const currentMetadata = this.form?.metadata || {
      formName: '',
      createdAt: new Date().toISOString(),
      version: '1.0'
    };

    const updateData = {
      metadata: {
        ...currentMetadata,
        formName: this.formTitle,
        formDescription: this.formDescription || '',
        updatedAt: new Date().toISOString()
      }
    };

    this.formsService.updateForm(this.editingFormId, updateData).subscribe({
      next: (updatedForm) => {
        this.autoSaving = false;
        // Update the local form reference
        if (this.form) {
          this.form.metadata = updatedForm.metadata;
        }
        console.log('Form info auto-saved successfully');
        
        // Show subtle success feedback
        this.snackBar.open('Changes saved automatically', '', { 
          duration: 2000,
          panelClass: ['auto-save-snackbar'],
          horizontalPosition: 'end',
          verticalPosition: 'bottom'
        });
      },
      error: (error) => {
        this.autoSaving = false;
        console.error('Error auto-saving form info:', error);
        // Don't show error to user for auto-save to avoid disruption
      }
    });
  }

  previewForm(): void {
    if (this.formId) {
      const url = this.router.serializeUrl(
        this.router.createUrlTree(['/forms', this.formId])
      );
      window.open(url, '_blank');
    }
  }

  saveForm(): void {
    if (!this.editorForm.valid) {
      this.snackBar.open('Please fill in required fields', 'Close', { duration: 3000 });
      return;
    }

    this.saving = true;
    this.error = '';

    // Convert drag form fields back to form fields
    const formFields: FormField[] = this.formElements.map(element => ({
      name: element.name,
      type: element.type,
      value: element.value,
      options: element.options,
      configuration: {
        mandatory: element.required || false,
        validation: Boolean(element.validation)
      }
    }));

    const fieldConfigurations: Record<string, FieldConfiguration> = {};
    this.formElements.forEach(element => {
      fieldConfigurations[element.name] = {
        mandatory: element.required || false,
        validation: Boolean(element.validation)
      };
    });

    // Get current user information
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.saving = false;
      this.error = 'Authentication required to save form';
      this.snackBar.open('Please log in to save forms', 'Close', { duration: 3000 });
      return;
    }

    const formData = {
      formData: formFields,
      fieldConfigurations,
      metadata: {
        formName: this.formTitle,
        version: '1.0',
        createdAt: this.form?.metadata.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: {
          userId: currentUser.id || currentUser.username || 'anonymous',
          username: currentUser.username || currentUser.email || 'unknown',
          userFullName: currentUser.name || 'Unknown User'
        }
      }
    };

    // Save the form
    if (this.editingFormId) {
      // Update existing form
      this.formsService.updateForm(this.editingFormId, formData).subscribe({
        next: (response: GeneratedForm) => {
          this.saving = false;
          this.openSaveConfirmationDialog(true, this.editingFormId!, new Date().toISOString());
        },
        error: (error: any) => {
          this.saving = false;
          this.error = 'Failed to update form';
          console.error('Error updating form:', error);
          this.snackBar.open('Failed to update form', 'Close', { duration: 3000 });
        }
      });
    } else {
      // Save new form
      this.formsService.saveForm(formData).subscribe({
        next: (response: { success: boolean; data: { formId: string; savedAt: string } }) => {
          this.saving = false;
          
          if (response.data && response.data.formId) {
            this.formId = response.data.formId;
            this.editingFormId = response.data.formId;
            // Update URL to include form ID
            this.router.navigate(['/form-editor', this.formId], { replaceUrl: true });
            
            this.openSaveConfirmationDialog(false, response.data.formId, response.data.savedAt);
          }
        },
        error: (error: any) => {
          this.saving = false;
          this.error = 'Failed to save form';
          console.error('Error saving form:', error);
          this.snackBar.open('Failed to save form', 'Close', { duration: 3000 });
        }
      });
    }
  }

  // Navigation
  goBack(): void {
    this.router.navigate(['/forms']);
  }

  // Utility methods
  getElementIcon(type: string): string {
    const element = this.availableElements.find(el => el.type === type);
    return element ? element.icon : 'help';
  }

  trackByElementId(index: number, element: DragFormField): string {
    return element.id;
  }

  trackByElementType(index: number, element: FormElementType): string {
    return element.id;
  }

  // Map field types from API to form editor types
  private mapFieldType(apiType: string): string {
    const typeMap: Record<string, string> = {
      'textbox': 'text',
      'text': 'text',
      'textarea': 'textarea',
      'number': 'number',
      'email': 'email',
      'date': 'date',
      'select': 'select',
      'dropdown': 'select',
      'radio': 'radio',
      'checkbox': 'checkbox',
      'file': 'file',
      'label': 'label'
    };
    
    return typeMap[apiType] || 'text'; // Default to text if type not found
  }

  // Extract options from checkbox field values
  private extractOptionsFromValue(field: FormField): string[] | undefined {
    console.log(`extractOptionsFromValue for field '${field.name}' (type: ${field.type}):`, field);
    
    // For checkbox fields, try to extract options from the value object first
    if (field.type === 'checkbox' && typeof field.value === 'object' && field.value !== null) {
      const optionsFromValue = Object.keys(field.value);
      console.log(`- Checkbox value object keys:`, optionsFromValue);
      if (optionsFromValue.length > 0) {
        return optionsFromValue;
      }
    }
    
    // Fallback to field.options if available
    if (field.options && Array.isArray(field.options)) {
      console.log(`- Using field.options:`, field.options);
      return field.options;
    }
    
    console.log(`- No options found for field '${field.name}'`);
    return undefined;
  }

  // Get field mandatory status with backward compatibility for both array and object formats
  private getFieldMandatoryStatus(fieldConfigurations: Record<string, any>, fieldName: string): boolean {
    const config = fieldConfigurations?.[fieldName];
    console.log(`getFieldMandatoryStatus for '${fieldName}':`, config);
    
    if (!config) {
      console.log(`- No config found for '${fieldName}', returning false`);
      return false;
    }
    
    // Handle object format: { mandatory: boolean, validation: boolean }
    if (typeof config === 'object' && config !== null && !Array.isArray(config)) {
      console.log(`- Object format detected for '${fieldName}', mandatory:`, config.mandatory);
      return config.mandatory || false;
    }
    
    // Handle legacy array format: ['mandatory', 'validation'] or []
    if (Array.isArray(config)) {
      const result = config.includes('mandatory');
      console.log(`- Array format detected for '${fieldName}', includes 'mandatory':`, result);
      return result;
    }
    
    console.log(`- Unknown config format for '${fieldName}', returning false`);
    return false;
  }

  private openSaveConfirmationDialog(isUpdate: boolean, formId: string, savedAt: string): void {
    const dialogData: FormSaveConfirmationData = {
      formTitle: this.formTitle,
      formId: formId,
      savedAt: savedAt,
      isUpdate: isUpdate
    };

    const dialogRef = this.dialog.open(FormSaveConfirmationDialogComponent, {
      width: '500px',
      data: dialogData,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'viewForms') {
        this.router.navigate(['/forms']);
      } else if (result === 'preview') {
        if (formId) {
          this.router.navigate(['/form-viewer', formId]);
        }
      }
      // If result is 'continue' or undefined, stay on the current editor page
    });
  }
}