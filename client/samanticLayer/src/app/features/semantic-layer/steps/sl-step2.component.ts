import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  SemanticLayerApiService,
  SemanticLayerDefinition,
  SLTable,
  SLColumn,
  SLRelationship
} from '../services/semantic-layer-api.service';
import { SemanticLayerStateService } from '../semantic-layer-state.service';

// ─── Row model for mat-table (flattened) ──────────────────────────────────────
export interface ColumnRow {
  _rowType: 'subtitle' | 'data';
  _tableName: string;
  _tableDisplayName: string;
  _tableColCount: number;
  // Column fields (only for data rows)
  name: string;
  displayName: string;
  dataType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  min: string;
  max: string;
  distinctCount: number | null;
  businessDescription: string;
  source: string;
  // Edit state
  isEditingDisplayName?: boolean;
  isEditingDescription?: boolean;
  prevDisplayName?: string;
  prevDescription?: string;
  isNewRow?: boolean;
  // Custom fields (dynamic) — key is field id, value is user-entered text
  customFieldValues?: { [fieldId: string]: string };
  editingCustomField?: string; // currently editing custom field id
  prevCustomFieldValue?: string;
}

@Component({
  selector: 'app-sl-step2',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule
  ],
  styleUrls: ['./sl-step2.component.scss'],
  template: `
    <div class="step2-container">

      <!-- Loading -->
      <div *ngIf="isLoading" class="spinner-overlay">
        <mat-progress-spinner mode="indeterminate" diameter="60"></mat-progress-spinner>
        <span>טוען שכבה סמנטית...</span>
      </div>

      <!-- No data -->
      <div class="no-data-container" *ngIf="!isLoading && !layer">
        <mat-icon>hourglass_empty</mat-icon>
        <p>יש להשלים את שלב 1 (חיבור וסריקה) לפני מעבר לשלב זה.</p>
      </div>

      <!-- Main content -->
      <ng-container *ngIf="!isLoading && layer">

        <!-- Header actions bar -->
        <div class="header-actions">
          <span class="table-title">העשרת השכבה הסמנטית</span>
          <div class="icon-actions">
            <button class="icon-boxSave" (click)="saveChanges()" [disabled]="isSaveDisabled()">
              <mat-icon class="save-icon">save</mat-icon>
              שמירה ({{ pendingUpdates.length }})
            </button>
            <button class="icon-box" matTooltip="הוסף שדה לכל הטבלאות" (click)="showAddFieldPrompt = !showAddFieldPrompt">
              <mat-icon class="action-icon">playlist_add</mat-icon>
            </button>
            <button class="icon-box" matTooltip="ייבוא שדה מקובץ (Excel / JSON)" (click)="showImportPanel = !showImportPanel">
              <mat-icon class="action-icon">upload_file</mat-icon>
            </button>
            <button class="icon-box" matTooltip="מילוי אוטומטי AI — בפיתוח" disabled style="opacity:0.5;cursor:not-allowed;">
              <mat-icon class="action-icon" style="color:#1e6a8a;">auto_awesome</mat-icon>
            </button>
          </div>
        </div>

        <!-- Add custom field prompt -->
        <div *ngIf="showAddFieldPrompt" style="display:flex;align-items:center;gap:12px;padding:10px 16px;background:#e8f4fa;border-radius:10px;margin-bottom:12px;flex-wrap:wrap;">
          <span style="font-weight:bold;color:#0A3546;">הוסף שדה חדש:</span>
          <input type="text" [(ngModel)]="newFieldName" placeholder="שם תצוגה (למשל: שם בעברית)"
                 style="padding:6px 12px;border:1px solid #2a8fba;border-radius:8px;font-size:14px;min-width:180px;" />
          <span style="font-size:13px;color:#0A3546;font-weight:600;white-space:nowrap;">שם המאפיין (אנגלית בלבד):</span>
          <input type="text" [(ngModel)]="newFieldKey" placeholder="hebrewName"
                 pattern="[a-zA-Z_][a-zA-Z0-9_]*"
                 (input)="sanitizeFieldKey()"
                 style="padding:6px 12px;border:1px solid #1e6a8a;border-radius:8px;font-size:14px;min-width:160px;direction:ltr;text-align:left;font-family:monospace;letter-spacing:0.5px;" />
          <button class="icon-boxSave" (click)="addCustomField()" [disabled]="!newFieldName.trim() || !newFieldKey.trim()">
            <mat-icon class="save-icon">add</mat-icon> הוסף
          </button>
          <button class="icon-box" (click)="showAddFieldPrompt = false" style="border-color:#999;">
            <mat-icon style="color:#999;font-size:20px;">close</mat-icon>
          </button>
          <div *ngIf="customFields.length > 0" style="width:100%;margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
            <span style="font-size:13px;color:#666;">שדות שנוספו:</span>
            <span *ngFor="let f of customFields" style="background:#fff;border:1px solid #2a8fba;border-radius:16px;padding:3px 10px;font-size:13px;display:inline-flex;align-items:center;gap:4px;">
              {{ f.name }} <span style="color:#888;font-size:11px;">({{ f.key }})</span>
              <mat-icon (click)="removeCustomField(f.id)" style="font-size:14px;width:14px;height:14px;cursor:pointer;color:#f44336;">close</mat-icon>
            </span>
          </div>
        </div>

        <!-- Import from file panel -->
        <div *ngIf="showImportPanel" class="import-panel">
          <div class="import-panel-header">
            <mat-icon style="color:#2a8fba;font-size:24px;width:24px;height:24px;">upload_file</mat-icon>
            <span class="import-panel-title">ייבוא / עדכון מקובץ</span>
            <button class="icon-box" (click)="showImportPanel = false" style="border-color:#999;margin-right:auto;">
              <mat-icon style="color:#999;font-size:18px;width:18px;height:18px;">close</mat-icon>
            </button>
          </div>

          <p class="import-panel-desc">
            העלה קובץ <strong>Excel (.xlsx)</strong> או <strong>JSON</strong> עם עמודת מפתח (שם טבלה + שם עמודה) ועמודת ערכים.
            אפשר להוסיף שדה חדש או לעדכן עמודה קיימת.
          </p>

          <!-- Step 1: Upload file -->
          <div class="import-step" *ngIf="!importedData">
            <div class="import-dropzone" (click)="fileInput.click()"
                 (dragover)="onDragOver($event)" (drop)="onFileDrop($event)">
              <mat-icon style="font-size:36px;width:36px;height:36px;color:#2a8fba;">cloud_upload</mat-icon>
              <span>גרור קובץ לכאן או <strong>לחץ לבחירה</strong></span>
              <span style="font-size:12px;color:#999;">Excel (.xlsx) / JSON</span>
            </div>
            <input type="file" #fileInput hidden accept=".xlsx,.xls,.json" (change)="onFileSelected($event)" />
          </div>

          <!-- Step 2: Preview & Map columns -->
          <div class="import-step" *ngIf="importedData && !importValidationResult">
            <div class="import-file-info">
              <mat-icon style="color:#4caf50;">check_circle</mat-icon>
              <span><strong>{{ importedFileName }}</strong> — {{ importedData.length }} שורות נטענו</span>
              <button class="icon-box" (click)="clearImport()" style="border-color:#f44336;" matTooltip="נקה ובחר קובץ אחר">
                <mat-icon style="color:#f44336;font-size:18px;width:18px;height:18px;">delete</mat-icon>
              </button>
            </div>

            <!-- Column mapping -->
            <div class="import-mapping">
              <div class="import-mapping-row">
                <label>עמודת מפתח - שם טבלה:</label>
                <select [(ngModel)]="importMapTable" style="padding:6px 12px;border:1px solid #ccc;border-radius:8px;font-size:14px;">
                  <option value="">בחר עמודה...</option>
                  <option *ngFor="let h of importHeaders" [value]="h">{{ h }}</option>
                </select>
              </div>
              <div class="import-mapping-row">
                <label>עמודת מפתח - שם עמודה:</label>
                <select [(ngModel)]="importMapColumn" style="padding:6px 12px;border:1px solid #ccc;border-radius:8px;font-size:14px;">
                  <option value="">בחר עמודה...</option>
                  <option *ngFor="let h of importHeaders" [value]="h">{{ h }}</option>
                </select>
              </div>
              <div class="import-mapping-row">
                <label>עמודת ערך:</label>
                <select [(ngModel)]="importMapValue" style="padding:6px 12px;border:1px solid #ccc;border-radius:8px;font-size:14px;">
                  <option value="">בחר עמודה...</option>
                  <option *ngFor="let h of importHeaders" [value]="h">{{ h }}</option>
                </select>
              </div>

              <!-- Action type: add new or update existing -->
              <div class="import-mapping-row" style="margin-top:12px;padding-top:12px;border-top:1px solid #e0e0e0;">
                <label>פעולה:</label>
                <select [(ngModel)]="importAction" style="padding:6px 12px;border:1px solid #2a8fba;border-radius:8px;font-size:14px;font-weight:bold;">
                  <option value="addNew">הוסף כשדה חדש</option>
                  <option value="updateDisplayName">עדכן שם תצוגה (Display Name)</option>
                  <option value="updateDescription">עדכן תיאור עסקי (Business Description)</option>
                  <option value="updateMin">עדכן Min</option>
                  <option value="updateMax">עדכן Max</option>
                  <option *ngFor="let cf of customFields; let ci = index" [value]="'updateCustom_' + ci">
                    עדכן שדה: {{ cf.name }}
                  </option>
                </select>
              </div>

              <!-- Field name + key (only for add new) -->
              <div class="import-mapping-row" *ngIf="importAction === 'addNew'">
                <label>שם תצוגה:</label>
                <input type="text" [(ngModel)]="importFieldName" placeholder="למשל: שם בעברית"
                       style="padding:6px 12px;border:1px solid #2a8fba;border-radius:8px;font-size:14px;width:180px;" />
              </div>
              <div class="import-mapping-row" *ngIf="importAction === 'addNew'">
                <label style="font-weight:600;">שם המאפיין (אנגלית בלבד):</label>
                <input type="text" [(ngModel)]="importFieldKey" placeholder="hebrewName"
                       (input)="sanitizeImportFieldKey()"
                       style="padding:6px 12px;border:1px solid #1e6a8a;border-radius:8px;font-size:14px;width:160px;direction:ltr;text-align:left;font-family:monospace;" />
              </div>
            </div>

            <!-- Preview -->
            <div class="import-preview" *ngIf="importedData.length > 0">
              <span style="font-size:13px;color:#666;font-weight:bold;">תצוגה מקדימה ({{ importedData.length > 5 ? '5 ראשונות מתוך ' + importedData.length : importedData.length }} שורות):</span>
              <table class="import-preview-table">
                <thead>
                  <tr><th *ngFor="let h of importHeaders">{{ h }}</th></tr>
                </thead>
                <tbody>
                  <tr *ngFor="let row of importedData.slice(0, 5)">
                    <td *ngFor="let h of importHeaders">{{ row[h] ?? '' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Validate button -->
            <div style="margin-top:12px;display:flex;gap:8px;">
              <button class="icon-boxSave" (click)="validateImport()"
                      [disabled]="!importMapTable || !importMapColumn || !importMapValue || (importAction === 'addNew' && (!importFieldName.trim() || !importFieldKey.trim()))">>
                <mat-icon class="save-icon">verified</mat-icon>
                בדוק התאמה
              </button>
            </div>
          </div>

          <!-- Step 3: Validation results -->
          <div class="import-step" *ngIf="importValidationResult">

            <!-- Full match -->
            <div *ngIf="importValidationResult.status === 'ok'" style="background:#ecfdf3;border:1px solid #a5ebc2;border-radius:10px;padding:12px 16px;margin-bottom:12px;">
              <div style="display:flex;align-items:center;gap:8px;font-weight:bold;color:#047244;">
                <mat-icon style="font-size:20px;width:20px;height:20px;">check_circle</mat-icon>
                התאמה מלאה — {{ importValidationResult.matchedCount }} שורות תואמות
              </div>
            </div>

            <!-- Partial match -->
            <div *ngIf="importValidationResult.status === 'partial'" style="background:#fff8e1;border:1px solid #ffe082;border-radius:10px;padding:12px 16px;margin-bottom:12px;">
              <div style="display:flex;align-items:center;gap:8px;font-weight:bold;color:#f57c00;margin-bottom:8px;">
                <mat-icon style="font-size:20px;width:20px;height:20px;">warning</mat-icon>
                התאמה חלקית — {{ importValidationResult.matchedCount }} תואמות, {{ importValidationResult.mismatches.length }} לא תואמות
              </div>
              <div style="max-height:150px;overflow-y:auto;font-size:13px;">
                <div *ngFor="let m of importValidationResult.mismatches" style="padding:4px 0;border-bottom:1px solid #fff3cd;">
                  <strong>{{ m.fileTable }}.{{ m.fileColumn }}</strong> — לא נמצאה בשכבה הסמנטית
                  <span *ngIf="m.suggestion" style="color:#2a8fba;"> (אולי התכוונת ל: <strong>{{ m.suggestion }}</strong>?)</span>
                </div>
              </div>
              <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
                <button class="icon-boxSave" (click)="applyImportWithOption('keepExisting')" style="font-size:13px;">
                  <mat-icon class="save-icon" style="font-size:18px;width:18px;height:18px;">check</mat-icon>
                  המשך רק עם השורות התואמות
                </button>
                <button class="icon-boxSave" (click)="applyImportWithOption('updateKeys')"
                        style="font-size:13px;background:#f57c00;border-color:#f57c00;">
                  <mat-icon class="save-icon" style="font-size:18px;width:18px;height:18px;">sync</mat-icon>
                  עדכן מפתחות לפי הקובץ
                </button>
                <button class="icon-boxSave" (click)="showManualMatchingUI()"
                        style="font-size:13px;background:#1976d2;border-color:#1976d2;">
                  <mat-icon class="save-icon" style="font-size:18px;width:18px;height:18px;">tune</mat-icon>
                  התאמה ידנית
                </button>
                <button class="icon-box" (click)="importValidationResult = null" style="border-color:#999;font-size:13px;padding:0.4rem 0.8rem;">
                  <mat-icon style="color:#999;font-size:16px;width:16px;height:16px;">arrow_back</mat-icon>
                  חזור
                </button>
              </div>

              <!-- Manual Matching UI -->
              <div *ngIf="showManualMatching" style="margin-top:12px;border:1px solid #1976d2;border-radius:10px;padding:12px;background:#f5f9ff;">
                <div style="font-weight:bold;color:#1976d2;margin-bottom:10px;display:flex;align-items:center;gap:8px;">
                  <mat-icon style="font-size:20px;width:20px;height:20px;">tune</mat-icon>
                  התאמה ידנית — בחר טבלה.עמודה לכל שורה שלא תואמה
                </div>
                <table style="width:100%;border-collapse:collapse;font-size:13px;">
                  <thead>
                    <tr style="background:#e3f2fd;">
                      <th style="padding:6px 8px;text-align:right;border-bottom:1px solid #bbdefb;">שורה בקובץ</th>
                      <th style="padding:6px 8px;text-align:right;border-bottom:1px solid #bbdefb;">מיפוי לשכבה</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let mm of manualMatchMappings; let mi = index" style="border-bottom:1px solid #e0e0e0;">
                      <td style="padding:6px 8px;"><strong>{{ mm.fileTable }}.{{ mm.fileColumn }}</strong></td>
                      <td style="padding:6px 8px;">
                        <select [(ngModel)]="manualMatchMappings[mi].mappedTo"
                                style="padding:4px 8px;border:1px solid #90caf9;border-radius:6px;font-size:13px;min-width:200px;">
                          <option value="__skip__">דלג (לא לייבא)</option>
                          <option *ngFor="let opt of getLayerColumnOptions()" [value]="opt">{{ opt }}</option>
                        </select>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div style="margin-top:10px;display:flex;gap:8px;">
                  <button class="icon-boxSave" (click)="applyManualMatching()">
                    <mat-icon class="save-icon" style="font-size:18px;width:18px;height:18px;">check</mat-icon>
                    החל התאמה
                  </button>
                  <button class="icon-box" (click)="showManualMatching = false" style="border-color:#999;">
                    <mat-icon style="color:#999;font-size:16px;width:16px;height:16px;">close</mat-icon>
                    ביטול
                  </button>
                </div>
              </div>
              <div *ngIf="importAction !== 'addNew'" style="margin-top:8px;padding:8px;background:#fff3e0;border-radius:6px;font-size:12px;color:#e65100;">
                <mat-icon style="font-size:14px;width:14px;height:14px;vertical-align:middle;">info</mat-icon>
                שים לב: "עדכן מפתחות לפי הקובץ" ישנה את שמות הטבלאות/עמודות בשכבה — ייתכן שזה שונה מה-DB בפועל.
              </div>
            </div>

            <!-- No match -->
            <div *ngIf="importValidationResult.status === 'error'" style="background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;padding:12px 16px;margin-bottom:12px;">
              <div style="display:flex;align-items:center;gap:8px;font-weight:bold;color:#b91c1c;">
                <mat-icon style="font-size:20px;width:20px;height:20px;">error</mat-icon>
                אין התאמה — אף שורה מהקובץ לא תואמת לשכבה הסמנטית
              </div>
              <p style="font-size:13px;color:#666;margin:8px 0 0;">ודא שעמודות המפתח בקובץ תואמות לשמות הטבלאות והעמודות שנסרקו.</p>
              <button class="icon-box" (click)="importValidationResult = null" style="margin-top:8px;border-color:#999;">
                <mat-icon style="color:#999;">arrow_back</mat-icon> חזור
              </button>
            </div>

            <!-- Full match: apply button -->
            <div *ngIf="importValidationResult.status === 'ok'" style="display:flex;gap:8px;">
              <button class="icon-boxSave" (click)="applyImportWithOption('keepExisting')">
                <mat-icon class="save-icon">check</mat-icon>
                {{ getApplyButtonLabel() }}
              </button>
              <button class="icon-box" (click)="importValidationResult = null" style="border-color:#999;">
                <mat-icon style="color:#999;">arrow_back</mat-icon> חזור
              </button>
            </div>
          </div>
        </div>

        <!-- Table wrapper -->
        <div class="table-wrapper">
          <div class="table-scroll">
            <table mat-table [dataSource]="dataSource" class="styled-table">

              <!-- Column: Table Name (subtitle uses this) -->
              <ng-container matColumnDef="tableName">
                <th mat-header-cell *matHeaderCellDef>טבלה</th>
                <td mat-cell *matCellDef="let row">
                  <span class="status-db" *ngIf="row._rowType === 'data'">{{ row._tableName }}</span>
                </td>
              </ng-container>

              <!-- Column: Column Name -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>שם עמודה</th>
                <td mat-cell *matCellDef="let row">
                  <ng-container *ngIf="row._rowType === 'data'">
                    <strong>{{ row.name }}</strong>
                  </ng-container>
                </td>
              </ng-container>

              <!-- Column: Data Type -->
              <ng-container matColumnDef="dataType">
                <th mat-header-cell *matHeaderCellDef>סוג נתון</th>
                <td mat-cell *matCellDef="let row">
                  <ng-container *ngIf="row._rowType === 'data'">
                    <span *ngIf="!row.isNewRow">{{ row.dataType }}</span>
                    <select *ngIf="row.isNewRow" [(ngModel)]="row.dataType" style="font-size:13px;padding:2px 6px;border-radius:4px;border:1px solid #ccc;">
                      <option *ngFor="let dt of dataTypes" [value]="dt">{{ dt }}</option>
                    </select>
                  </ng-container>
                </td>
              </ng-container>

              <!-- Column: Nullable -->
              <ng-container matColumnDef="isNullable">
                <th mat-header-cell *matHeaderCellDef class="center">Null</th>
                <td mat-cell *matCellDef="let row" class="center">
                  <ng-container *ngIf="row._rowType === 'data'">
                    {{ row.isNullable ? '✓' : '✗' }}
                  </ng-container>
                </td>
              </ng-container>

              <!-- Column: PK -->
              <ng-container matColumnDef="isPrimaryKey">
                <th mat-header-cell *matHeaderCellDef class="center">PK</th>
                <td mat-cell *matCellDef="let row" class="center">
                  <ng-container *ngIf="row._rowType === 'data' && row.isPrimaryKey">
                    <mat-icon style="font-size:16px;width:16px;height:16px;color:#f57c00;">vpn_key</mat-icon>
                  </ng-container>
                </td>
              </ng-container>

              <!-- Column: FK -->
              <ng-container matColumnDef="isForeignKey">
                <th mat-header-cell *matHeaderCellDef class="center">FK</th>
                <td mat-cell *matCellDef="let row" class="center">
                  <ng-container *ngIf="row._rowType === 'data' && row.isForeignKey">
                    <mat-icon style="font-size:16px;width:16px;height:16px;color:#7b1fa2;">link</mat-icon>
                  </ng-container>
                </td>
              </ng-container>

              <!-- Column: Min -->
              <ng-container matColumnDef="min">
                <th mat-header-cell *matHeaderCellDef>Min</th>
                <td mat-cell *matCellDef="let row">
                  <ng-container *ngIf="row._rowType === 'data'">{{ row.min || '—' }}</ng-container>
                </td>
              </ng-container>

              <!-- Column: Max -->
              <ng-container matColumnDef="max">
                <th mat-header-cell *matHeaderCellDef>Max</th>
                <td mat-cell *matCellDef="let row">
                  <ng-container *ngIf="row._rowType === 'data'">{{ row.max || '—' }}</ng-container>
                </td>
              </ng-container>

              <!-- Column: Distinct -->
              <ng-container matColumnDef="distinctCount">
                <th mat-header-cell *matHeaderCellDef>Distinct</th>
                <td mat-cell *matCellDef="let row">
                  <ng-container *ngIf="row._rowType === 'data'">{{ row.distinctCount ?? '—' }}</ng-container>
                </td>
              </ng-container>

              <!-- Column: Display Name (editable) -->
              <ng-container matColumnDef="displayName">
                <th mat-header-cell *matHeaderCellDef>שם תצוגה</th>
                <td mat-cell *matCellDef="let row" (click)="onClickDisplayName($event, row)">
                  <ng-container *ngIf="row._rowType === 'data'">
                    <ng-container *ngIf="row.isEditingDisplayName; else showDisplayName">
                      <input type="text" [(ngModel)]="row.displayName"
                             (blur)="confirmDisplayNameEdit(row)"
                             (keydown.enter)="confirmDisplayNameEdit(row)"
                             (keydown.escape)="cancelDisplayNameEdit(row)"
                             #displayNameInput />
                    </ng-container>
                    <ng-template #showDisplayName>
                      <span style="cursor:pointer;display:inline-block;min-width:60px;min-height:20px;">
                        {{ row.displayName || '—' }}
                      </span>
                    </ng-template>
                  </ng-container>
                </td>
              </ng-container>

              <!-- Column: Business Description (editable) -->
              <ng-container matColumnDef="businessDescription">
                <th mat-header-cell *matHeaderCellDef>תיאור עסקי</th>
                <td mat-cell *matCellDef="let row" (click)="onClickDescription($event, row)">
                  <ng-container *ngIf="row._rowType === 'data'">
                    <ng-container *ngIf="row.isEditingDescription; else showDescription">
                      <input type="text" [(ngModel)]="row.businessDescription"
                             (blur)="confirmDescriptionEdit(row)"
                             (keydown.enter)="confirmDescriptionEdit(row)"
                             (keydown.escape)="cancelDescriptionEdit(row)"
                             #descInput />
                    </ng-container>
                    <ng-template #showDescription>
                      <span style="cursor:pointer;display:inline-block;min-width:60px;min-height:20px;">
                        {{ row.businessDescription || '—' }}
                      </span>
                    </ng-template>
                  </ng-container>
                </td>
              </ng-container>

              <!-- Dynamic custom field columns (pre-defined slots 0-4) -->
              <ng-container matColumnDef="custom_0">
                <th mat-header-cell *matHeaderCellDef>{{ customFields[0]?.name }}</th>
                <td mat-cell *matCellDef="let row" (click)="onClickCustomField($event, row, 0)">
                  <ng-container *ngIf="row._rowType === 'data'">
                    <ng-container *ngIf="row.editingCustomField === '0'; else showCF0">
                      <input type="text" [(ngModel)]="row.customFieldValues!['0']"
                             (blur)="confirmCustomFieldEdit(row)" (keydown.enter)="confirmCustomFieldEdit(row)" (keydown.escape)="cancelCustomFieldEdit(row)" />
                    </ng-container>
                    <ng-template #showCF0><span style="cursor:pointer;display:inline-block;min-width:60px;min-height:20px;">{{ row.customFieldValues?.['0'] || '—' }}</span></ng-template>
                  </ng-container>
                </td>
              </ng-container>

              <ng-container matColumnDef="custom_1">
                <th mat-header-cell *matHeaderCellDef>{{ customFields[1]?.name }}</th>
                <td mat-cell *matCellDef="let row" (click)="onClickCustomField($event, row, 1)">
                  <ng-container *ngIf="row._rowType === 'data'">
                    <ng-container *ngIf="row.editingCustomField === '1'; else showCF1">
                      <input type="text" [(ngModel)]="row.customFieldValues!['1']"
                             (blur)="confirmCustomFieldEdit(row)" (keydown.enter)="confirmCustomFieldEdit(row)" (keydown.escape)="cancelCustomFieldEdit(row)" />
                    </ng-container>
                    <ng-template #showCF1><span style="cursor:pointer;display:inline-block;min-width:60px;min-height:20px;">{{ row.customFieldValues?.['1'] || '—' }}</span></ng-template>
                  </ng-container>
                </td>
              </ng-container>

              <ng-container matColumnDef="custom_2">
                <th mat-header-cell *matHeaderCellDef>{{ customFields[2]?.name }}</th>
                <td mat-cell *matCellDef="let row" (click)="onClickCustomField($event, row, 2)">
                  <ng-container *ngIf="row._rowType === 'data'">
                    <ng-container *ngIf="row.editingCustomField === '2'; else showCF2">
                      <input type="text" [(ngModel)]="row.customFieldValues!['2']"
                             (blur)="confirmCustomFieldEdit(row)" (keydown.enter)="confirmCustomFieldEdit(row)" (keydown.escape)="cancelCustomFieldEdit(row)" />
                    </ng-container>
                    <ng-template #showCF2><span style="cursor:pointer;display:inline-block;min-width:60px;min-height:20px;">{{ row.customFieldValues?.['2'] || '—' }}</span></ng-template>
                  </ng-container>
                </td>
              </ng-container>

              <ng-container matColumnDef="custom_3">
                <th mat-header-cell *matHeaderCellDef>{{ customFields[3]?.name }}</th>
                <td mat-cell *matCellDef="let row" (click)="onClickCustomField($event, row, 3)">
                  <ng-container *ngIf="row._rowType === 'data'">
                    <ng-container *ngIf="row.editingCustomField === '3'; else showCF3">
                      <input type="text" [(ngModel)]="row.customFieldValues!['3']"
                             (blur)="confirmCustomFieldEdit(row)" (keydown.enter)="confirmCustomFieldEdit(row)" (keydown.escape)="cancelCustomFieldEdit(row)" />
                    </ng-container>
                    <ng-template #showCF3><span style="cursor:pointer;display:inline-block;min-width:60px;min-height:20px;">{{ row.customFieldValues?.['3'] || '—' }}</span></ng-template>
                  </ng-container>
                </td>
              </ng-container>

              <ng-container matColumnDef="custom_4">
                <th mat-header-cell *matHeaderCellDef>{{ customFields[4]?.name }}</th>
                <td mat-cell *matCellDef="let row" (click)="onClickCustomField($event, row, 4)">
                  <ng-container *ngIf="row._rowType === 'data'">
                    <ng-container *ngIf="row.editingCustomField === '4'; else showCF4">
                      <input type="text" [(ngModel)]="row.customFieldValues!['4']"
                             (blur)="confirmCustomFieldEdit(row)" (keydown.enter)="confirmCustomFieldEdit(row)" (keydown.escape)="cancelCustomFieldEdit(row)" />
                    </ng-container>
                    <ng-template #showCF4><span style="cursor:pointer;display:inline-block;min-width:60px;min-height:20px;">{{ row.customFieldValues?.['4'] || '—' }}</span></ng-template>
                  </ng-container>
                </td>
              </ng-container>

              <!-- Column: Source badge -->
              <ng-container matColumnDef="source">
                <th mat-header-cell *matHeaderCellDef>מקור</th>
                <td mat-cell *matCellDef="let row">
                  <ng-container *ngIf="row._rowType === 'data'">
                    <span [ngClass]="{'status-db': row.source === 'db', 'status-manual': row.source === 'manual', 'status-new': row.source === 'file'}">
                      {{ row.source === 'db' ? 'DB' : row.source === 'manual' ? 'ידני' : row.source }}
                    </span>
                  </ng-container>
                </td>
              </ng-container>

              <!-- Column: Actions (edit row) -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef style="min-width:60px;width:60px;text-align:center;">עריכה</th>
                <td mat-cell *matCellDef="let row" style="min-width:60px;width:60px;text-align:center;">
                  <ng-container *ngIf="row._rowType === 'data'">
                    <mat-icon class="action-icon2"
                              [matTooltip]="row.isEditingDisplayName ? 'סגור עריכה' : 'ערוך שורה'"
                              (click)="toggleRowEdit(row)"
                              [style.color]="row.isEditingDisplayName ? '#4caf50' : ''">
                      {{ row.isEditingDisplayName ? 'check_circle' : 'edit' }}
                    </mat-icon>
                  </ng-container>
                </td>
              </ng-container>

              <!-- Subtitle row definition (spans all columns) -->
              <ng-container matColumnDef="subtitleRow">
                <td mat-cell *matCellDef="let row" [attr.colspan]="displayedColumns.length">
                  <div class="table-subtitle-content">
                    <mat-icon>table_chart</mat-icon>
                    <span>{{ row._tableName }}</span>
                    <span *ngIf="row._tableDisplayName && row._tableDisplayName !== row._tableName" style="color:#1976d2;">
                      → {{ row._tableDisplayName }}
                    </span>
                    <span class="table-subtitle-count">({{ row._tableColCount }} עמודות)</span>
                  </div>
                </td>
              </ng-container>

              <!-- Header row -->
              <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>

              <!-- Subtitle row (when _rowType === 'subtitle') -->
              <tr mat-row *matRowDef="let row; columns: ['subtitleRow']; when: isSubtitleRow"
                  class="table-subtitle-row"></tr>

              <!-- Data row -->
              <tr mat-row *matRowDef="let row; columns: displayedColumns; when: isDataRow"
                  class="data-row"
                  [class.selected-row]="isRowPending(row)"></tr>

            </table>
          </div>

          <!-- Paginator -->
          <mat-paginator class="table-paginator"
                         [pageSize]="15"
                         [pageSizeOptions]="[10, 15, 30, 50, 100]"
                         showFirstLastButtons>
          </mat-paginator>
        </div>

        <!-- Relationships section -->
        <div *ngIf="unconfirmedRelationships.length > 0" style="margin-top:1.5rem;background:#f8fafc;border:1px solid #e0e0e0;border-radius:12px;padding:1rem;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;font-weight:bold;color:#0A3546;">
            <mat-icon>share</mat-icon>
            קשרים שממתינים לאישור ({{ unconfirmedRelationships.length }})
          </div>
          <div *ngFor="let rel of unconfirmedRelationships; let ri = index"
               style="display:flex;align-items:center;gap:12px;padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;">
            <div style="flex:1;">
              <strong>{{ rel.fromTable }}</strong>.{{ rel.fromColumn }}
              <mat-icon style="font-size:16px;width:16px;height:16px;vertical-align:middle;">arrow_back</mat-icon>
              <strong>{{ rel.toTable }}</strong>.{{ rel.toColumn }}
            </div>
            <button class="icon-box" matTooltip="אשר קשר" (click)="confirmRelationship(ri, true)" style="border-color:#4caf50;">
              <mat-icon style="color:#4caf50;font-size:20px;">check_circle</mat-icon>
            </button>
            <button class="icon-box" matTooltip="דחה קשר" (click)="confirmRelationship(ri, false)" style="border-color:#f44336;">
              <mat-icon style="color:#f44336;font-size:20px;">cancel</mat-icon>
            </button>
          </div>
        </div>

      </ng-container>
    </div>
  `
})

