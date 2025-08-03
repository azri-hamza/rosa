import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
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
  DeleteOutline,
  LockOutline,
  EditOutline,
  SearchOutline,
  ClearOutline,
  InboxOutline,
  PrinterOutline,
} from '@ant-design/icons-angular/icons';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { provideApiClient } from '@rosa/api-client';
import { environment } from '../environments/environment';
import { authInterceptor } from '@rosa/auth';
import { registerLocaleData } from '@angular/common';
import fr_FR_locale from '@angular/common/locales/fr';
import ar_TN_locale from '@angular/common/locales/ar-TN';

// Register French locale (for general app use)
registerLocaleData(fr_FR_locale);
// Register Arabic Tunisia locale (for currency and local formatting)
registerLocaleData(ar_TN_locale, 'ar-TN');

const icons = [
  HomeOutline,
  InfoCircleOutline,
  LaptopOutline,
  NotificationOutline,
  UserOutline,
  PieChartOutline,
  PlusOutline,
  EyeOutline,
  DeleteOutline,
  LockOutline,
  EditOutline,
  SearchOutline,
  ClearOutline,
  InboxOutline,
  PrinterOutline,
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: NZ_I18N, useValue: fr_FR },
    { provide: NZ_ICONS, useValue: icons },
    { provide: LOCALE_ID, useValue: 'fr-FR' }, // Set French as default locale
    provideZoneChangeDetection({ eventCoalescing: true }),
    ...provideApiClient(environment),
  ],
};
