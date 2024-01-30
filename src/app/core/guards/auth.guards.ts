import { inject } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivateFn, Router, UrlTree } from "@angular/router";
import { Observable, map, take } from "rxjs";
import { AuthService } from "../services/auth.service";
import { User } from '@angular/fire/auth';

export const checkAuthState: CanActivateFn = (route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree => {
  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);
  
  return authService.getAuthState().pipe(
    take(1),
    map((user: User | null) => {
      const isLoginOrRegisterRoute: boolean = ['login', 'register'].includes(route.url.toString());
        
      if (isLoginOrRegisterRoute) {
        return user ? router.createUrlTree(['/']) : true;
      } else {
        return user ? true : router.createUrlTree(['/login']);
      }
    })
  );
};
