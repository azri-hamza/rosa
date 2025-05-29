import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, map, take } from 'rxjs';
import { catchError, filter, tap } from 'rxjs/operators';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private refreshTokenInProgress = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient) {}

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  setTokens(tokens: TokenResponse): void {
    localStorage.setItem(this.TOKEN_KEY, tokens.access_token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refresh_token);
  }

  clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  refreshToken(): Observable<TokenResponse> {
    if (this.refreshTokenInProgress) {
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        map(token => {
          const refreshToken = this.getRefreshToken();
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }
          return {
            access_token: token,
            refresh_token: refreshToken
          };
        })
      );
    }

    this.refreshTokenInProgress = true;
    this.refreshTokenSubject.next(null);

    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<TokenResponse>('/api/auth/refresh', { refresh_token: refreshToken }).pipe(
      tap(tokens => {
        this.setTokens(tokens);
        this.refreshTokenInProgress = false;
        this.refreshTokenSubject.next(tokens.access_token);
      }),
      catchError(error => {
        this.refreshTokenInProgress = false;
        this.clearTokens();
        return throwError(() => error);
      })
    );
  }
} 