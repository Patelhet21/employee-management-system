import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { ToastService } from '../../shared/toast.service';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-form.component.html',
  styleUrls: ['./employee-form.component.css']
})
export class EmployeeFormComponent implements OnInit {

  employeeForm!: FormGroup;
  editMode = false;
  employeeId?: number;
  today = new Date().toISOString().split('T')[0];
  originalEmployeeData: any;

  emailTaken = false;
  mobileTaken = false;

  constructor(
    private fb: FormBuilder,
    private service: EmployeeService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.buildForm();

    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.employeeId = +params['id'];
        this.editMode = true;
        this.loadEmployee(this.employeeId);
      }
    });

    // Calculate age when DOB changes
    this.employeeForm.get('dateOfBirth')?.valueChanges.subscribe(() => {
      this.calculateAge();
    });

    // Check email while typing
    this.employeeForm.get('email')?.valueChanges
      .pipe(
        debounceTime(100), // wait 0.5s after typing stops
        distinctUntilChanged()
      )
      .subscribe(value => {
        if (this.f['email'].valid) {
          this.checkEmail(); // call API only if email format is valid
        } else {
          this.emailTaken = false; // reset if invalid
        }
      });

    // Check mobile while typing
    this.employeeForm.get('mobile')?.valueChanges
      .pipe(
        debounceTime(100),
        distinctUntilChanged()
      )
      .subscribe(value => {
        if (this.f['mobile'].valid) {
          this.checkMobile(); // call API only if mobile is valid
        } else {
          this.mobileTaken = false; // reset if invalid
        }
      });
  }


  buildForm() {
    this.employeeForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z ]+$/)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z ]+$/)]],
      dateOfBirth: ['', [Validators.required, this.ageRangeValidator(18, 110)]],
      age: [{ value: '', disabled: true }],
      mobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(254), Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/),]],
      address1: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(255)]],
      address2: ['', Validators.maxLength(255)],
      gender: ['', Validators.required]
    });
  }

  loadEmployee(id: number) {
    this.service.getAllEmployees().subscribe({
      next: (data) => {
        const emp = data.find(e => e.id === id);
        if (emp) {
          this.employeeForm.patchValue(emp);
          this.calculateAge();
          // Save original data for comparison
          this.originalEmployeeData = this.employeeForm.getRawValue();
        }
      }
    });
  }

  ageRangeValidator(min: number, max: number) {
    return (control: any) => {
      if (!control.value) return null;

      const dob = new Date(control.value);
      const today = new Date();

      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }

      return age >= min && age <= max ? null : { ageRange: true };
    };
  }

  calculateAge() {
    const dobControl = this.employeeForm.get('dateOfBirth');
    const dob = dobControl?.value;

    if (!dob) {
      this.employeeForm.get('age')?.setValue('');
      return;
    }

    const birthDate = new Date(dob);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    this.employeeForm.get('age')?.setValue(age);

    // 🔥 Important: trigger validation
    dobControl?.updateValueAndValidity();
  }

  hasChanges(): boolean {
    if (!this.originalEmployeeData) return true; // new employee
    const currentData = this.employeeForm.getRawValue();
    return Object.keys(currentData).some(key => currentData[key] !== this.originalEmployeeData[key]);
  }

  cancel() {
    this.router.navigate(['/employees']);
  }

  checkEmail() {
    const email = this.employeeForm.get('email')?.value;
    if (!email) return;

    this.service.checkEmail(email, this.employeeId).subscribe({
      next: res => this.emailTaken = res
    });
  }

  checkMobile() {
    const mobile = this.employeeForm.get('mobile')?.value;
    if (!mobile || mobile.length !== 10) return;

    this.service.checkMobile(mobile, this.employeeId).subscribe({
      next: res => this.mobileTaken = res
    });
  }

  // Allow only digits while typing
  allowDigitsOnly(event: KeyboardEvent) {
    const char = event.key;
    if (!/^[0-9]$/.test(char)) {
      event.preventDefault();
    }
  }

  // Allow paste BUT digits only + max 10
  handleMobilePaste(event: ClipboardEvent) {
    event.preventDefault();

    const pastedText = event.clipboardData?.getData('text') || '';
    const control = this.employeeForm.get('mobile');
    const currentValue = control?.value || '';

    const combined = currentValue + pastedText;

    if (/^\d+$/.test(pastedText) && combined.length <= 10) {
      control?.setValue(combined);
    }
  }

  save() {
    if (this.employeeForm.invalid || this.emailTaken || this.mobileTaken) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    const payload = { ...this.employeeForm.getRawValue() };

    if (this.editMode && this.employeeId) {
      this.service.updateEmployee(this.employeeId, payload).subscribe({
        next: () => {
          this.toast.show('Employee updated successfully', 'success');
          this.router.navigate(['/employees']);
        },
        error: () => this.toast.show('Update failed', 'error')
      });
    } else {
      this.service.createEmployee(payload).subscribe({
        next: () => {
          this.toast.show('Employee saved successfully', 'success');
          this.router.navigate(['/employees']);
        },
        error: () => this.toast.show('Save failed', 'error')
      });
    }
  }

  resetForm() {
    this.employeeForm.reset();
    this.emailTaken = false;
    this.mobileTaken = false;
  }

  viewEmployees() {
    this.router.navigate(['/employees']);
  }

  get f() {
    return this.employeeForm.controls;
  }
}
