export interface Employee {
    id?: number;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    age?: number;
    mobile: string;
    email: string;
    address1: string;
    address2?: string;
    gender: 'Male' | 'Female' | 'Other';
}
