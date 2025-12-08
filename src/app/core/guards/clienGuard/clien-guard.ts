import { CanActivateFn } from '@angular/router';

export const clienGuard: CanActivateFn = (route, state) => {
  return true;
};
