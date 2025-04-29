import { InjectionToken } from '@angular/core';

export interface ApiEnvironment {
  apiUrl: string;
  // Add other API-related environment variables here
}

export const API_ENVIRONMENT = new InjectionToken<ApiEnvironment>(
  'API_ENVIRONMENT'
);
