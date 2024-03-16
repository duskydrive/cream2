import { IUserData } from "src/app/core/interfaces/interfaces";

export interface IUserState {
  user: IUserData,
  language: string,
  loading: boolean,
  error: any,
}