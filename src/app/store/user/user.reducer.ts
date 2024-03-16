import { createReducer, on } from "@ngrx/store";
import * as UserActions from './user.actions';
import { IUserState } from "./user.interfaces";

export const initialState: IUserState = {
  user: {
    userId: null,
    name: null,
    email: null,
    photo: null,
  },
  language: 'en',
  loading: false,
  error: null,
};

export const userReducer = createReducer(
  initialState,
  on(UserActions.loginUser, state => ({
    ...state,
    loading: true,
  })),
  on(UserActions.loginUserSuccess, (state, { user }) => ({
    ...state,
    loading: false,
    user,
  })),
  on(UserActions.loginUserFailure, (state, error) => ({
    ...state,
    loading: false,
    error,
  })),
  on(UserActions.registerUser, state => ({
    ...state,
    loading: true,
  })),
  on(UserActions.registerUserSuccess, (state, { user }) => ({
    ...state,
    loading: false,
    user,
  })),
  on(UserActions.registerUserFailure, (state, error) => ({
    ...state,
    loading: false,
    error,
  })),
  on(UserActions.uploadUserPhoto, state => ({
    ...state,
    loading: true,
  })),
  on(UserActions.uploadUserPhotoSuccess, (state, { photoUrl }) => ({
    ...state,
    loading: false,
    user: {
      ...state.user,
      photo: photoUrl,
    },
  })),
  on(UserActions.uploadUserPhotoFailure, (state, error) => ({
    ...state,
    loading: false,
    error,
  })),
  on(UserActions.updateUserCreds, state => ({
    ...state,
    loading: true,
  })),
  on(UserActions.updateUserCredsSuccess, (state, { name }) => ({
    ...state,
    loading: false,
    user: {
      ...state.user,
      name,
    },
  })),
  on(UserActions.updateUserCredsFailure, (state, error) => ({
    ...state,
    loading: false,
    error,
  })),
  on(UserActions.setUser, (state, { user }) => ({ 
    ...state, 
    user,
  })),
  on(UserActions.setUserPhoto, (state, { photoUrl }) => ({
    ...state,
    user: {
      ...state.user,
      photo: photoUrl,
    },
  })),
  on(UserActions.setUserName, (state, { name }) => ({
    ...state,
    user: {
      ...state.user,
      name,
    },
  })),
  on(UserActions.changeLanguageSuccess, (state, { language }) => ({
    ...state,
    language,
  })),
  on(UserActions.changeLanguageFailure, (state, { error }) => ({
    ...state,
    error,
  })),
)
