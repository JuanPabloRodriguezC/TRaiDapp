// services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TradingBot, Subscription, TimeData, AssetAllocationData, TransactionData } from '../client/Interfaces/bot';

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

  //bots
  getBots(): Observable<TradingBot[]> {
    return this.http.get<TradingBot[]>(`${this.apiUrl}/bots`)
      .pipe(catchError(this.handleError));
  }
  getBot(id: number): Observable<TradingBot> {
    return this.http.get<TradingBot>(`${this.apiUrl}/bots/${id}`)
      .pipe(catchError(this.handleError));
  }

  createBot(bot: TradingBot): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/bots`, bot)
      .pipe(catchError(this.handleError));
  }

  updateBot(id: number, bot: TradingBot): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/bots/${id}`, bot)
      .pipe(catchError(this.handleError));
  }

  deleteBot(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/bots/${id}`)
      .pipe(catchError(this.handleError));
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