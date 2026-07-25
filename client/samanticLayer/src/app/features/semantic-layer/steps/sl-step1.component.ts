import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { SemanticLayerApiService, ConnectionDTO, SemanticLayerDefinition } from '../services/semantic-layer-api.service';
import { SemanticLayerStateService } from '../semantic-layer-state.service';

@Component({
  selector: 'app-sl-step1',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatExpansionModule, MatChipsModule, MatTooltipModule, MatDialogModule
  ],
  styleUrls: ['./sl-step.shared.scss'],
  styles: [`
    .connections-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
      width: 100%;
      max-width: 900px;
      margin: 0 auto;
    }
    .conn-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 14px;
      padding: 1.2rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      transition: box-shadow 0.2s, border-color 0.2s;
      cursor: pointer;
      position: relative;
    }
    .conn-card:hover {
      box-shadow: 0 4px 16px rgba(42, 143, 186, 0.15);
      border-color: #2a8fba;
    }
    .conn-card.active {
      border-color: #1e6a8a;
      box-shadow: 0 4px 16px rgba(30, 106, 138, 0.2);
      background: #f5fbfe;
    }
    .conn-card-header {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .conn-card-header mat-icon {
      color: #2a8fba;
      font-size: 22px;
      width: 22px;
      height: 22px;
    }
    .conn-card-name {
      font-weight: 700;
      color: #0A3546;
      font-size: 1rem;
    }
    .conn-card-details {
      font-size: 0.82rem;
      color: #666;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .conn-card-details span {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .conn-card-details mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: #999;
    }
    .conn-card-status {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      padding: 3px 8px;
      border-radius: 12px;
      width: fit-content;
    }
    .conn-card-status.ok {
      background: #ecfdf3;
      color: #047244;
      border: 1px solid #a5ebc2;
    }
    .conn-card-status.fail {
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fca5a5;
    }
    .conn-card-actions {
      display: flex;
      gap: 6px;
      margin-top: 0.5rem;
    }
    .conn-card-actions button {
      font-size: 13px;
      padding: 4px 12px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-family: var(--font);
      transition: background 0.2s;
    }
    .btn-scan {
      background: #1e6a8a;
      color: white;
    }
    .btn-scan:hover { background: #0A3546; }
    .btn-scan:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-delete {
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fca5a5 !important;
    }
    .btn-delete:hover { background: #fee2e2; }
    .new-conn-card {
      background: #f5fbfe;
      border: 2px dashed #2a8fba;
      border-radius: 14px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      cursor: pointer;
      transition: background 0.2s, border-color 0.2s;
      min-height: 140px;
    }
    .new-conn-card:hover {
      background: #e5f6fd;
      border-color: #1e6a8a;
    }
    .new-conn-card mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #2a8fba;
    }
    .new-conn-card span {
      font-weight: 600;
      color: #1e6a8a;
      font-size: 0.95rem;
    }

    /* Modal overlay */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.4);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-content {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      width: 90%;
      max-width: 520px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.2);
      direction: rtl;
      max-height: 85vh;
      overflow-y: auto;
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.2rem;
    }
    .modal-header h3 {
      margin: 0;
      font-size: 1.2rem;
      color: #0A3546;
      font-weight: 700;
    }
    .modal-close {
      background: none;
      border: none;
      cursor: pointer;
      color: #999;
      font-size: 24px;
      display: flex;
      align-items: center;
    }
    .modal-close:hover { color: #333; }
  `],
  template: `
    <div class="step-container">

      <!-- ── Loading ── -->
      <div class="step-bg" style="background-color:#f0faff;" *ngIf="loadingConnections()">
        <div class="step-content">
          <mat-spinner diameter="40"></mat-spinner>
          <p style="margin-top:12px;color:#666;">טוען חיבורים...</p>
        </div>
      </div>

      <!-- ── רשימת חיבורים קיימים ── -->
      <div class="step-bg" style="background-color:#f0faff;overflow-y:auto;align-items:flex-start;" *ngIf="!loadingConnections() && !scanResult()">
        <div class="step-content" style="max-width:960px;">
          <h3 class="step-title">חיבור למסד נתונים</h3>
          <p class="step-description">בחר חיבור קיים או צור חיבור חדש כדי להתחיל בבניית השכבה הסמנטית.</p>

          <div class="connections-grid">
            <!-- New connection card -->
            <div class="new-conn-card" (click)="openNewConnectionModal()">
              <mat-icon>add_circle_outline</mat-icon>
              <span>חיבור חדש</span>
            </div>

            <!-- Existing connections -->
            <div class="conn-card" *ngFor="let conn of connections()"
                 [class.active]="selectedConnectionId() === conn.id">
              <div class="conn-card-header">
                <mat-icon>dns</mat-icon>
                <span class="conn-card-name">{{ conn.name }}</span>
              </div>
              <div class="conn-card-details">
                <span><mat-icon>storage</mat-icon> {{ conn.serverName }}</span>
                <span><mat-icon>folder</mat-icon> {{ conn.databaseName }}</span>
                <span><mat-icon>lock</mat-icon> {{ conn.authType === 'Windows' ? 'Windows Auth' : 'SQL Auth' }}</span>
              </div>
              <span class="conn-card-status" [class.ok]="conn.lastTestResult === 'OK'" [class.fail]="conn.lastTestResult && conn.lastTestResult !== 'OK'">
                <mat-icon style="font-size:12px;width:12px;height:12px;">{{ conn.lastTestResult === 'OK' ? 'check_circle' : 'error' }}</mat-icon>
                {{ conn.lastTestResult === 'OK' ? 'תקין' : (conn.lastTestResult || 'לא נבדק') }}
              </span>
              <div class="conn-card-actions">
                <button class="btn-scan" (click)="onSelectAndScan(conn)" [disabled]="loading() && selectedConnectionId() === conn.id">
                  <mat-icon style="font-size:16px;width:16px;height:16px;">cable</mat-icon>
                  {{ loading() && selectedConnectionId() === conn.id ? 'סורק...' : 'התחבר וסרוק' }}
                </button>
                <button class="btn-delete" (click)="deleteConnection(conn, $event)" matTooltip="מחק חיבור">
                  <mat-icon style="font-size:16px;width:16px;height:16px;">delete</mat-icon>
                </button>
              </div>
            </div>
          </div>

          <!-- Error message -->
          <div class="conn-error" *ngIf="errorMsg()" style="margin-top:1rem;max-width:600px;">
            <mat-icon>error_outline</mat-icon>
            <span>{{ errorMsg() }}</span>
          </div>
        </div>
      </div>

      <!-- ── מודל חיבור חדש ── -->
      <div class="modal-overlay" *ngIf="showNewConnModal" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>יצירת חיבור חדש</h3>
            <button class="modal-close" (click)="closeModal()">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <form class="conn-form" (ngSubmit)="onCreateConnection()">
            <mat-form-field appearance="outline" class="field-full">
              <mat-label>שם חיבור (תיאור ידידותי)</mat-label>
              <input matInput [(ngModel)]="form.name" name="name" required />
            </mat-form-field>

            <div class="field-row">
              <mat-form-field appearance="outline" class="field-half">
                <mat-label>שם שרת</mat-label>
                <input matInput [(ngModel)]="form.serverName" name="serverName" required
                       placeholder="localhost או .\\SQLEXPRESS" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="field-half">
                <mat-label>שם מסד נתונים</mat-label>
                <input matInput [(ngModel)]="form.databaseName" name="databaseName" required
                       placeholder="SemanticLayerDemo" />
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="field-full">
              <mat-label>סוג אימות</mat-label>
              <mat-select [(ngModel)]="form.authType" name="authType">
                <mat-option value="Windows">Windows Authentication</mat-option>
                <mat-option value="SqlServer">SQL Server Authentication</mat-option>
              </mat-select>
            </mat-form-field>

            <div class="field-row" *ngIf="form.authType === 'SqlServer'">
              <mat-form-field appearance="outline" class="field-half">
                <mat-label>שם משתמש</mat-label>
                <input matInput [(ngModel)]="form.username" name="username" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="field-half">
                <mat-label>סיסמה</mat-label>
                <input matInput type="password" [(ngModel)]="form.password" name="password" />
              </mat-form-field>
            </div>

            <!-- Error -->
            <div class="conn-error" *ngIf="modalError()">
              <mat-icon>error_outline</mat-icon>
              <span>{{ modalError() }}</span>
            </div>

            <!-- Buttons -->
            <div class="conn-actions" style="gap:8px;">
              <button mat-raised-button type="submit" class="btn-primary" [disabled]="creatingConn()">
                <mat-spinner *ngIf="creatingConn()" diameter="18"></mat-spinner>
                <mat-icon *ngIf="!creatingConn()">add</mat-icon>
                <span>{{ creatingConn() ? 'יוצר...' : 'צור חיבור' }}</span>
              </button>
              <button mat-button type="button" (click)="closeModal()" style="color:#666;">ביטול</button>
            </div>
          </form>
        </div>
      </div>

      <!-- ── תוצאות סריקה ── -->
      <div class="scan-results" *ngIf="scanResult()">
        <div class="scan-header">
          <div class="scan-header__info">
            <mat-icon class="scan-header__icon">check_circle</mat-icon>
            <div>
              <h3 class="scan-header__title">סריקה הושלמה בהצלחה</h3>
              <p class="scan-header__sub">
                נמצאו <strong>{{ scanResult()!.tables?.length || 0 }}</strong> טבלאות
                ו-<strong>{{ scanResult()!.relationships?.length || 0 }}</strong> קשרים
                ב-<strong>{{ scanResult()!.databaseName }}</strong>
              </p>
            </div>
          </div>
          <button mat-button class="btn-ghost-sm" (click)="resetToConnectionsList()">
            <mat-icon>arrow_forward</mat-icon> חזרה לרשימת חיבורים
          </button>
        </div>

        <!-- Table cards -->
        <mat-accordion multi>
          <mat-expansion-panel *ngFor="let table of scanResult()!.tables">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon class="table-icon">table_chart</mat-icon>
                <span class="table-name">{{ table.name }}</span>
                <mat-chip class="col-count">{{ table.columns.length }} עמודות</mat-chip>
              </mat-panel-title>
            </mat-expansion-panel-header>

            <div class="columns-grid">
              <div class="col-row col-row--header">
                <span>עמודה</span><span>טיפוס</span><span>PK</span><span>FK</span><span>Min</span><span>Max</span><span>Distinct</span>
              </div>
              <div class="col-row" *ngFor="let col of table.columns">
                <span class="col-name">{{ col.name }}</span>
                <span class="col-type">{{ col.dataType }}</span>
                <mat-icon class="col-badge" *ngIf="col.isPrimaryKey" matTooltip="Primary Key">vpn_key</mat-icon>
                <mat-icon class="col-badge fk" *ngIf="col.isForeignKey" matTooltip="Foreign Key">link</mat-icon>
                <span *ngIf="!col.isPrimaryKey && !col.isForeignKey"></span>
                <span *ngIf="!col.isPrimaryKey && !col.isForeignKey"></span>
                <span class="col-stat">{{ col.min ?? '—' }}</span>
                <span class="col-stat">{{ col.max ?? '—' }}</span>
                <span class="col-stat">{{ col.distinctCount ?? '—' }}</span>
              </div>
            </div>
          </mat-expansion-panel>
        </mat-accordion>

        <!-- Relationships summary -->
        <div class="relationships-box" *ngIf="scanResult()!.relationships?.length">
          <h4><mat-icon>share</mat-icon> קשרים שזוהו</h4>
          <div class="rel-row" *ngFor="let r of scanResult()!.relationships">
            <span>{{ r.fromTable }}.{{ r.fromColumn }}</span>
            <mat-icon>arrow_back</mat-icon>
            <span>{{ r.toTable }}.{{ r.toColumn }}</span>
          </div>
        </div>
      </div>

    </div>
  `
})
export class SlStep1Component implements OnInit {
  private api = inject(SemanticLayerApiService);
  private slState = inject(SemanticLayerStateService);

