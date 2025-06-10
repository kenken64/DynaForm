import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StepItem {
  id: string;
  label: string;
  description?: string;
  completed?: boolean;
  disabled?: boolean;
}

@Component({
  selector: 'radix-stepper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stepper">
      <div class="steps-container">
        <div *ngFor="let step of steps; let i = index; trackBy: trackByFn"
             class="step-wrapper">
          
          <!-- Step -->
          <div class="step"
               [class.active]="currentStep === step.id"
               [class.completed]="step.completed"
               [class.disabled]="step.disabled"
               (click)="onStepClick(step, i)">
            
            <!-- Step indicator -->
            <div class="step-indicator">
              <div *ngIf="step.completed" class="step-check">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" fill="currentColor"/>
                </svg>
              </div>
              <span *ngIf="!step.completed" class="step-number">{{ i + 1 }}</span>
            </div>
            
            <!-- Step content -->
            <div class="step-content">
              <div class="step-label">{{ step.label }}</div>
              <div *ngIf="step.description" class="step-description">{{ step.description }}</div>
            </div>
          </div>
          
          <!-- Connector line -->
          <div *ngIf="i < steps.length - 1" 
               class="step-connector"
               [class.completed]="step.completed">
          </div>
        </div>
      </div>
      
      <!-- Step content area -->
      <div class="step-content-area">
        <ng-content></ng-content>
      </div>
      
      <!-- Navigation buttons -->
      <div *ngIf="showNavigation" class="step-navigation">
        <button *ngIf="canGoBack()" 
                (click)="goBack()"
                class="nav-button nav-button-secondary">
          {{ backLabel }}
        </button>
        
        <button *ngIf="canGoNext()" 
                (click)="goNext()"
                class="nav-button nav-button-primary">
          {{ nextLabel }}
        </button>
        
        <button *ngIf="isLastStep()" 
                (click)="onFinish()"
                class="nav-button nav-button-primary">
          {{ finishLabel }}
        </button>
      </div>
    </div>
  `,
  styleUrl: './radix-stepper.component.css'
})
export class RadixStepperComponent {
  @Input() steps: StepItem[] = [];
  @Input() currentStep?: string;
  @Input() showNavigation = true;
  @Input() nextLabel = 'Next';
  @Input() backLabel = 'Back';
  @Input() finishLabel = 'Finish';
  @Input() linear = true;

  @Output() stepChange = new EventEmitter<{ step: StepItem; index: number }>();
  @Output() stepClick = new EventEmitter<{ step: StepItem; index: number }>();
  @Output() complete = new EventEmitter<void>();

  get currentStepIndex(): number {
    return this.steps.findIndex(step => step.id === this.currentStep);
  }

  trackByFn(index: number, item: StepItem): string {
    return item.id;
  }

  onStepClick(step: StepItem, index: number): void {
    if (step.disabled) return;
    
    if (this.linear) {
      // In linear mode, only allow clicking on completed steps or the next available step
      const canAccess = step.completed || 
                       index <= this.currentStepIndex + 1 ||
                       this.steps.slice(0, index).every(s => s.completed);
      if (!canAccess) return;
    }

    this.currentStep = step.id;
    this.stepClick.emit({ step, index });
    this.stepChange.emit({ step, index });
  }

  canGoBack(): boolean {
    return this.currentStepIndex > 0;
  }

  canGoNext(): boolean {
    return this.currentStepIndex < this.steps.length - 1 && 
           this.currentStepIndex >= 0;
  }

  isLastStep(): boolean {
    return this.currentStepIndex === this.steps.length - 1;
  }

  goBack(): void {
    if (this.canGoBack()) {
      const newIndex = this.currentStepIndex - 1;
      const step = this.steps[newIndex];
      this.currentStep = step.id;
      this.stepChange.emit({ step, index: newIndex });
    }
  }

  goNext(): void {
    if (this.canGoNext()) {
      const newIndex = this.currentStepIndex + 1;
      const step = this.steps[newIndex];
      this.currentStep = step.id;
      this.stepChange.emit({ step, index: newIndex });
    }
  }

  onFinish(): void {
    this.complete.emit();
  }

  markStepCompleted(stepId: string): void {
    const step = this.steps.find(s => s.id === stepId);
    if (step) {
      step.completed = true;
    }
  }

  markStepIncomplete(stepId: string): void {
    const step = this.steps.find(s => s.id === stepId);
    if (step) {
      step.completed = false;
    }
  }
}
