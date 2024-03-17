import { createAction, props } from "@ngrx/store";
import { IUserData } from "src/app/core/interfaces/interfaces";

export const loginUser = createAction(
  '[User] Login User',
  props<{ email: string, password: string }>()
);

export const loginUserSuccess = createAction(
  '[User] Login User Success',
  props<{ user: any }>()
);

export const loginUserFailure = createAction(
  '[User] Login User Failure',
  props<{ error: any }>()
);

export const registerUser = createAction(
  '[User] Register User',
  props<{ email: string, password: string, name: string }>()
);

export const registerUserSuccess = createAction(
  '[User] Register User Success',
  props<{ user: IUserData }>()
);

export const registerUserFailure = createAction(
  '[User] Register User Failure',
  props<{ error: any }>()
);

export const uploadUserPhoto = createAction(
  '[User] Upload User Photo',
  props<{ userId: string, file: File }>()
);

export const uploadUserPhotoSuccess = createAction(
  '[User] Upload User Photo Success',
  props<{ photoUrl: string }>()
);

export const uploadUserPhotoFailure = createAction(
  '[User] Upload User Photo Failure',
  props<{ error: any }>()
);

export const updateUserCreds = createAction(
  '[User] Update User Creds',
  props<{ name: string, password?: string }>()
);

export const updateUserCredsSuccess = createAction(
  '[User] Update User Creds Success',
  props<{ name: string, password?: string }>()
);

export const updateUserCredsFailure = createAction(
  '[User] Update User Creds Failure',
  props<{ error: any }>()
);

export const setUser = createAction(
  '[User] Set User',
  props<{ user: IUserData }>()
);

export const setUserName = createAction(
  '[User] Set User Name',
  props<{ name: string }>()
);

export const setUserPhoto = createAction(
  '[User] Set User Photo',
  props<{ photoUrl: string }>()
);

export const changeLanguage = createAction(
  '[User] Change Language',
  props<{ language: string }>()
);

export const changeLanguageSuccess = createAction(
  '[User] Change Language Success',
  props<{ language: string }>()
);

export const changeLanguageFailure = createAction(
  '[User] Change Language Error',
  props<{ error: any }>()
);