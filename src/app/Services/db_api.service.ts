// services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Subscription, TimeData, AssetAllocationData, TransactionData } from '../client/Interfaces/bot';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  getSubscription(id: number): Observable<Subscription> {
    return this.http.get<Subscription>(`${this.apiUrl}/subscriptions/${id}`)
     .pipe(catchError(this.handleError));
  }

  getGraphData(id: number): Observable<TimeData[]> {
    return this.http.get<TimeData[]>(`${this.apiUrl}/graphdata/${id}`)
      .pipe(catchError(this.handleError));
  }

  getAllocData(id: string): Observable<AssetAllocationData[]> {
    return this.http.get<any>(`${this.apiUrl}/allocation/${id}`)
      .pipe(catchError(this.handleError));
  }

  getTableData(id: string): Observable<TransactionData[]> {
    return this.http.get<any>(`${this.apiUrl}/transactionsdata/${id}`)
      .pipe(catchError(this.handleError));
  }
}