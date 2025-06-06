import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { FormsListComponent } from './forms-list/forms-list.component';
import { FormViewerComponent } from './form-viewer/form-viewer.component';
import { FormEditorComponent } from './form-editor/form-editor.component';
import { FormDataListComponent } from './form-data-list/form-data-list.component';
import { FormDataViewerComponent } from './form-data-viewer/form-data-viewer.component';
import { RecipientsComponent } from './recipients/recipients.component';
import { PublicFormComponent } from './public-form/public-form.component';
import { AuthGuard } from './auth/auth.guard';
import { DebugFormsComponent } from './debug-forms.component';

const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'forms', component: FormsListComponent, canActivate: [AuthGuard] },
  { path: 'forms/:id', component: FormViewerComponent, canActivate: [AuthGuard] },
  { path: 'form-editor', component: FormEditorComponent, canActivate: [AuthGuard] },
  { path: 'form-editor/:id', component: FormEditorComponent, canActivate: [AuthGuard] },
  { path: 'form-data', component: FormDataListComponent, canActivate: [AuthGuard] },
  { path: 'form-data/:id', component: FormDataViewerComponent, canActivate: [AuthGuard] },
  { path: 'recipients', component: RecipientsComponent, canActivate: [AuthGuard] },
  { path: 'debug-forms', component: DebugFormsComponent, canActivate: [AuthGuard] },
  { path: 'public/form/:formId/:fingerprint', component: PublicFormComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
