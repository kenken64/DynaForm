// Export all Radix-NG inspired components
export { ButtonComponent } from './button/button.component';
export { RadixButtonComponent } from './radix-button/radix-button.component';
export { RadixInputComponent } from './radix-input/radix-input.component';
export { 
  RadixCardComponent,
  RadixCardHeaderComponent,
  RadixCardTitleComponent,
  RadixCardDescriptionComponent,
  RadixCardContentComponent,
  RadixCardFooterComponent
} from './radix-card/radix-card.component';

// Common imports array for easy module import
export const RADIX_COMPONENTS = [
  ButtonComponent,
  RadixButtonComponent,
  RadixInputComponent,
  RadixCardComponent,
  RadixCardHeaderComponent,
  RadixCardTitleComponent,
  RadixCardDescriptionComponent,
  RadixCardContentComponent,
  RadixCardFooterComponent
] as const;
