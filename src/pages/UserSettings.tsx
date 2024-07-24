import React, { useState } from "react";
import {
  IonPage,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonButton,
  IonText,
} from "@ionic/react";
import { useAuth } from "../provider/AuthProvider";
import useToast from "../hooks/useToast";
import {
  EmailAuthProvider,
  multiFactor,
  reauthenticateWithCredential,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import SMSTwoFA from "../components/SmsTwoFA";
import TOTPTwoFA from "../components/TotpTwoFA";
import { FirebaseError } from "firebase/app";
import { useHistory } from "react-router-dom";

const UserSettings: React.FC = () => {
  const { user, emailVerified, isSMS2FA, isTOTP2FA } = useAuth();
  const [showChooseFAModal, setShowChooseFAModal] = useState(false);
  const { presentSuccessToast, presentDangerToast } = useToast();
  const history = useHistory();
  interface MFAConfig {
    smsSetup: boolean;
    smsDisable: boolean;
    totpSetup: boolean;
    totpDisable: boolean;
  }
  const [isOpen, setIsOpen] = useState<MFAConfig>({
    smsSetup: false,
    totpSetup: false,
    smsDisable: false,
    totpDisable: false,
  });

  const toggleShow = (key: keyof MFAConfig) => {
    setIsOpen((prevState) => ({
      ...prevState,
      [key]: !prevState[key],
    }));
  };

  const handleSendVerificationEmail = async () => {
    if (user && !emailVerified) {
      try {
        await sendEmailVerification(user);
        presentSuccessToast(
          "Verification email sent. Please check your inbox."
        );
      } catch (error) {
        presentDangerToast(
          "Failed to send verification email. Please try again."
        );
      }
    }
  };

  const handleUnenrollSms = async () => {
    console.log("Unenroll SMS 2FA");
    if (!user) {
      console.log("User not found");
      return;
    }
    try {
      // Unenroll from TOTP MFA.
      const multiFactorUser = multiFactor(user);
      const mfaEnrollmentId = multiFactorUser.enrolledFactors.find(
        (factor) => factor.factorId === "phone"
      )?.uid;
      if (!mfaEnrollmentId) {
        console.log("No enrollment ID found for SMS MFA");
        return;
      }
      await multiFactorUser.unenroll(mfaEnrollmentId);
      presentSuccessToast("SMS 2FA has been disabled.");
      console.log("SMS 2FA has been disabled.");
      window.location.reload();
    } catch (error) {
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "auth/requires-recent-login":
            try {
              console.log(`User needs to reauthenticate: ${error}`);
              presentDangerToast("Please login again to disable SMS 2FA.");
              // Wait 5 seconds before moving on
              console.log("Waiting 5 seconds …");
              setTimeout(() => {
                history.push("/logout");
              }, 5000);
              break;
            } catch (reauthError) {
              presentDangerToast("Reauthentication failed. Please try again.");
              console.error("Error reauthenticating:", reauthError);
            }
            break;
          case "auth/user-token-expired":
            // If the user was signed out, re-authenticate them.
            console.log("Re-authenticating user");
            history.push("/start");
            break;
          default:
            presentDangerToast("Failed to disable SMS 2FA. Please try again.");
            console.error("Error disabling SMS 2FA:", error);
        }
      } else {
        presentDangerToast("Failed to disable SMS 2FA. Please try again.");
        console.error("Error disabling SMS 2FA:", error);
      }
    }
  };

  const handleUnenrollTotp = async () => {
    console.log("Unenroll SMS 2FA");
    if (!user) {
      console.log("User not found");
      return;
    }
    try {
      // Unenroll from TOTP MFA.
      const multiFactorUser = multiFactor(user);
      const mfaEnrollmentId = multiFactorUser.enrolledFactors.find(
        (factor) => factor.factorId === "totp"
      )?.uid;
      if (!mfaEnrollmentId) {
        console.log("No enrollment ID found for TOTP MFA");
        return;
      }
      await multiFactorUser.unenroll(mfaEnrollmentId);
      presentSuccessToast("TOTP 2FA has been disabled.");
      console.log("TOTP 2FA has been disabled.");
      window.location.reload();
    } catch (error) {
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "auth/requires-recent-login":
            try {
              console.log(`User needs to reauthenticate: ${error}`);
              presentDangerToast("Please login again to disable TOTP 2FA.");
              // Wait 5 seconds before moving on
              console.log("Waiting 5 seconds …");
              setTimeout(() => {
                history.push("/logout");
              }, 5000);
              break;
            } catch (reauthError) {
              presentDangerToast("Reauthentication failed. Please try again.");
              console.error("Error reauthenticating:", reauthError);
            }
            break;
          case "auth/user-token-expired":
            // If the user was signed out, re-authenticate them.
            console.log("Re-authenticating user");
            history.push("/start");
            break;
          default:
            presentDangerToast("Failed to disable TOTP 2FA. Please try again.");
            console.error("Error disabling TOTP 2FA:", error);
        }
      } else {
        presentDangerToast("Failed to disable TOTP 2FA. Please try again.");
        console.error("Error disabling TOTP 2FA:", error);
      }
    }
  };

  return (
    <IonPage>
      <IonToolbar>
        <IonTitle>User Settings</IonTitle>
      </IonToolbar>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            <IonCol>
              {user && !emailVerified && (
                <IonItem>
                  <IonLabel color="danger">
                    Your email is not verified. Please verify your email to use
                    all features.
                  </IonLabel>
                  <IonButton onClick={handleSendVerificationEmail}>
                    Send Verification Email
                  </IonButton>
                </IonItem>
              )}
            </IonCol>
          </IonRow>
        </IonGrid>
        {!isSMS2FA && isOpen.smsSetup ? (
          <>
            <IonButton onClick={() => toggleShow("smsSetup")}>Close</IonButton>
            <SMSTwoFA />
          </>
        ) : isSMS2FA && isOpen.smsDisable ? (
          <>
            <IonText>Are you sure you want to disable SMS 2FA?</IonText>
            <IonRow>
              <IonButton
                color="medium"
                onClick={() => toggleShow("smsDisable")}
              >
                Cancel
              </IonButton>
              <IonButton color="danger" onClick={handleUnenrollSms}>
                Yes, disable it
              </IonButton>
            </IonRow>
          </>
        ) : !isTOTP2FA && isOpen.totpSetup ? (
          <>
            <IonButton onClick={() => toggleShow("totpSetup")}>Close</IonButton>
            <TOTPTwoFA />
          </>
        ) : isTOTP2FA && isOpen.totpDisable ? (
          <>
            <IonText>Are you sure you want to disable TOTP 2FA?</IonText>
            <IonRow>
              <IonButton
                color="medium"
                onClick={() => toggleShow("totpDisable")}
              >
                Cancel
              </IonButton>
              <IonButton color="danger" onClick={handleUnenrollTotp}>
                Yes, disable it
              </IonButton>
            </IonRow>
          </>
        ) : (
          <IonGrid fixed={true}>
            <IonRow>
              <IonCol>
                <h2>SMS 2FA:</h2>
              </IonCol>
              <IonCol>
                {isSMS2FA ? (
                  <IonText>Enabled</IonText>
                ) : (
                  <IonText>Disabled</IonText>
                )}
              </IonCol>
              <IonCol>
                {!isSMS2FA ? (
                  <IonButton onClick={() => toggleShow("smsSetup")}>
                    Setup SMS 2FA
                  </IonButton>
                ) : (
                  <IonButton onClick={() => toggleShow("smsDisable")}>
                    Disable SMS 2FA
                  </IonButton>
                )}
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol>
                <h2>TOTP 2FA:</h2>
              </IonCol>
              <IonCol>
                {isTOTP2FA ? (
                  <IonText>Enabled</IonText>
                ) : (
                  <IonText>Disabled</IonText>
                )}
              </IonCol>
              <IonCol>
                {!isTOTP2FA ? (
                  <IonButton onClick={() => toggleShow("totpSetup")}>
                    Setup TOTP 2FA
                  </IonButton>
                ) : (
                  <IonButton onClick={() => toggleShow("totpDisable")}>
                    Disable TOTP 2FA
                  </IonButton>
                )}
              </IonCol>
            </IonRow>
          </IonGrid>
        )}
      </IonContent>
    </IonPage>
  );
};

export default UserSettings;
