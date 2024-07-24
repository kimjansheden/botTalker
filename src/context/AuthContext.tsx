import { createContext } from "react";
import { AuthContextType } from "../../common/types";

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  role: null,
  emailVerified: null,
  isSMS2FA: null,
  isTOTP2FA: null,
  pushBulletApiKey: null
});
