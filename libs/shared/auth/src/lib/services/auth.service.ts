import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { TokenService } from './token.service';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    roles: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = '/api/auth'; // This should come from environment
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private userSubject = new BehaviorSubject<AuthResponse['user'] | null>(null);

  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    private tokenService: TokenService
  ) {
    // Initialize auth state from stored token
    const token = this.tokenService.getToken();
    this.isAuthenticatedSubject.next(!!token);
    
    if (token) {
      // Fetch user profile if token exists
      this.fetchUserProfile().subscribe();
    }
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(response => {
        this.tokenService.setTokens({
          access_token: response.access_token,
          refresh_token: response.refresh_token
        });
        this.isAuthenticatedSubject.next(true);
        this.userSubject.next(response.user);
      })
    );
  }

  logout(): void {
    // Optional: Call backend to invalidate token
    this.http.post(`${this.API_URL}/logout`, {}).subscribe({
      complete: () => this.handleLogout(),
      error: () => this.handleLogout()
    });
  }

  private handleLogout(): void {
    this.tokenService.clearTokens();
    this.isAuthenticatedSubject.next(false);
    this.userSubject.next(null);
  }

  private fetchUserProfile(): Observable<AuthResponse['user']> {
    return this.http.get<AuthResponse['user']>(`${this.API_URL}/profile`).pipe(
      tap(user => this.userSubject.next(user))
    );
  }
} 