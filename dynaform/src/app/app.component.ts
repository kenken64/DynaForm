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
    ).subscribe(() => {
      let route = this.activatedRoute;
      while (route.firstChild) {
        route = route.firstChild;
      }
      const currentRoutePath = route.snapshot.routeConfig ? route.snapshot.routeConfig.path : '';
      // Check if the route is login or under an auth segment and is login
      if (currentRoutePath === 'login' || 
          (route.parent?.snapshot?.routeConfig?.path === 'auth' && currentRoutePath === 'login')) {
        this.showSideMenu = false;
      } else {
        this.showSideMenu = true;
      }
      console.log('Current route path:', currentRoutePath, 'Show side menu:', this.showSideMenu);
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