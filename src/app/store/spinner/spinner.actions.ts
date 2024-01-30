import { createAction } from '@ngrx/store';

export const startRequest = createAction(
  '[Spinner] Start Request'
);

export const endRequest = createAction(
  '[Spinner] End Request'
);