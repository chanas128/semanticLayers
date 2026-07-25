// routes.ts
import { Routes } from '@angular/router';
// import { AuthGuard } from './shared/components/auth.guard';

export const appRoutes: Routes = [
  // ─── נתיבים פעילים ────────────────────────────────────────────
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./features/landing-page/landing-page.component').then(m => m.LandingPageComponent),
  },
  {
    path: 'semantic-layer',
    // canActivate: [AuthGuard],
    loadComponent: () =>
      import('./features/semantic-layer/semantic-layer.component').then(m => m.SemanticLayerComponent),
  },


  // ─── ארכיון — נתיבים ישנים (הועברו ל-archive/, לא בשימוש) ────
  // {
  //   path: 'hamara',
  //   loadComponent: () => import('./features/hamara/hamara.component').then(m => m.HamaraComponent),
  // },
  // {
  //   path: 'reports',
  //   loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent),
  // },
  // {
  //   path: 'management',
  //   loadComponent: () => import('./features/management/management.component').then(m => m.AdminComponent),
  // },
  // {
  //   path: 'dashboard',
  //   loadComponent: () => import('./shared/components/Dashboard/dashboard.component').then(m => m.DashboardComponent),
  // },
];
