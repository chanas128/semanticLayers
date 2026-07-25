import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  SemanticLayerApiService,
  SemanticLayerDefinition, SLTable, QueryResult, QueryFilter
} from '../services/semantic-layer-api.service';
import { SemanticLayerStateService } from '../semantic-layer-state.service';

@Component({
  selector: 'app-sl-step3',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatFormFieldModule, MatSelectModule, MatInputModule,
    MatButtonModule, MatIconModule, MatCheckboxModule,
    MatProgressSpinnerModule, MatTooltipModule
  ],
  styleUrls: ['./sl-step.shared.scss'],
  template: `
    <div class="step-container">

      <!-- No layer -->
      <div class="step-bg" style="background-color: #e8f5f9;" *ngIf="!layer()">
        <div class="step-content">
          <mat-icon class="placeholder-icon">hourglass_empty</mat-icon>
          <p class="placeholder-text">יש להשלים את שלבים 1–2 לפני מעבר לשלב זה.</p>
        </div>
      </div>

      <!-- Query builder -->
      <div class="query-builder" *ngIf="layer()">
        <h3 class="step-title">הצגת נתונים</h3>
        <p class="step-description">בחר טבלה, סמן עמודות, הגדר מסנן אופציונלי — והמערכת תייצר שאילתה ותציג תוצאות.</p>

        <!-- Table selector -->
        <div class="qb-row">
          <mat-form-field appearance="outline" class="qb-table-select">
            <mat-label>בחירת טבלה (שם עסקי)</mat-label>
            <mat-select [(ngModel)]="selectedTable" (selectionChange)="onTableChange()">
              <mat-option *ngFor="let t of layer()!.tables" [value]="t">
                {{ t.displayName }} <span class="tech-hint">({{ t.name }})</span>
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Column picker -->
        <div class="qb-columns" *ngIf="selectedTable">
          <label class="qb-label">עמודות להצגה:</label>
          <div class="qb-chips">
            <mat-checkbox *ngFor="let col of selectedTable.columns"
                          [checked]="isColSelected(col.name)"
                          (change)="toggleColumn(col.name)"
                          color="primary">
              {{ col.displayName }}
              <span class="tech-hint">({{ col.dataType }})</span>
            </mat-checkbox>
          </div>
        </div>

        <!-- Filter -->
        <div class="qb-filter" *ngIf="selectedTable">
          <label class="qb-label">מסנן (אופציונלי):</label>
          <div class="qb-filter-row">
            <mat-form-field appearance="outline" class="qb-field-sm">
              <mat-label>עמודה</mat-label>
              <mat-select [(ngModel)]="filterCol">
                <mat-option value="">ללא מסנן</mat-option>
                <mat-option *ngFor="let col of selectedTable.columns" [value]="col.name">
                  {{ col.displayName }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="qb-field-xs" *ngIf="filterCol">
              <mat-label>אופרטור</mat-label>
              <mat-select [(ngModel)]="filterOp">
                <mat-option value="=">=</mat-option>
                <mat-option value=">">></mat-option>
                <mat-option value="<"><</mat-option>
                <mat-option value=">=">>=</mat-option>
                <mat-option value="<="><=</mat-option>
                <mat-option value="LIKE">LIKE</mat-option>
                <mat-option value="BETWEEN">BETWEEN</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="qb-field-sm" *ngIf="filterCol">
              <mat-label>ערך</mat-label>
              <input matInput [(ngModel)]="filterVal" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="qb-field-sm" *ngIf="filterCol && filterOp === 'BETWEEN'">
              <mat-label>עד</mat-label>
              <input matInput [(ngModel)]="filterValTo" />
            </mat-form-field>
          </div>
        </div>

        <!-- Run button -->
        <div class="qb-actions" *ngIf="selectedTable">
          <button mat-raised-button class="btn-primary" (click)="runQuery()" [disabled]="loading() || selectedColsCount() === 0">
            <mat-spinner *ngIf="loading()" diameter="18"></mat-spinner>
            <mat-icon *ngIf="!loading()">play_arrow</mat-icon>
            <span>{{ loading() ? 'מריץ...' : 'הצג נתונים' }}</span>
          </button>
          <span class="qb-hint" *ngIf="selectedColsCount() === 0">יש לבחור לפחות עמודה אחת</span>
        </div>

        <!-- Results table -->
        <div class="qb-results" *ngIf="queryResult()">
          <div class="qb-results-header">
            <span><strong>{{ getResultRows().length }}</strong> שורות הוחזרו</span>
            <code class="qb-sql" matTooltip="שאילתת SQL שנוצרה">{{ getResultSql() }}</code>
          </div>
          <div class="qb-table-wrapper">
            <table class="qb-table">
              <thead>
                <tr>
                  <th *ngFor="let col of getResultColumns()">
                    {{ getDisplayName(col) }}
                    <div *ngIf="getCustomFieldSummary(col)" style="font-size:0.65rem;font-weight:normal;color:#2a8fba;margin-top:2px;">
                      {{ getCustomFieldSummary(col) }}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of getResultRows()">
                  <td *ngFor="let cell of row">{{ cell ?? '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Error -->
        <div class="conn-error" *ngIf="errorMsg()">
          <mat-icon>error_outline</mat-icon>
          <span>{{ errorMsg() }}</span>
        </div>
      </div>

    </div>
  `
})
export class SlStep3Component implements OnInit {
  private api = inject(SemanticLayerApiService);
  private slState = inject(SemanticLayerStateService);

