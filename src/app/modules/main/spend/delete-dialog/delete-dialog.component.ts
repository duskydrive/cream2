import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Unsub } from 'src/app/core/classes/unsub';

@Component({
  selector: 'app-delete-dialog',
  templateUrl: './delete-dialog.component.html',
  styleUrls: ['./delete-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteDialogComponent extends Unsub implements OnInit {
  constructor(
    private matDialogRef: MatDialogRef<DeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {title: string},
  ) {
    super();
  }
    
  public ngOnInit() {

  }

  onSubmit() {
    this.matDialogRef.close(true);
  }
}
