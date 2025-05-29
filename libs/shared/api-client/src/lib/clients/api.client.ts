import { HttpClient } from '@angular/common/http';
import { Injectable, inject, Inject } from '@angular/core';
import { HttpOptions } from '@rosa/types';
import {
  ApiEnvironment,
  API_ENVIRONMENT,
} from '../interfaces/environment.interface';

@Injectable()
export class ApiClient {
  private readonly http = inject(HttpClient);

  constructor(@Inject(API_ENVIRONMENT) private environment: ApiEnvironment) {}

  get<T>(endpoint: string, options?: HttpOptions) {
    return this.http.get<T>(this.buildUrl(endpoint), options);
  }

  post<T>(endpoint: string, body: unknown, options?: HttpOptions) {
    return this.http.post<T>(this.buildUrl(endpoint), body, options);
  }

  put<T>(endpoint: string, body: unknown, options?: HttpOptions) {
    return this.http.put<T>(this.buildUrl(endpoint), body, options);
  }

  delete<T>(endpoint: string, options?: HttpOptions) {
    return this.http.delete<T>(this.buildUrl(endpoint), options);
  }

  patch<T>(endpoint: string, body: unknown, options?: HttpOptions) {
    return this.http.patch<T>(this.buildUrl(endpoint), body, options);
  }

  private buildUrl(endpoint: string): string {
    return `${this.environment.apiUrl}/${endpoint}`;
  }
}
