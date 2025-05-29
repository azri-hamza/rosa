import { HttpClient } from '@angular/common/http';
import { ApiClient } from './clients/api.client';
import {
  ApiEnvironment,
  API_ENVIRONMENT,
} from './interfaces/environment.interface';

export function provideApiClient(config: ApiEnvironment) {
  return [
    HttpClient,
    ApiClient,
    {
      provide: API_ENVIRONMENT,
      useValue: config,
    },
  ];
}
