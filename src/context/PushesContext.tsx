import React, { createContext } from "react";
import {
  ButtonStates,
  ApiResponse,
  PendingAnswers,
} from "../../common/types";

interface PushesContextProps {
  pbUserInfo: ApiResponse;
  setPbUserInfo: React.Dispatch<React.SetStateAction<ApiResponse>>;
  botPushes: PendingAnswers;
  setBotPushes: React.Dispatch<React.SetStateAction<PendingAnswers>>;
  numNewAnswers: number;
  setNumNewAnswers: React.Dispatch<React.SetStateAction<number>>;
  buttonStates: ButtonStates;
  setButtonStates: React.Dispatch<React.SetStateAction<ButtonStates>>;
  parsedDataArray: { [key: string]: string }[];
  setParsedDataArray: React.Dispatch<
    React.SetStateAction<{ [key: string]: string }[]>
  >;
}

const defaultState = {
  pbUserInfo: {},
  setPbUserInfo: () => {},
  botPushes: {},
  setBotPushes: () => {},
  numNewAnswers: 0,
  setNumNewAnswers: () => {},
  buttonStates: {},
  setButtonStates: () => {},
  parsedDataArray: [],
  setParsedDataArray: () => {},
};

export const PushesContext = createContext<PushesContextProps>(defaultState);
