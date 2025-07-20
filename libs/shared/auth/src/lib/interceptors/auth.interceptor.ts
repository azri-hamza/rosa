import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { TokenService } from '../services/token.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly PUBLIC_ENDPOINTS = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
    // Add other public endpoints here
  ];

  constructor(private tokenService: TokenService) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // Skip authentication for public endpoints
    if (this.isPublicEndpoint(request.url)) {
      return next.handle(request);
    }

    return this.handleRequest(request, next);
  }

  private handleRequest(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    const token = this.tokenService.getToken();

    if (!token) {
      return next.handle(request);
    }

    const authReq = this.addTokenToRequest(request, token);

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.handle401Error(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  private handle401Error(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return this.tokenService.refreshToken().pipe(
      switchMap((tokens) => {
        const newAuthReq = this.addTokenToRequest(request, tokens.access_token);
        return next.handle(newAuthReq);
      }),
      catchError((error) => {
        // If refresh token fails, clear tokens and throw error
        this.tokenService.clearTokens();
        return throwError(() => error);
      })
    );
  }

  private addTokenToRequest(
    request: HttpRequest<unknown>,
    token: string
  ): HttpRequest<unknown> {
    return request.clone({
      headers: request.headers.set('Authorization', `Bearer ${token}`),
    });
  }

  private isPublicEndpoint(url: string): boolean {
    return this.PUBLIC_ENDPOINTS.some((endpoint) => url.includes(endpoint));
  }
}

// Functional interceptor for new Angular HTTP client
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  
  const PUBLIC_ENDPOINTS = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
  ];

  const isPublicEndpoint = (url: string): boolean => {
    return PUBLIC_ENDPOINTS.some((endpoint) => url.includes(endpoint));
  };

  const addTokenToRequest = (request: HttpRequest<unknown>, token: string): HttpRequest<unknown> => {
    return request.clone({
      headers: request.headers.set('Authorization', `Bearer ${token}`),
    });
  };

  // Skip authentication for public endpoints
  if (isPublicEndpoint(req.url)) {
    return next(req);
  }

  const token = tokenService.getToken();
  const refreshToken = tokenService.getRefreshToken();

  // If no access token but refresh token exists, try to refresh first
  if (!token && refreshToken) {
    console.log('No access token but refresh token exists, attempting refresh');
    return tokenService.refreshToken().pipe(
      switchMap((tokens) => {
        console.log('Refresh successful, making request with new token');
        const newAuthReq = addTokenToRequest(req, tokens.access_token);
        return next(newAuthReq);
      }),
      catchError((refreshError) => {
        console.log('Refresh failed, proceeding without authentication');
        tokenService.clearTokens();
        return next(req);
      })
    );
  }

  // If no tokens at all, proceed without authentication
  if (!token) {
    return next(req);
  }

  // If access token exists, use it
  const authReq = addTokenToRequest(req, token);

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.log('401 error received, attempting token refresh');
        return tokenService.refreshToken().pipe(
          switchMap((tokens) => {
            console.log('Refresh successful after 401, retrying request');
            const newAuthReq = addTokenToRequest(req, tokens.access_token);
            return next(newAuthReq);
          }),
          catchError((refreshError) => {
            console.log('Refresh failed after 401, clearing tokens');
            tokenService.clearTokens();
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
}; 