export class SlStep2Component implements OnInit {

  get displayedColumns(): string[] {
    const base = [
      'tableName', 'name', 'dataType', 'isNullable', 'isPrimaryKey', 'isForeignKey',
      'min', 'max', 'distinctCount', 'displayName', 'businessDescription'
    ];
    const custom = this.customFields.map((_f, i) => 'custom_' + i);
    return [...base, ...custom, 'source', 'actions'];
  }

  dataSource = new MatTableDataSource<ColumnRow>([]);
  layer: SemanticLayerDefinition | null = null;
  isLoading = false;

  pendingUpdates: ColumnRow[] = [];
  pendingDeletions: ColumnRow[] = [];
  unconfirmedRelationships: SLRelationship[] = [];

  // Custom fields
  customFields: { id: string; name: string; key: string }[] = [];
  showAddFieldPrompt = false;
  newFieldName = '';
  newFieldKey = '';

  // Import from file
  showImportPanel = false;
  importedData: Record<string, any>[] | null = null;
  importedFileName = '';
  importHeaders: string[] = [];
  importFieldName = '';
  importFieldKey = '';
  importMapTable = '';
  importMapColumn = '';
  importMapValue = '';
  importAction: string = 'addNew';
  importValidationResult: {
    status: 'ok' | 'partial' | 'error';
    matchedCount: number;
    mismatches: { fileTable: string; fileColumn: string; suggestion?: string }[];
  } | null = null;

