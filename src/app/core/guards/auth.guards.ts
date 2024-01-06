import { inject } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivateFn, Router } from "@angular/router";
import { map, take } from "rxjs";
import { AuthService } from "../services/auth.service";

export const checkAuthState: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  return authService.getAuthStatus().pipe(
    take(1),
    map(user => {
      const isLoginOrRegisterRoute = ['login', 'register'].includes(route.url.toString());
        
      if (isLoginOrRegisterRoute) {
        return user ? router.createUrlTree(['/']) : true;
      } else {
        return user ? true : router.createUrlTree(['/login']);
      }
    })
  );
};
