import React, { useContext, useEffect, useState } from "react";
import {
  User,
  getIdTokenResult,
  multiFactor,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, db } from "../config/FirebaseConfig";
import { AuthContext } from "../context/AuthContext";
import { AuthProviderProps } from "../../common/types";
import { doc, getDoc } from "firebase/firestore";

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [isSMS2FA, setIsSMS2FA] = useState<boolean | null>(null);
  const [isTOTP2FA, setIsTOTP2FA] = useState<boolean | null>(null);
  const [pushBulletApiKey, setPushBulletApiKey] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        setEmailVerified(user.emailVerified);
        try {
          const tokenResult = await getIdTokenResult(user);
          // console.log("tokenResult:", tokenResult)
          const isAdmin = tokenResult.claims.admin === true;
          setRole(isAdmin ? "admin" : "user");

          // Check if the user has SMS 2FA enabled
          const multiFactorUser = multiFactor(user).enrolledFactors;
          const hasSMS2FA = multiFactorUser.some(
            (factor) => factor.factorId === "phone"
          );
          const hasTOTP2FA = multiFactorUser.some(
            (factor) => factor.factorId === "totp"
          );
          setIsTOTP2FA(hasTOTP2FA);
          setIsSMS2FA(hasSMS2FA);

          // Fetch PushBullet API key
          const docRef = doc(db, "postHistory", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.pushBulletApiKey) {
              setPushBulletApiKey(data.pushBulletApiKey);
            }
          }
        } catch (error) {
          console.error("Failed to get token result:", error);
          setRole(null);
        }
      } else {
        setUser(null);
        setRole(null);
        setEmailVerified(null);
        setIsSMS2FA(null);
        setIsTOTP2FA(null);
        setPushBulletApiKey(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        role,
        emailVerified,
        isSMS2FA,
        isTOTP2FA,
        pushBulletApiKey,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
