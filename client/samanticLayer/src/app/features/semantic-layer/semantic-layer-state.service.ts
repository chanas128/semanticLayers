import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { UserMessageDialogComponent } from '../../shared/components/user-message-dialog/user-message-dialog';

/**
 * SemanticLayerStateService
 * ------------------------
 * TODO: הוסף כאן כל מידע גלובלי שנחוץ לתהליך —
 *       כגון ID של חיבור ה-DB שנבחר, שם השכבה, רשימת טבלאות וכד'.
 */
@Injectable({ providedIn: 'root' })
export class SemanticLayerStateService {

  // ─── ניווט בין שלבים ───────────────────────────────────────────

  /** האינדקס של השלב הנוכחי (0-based) */
  currentStep = signal<number>(0);

  /** השלב הגבוה ביותר שהמשתמש הגיע אליו — קובע אילו שלבים ניתן ללחוץ עליהם */
  maxStepReached = signal<number>(0);

  /** כשהוא true — כפתור "הבא" מוחשך */
  nextDisabled = signal<boolean>(false);

  /** כשהוא true — יש שינויים שטרם נשמרו */
  hasUnsavedChanges = signal<boolean>(false);

  // ─── TODO: State ספציפי לשכבה הסמנטית ────────────────────────
  // TODO: הוסף signals לנתוני ה-Step1 (פרטי חיבור DB, טבלאות שנחשפו וכד')
  // TODO: הוסף signals לנתוני ה-Step2 (קשרים, חישובים, העשרות שנוצרו)
  // TODO: הוסף signals לנתוני ה-Step3 (שינויים שהמשתמש ערך בתצוגה המקדימה)
  // TODO: הוסף signal לשם / מזהה של השכבה שנוצרת

  constructor(private dialog: MatDialog) {}

  // ─── ניהול שלבים ───────────────────────────────────────────────

  /** עדכון השלב הנוכחי ואיפוס nextDisabled */
  updateCurrentStep(step: number): void {
    this.currentStep.set(step);
    this.nextDisabled.set(false); // כל שלב מאפס — השלב עצמו מדליק אם צריך
    if (step > this.maxStepReached()) {
      this.maxStepReached.set(step);
    }
  }

  setNextDisabled(value: boolean): void {
    this.nextDisabled.set(value);
  }

  setUnsavedChanges(value: boolean): void {
    this.hasUnsavedChanges.set(value);
  }

  resetProgress(): void {
    this.currentStep.set(0);
    this.maxStepReached.set(0);
    this.nextDisabled.set(false);
    this.hasUnsavedChanges.set(false);
    // TODO: אפס כאן גם את ה-signals הספציפיים של השכבה
  }

  // ─── אישור מעבר עמוד (unsaved changes guard) ───────────────────

  /**
   * מחזיר Observable<boolean>.
   * אם אין שינויים — מאשר מיד.
   * אם יש שינויים — פותח דיאלוג אישור.
   */
  canLeavePage(): Observable<boolean> {
    if (!this.hasUnsavedChanges()) {
      return of(true);
    }

    const dialogRef = this.dialog.open(UserMessageDialogComponent, {
      data: {
        type: 'question',
        message: 'ישנם שינויים שלא נשמרו, האם להמשיך?',
        confirmText: 'המשך ללא שמירה',
        cancelText: 'חזור'
      }
    });

    return dialogRef.afterClosed().pipe(
      map(result => !!result),
      tap(approved => {
        if (approved) {
          this.hasUnsavedChanges.set(false);
        }
      })
    );
  }
}
