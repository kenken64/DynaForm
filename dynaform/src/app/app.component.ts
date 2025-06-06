import { Component } from '@angular/core';
import { GeneratedForm } from './interfaces/form.interface';
import { Router, NavigationEnd, ActivatedRoute, Event as RouterEvent } from '@angular/router'; // Added Router, NavigationEnd, ActivatedRoute, Event
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'dynaform';
  isSideMenuCollapsed = false;
  selectedForm: GeneratedForm | null = null;
  showSideMenu = true;

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {
    this.router.events.pipe(
      filter((event: RouterEvent): event is NavigationEnd => event instanceof NavigationEnd) // Typed event and used type guard
    ).subscribe((event: NavigationEnd) => {
      // Use the URL to detect public routes instead of route config path
      const currentUrl = event.url;
      console.log('Current URL:', currentUrl);
      
      // Check if the route is login, register, landing page, or public form
      if (currentUrl === '/' || 
          currentUrl === '/login' || 
          currentUrl === '/register' ||
          currentUrl.startsWith('/public/form/')) {
        this.showSideMenu = false;
      } else {
        this.showSideMenu = true;
      }
      console.log('Show side menu:', this.showSideMenu);
    });
  }

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