// services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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

  getBots(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/bots`)
      .pipe(catchError(this.handleError));
  }

  createBot(bot: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/bots`, bot)
      .pipe(catchError(this.handleError));
  }

  updateBot(id: number, bot: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/bots/${id}`, bot)
      .pipe(catchError(this.handleError));
  }

  deleteBot(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/bots/${id}`)
      .pipe(catchError(this.handleError));
  }
}