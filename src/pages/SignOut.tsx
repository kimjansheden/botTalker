import { signOut } from "firebase/auth";
import { auth } from "../config/FirebaseConfig";
import { useHistory } from "react-router-dom";
import { useAuth } from "../provider/AuthProvider";
import { IonContent, useIonToast } from "@ionic/react";
import { useEffect, useState } from "react";

const SignOut: React.FC = () => {
  const history = useHistory();
  const { loading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [presentToast] = useIonToast();

  if (loading) {
    return <IonContent>Loading …</IonContent>;
  }

  useEffect(() => {
    const handleSignOut = async () => {
      if (isSigningOut) return;
      setIsSigningOut(true);
      try {
        await signOut(auth);
        presentToast({
          message: "You have been logged out!",
          duration: 5000,
          color: "success",
          position: "middle",
          cssClass: "toast",
        });
        history.push("/start");
      } catch (error) {
        console.error("Logout error", error);
        alert("Logout failed!");
      }
    };

    handleSignOut();
  }, [isSigningOut, history]);

  return null;
};

export default SignOut;