  // ─── State ──────────────────────────────────────────────
  connections = signal<ConnectionDTO[]>([]);
  loadingConnections = signal(true);
  loading = signal(false);
  errorMsg = signal<string | null>(null);
  scanResult = signal<SemanticLayerDefinition | null>(null);
  selectedConnectionId = signal<number | null>(null);

  // New connection modal
  showNewConnModal = false;
  creatingConn = signal(false);
  modalError = signal<string | null>(null);

  form: ConnectionDTO = {
    name: '',
    serverName: '',
    databaseName: 'SemanticLayerDemo',
    authType: 'Windows',
    username: '',
    password: ''
  };

  // ─── Lifecycle ──────────────────────────────────────────
  ngOnInit(): void {
    this.loadConnections();
  }

  private loadConnections(): void {
    this.loadingConnections.set(true);
    this.api.getConnections().subscribe({
      next: (list) => {
        this.connections.set(list);
        this.loadingConnections.set(false);
      },
      error: () => {
        this.connections.set([]);
        this.loadingConnections.set(false);
      }
    });
  }

  // ─── Select existing and scan ───────────────────────────
  onSelectAndScan(conn: ConnectionDTO): void {
    const id = conn.id!;
    this.selectedConnectionId.set(id);
    this.loading.set(true);
    this.errorMsg.set(null);

    this.api.scanConnection(id).subscribe({
      next: (layer) => {
        this.loading.set(false);
        this.scanResult.set(layer);
        (this.slState as any)._connectionId = id;
        (this.slState as any)._layer = layer;
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(`שגיאת סריקה: ${err.error?.message || err.message || 'שגיאה'}`);
      }
    });
  }

