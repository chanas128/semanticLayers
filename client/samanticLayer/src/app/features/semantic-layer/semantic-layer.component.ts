import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';
import { SemanticLayerStateService } from './semantic-layer-state.service';
import { SlStep1Component } from './steps/sl-step1.component';
import { SlStep2Component } from './steps/sl-step2.component';
import { SlStep3Component } from './steps/sl-step3.component';
import { SlStep4Component } from './steps/sl-step4.component';

@Component({
  selector: 'app-semantic-layer',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    SlStep1Component,
    SlStep2Component,
    SlStep3Component,
    SlStep4Component
  ],
  styleUrls: ['./semantic-layer.component.scss'],
  template: `
    <div class="sl-workspace" dir="rtl">
      <div class="sl-card">

        <!-- ── Step Tabs ──────────────────────────────────────── -->
        <nav class="sl-tabs">
          <ng-container *ngFor="let step of steps; let i = index; let last = last">
            <button
              class="sl-tab"
              [class.active]="i === currentStep"
              [class.visited]="i < currentStep"
              [class.disabled]="i > maxStepReached"
              [matTooltip]="step.tooltip"
              matTooltipPosition="below"
              (click)="onStepHeaderClick(i)"
            >
              <mat-icon class="sl-tab__icon">
                {{ i < currentStep ? 'check_circle' : step.icon }}
              </mat-icon>
              <span class="sl-tab__label">{{ step.label }}</span>
            </button>
            <div class="sl-tab-sep" *ngIf="!last"></div>
          </ng-container>
        </nav>

        <!-- ── Step Content ───────────────────────────────────── -->
        <div class="sl-content">
          <ng-container [ngSwitch]="currentStep">
            <app-sl-step1 *ngSwitchCase="0" />
            <app-sl-step2 *ngSwitchCase="1" />
            <app-sl-step3 *ngSwitchCase="2" />
            <app-sl-step4 *ngSwitchCase="3" />
          </ng-container>
        </div>

        <!-- ── Footer Nav ─────────────────────────────────────── -->
        <footer class="sl-footer">
          <button
            class="sl-btn sl-btn--ghost"
            (click)="goToPrevious()"
            *ngIf="currentStep > 0"
          >
            <mat-icon>arrow_forward</mat-icon>
            <span>הקודם</span>
          </button>

          <span
            [matTooltip]="nextTooltip"
            matTooltipPosition="above"
            [matTooltipDisabled]="!nextDisabled()"
          >
            <button
              class="sl-btn sl-btn--primary"
              [class.sl-btn--disabled]="nextDisabled()"
              (click)="goToNext()"
              [disabled]="nextDisabled()"
              *ngIf="currentStep < steps.length - 1"
            >
              <span>הבא</span>
              <mat-icon>arrow_back</mat-icon>
            </button>
          </span>
        </footer>

      </div>
    </div>
  `
})
export class SemanticLayerComponent {

  steps = [
    { label: 'חיבור וסריקה',   icon: 'storage',     tooltip: 'חיבור ל-DB וסריקת מבנה הטבלאות' },
    { label: 'העשרה ועריכה',   icon: 'edit_note',   tooltip: 'עריכת שמות, תיאורים, ייבוא שדות ואישור קשרים' },
    { label: 'הצגת נתונים',    icon: 'table_view',  tooltip: 'שאילתות והצגת נתונים מהשכבה הסמנטית' },
    { label: 'ייצוא',          icon: 'download',    tooltip: 'ייצוא השכבה הסמנטית לקובץ' }
  ];

  // TODO: עדכן tooltip לפי הסיבה שבגינה הבא מושבת בכל שלב
  nextTooltip = 'יש להשלים את כל שדות החובה לפני המעבר לשלב הבא';

  drawerOpen = false;

  nextDisabled = computed(() => this.slState.nextDisabled());

  constructor(public slState: SemanticLayerStateService) {}

  get currentStep(): number  { return this.slState.currentStep(); }
  get maxStepReached(): number { return this.slState.maxStepReached(); }

  toggleDrawer(): void {
    this.drawerOpen = !this.drawerOpen;
  }

  async goToNext(): Promise<void> {
    const canLeave = await firstValueFrom(this.slState.canLeavePage());
    if (!canLeave || this.nextDisabled()) return;
    if (this.currentStep < this.steps.length - 1) {
      this.slState.updateCurrentStep(this.currentStep + 1);
    }
  }

  async goToPrevious(): Promise<void> {
    const canLeave = await firstValueFrom(this.slState.canLeavePage());
    if (!canLeave) return;
    if (this.currentStep > 0) {
      this.slState.updateCurrentStep(this.currentStep - 1);
    }
  }

  async onStepHeaderClick(index: number): Promise<void> {
    const canLeave = await firstValueFrom(this.slState.canLeavePage());
    if (!canLeave) return;
    if (index <= this.maxStepReached) {
      this.slState.updateCurrentStep(index);
    }
  }
}
