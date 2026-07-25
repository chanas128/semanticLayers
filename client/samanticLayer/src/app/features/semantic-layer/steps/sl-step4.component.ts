import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SemanticLayerApiService, SemanticLayerDefinition } from '../services/semantic-layer-api.service';
import { SemanticLayerStateService } from '../semantic-layer-state.service';

@Component({
  selector: 'app-sl-step4',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  styleUrls: ['./sl-step.shared.scss'],
  template: `
    <div class="step-container">

      <!-- No layer -->
      <div class="step-bg" style="background-color: #e3f2f7;" *ngIf="!layer()">
        <div class="step-content">
          <mat-icon class="placeholder-icon">hourglass_empty</mat-icon>
          <p class="placeholder-text">יש להשלים את כל השלבים הקודמים.</p>
        </div>
      </div>

      <!-- Summary + Export -->
      <div class="step4-wrapper" *ngIf="layer()">
        <div class="step-bg" style="background-color: #e3f2f7;">
          <div class="finish-message">
            <mat-icon class="finish-icon">check_circle</mat-icon>
            <h2>השכבה הסמנטית מוכנה!</h2>
            <p>התהליך הושלם — ניתן לייצא את השכבה או לחזור ולערוך.</p>
          </div>
        </div>

        <!-- Summary cards -->
        <div class="summary-grid">
          <div class="summary-card">
            <mat-icon>table_chart</mat-icon>
            <div class="summary-value">{{ layer()!.tables.length }}</div>
            <div class="summary-label">טבלאות</div>
          </div>
          <div class="summary-card">
            <mat-icon>view_column</mat-icon>
            <div class="summary-value">{{ totalColumns() }}</div>
            <div class="summary-label">עמודות</div>
          </div>
          <div class="summary-card">
            <mat-icon>share</mat-icon>
            <div class="summary-value">{{ layer()!.relationships.length }}</div>
            <div class="summary-label">קשרים</div>
          </div>
          <div class="summary-card">
            <mat-icon>storage</mat-icon>
            <div class="summary-value">{{ layer()!.databaseName }}</div>
            <div class="summary-label">מסד נתונים</div>
          </div>
        </div>

        <!-- Export buttons -->
        <div class="export-actions">
          <button mat-raised-button class="btn-primary" (click)="exportJson()">
            <mat-icon>download</mat-icon>
            <span>ייצוא JSON</span>
          </button>

          <button mat-raised-button class="btn-disabled" disabled
                  matTooltip="בפיתוח — ייצוא לפורמט Excel">
            <mat-icon>grid_on</mat-icon>
            <span>ייצוא Excel</span>
          </button>

          <!-- <button mat-raised-button class="btn-disabled" disabled
                  matTooltip="בפיתוח — מילוי תיאורים אוטומטי ע"י AI">
            <mat-icon>auto_awesome</mat-icon>
            <span>מילוי AI</span>
          </button> -->
        </div>
      </div>

    </div>
  `
})
export class SlStep4Component implements OnInit {
  private api = inject(SemanticLayerApiService);
  private slState = inject(SemanticLayerStateService);

  layer = signal<SemanticLayerDefinition | null>(null);

  ngOnInit(): void {
    const stateLayer = (this.slState as any)._layer as SemanticLayerDefinition | undefined;
    const connId = (this.slState as any)._connectionId as number | undefined;

    if (stateLayer) {
      this.layer.set(stateLayer);
    } else if (connId) {
      this.api.getSemanticLayer(connId).subscribe({
        next: (l) => this.layer.set(l),
        error: () => {}
      });
    }
  }

  totalColumns(): number {
    return this.layer()?.tables.reduce((sum, t) => sum + t.columns.length, 0) ?? 0;
  }

  exportJson(): void {
    const connId = (this.slState as any)._connectionId as number;
    if (!connId) return;

    this.api.exportJson(connId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `semantic-layer-${connId}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Export failed', err)
    });
  }
}
