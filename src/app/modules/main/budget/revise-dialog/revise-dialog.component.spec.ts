import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviseDialogComponent } from './revise-dialog.component';

describe('EditDialogComponent', () => {
  let component: ReviseDialogComponent;
  let fixture: ComponentFixture<ReviseDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReviseDialogComponent]
    });
    fixture = TestBed.createComponent(ReviseDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
