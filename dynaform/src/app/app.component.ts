import { Component } from '@angular/core';
import { GeneratedForm } from './interfaces/form.interface';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']  // ✅ Corrected
})
export class AppComponent {
  title = 'dynaform';
  isSideMenuCollapsed = false;
  selectedForm: GeneratedForm | null = null;

  toggleSideMenu(): void {
    this.isSideMenuCollapsed = !this.isSideMenuCollapsed;
  }

  onFormSelected(form: GeneratedForm): void {
    this.selectedForm = form;
    // You can add navigation logic here if needed
    // For example, navigate to a form viewer route with the form ID
    console.log('Selected form:', form);
  }
}