  layer = signal<SemanticLayerDefinition | null>(null);
  loading = signal(false);
  errorMsg = signal<string | null>(null);
  queryResult = signal<QueryResult | null>(null);

  selectedTable: SLTable | null = null;
  selectedCols = signal<string[]>([]);
  selectedColsCount = signal(0);
  filterCol = '';
  filterOp = '=';
  filterVal = '';
  filterValTo = '';

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

  onTableChange(): void {
    this.queryResult.set(null);
    this.errorMsg.set(null);
    this.filterCol = '';
    // Auto-select first 5 columns
    if (this.selectedTable) {
      const cols = this.selectedTable.columns.slice(0, 5).map(c => c.name);
      this.selectedCols.set(cols);
    } else {
      this.selectedCols.set([]);
    }
    this.selectedColsCount.set(this.selectedCols().length);
  }

  isColSelected(name: string): boolean {
    return this.selectedCols().includes(name);
  }

  toggleColumn(name: string): void {
    const current = this.selectedCols();
    if (current.includes(name)) {
      this.selectedCols.set(current.filter(c => c !== name));
    } else {
      this.selectedCols.set([...current, name]);
    }
    this.selectedColsCount.set(this.selectedCols().length);
  }

  runQuery(): void {
    if (!this.selectedTable || this.selectedCols().length === 0) return;
    const connId = (this.slState as any)._connectionId as number | undefined;

    if (!connId) {
      this.errorMsg.set('חסר מזהה חיבור — יש לחזור לשלב 1 ולבצע סריקה מחדש.');
      return;
    }

    // Only send real DB columns to the query
    const dbCols = this.selectedCols().filter(c => !c.startsWith('__custom__'));
    if (dbCols.length === 0) {
      this.errorMsg.set('יש לבחור לפחות עמודה אחת מה-DB.');
      return;
    }

    const filters: QueryFilter[] = [];
    if (this.filterCol && this.filterVal) {
      filters.push({
        column: this.filterCol,
        operator: this.filterOp,
        value: this.filterVal,
        valueTo: this.filterOp === 'BETWEEN' ? this.filterValTo : undefined
      });
    }

    this.loading.set(true);
    this.errorMsg.set(null);

    this.api.executeQuery({
      connectionId: connId,
      tableName: this.selectedTable.name,
      selectedColumns: dbCols,
      filters,
      maxRows: 200
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.queryResult.set(res);
        setTimeout(() => {
          const el = document.querySelector('.qb-results');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error || err.message || 'שגיאה בהרצת השאילתה');
      }
    });
  }

  getDisplayName(colName: string): string {
    if (!this.selectedTable) return colName;
    const col = this.selectedTable.columns.find(c => c.name === colName);
    return col?.displayName || colName;
  }

  /** Get custom field values for a column (shown under column header) */
  getCustomFieldSummary(colName: string): string {
    if (!this.selectedTable) return '';
    const col = this.selectedTable.columns.find(c => c.name === colName);
    if (!col?.customValues) return '';

    const layer = this.layer() as any;
    const customFields = layer?.customFields as { id: string; name: string }[] || [];
    if (customFields.length === 0) return '';

    const parts: string[] = [];
    for (const field of customFields) {
      const val = col.customValues[field.id];
      if (val) {
        parts.push(`${field.name}: ${val}`);
      }
    }
    return parts.join(' | ');
  }

  getResultColumns(): string[] {
    const r = this.queryResult() as any;
    if (!r) return [];
    return r.columns || r.Columns || [];
  }

  getResultRows(): any[][] {
    const r = this.queryResult() as any;
    if (!r) return [];
    return r.rows || r.Rows || [];
  }

  getResultSql(): string {
    const r = this.queryResult() as any;
    if (!r) return '';
    return r.generatedSql || r.GeneratedSql || '';
  }
}
