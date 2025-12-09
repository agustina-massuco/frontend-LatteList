import { Routes } from '@angular/router';
import { Home } from './shared/home/home';
import { authGuard } from './core/guards/authGuard/auth-guard';
import { clienGuard } from './core/guards/clienGuard/clien-guard';
import { adminGuard } from './core/guards/adminGuard/admin-guard';

export const routes: Routes = [
    {
        path: '', redirectTo: '/home', pathMatch: 'full'
    },
    {
        path: 'home', component: Home 
    },
    { 
        path: 'auth',
        loadChildren: () => import('./features/users/user-routing.module')
            .then(m => m.UserRoutingModule) 
    },

    ///rutas privadas
    {
        path: 'cafes',
        loadChildren: () => import('./features/cafes/cafes-routing.module')
            .then(m => m.CafesRoutingModule),
        canActivate: [authGuard]
    },
    {  
        path: 'lista',
        loadChildren: () => import('./features/lista/list-routing.module').then(m => m.ListRoutingModule),
        canActivate: [authGuard, clienGuard]
    },


    {
        path: 'admin',
        loadChildren: () => import('./features/users/user-routing.module').then(m => m.UserRoutingModule), 
        canActivate: [authGuard, adminGuard] 
    },

    // Redirige a 'home' si la ruta no existe.
    { path: '**', redirectTo: '/home' }
];
