import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  template: `
    <!-- Layout רגיל: TopBar + תוכן מלא-רוחב -->
    <div *ngIf="showLayout" class="app-shell">
      <header class="topbar" dir="rtl">
        <button
          class="back-btn"
          matTooltip="חזור"
          matTooltipPosition="below"
          (click)="goBack()"
          *ngIf="showBackButton"
        >
          <mat-icon>arrow_forward</mat-icon>
        </button>
        <span class="topbar-title" *ngIf="pageTitle">{{ pageTitle }}</span>
      </header>

      <div class="app-content">
        <router-outlet></router-outlet>
      </div>
    </div>

    <!-- דף access-denied — ללא TopBar -->
    <div *ngIf="!showLayout">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    /* ── Shell ────────────────────────────────────── */
    .app-shell {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }

    /* ── TopBar ───────────────────────────────────── */
    .topbar {
      flex-shrink: 0;
      height: 56px;
      background: #ffffff;
      border-bottom: 1px solid rgba(0,0,0,0.06);
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0 1.4rem;
      direction: rtl;
      box-shadow: 0 1px 6px rgba(10,53,70,0.05);
      z-index: 100;
    }

    .back-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      cursor: pointer;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      color: #1e6a8a;
      transition: background 0.2s, color 0.2s;

      mat-icon { font-size: 22px; width: 22px; height: 22px; }

      &:hover { background: #e5f6fd; color: #3cb8e6; }
    }

    .topbar-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #0A3546;
      font-family: var(--fontB, var(--font));
    }

    /* ── Main content fills remaining height ──────── */
    .app-content {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
    }
  `]
})
export class AppComponent {

  showLayout    = true;
  showBackButton = false;
  pageTitle     = '';

  private routeTitles: Record<string, string> = {
    '/home':           '',
    '/semantic-layer': 'הגדרת שכבה סמנטית חדשה',
  };

  constructor(
    private router: Router,
    private location: Location,
    private http: HttpClient,
  ) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: NavigationEnd) => {
      const url = e.urlAfterRedirects;
      this.showLayout = !url.startsWith('/access-denied');

      const base = '/' + url.split('/')[1];
      this.pageTitle      = this.routeTitles[base] ?? '';
      this.showBackButton = base !== '/home' && base !== '/';

      if (url === '/access-denied') {
        const redirect = sessionStorage.getItem('redirectAfterAccessRestored');
        if (redirect) {
          this.http.get('/api/check-permission', { observe: 'response' }).subscribe({
            next: res => {
              if (res.status === 200) {
                sessionStorage.removeItem('redirectAfterAccessRestored');
                this.router.navigateByUrl(redirect);
              }
            },
            error: err => {
              if (err.status !== 403) sessionStorage.removeItem('redirectAfterAccessRestored');
            }
          });
        }
      }
    });
  }

  goBack(): void { this.location.back(); }
}
