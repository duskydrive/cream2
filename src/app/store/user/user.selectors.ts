import { createSelector } from "@ngrx/store"
import { IUserState } from "./user.interfaces";

export const selectUserState = (state: any) => state.user;

export const selectUser = createSelector(
  selectUserState,
  (state: IUserState) => state.user,
);

export const selectUserId = createSelector(
  selectUser,
  user => user ? user.userId : null
);

export const selectUserName = createSelector(
  selectUser,
  user => user ? user.name : null
);

export const selectUserEmail = createSelector(
  selectUser,
  user => user ? user.email : null
);

export const selectUserPhoto = createSelector(
  selectUser,
  user => user ? user.photo : null
);