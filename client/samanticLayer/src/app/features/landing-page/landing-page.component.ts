import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatRippleModule],
  template: `
    <div class="landing" dir="rtl">

      <!-- ─── Hero ─── -->
      <section class="hero">

        <!-- SVG לוגו — שכבות נתונים -->
        <div class="hero-logo">
          <svg viewBox="0 0 80 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <ellipse cx="40" cy="52" rx="32" ry="8"  fill="#1e6a8a" opacity="0.6"/>
            <ellipse cx="40" cy="38" rx="32" ry="8"  fill="#2a8fba" opacity="0.78"/>
            <ellipse cx="40" cy="24" rx="32" ry="8"  fill="#3cb8e6"/>
            <ellipse cx="40" cy="12" rx="18" ry="5"  fill="#7ee8ff" opacity="0.85"/>
            <circle  cx="62"  cy="8"  r="3.5"        fill="#7ee8ff" opacity="0.7"/>
          </svg>
        </div>

        <h1 class="hero-title">ברוכים הבאים למערכת<br>השכבה הסמנטית</h1>
        <p class="hero-sub">
          כלי מתקדם לחשיפה, הגדרה, והעשרה של נתונים מול מסדי הנתונים בארגון —<br>
          בתהליך עבודה פשוט ומובנה, ללא צורך בכתיבת קוד מורכב.
        </p>
      </section>

      <!-- ─── 4 שלבים ─── -->
      <section class="steps-section">
        <h2 class="steps-title">איך זה עובד?</h2>
        <div class="steps-row">

          <div class="step-card" style="background: #e5f6fd;">
            <div class="step-num">1</div>
            <mat-icon class="step-icon">storage</mat-icon>
            <div class="step-label">חיבור וסריקה</div>
            <div class="step-desc">חיבור ל-DB וסריקת<br>מבנה הטבלאות</div>
          </div>

          <mat-icon class="arrow-between">chevron_left</mat-icon>

          <div class="step-card" style="background: #d6f0f9;">
            <div class="step-num">2</div>
            <mat-icon class="step-icon">edit_note</mat-icon>
            <div class="step-label">העשרה ועריכה</div>
            <div class="step-desc">שמות עסקיים, תיאורים<br>וייבוא שדות</div>
          </div>

          <mat-icon class="arrow-between">chevron_left</mat-icon>

          <div class="step-card" style="background: #c4e9f5;">
            <div class="step-num">3</div>
            <mat-icon class="step-icon">table_view</mat-icon>
            <div class="step-label">הצגת נתונים</div>
            <div class="step-desc">שאילתות והצגה<br>מהשכבה הסמנטית</div>
          </div>

          <mat-icon class="arrow-between">chevron_left</mat-icon>

          <div class="step-card" style="background: #b0dff0;">
            <div class="step-num">4</div>
            <mat-icon class="step-icon">download</mat-icon>
            <div class="step-label">ייצוא</div>
            <div class="step-desc">ייצוא השכבה<br>הסמנטית לקובץ</div>
          </div>

        </div>
      </section>

      <!-- ─── CTA ─── -->
      <section class="cta-section">
        <button class="cta-btn" matRipple (click)="goToSemanticLayer()">
          <span>התחל ביצירת שכבה סמנטית</span>
          <mat-icon>arrow_back</mat-icon>
        </button>
      </section>

    </div>
  `,
  styles: [`
    .landing {
      direction: rtl;
      min-height: 100%;
      background: linear-gradient(160deg, #f5fbfe 0%, #e8f7fd 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.2rem 1rem 2rem;
      font-family: var(--font, 'Segoe UI', sans-serif);
      gap: 1.5rem;
    }

    /* ─── Hero ─── */
    .hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.6rem;
    }

    .hero-logo svg {
      width: 70px;
      height: 56px;
      filter: drop-shadow(0 4px 12px rgba(42, 143, 186, 0.3));
      animation: floatUp 3.5s ease-in-out infinite;
    }

    @keyframes floatUp {
      0%, 100% { transform: translateY(0); }
      50%       { transform: translateY(-6px); }
    }

    .hero-title {
      font-size: clamp(1.3rem, 2.5vw, 2rem);
      font-weight: 800;
      color: #0A3546;
      line-height: 1.35;
      margin: 0;
      font-family: var(--fontB, var(--font));
    }

    .hero-sub {
      font-size: clamp(0.82rem, 1.3vw, 0.95rem);
      color: #3a6070;
      line-height: 1.6;
      max-width: 520px;
      margin: 0;
    }

    /* ─── Steps ─── */
    .steps-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.8rem;
      width: 100%;
      max-width: 800px;
    }

    .steps-title {
      font-size: 1rem;
      font-weight: 700;
      color: #1e6a8a;
      margin: 0;
      font-family: var(--fontB, var(--font));
      letter-spacing: 0.02em;
    }

    .steps-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      flex-wrap: wrap;
      width: 100%;
    }

    .step-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.3rem;
      padding: 0.9rem 0.8rem;
      border-radius: 1rem;
      min-width: 120px;
      max-width: 140px;
      flex: 1 1 120px;
      border: 1.5px solid rgba(42, 143, 186, 0.18);
      box-shadow: 0 2px 10px rgba(42, 143, 186, 0.1);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      position: relative;
      cursor: default;

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 20px rgba(42, 143, 186, 0.2);
      }
    }

    .step-num {
      position: absolute;
      top: 0.5rem;
      right: 0.6rem;
      font-size: 0.7rem;
      font-weight: 700;
      color: #2a8fba;
      opacity: 0.7;
    }

    .step-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
      color: #1e6a8a;
    }

    .step-label {
      font-size: 0.85rem;
      font-weight: 700;
      color: #0A3546;
      font-family: var(--fontB, var(--font));
      text-align: center;
    }

    .step-desc {
      font-size: 0.75rem;
      color: #4a7a8a;
      line-height: 1.5;
      text-align: center;
    }

    .arrow-between {
      font-size: 1.8rem;
      width: 1.8rem;
      height: 1.8rem;
      color: #7dd4ee;
      flex-shrink: 0;
    }

    /* ─── CTA ─── */
    .cta-section {
      display: flex;
      justify-content: center;
    }

    .cta-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: linear-gradient(135deg, #3cb8e6 0%, #2a8fba 100%);
      color: white;
      border: none;
      border-radius: 2rem;
      padding: 0.85rem 2rem;
      font-size: 1rem;
      font-weight: 700;
      font-family: var(--fontB, var(--font));
      cursor: pointer;
      box-shadow: 0 4px 18px rgba(60, 184, 230, 0.4);
      transition: background 0.25s ease, transform 0.2s ease, box-shadow 0.25s ease;
      direction: rtl;

      mat-icon {
        font-size: 1.2rem;
        width: 1.2rem;
        height: 1.2rem;
      }

      &:hover {
        background: linear-gradient(135deg, #2a8fba 0%, #1e6a8a 100%);
        transform: translateY(-2px);
        box-shadow: 0 6px 22px rgba(42, 143, 186, 0.45);
      }

      &:active {
        transform: translateY(0);
      }
    }

    /* ─── מובייל ─── */
    @media (max-width: 640px) {
      .steps-row { gap: 0.75rem; }
      .arrow-between { display: none; }
      .step-card { min-width: 110px; }
    }
  `]
})
export class LandingPageComponent {
  constructor(private router: Router) {}

  goToSemanticLayer(): void {
    this.router.navigate(['/semantic-layer']);
  }
}
