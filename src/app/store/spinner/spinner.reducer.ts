import { createReducer, on } from '@ngrx/store';
import * as SpinnerActions from './spinner.actions';
import { initialSpinnerState } from './spinner.state';

export const spinnerReducer = createReducer(
  initialSpinnerState,
  on(SpinnerActions.startRequest, state => ({ 
    ...state, 
    activeRequests: state.activeRequests + 1,
  })),
  on(SpinnerActions.endRequest, state => ({ 
    ...state, 
    activeRequests: Math.max(0, state.activeRequests - 1),
  })),
);
