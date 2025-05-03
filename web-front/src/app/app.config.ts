import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { NZ_I18N, fr_FR } from 'ng-zorro-antd/i18n';
import {
  HomeOutline,
  InfoCircleOutline,
  LaptopOutline,
  NotificationOutline,
  UserOutline,
  PieChartOutline,
  PlusOutline,
  EyeOutline,
} from '@ant-design/icons-angular/icons';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { ApiClient, API_ENVIRONMENT } from '@rosa/api-client';
import { environment } from '../environments/environment';

const icons = [
  HomeOutline,
  InfoCircleOutline,
  LaptopOutline,
  NotificationOutline,
  UserOutline,
  PieChartOutline,
  PlusOutline,
  EyeOutline,
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideAnimations(),
    provideHttpClient(),
    { provide: NZ_I18N, useValue: fr_FR },
    { provide: NZ_ICONS, useValue: icons },
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: API_ENVIRONMENT, useValue: environment },
    ApiClient,
  ],
};
