import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return authService.isAuthenticated$.pipe(
    take(1),
    map(isAuthenticated => {
      if (isAuthenticated) {
        return true;
      }

      // Store the attempted URL for redirecting
      const currentUrl = router.getCurrentNavigation()?.initialUrl.toString();
      if (currentUrl) {
        router.navigate(['/login'], { 
          queryParams: { returnUrl: currentUrl }
        });
      } else {
        router.navigate(['/login']);
      }
      
      return false;
    })
  );
}; 