  // Manual matching state
  showManualMatching = false;
  manualMatchMappings: { fileTable: string; fileColumn: string; mappedTo: string }[] = [];

  dataTypes = ['int', 'bigint', 'smallint', 'tinyint', 'nvarchar', 'varchar', 'nchar',
               'decimal', 'numeric', 'float', 'real', 'money',
               'bit', 'datetime', 'datetime2', 'date', 'time', 'uniqueidentifier'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private api: SemanticLayerApiService,
    private slState: SemanticLayerStateService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  // ─── Row type predicates (for matRowDef when) ──────────────────
  isSubtitleRow = (_index: number, row: ColumnRow): boolean => row._rowType === 'subtitle';
  isDataRow = (_index: number, row: ColumnRow): boolean => row._rowType === 'data';

  // ─── Load data ─────────────────────────────────────────────────
  loadData(): void {
    this.isLoading = true;
    const stateLayer = (this.slState as any)._layer as SemanticLayerDefinition | undefined;
    const connId = (this.slState as any)._connectionId as number | undefined;

    if (stateLayer) {
      this.layer = structuredClone(stateLayer);
      this.buildTableRows();
      this.refreshRelationships();
      this.isLoading = false;
    } else if (connId) {
      this.api.getSemanticLayer(connId).subscribe({
        next: (l) => {
          this.layer = l;
          (this.slState as any)._layer = l;
          this.buildTableRows();
          this.refreshRelationships();
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.snackBar.open('שגיאה בטעינת השכבה הסמנטית', 'סגור', { duration: 4000 });
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  // ─── Build flat rows for mat-table ─────────────────────────────
  private buildTableRows(): void {
    if (!this.layer?.tables) {
      this.dataSource.data = [];
      return;
    }

    // Restore custom fields metadata from layer
    if (this.layer.customFields && this.layer.customFields.length > 0) {
      this.customFields = [...this.layer.customFields];
    }

    const rows: ColumnRow[] = [];

    for (const table of this.layer.tables) {
      // Subtitle row
      rows.push({
        _rowType: 'subtitle',
        _tableName: table.name,
        _tableDisplayName: table.displayName || table.name,
        _tableColCount: table.columns?.length || 0,
        name: '', displayName: '', dataType: '', isNullable: false,
        isPrimaryKey: false, isForeignKey: false, min: '', max: '',
        distinctCount: null, businessDescription: '', source: ''
      });

      // Data rows
      if (table.columns) {
        for (const col of table.columns) {
          rows.push({
            _rowType: 'data',
            _tableName: table.name,
            _tableDisplayName: table.displayName || table.name,
            _tableColCount: table.columns.length,
            name: col.name,
            displayName: col.displayName || col.name,
            dataType: col.dataType,
            isNullable: col.isNullable,
            isPrimaryKey: col.isPrimaryKey,
            isForeignKey: col.isForeignKey,
            min: col.min || '',
            max: col.max || '',
            distinctCount: col.distinctCount ?? null,
            businessDescription: col.businessDescription || '',
            source: col.source || 'db',
            customFieldValues: this.loadCustomValuesFromLayer(col.customValues)
          });
        }
      }
    }

    this.dataSource.data = rows;
  }


  // ─── Toggle row edit mode (opens all editable fields) ──────
  toggleRowEdit(row: ColumnRow): void {
    if (row._rowType !== 'data') return;

    if (row.isEditingDisplayName) {
      // Close editing — confirm both fields
      this.confirmDisplayNameEdit(row);
      this.confirmDescriptionEdit(row);
      // Also confirm any custom field being edited
      if (row.editingCustomField) {
        this.confirmCustomFieldEdit(row);
      }
    } else {
      // Open editing — enable both main editable fields
      row.prevDisplayName = row.displayName;
      row.prevDescription = row.businessDescription;
      row.isEditingDisplayName = true;
      row.isEditingDescription = true;
    }
  }

  // ─── Inline editing: Display Name ───────────────────────────
  onClickDisplayName(event: MouseEvent, row: ColumnRow): void {
    if (row._rowType !== 'data' || row.isEditingDisplayName) return;
    event.stopPropagation();
    row.isEditingDisplayName = true;
    row.prevDisplayName = row.displayName;
    this.cdr.detectChanges();
    setTimeout(() => {
      const el = event.target as HTMLElement;
      const td = el.closest('td');
      const input = td?.querySelector('input') as HTMLInputElement;
      if (input) { input.focus(); input.select(); }
    });
  }

  confirmDisplayNameEdit(row: ColumnRow): void {
    row.isEditingDisplayName = false;
    if (row.displayName !== row.prevDisplayName) {
      this.markAsUpdated(row);
    }
  }

  cancelDisplayNameEdit(row: ColumnRow): void {
    row.displayName = row.prevDisplayName || row.name;
    row.isEditingDisplayName = false;
  }

  // ─── Inline editing: Business Description ──────────────────────
  onClickDescription(event: MouseEvent, row: ColumnRow): void {
    if (row._rowType !== 'data' || row.isEditingDescription) return;
    event.stopPropagation();
    row.isEditingDescription = true;
    row.prevDescription = row.businessDescription;
    this.cdr.detectChanges();
    setTimeout(() => {
      const el = event.target as HTMLElement;
      const td = el.closest('td');
      const input = td?.querySelector('input') as HTMLInputElement;
      if (input) { input.focus(); input.select(); }
    });
  }

  confirmDescriptionEdit(row: ColumnRow): void {
    row.isEditingDescription = false;
    if (row.businessDescription !== row.prevDescription) {
      this.markAsUpdated(row);
    }
  }

  cancelDescriptionEdit(row: ColumnRow): void {
    row.businessDescription = row.prevDescription || '';
    row.isEditingDescription = false;
  }

  // ─── Add / Delete rows ─────────────────────────────────────────
  addRowAfter(row: ColumnRow): void {
    const newRow: ColumnRow = {
      _rowType: 'data',
      _tableName: row._tableName,
      _tableDisplayName: row._tableDisplayName,
      _tableColCount: row._tableColCount,
      name: '',
      displayName: '',
      dataType: 'nvarchar',
      isNullable: true,
      isPrimaryKey: false,
      isForeignKey: false,
      min: '',
      max: '',
      distinctCount: null,
      businessDescription: '',
      source: 'manual',
      isNewRow: true,
      isEditingDisplayName: true
    };

    const data = this.dataSource.data;
    const index = data.indexOf(row);
    if (index !== -1) {
      data.splice(index + 1, 0, newRow);
      this.dataSource.data = [...data];
      this.markAsUpdated(newRow);
    }
  }

  addManualRow(): void {
    // Add to the first table
    if (!this.layer?.tables?.length) return;
    const firstTable = this.layer.tables[0];
    const subtitleRow = this.dataSource.data.find(
      r => r._rowType === 'subtitle' && r._tableName === firstTable.name
    );
    if (subtitleRow) {
      this.addRowAfter(subtitleRow);
    }
  }

  // ─── Custom Fields (add column to all tables) ──────────────────
  /** Strip any non-English/non-underscore/non-digit characters in real-time */
  sanitizeFieldKey(): void {
    this.newFieldKey = this.newFieldKey.replace(/[^a-zA-Z0-9_]/g, '');
  }

  /** Same sanitization for the import flow key */
  sanitizeImportFieldKey(): void {
    this.importFieldKey = this.importFieldKey.replace(/[^a-zA-Z0-9_]/g, '');
  }

  addCustomField(): void {
    const name = this.newFieldName.trim();
    const key = this.newFieldKey.trim();
    if (!name || !key) return;
    if (this.customFields.length >= 5) {
      this.snackBar.open('ניתן להוסיף עד 5 שדות מותאמים', 'סגור', { duration: 3000 });
      return;
    }

    // Validate key format (English alphanumeric + underscores only)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
      this.snackBar.open('מפתח חייב להיות באנגלית (אותיות, מספרים וקו תחתון בלבד)', 'סגור', { duration: 3000 });
      return;
    }

    // Validate key uniqueness
    if (this.customFields.some(f => f.key === key)) {
      this.snackBar.open(`מפתח "${key}" כבר קיים — בחר מפתח ייחודי`, 'סגור', { duration: 3000 });
      return;
    }

    const idx = this.customFields.length.toString();
    this.customFields.push({ id: idx, name, key });
    this.newFieldName = '';
    this.newFieldKey = '';

    // Initialize the value for all existing data rows
    for (const row of this.dataSource.data) {
      if (row._rowType === 'data') {
        if (!row.customFieldValues) row.customFieldValues = {};
        row.customFieldValues[idx] = '';
      }
    }

    this.snackBar.open(`שדה "${name}" (${key}) נוסף כטור חדש בטבלה`, 'סגור', { duration: 2500 });
  }

  removeCustomField(fieldId: string): void {
    const idx = this.customFields.findIndex(f => f.id === fieldId);
    if (idx === -1) return;
    this.customFields.splice(idx, 1);
    // Re-index remaining fields
    this.customFields.forEach((f, i) => f.id = i.toString());
    // Rebuild custom field values on rows
    for (const row of this.dataSource.data) {
      if (row._rowType === 'data' && row.customFieldValues) {
        const newValues: { [key: string]: string } = {};
        this.customFields.forEach((f, i) => {
          newValues[i.toString()] = row.customFieldValues?.[f.id] || '';
        });
        row.customFieldValues = newValues;
      }
    }
  }

  getCustomFieldValue(row: ColumnRow, fieldId: string): string {
    return row.customFieldValues?.[fieldId] || '';
  }

  setCustomFieldValue(row: ColumnRow, fieldId: string, value: string): void {
    if (!row.customFieldValues) row.customFieldValues = {};
    row.customFieldValues[fieldId] = value;
  }

  onClickCustomField(event: MouseEvent, row: ColumnRow, fieldIndex: number): void {
    if (row._rowType !== 'data') return;
    const idx = fieldIndex.toString();
    if (row.editingCustomField === idx) return;
    event.stopPropagation();
    row.editingCustomField = idx;
    row.prevCustomFieldValue = this.getCustomFieldValue(row, idx);
    this.cdr.detectChanges();
    setTimeout(() => {
      const el = event.target as HTMLElement;
      const td = el.closest('td');
      const input = td?.querySelector('input') as HTMLInputElement;
      if (input) { input.focus(); input.select(); }
    });
  }

  confirmCustomFieldEdit(row: ColumnRow): void {
    const fieldId = row.editingCustomField;
    if (fieldId && this.getCustomFieldValue(row, fieldId) !== row.prevCustomFieldValue) {
      this.markAsUpdated(row);
    }
    row.editingCustomField = undefined;
    row.prevCustomFieldValue = undefined;
  }

  cancelCustomFieldEdit(row: ColumnRow): void {
    const fieldId = row.editingCustomField;
    if (fieldId && row.prevCustomFieldValue !== undefined) {
      this.setCustomFieldValue(row, fieldId, row.prevCustomFieldValue);
    }
    row.editingCustomField = undefined;
    row.prevCustomFieldValue = undefined;
  }

  // ─── Import from file ──────────────────────────────────────────
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer?.files?.[0];
    if (file) this.processFile(file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.processFile(file);
    input.value = ''; // reset
  }

  private processFile(file: File): void {
    this.importedFileName = file.name;
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'json') {
      this.readJsonFile(file);
    } else if (ext === 'xlsx' || ext === 'xls') {
      this.readExcelFile(file);
    } else {
      this.snackBar.open('סוג קובץ לא נתמך. השתמש ב-Excel (.xlsx) או JSON.', 'סגור', { duration: 4000 });
    }
  }

  private readJsonFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        if (Array.isArray(data) && data.length > 0) {
          this.importedData = data;
          this.importHeaders = Object.keys(data[0]);
          this.snackBar.open(`${data.length} שורות נטענו מהקובץ`, 'סגור', { duration: 2000 });
        } else {
          this.snackBar.open('הקובץ ריק או בפורמט לא תקין (צפוי מערך של אובייקטים)', 'סגור', { duration: 4000 });
        }
      } catch {
        this.snackBar.open('שגיאה בקריאת הקובץ — ודא שזהו JSON תקין', 'סגור', { duration: 4000 });
      }
    };
    reader.readAsText(file);
  }

  private readExcelFile(file: File): void {
    // Dynamic import of xlsx library (already in package.json)
    import('xlsx').then(XLSX => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

          if (jsonData.length > 0) {
            this.importedData = jsonData;
            this.importHeaders = Object.keys(jsonData[0]);
            this.snackBar.open(`${jsonData.length} שורות נטענו מהגיליון "${sheetName}"`, 'סגור', { duration: 2500 });
          } else {
            this.snackBar.open('הגיליון ריק', 'סגור', { duration: 3000 });
          }
          this.cdr.detectChanges();
        } catch {
          this.snackBar.open('שגיאה בקריאת קובץ Excel', 'סגור', { duration: 4000 });
        }
      };
      reader.readAsArrayBuffer(file);
    }).catch(() => {
      this.snackBar.open('ספריית xlsx לא זמינה', 'סגור', { duration: 4000 });
    });
  }

  clearImport(): void {
    this.importedData = null;
    this.importedFileName = '';
    this.importHeaders = [];
    this.importFieldName = '';
    this.importFieldKey = '';
    this.importMapTable = '';
    this.importMapColumn = '';
    this.importMapValue = '';
    this.importAction = 'addNew';
    this.importValidationResult = null;
    this.showManualMatching = false;
    this.manualMatchMappings = [];
  }

  applyImport(): void {
    // Legacy — redirect to new flow
    this.validateImport();
  }

  /** Step 1 of import: validate keys against layer */
  validateImport(): void {
    if (!this.importedData || !this.importMapTable || !this.importMapColumn || !this.importMapValue) return;

    const mismatches: { fileTable: string; fileColumn: string; suggestion?: string }[] = [];
    let matchedCount = 0;

    // Get all table.column keys from layer
    const layerKeys = new Set<string>();
    const layerTables = new Set<string>();
    const layerColumns = new Map<string, Set<string>>(); // table → columns

    for (const row of this.dataSource.data) {
      if (row._rowType !== 'data') continue;
      layerKeys.add(`${row._tableName}|${row.name}`);
      layerTables.add(row._tableName);
      if (!layerColumns.has(row._tableName)) layerColumns.set(row._tableName, new Set());
      layerColumns.get(row._tableName)!.add(row.name);
    }

    for (const fileRow of this.importedData) {
      const fileTable = String(fileRow[this.importMapTable] || '').trim();
      const fileColumn = String(fileRow[this.importMapColumn] || '').trim();
      if (!fileTable || !fileColumn) continue;

      const key = `${fileTable}|${fileColumn}`;

      if (layerKeys.has(key)) {
        matchedCount++;
      } else {
        // Try to find suggestion (case-insensitive match)
        const suggestion = this.findSuggestion(fileTable, fileColumn, layerTables, layerColumns);
        mismatches.push({ fileTable, fileColumn, suggestion });
      }
    }

    if (matchedCount === 0 && mismatches.length > 0) {
      this.importValidationResult = { status: 'error', matchedCount: 0, mismatches };
    } else if (mismatches.length === 0) {
      this.importValidationResult = { status: 'ok', matchedCount, mismatches: [] };
    } else {
      this.importValidationResult = { status: 'partial', matchedCount, mismatches };
    }
  }

  /** Find a close match for a table.column key */
  private findSuggestion(fileTable: string, fileColumn: string, tables: Set<string>, columns: Map<string, Set<string>>): string | undefined {
    const ftLower = fileTable.toLowerCase();
    const fcLower = fileColumn.toLowerCase();

    // Find matching table (case-insensitive)
    let matchedTable: string | undefined;
    for (const t of tables) {
      if (t.toLowerCase() === ftLower) { matchedTable = t; break; }
    }

    if (!matchedTable) {
      // Try partial match (contains or starts with)
      for (const t of tables) {
        if (t.toLowerCase().includes(ftLower) || ftLower.includes(t.toLowerCase())) {
          matchedTable = t; break;
        }
      }
    }

    if (!matchedTable) return undefined;

    // Find matching column
    const tableCols = columns.get(matchedTable);
    if (!tableCols) return matchedTable;

    for (const c of tableCols) {
      if (c.toLowerCase() === fcLower) return `${matchedTable}.${c}`;
    }

    // Partial column match
    for (const c of tableCols) {
      if (c.toLowerCase().includes(fcLower) || fcLower.includes(c.toLowerCase())) {
        return `${matchedTable}.${c}`;
      }
    }

    return matchedTable + '.?';
  }

  /** Apply import with chosen option */
  applyImportWithOption(option: 'keepExisting' | 'updateKeys'): void {
    if (!this.importedData) return;

    if (option === 'updateKeys') {
      // Update layer keys to match file keys for mismatched entries
      this.updateLayerKeysFromFile();
    }

    // Now perform the actual import
    if (this.importAction === 'addNew') {
      this.performAddNewField();
    } else {
      this.performUpdateExistingField();
    }

    this.showImportPanel = false;
    this.clearImport();
  }

  /** Update table/column names in the layer based on file data (for mismatches) */
  private updateLayerKeysFromFile(): void {
    if (!this.importValidationResult?.mismatches || !this.importedData) return;

    for (const m of this.importValidationResult.mismatches) {
      if (!m.suggestion) continue;

      // Find the closest match and rename
      const parts = m.suggestion.split('.');
      if (parts.length < 2) continue;
      const suggestedTable = parts[0];
      const suggestedCol = parts[1];
      if (suggestedCol === '?') continue;

      // Rename in dataSource
      for (const row of this.dataSource.data) {
        if (row._tableName === suggestedTable && row.name === suggestedCol) {
          // Update to file's naming
          row._tableName = m.fileTable;
          row.name = m.fileColumn;
        }
        if (row._rowType === 'subtitle' && row._tableName === suggestedTable) {
          row._tableName = m.fileTable;
        }
      }
    }

    this.dataSource.data = [...this.dataSource.data];
    this.snackBar.open('⚠️ שמות טבלאות/עמודות עודכנו לפי הקובץ — שים לב שזה עשוי להיות שונה מה-DB', 'סגור', { duration: 5000 });
  }

  /** Add a new custom field column from file */
  private performAddNewField(): void {
    if (!this.importedData || !this.importFieldName.trim() || !this.importFieldKey.trim()) return;

    if (this.customFields.length >= 5) {
      this.snackBar.open('ניתן להוסיף עד 5 שדות מותאמים', 'סגור', { duration: 3000 });
      return;
    }

    const key = this.importFieldKey.trim();
    if (this.customFields.some(f => f.key === key)) {
      this.snackBar.open(`מפתח "${key}" כבר קיים — יש לבחור שם אחר`, 'סגור', { duration: 3000 });
      return;
    }

    const fieldIdx = this.customFields.length.toString();
    this.customFields.push({ id: fieldIdx, name: this.importFieldName.trim(), key });

    let matchCount = 0;
    for (const row of this.dataSource.data) {
      if (row._rowType !== 'data') continue;
      if (!row.customFieldValues) row.customFieldValues = {};

      const fileRow = this.importedData.find(fr =>
        String(fr[this.importMapTable] || '').trim() === row._tableName &&
        String(fr[this.importMapColumn] || '').trim() === row.name
      );

      if (fileRow) {
        row.customFieldValues[fieldIdx] = String(fileRow[this.importMapValue] || '');
        matchCount++;
        this.markAsUpdated(row);
      } else {
        row.customFieldValues[fieldIdx] = '';
      }
    }

    this.snackBar.open(`טור "${this.importFieldName}" נוסף — ${matchCount} ערכים מופו מהקובץ`, 'סגור', { duration: 4000 });
  }

  /** Update existing field (displayName, businessDescription, min, max, or custom) from file */
  private performUpdateExistingField(): void {
    if (!this.importedData) return;

    let matchCount = 0;

    // Determine which field to update
    let fieldProp: string | null = null;
    let customFieldIndex: number | null = null;

    if (this.importAction === 'updateDisplayName') {
      fieldProp = 'displayName';
    } else if (this.importAction === 'updateDescription') {
      fieldProp = 'businessDescription';
    } else if (this.importAction === 'updateMin') {
      fieldProp = 'min';
    } else if (this.importAction === 'updateMax') {
      fieldProp = 'max';
    } else if (this.importAction.startsWith('updateCustom_')) {
      customFieldIndex = parseInt(this.importAction.replace('updateCustom_', ''), 10);
    }

    for (const row of this.dataSource.data) {
      if (row._rowType !== 'data') continue;

      const fileRow = this.importedData.find(fr =>
        String(fr[this.importMapTable] || '').trim() === row._tableName &&
        String(fr[this.importMapColumn] || '').trim() === row.name
      );

      if (fileRow) {
        const newValue = String(fileRow[this.importMapValue] || '').trim();
        if (newValue) {
          if (customFieldIndex !== null) {
            // Update custom field value
            if (!row.customFieldValues) row.customFieldValues = {};
            row.customFieldValues[customFieldIndex.toString()] = newValue;
          } else if (fieldProp) {
            (row as any)[fieldProp] = newValue;
          }
          matchCount++;
          this.markAsUpdated(row);
        }
      }
    }

    this.dataSource.data = [...this.dataSource.data];

    let fieldLabel = 'ערכים';
    if (this.importAction === 'updateDisplayName') fieldLabel = 'שמות תצוגה';
    else if (this.importAction === 'updateDescription') fieldLabel = 'תיאורים עסקיים';
    else if (this.importAction === 'updateMin') fieldLabel = 'ערכי Min';
    else if (this.importAction === 'updateMax') fieldLabel = 'ערכי Max';
    else if (customFieldIndex !== null && this.customFields[customFieldIndex]) {
      fieldLabel = `שדה "${this.customFields[customFieldIndex].name}"`;
    }

    this.snackBar.open(`${fieldLabel} עודכנו — ${matchCount} עמודות עודכנו מהקובץ`, 'סגור', { duration: 4000 });
  }

  /** Show manual matching UI for mismatched rows */
  showManualMatchingUI(): void {
    if (!this.importValidationResult?.mismatches) return;
    this.manualMatchMappings = this.importValidationResult.mismatches.map(m => ({
      fileTable: m.fileTable,
      fileColumn: m.fileColumn,
      mappedTo: m.suggestion || '__skip__'
    }));
    this.showManualMatching = true;
  }

  /** Get all table.column options from the layer for manual matching dropdowns */
  getLayerColumnOptions(): string[] {
    const options: string[] = [];
    for (const row of this.dataSource.data) {
      if (row._rowType === 'data') {
        options.push(`${row._tableName}.${row.name}`);
      }
    }
    return options;
  }

  /** Apply manual matching: remap imported data based on user selections */
  applyManualMatching(): void {
    if (!this.importedData || !this.importValidationResult) return;

    // Build a mapping from file key to layer key
    const mapping = new Map<string, string>();
    for (const mm of this.manualMatchMappings) {
      if (mm.mappedTo && mm.mappedTo !== '__skip__') {
        mapping.set(`${mm.fileTable}|${mm.fileColumn}`, mm.mappedTo);
      }
    }

    // Remap the imported data: replace table/column values for mapped entries
    const remappedData: Record<string, any>[] = [];
    for (const fileRow of this.importedData) {
      const fileTable = String(fileRow[this.importMapTable] || '').trim();
      const fileColumn = String(fileRow[this.importMapColumn] || '').trim();
      const key = `${fileTable}|${fileColumn}`;

      if (mapping.has(key)) {
        const target = mapping.get(key)!;
        const [newTable, newCol] = target.split('.');
        const remapped = { ...fileRow };
        remapped[this.importMapTable] = newTable;
        remapped[this.importMapColumn] = newCol;
        remappedData.push(remapped);
      } else {
        // Keep as-is (already matched or will be skipped)
        remappedData.push(fileRow);
      }
    }

    // Replace importedData with remapped version (excluding skipped rows)
    const skippedKeys = new Set<string>();
    for (const mm of this.manualMatchMappings) {
      if (mm.mappedTo === '__skip__') {
        skippedKeys.add(`${mm.fileTable}|${mm.fileColumn}`);
      }
    }

    this.importedData = remappedData.filter(fr => {
      const t = String(fr[this.importMapTable] || '').trim();
      const c = String(fr[this.importMapColumn] || '').trim();
      return !skippedKeys.has(`${t}|${c}`);
    });

    this.showManualMatching = false;

    // Now perform the actual import
    if (this.importAction === 'addNew') {
      this.performAddNewField();
    } else {
      this.performUpdateExistingField();
    }

    this.showImportPanel = false;
    this.clearImport();
  }

  /** Get button label for full match apply button */
  getApplyButtonLabel(): string {
    if (this.importAction === 'addNew') return 'הוסף טור "' + this.importFieldName + '"';
    if (this.importAction === 'updateDisplayName') return 'עדכן שמות תצוגה';
    if (this.importAction === 'updateDescription') return 'עדכן תיאורים עסקיים';
    if (this.importAction === 'updateMin') return 'עדכן ערכי Min';
    if (this.importAction === 'updateMax') return 'עדכן ערכי Max';
    if (this.importAction.startsWith('updateCustom_')) {
      const idx = parseInt(this.importAction.replace('updateCustom_', ''), 10);
      if (this.customFields[idx]) return `עדכן שדה "${this.customFields[idx].name}"`;
    }
    return 'החל';
  }

  deleteRow(row: ColumnRow): void {
    if (row._rowType !== 'data') return;

    const data = this.dataSource.data.filter(r => r !== row);
    this.dataSource.data = data;

    if (!row.isNewRow) {
      this.pendingDeletions.push(row);
    }

    // Remove from pending updates if it was there
    this.pendingUpdates = this.pendingUpdates.filter(r => r !== row);
    this.snackBar.open(`עמודה "${row.name || 'חדשה'}" הוסרה`, 'סגור', { duration: 2000 });
  }

  // ─── Dirty state tracking ──────────────────────────────────────
  markAsUpdated(row: ColumnRow): void {
    const existing = this.pendingUpdates.findIndex(r =>
      r._tableName === row._tableName && r.name === row.name && r === row
    );
    if (existing === -1) {
      this.pendingUpdates.push(row);
    }
    this.slState.setUnsavedChanges(true);
  }

  isRowPending(row: ColumnRow): boolean {
    return this.pendingUpdates.includes(row);
  }

  isSaveDisabled(): boolean {
    return this.pendingUpdates.length === 0 && this.pendingDeletions.length === 0;
  }

  // ─── Save changes (batch) ──────────────────────────────────────
  saveChanges(): void {
    if (!this.layer) return;
    const connId = (this.slState as any)._connectionId as number | undefined;
    if (!connId) {
      this.snackBar.open('חסר מזהה חיבור', 'סגור', { duration: 3000 });
      return;
    }

    // Rebuild the layer from the current dataSource rows
    this.syncRowsBackToLayer();

    this.api.updateSemanticLayer(connId, this.layer).subscribe({
      next: (updated) => {
        this.layer = updated;
        (this.slState as any)._layer = updated;
        this.pendingUpdates = [];
        this.pendingDeletions = [];
        this.slState.setUnsavedChanges(false);
        this.buildTableRows();
        this.refreshRelationships();
        this.snackBar.open('השינויים נשמרו בהצלחה ✓', 'סגור', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('שגיאה בשמירה — נסי שוב', 'סגור', { duration: 4000 });
      }
    });
  }

  /** Sync the flat mat-table rows back into the SemanticLayerDefinition model */
  private syncRowsBackToLayer(): void {
    if (!this.layer) return;

    // Save custom fields metadata on the layer
    this.layer.customFields = this.customFields.length > 0 ? [...this.customFields] : undefined;

    // Group data rows by table
    const tableMap = new Map<string, ColumnRow[]>();
    for (const row of this.dataSource.data) {
      if (row._rowType !== 'data') continue;
      if (!tableMap.has(row._tableName)) {
        tableMap.set(row._tableName, []);
      }
      tableMap.get(row._tableName)!.push(row);
    }

    // Update layer.tables
    for (const table of this.layer.tables) {
      const rows = tableMap.get(table.name);
      if (!rows) {
        table.columns = [];
        continue;
      }
      table.columns = rows.map(r => ({
        name: r.name,
        displayName: r.displayName || r.name,
        dataType: r.dataType,
        isNullable: r.isNullable,
        isPrimaryKey: r.isPrimaryKey,
        isForeignKey: r.isForeignKey,
        min: r.min || undefined,
        max: r.max || undefined,
        distinctCount: r.distinctCount ?? undefined,
        businessDescription: r.businessDescription || undefined,
        source: r.source || 'db',
        customValues: this.buildCustomValuesForSave(r.customFieldValues)
      } as SLColumn));
    }

    // Add new tables if there are rows for tables not in layer
    for (const [tableName, rows] of tableMap) {
      if (!this.layer.tables.find(t => t.name === tableName)) {
        this.layer.tables.push({
          name: tableName,
          displayName: tableName,
          columns: rows.map(r => ({
            name: r.name,
            displayName: r.displayName || r.name,
            dataType: r.dataType,
            isNullable: r.isNullable,
            isPrimaryKey: r.isPrimaryKey,
            isForeignKey: r.isForeignKey,
            source: r.source || 'manual',
            customValues: this.buildCustomValuesForSave(r.customFieldValues)
          } as SLColumn))
        });
      }
    }
  }

  /** Convert customFieldValues (id-keyed) to key-keyed for JSON export */
  private buildCustomValuesForSave(customFieldValues?: { [key: string]: string }): { [key: string]: string } | undefined {
    if (this.customFields.length === 0) return undefined;
    const result: { [key: string]: string } = {};
    for (const field of this.customFields) {
      const val = customFieldValues?.[field.id] || '';
      result[field.key] = val;
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }

  /** Convert key-keyed customValues (from DB/JSON) back to id-keyed for internal use */
  private loadCustomValuesFromLayer(customValues?: { [key: string]: string } | null): { [key: string]: string } {
    if (!customValues) return {};
    // If already id-keyed (old format), return as-is
    const keys = Object.keys(customValues);
    if (keys.length > 0 && keys.every(k => /^\d+$/.test(k))) {
      return { ...customValues };
    }
    // Key-based lookup: convert back to id-keyed using customFields
    const result: { [key: string]: string } = {};
    for (const field of this.customFields) {
      // Try key first, then fall back to name for backward compatibility
      result[field.id] = customValues[field.key] || customValues[field.name] || '';
    }
    return result;
  }

  // ─── Relationships ─────────────────────────────────────────────
  private refreshRelationships(): void {
    if (!this.layer?.relationships) {
      this.unconfirmedRelationships = [];
      return;
    }
    this.unconfirmedRelationships = this.layer.relationships.filter(r => !r.confirmed);
  }

  confirmRelationship(index: number, approved: boolean): void {
    if (!this.layer?.relationships) return;

    const rel = this.unconfirmedRelationships[index];
    if (!rel) return;

    if (approved) {
      rel.confirmed = true;
      this.snackBar.open(`קשר ${rel.fromTable} → ${rel.toTable} אושר`, 'סגור', { duration: 2000 });
    } else {
      const fullIndex = this.layer.relationships.indexOf(rel);
      if (fullIndex >= 0) {
        this.layer.relationships.splice(fullIndex, 1);
      }
      this.snackBar.open('קשר נדחה והוסר', 'סגור', { duration: 2000 });
    }

    // Mark as needing save
    this.pendingUpdates.push({} as ColumnRow); // dummy to enable save
    this.slState.setUnsavedChanges(true);
    this.refreshRelationships();
  }
}
