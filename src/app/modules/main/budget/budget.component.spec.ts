import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BudgetComponent } from './budget.component';

describe('CreateBudgetComponent', () => {
  let component: BudgetComponent;
  let fixture: ComponentFixture<BudgetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BudgetComponent]
    });
    fixture = TestBed.createComponent(BudgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
