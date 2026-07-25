import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-user-message-dialog',
  standalone: true,
  templateUrl: './user-message-dialog.html',
  styleUrls: ['./user-message-dialog.scss'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule
  ]
})
export class UserMessageDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<UserMessageDialogComponent>,
@Inject(MAT_DIALOG_DATA) public data: {
  type: 'error' | 'success' | 'info' | 'warning' | 'question',
  message: string,
  customClass?: string // שדה אופציונלי - לא חובה לשלוח אותו
}
  ) {}

  close(): void {
    this.dialogRef.close();
  }
  confirm(): void {
  this.dialogRef.close(true); // מחזיר true כבחירה
}
}
