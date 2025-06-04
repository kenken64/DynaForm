import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

import { FormsService } from '../services/forms.service';
import { GeneratedForm, FormField, FieldConfiguration } from '../interfaces/form.interface';

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
  error = '';
  
  // Subscriptions
  private routeSubscription: Subscription = new Subscription();
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private formsService: FormsService,
    private snackBar: MatSnackBar
  ) {
    this.editorForm = this.fb.group({
      title: [this.formTitle, Validators.required],
      description: [this.formDescription]
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
  }

  loadForm(formId: string): void {
    this.loading = true;
    this.error = '';
    
    this.formsService.getForm(formId).subscribe({
      next: (form: GeneratedForm) => {
        console.log('Loaded form:', form);
        this.loading = false;
        this.form = form;
        this.formTitle = form.metadata.formName || 'Untitled Form';
        this.formDescription = ''; // Add description field to form interface if needed
        
        // Convert form fields to drag form fields
        this.formElements = (form.formData || []).map((field, index) => ({
          ...field,
          id: `field_${index}_${Date.now()}`,
          type: this.mapFieldType(field.type), // Map field types to supported types
          label: field.name,
          position: index,
          required: form.fieldConfigurations?.[field.name]?.mandatory || false,
          options: this.extractOptionsFromValue(field) // Extract options from checkbox values
        }));
        
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
    if (event.previousContainer === event.container) {
      // Reorder within form elements
      moveItemInArray(this.formElements, event.previousIndex, event.currentIndex);
      this.updateElementPositions();
    } else {
      // Add new element from palette
      const elementType = event.previousContainer.data[event.previousIndex];
      const newElement = this.createElement(elementType);
      
      // Insert at specific position & ensure change detection
      const updatedFormElements = [...this.formElements];
      updatedFormElements.splice(event.currentIndex, 0, newElement);
      this.formElements = updatedFormElements;
      
      this.updateElementPositions();
      
      // Auto-select the new element
      this.selectedElement = newElement;
    }
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
    const formData = this.editorForm.value;
    this.formTitle = formData.title;
    this.formDescription = formData.description;
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

    const formData = {
      formData: formFields,
      fieldConfigurations,
      metadata: {
        formName: this.formTitle,
        version: '1.0',
        createdAt: this.form?.metadata.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    // Save the form
    if (this.editingFormId) {
      // Update existing form
      this.formsService.updateForm(this.editingFormId, formData).subscribe({
        next: (response: GeneratedForm) => {
          this.saving = false;
          this.snackBar.open('Form updated successfully', 'Close', { duration: 3000 });
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
          this.snackBar.open('Form saved successfully', 'Close', { duration: 3000 });
          
          if (response.data && response.data.formId) {
            this.formId = response.data.formId;
            this.editingFormId = response.data.formId;
            // Update URL to include form ID
            this.router.navigate(['/form-editor', this.formId], { replaceUrl: true });
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
    if (field.type === 'checkbox' && typeof field.value === 'object' && field.value !== null) {
      return Object.keys(field.value);
    }
    return undefined;
  }
}