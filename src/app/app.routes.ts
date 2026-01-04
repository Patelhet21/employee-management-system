import { Routes } from '@angular/router';
import { EmployeeFormComponent } from './components/employee-form/employee-form.component';
import { EmployeeListComponent } from './components/employee-list/employee-list.component';

export const routes: Routes = [
  { path: '', redirectTo: 'add-employee', pathMatch: 'full' },
  { path: 'add-employee', component: EmployeeFormComponent },
  { path: 'employees', component: EmployeeListComponent }
];
