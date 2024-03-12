import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchiveDialogComponent } from './archive-dialog.component';

describe('ArchiveDialogComponent', () => {
  let component: ArchiveDialogComponent;
  let fixture: ComponentFixture<ArchiveDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ArchiveDialogComponent]
    });
    fixture = TestBed.createComponent(ArchiveDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
