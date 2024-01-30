import { IUserData } from "src/app/core/models/interfaces";

export interface IUserState {
  user: IUserData,
  loading: boolean,
  error: any,
}