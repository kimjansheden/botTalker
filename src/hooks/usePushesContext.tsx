import { useContext } from "react";
import { PushesContext } from "../context/PushesContext";

export const usePushesContext = () => useContext(PushesContext);
