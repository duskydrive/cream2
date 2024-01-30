import { ActionReducerMap } from "@ngrx/store";
import { userReducer } from "./user/user.reducer";
import { IUserState } from "./user/user.interfaces";
import { spinnerReducer } from "./spinner/spinner.reducer";
import { ISpinnerState } from "./spinner/spinner.state";
import { IBudgetState, budgetReducer } from "./budget/budget.reducer";

export interface AppState {
  user: IUserState;
  spinner: ISpinnerState;
  budget: IBudgetState;
}

export const reducers: ActionReducerMap<AppState> = {
  user: userReducer,
  spinner: spinnerReducer,
  budget: budgetReducer,
}