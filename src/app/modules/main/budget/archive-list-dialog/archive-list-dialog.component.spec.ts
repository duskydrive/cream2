import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchiveListDialogComponent } from './archive-list-dialog.component';

describe('ArchiveDialogComponent', () => {
  let component: ArchiveListDialogComponent;
  let fixture: ComponentFixture<ArchiveListDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ArchiveListDialogComponent]
    });
    fixture = TestBed.createComponent(ArchiveListDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
