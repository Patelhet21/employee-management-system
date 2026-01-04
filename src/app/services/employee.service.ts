import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employee } from '../models/employee.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {

  private baseUrl = 'http://localhost:9090/api/v1/employees';

  constructor(private http: HttpClient) { }

  getAllEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.baseUrl);
  }

  createEmployee(employee: Employee): Observable<Employee> {
    return this.http.post<Employee>(this.baseUrl, employee);
  }

  updateEmployee(id: number, employee: Employee) {
    return this.http.put<Employee>(`${this.baseUrl}/${id}`, employee);
  }

  deleteEmployee(id: number) {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  checkEmail(email: string, id?: number): Observable<boolean> {
    let params = new HttpParams().set('email', email);
    if (id) params = params.set('id', id);

    return this.http.get<boolean>(`${this.baseUrl}/check-email`, { params });
  }

  checkMobile(mobile: string, id?: number): Observable<boolean> {
    let params = new HttpParams().set('mobile', mobile);
    if (id) params = params.set('id', id);

    return this.http.get<boolean>(`${this.baseUrl}/check-mobile`, { params });
  }
}
