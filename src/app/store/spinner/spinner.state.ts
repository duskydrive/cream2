export interface ISpinnerState {
  activeRequests: number;
}

export const initialSpinnerState: ISpinnerState = {
  activeRequests: 0,
};