  // ─── New connection modal ───────────────────────────────
  openNewConnectionModal(): void {
    this.form = { name: '', serverName: '', databaseName: 'SemanticLayerDemo', authType: 'Windows', username: '', password: '' };
    this.modalError.set(null);
    this.showNewConnModal = true;
  }

  closeModal(): void {
    this.showNewConnModal = false;
  }

  onCreateConnection(): void {
    if (!this.form.name || !this.form.serverName || !this.form.databaseName) {
      this.modalError.set('יש למלא שם חיבור, שם שרת ושם מסד נתונים.');
      return;
    }

    this.creatingConn.set(true);
    this.modalError.set(null);

    this.api.createConnection(this.form).subscribe({
      next: (created: any) => {
        this.creatingConn.set(false);
        const newId = created.id ?? created.Id;
        if (!newId) {
          this.modalError.set('החיבור נוצר אך לא התקבל מזהה מהשרת.');
          return;
        }
        // Close modal and refresh list
        this.showNewConnModal = false;
        this.loadConnections();
      },
      error: (err) => {
        this.creatingConn.set(false);
        this.modalError.set(`שגיאה: ${err.error?.message || err.message || 'שגיאת תקשורת'}`);
      }
    });
  }

  // ─── Delete connection ──────────────────────────────────
  deleteConnection(conn: ConnectionDTO, event: Event): void {
    event.stopPropagation();
    if (!confirm(`למחוק את החיבור "${conn.name}"?`)) return;

    this.api.deleteConnection(conn.id!).subscribe({
      next: () => this.loadConnections(),
      error: () => this.errorMsg.set('שגיאה במחיקת החיבור')
    });
  }

  // ─── Reset ──────────────────────────────────────────────
  resetToConnectionsList(): void {
    this.scanResult.set(null);
    this.errorMsg.set(null);
    this.selectedConnectionId.set(null);
  }
}
