import {
  IonButton,
  IonCol,
  IonContent,
  IonGrid,
  IonIcon,
  IonItem,
  IonModal,
  IonRow,
  IonText,
  IonTitle,
} from "@ionic/react";
import { informationCircleOutline } from "ionicons/icons";
import React from "react";
import TotpVerificationCode from "./TotpVerificationCode";
import { MultiFactorResolver, TotpMultiFactorGenerator } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import useToast from "../hooks/useToast";

interface TwoFAModalProps {
  show2FAModal: boolean;
  setShow2FAModal: React.Dispatch<React.SetStateAction<boolean>>;
  verificationCode: string;
  setVerificationCode: React.Dispatch<React.SetStateAction<string>>;
  multiFactorResolver?: MultiFactorResolver | null;
}
const TotpTwoFASignInModal: React.FC<TwoFAModalProps> = ({
  show2FAModal,
  setShow2FAModal,
  verificationCode,
  setVerificationCode,
  multiFactorResolver,
}) => {
  const { presentSuccessToast, presentDangerToast } = useToast();
  const handleSubmit = async () => {
    console.log("Verification code:", verificationCode);
    if (!multiFactorResolver) {
      console.log(
        "TotpTwoFASignInModal – handleSubmit: No multiFactorResolver available"
      );
      return;
    }

    console.log("multiFactorResolver.hints:", multiFactorResolver.hints);

    const enrollmentId = multiFactorResolver.hints.find(
      (hint) => hint.factorId === "totp"
    )?.uid;

    if (!enrollmentId) {
      console.log("TotpTwoFASignInModal – handleSubmit: No enrollmentId found");
      return;
    }

    const multiFactorAssertion = TotpMultiFactorGenerator.assertionForSignIn(
      enrollmentId,
      verificationCode
    );
    try {
      const userCredential = await multiFactorResolver.resolveSignIn(
        multiFactorAssertion
      );
      // Successfully signed in!
      presentSuccessToast("You have been signed in!");
      setShow2FAModal(false);
    } catch (error) {
      // Invalid or expired OTP.
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "auth/totp-challenge-timeout":
            console.log(error);
            presentDangerToast("Timeout, please try again");
            setShow2FAModal(false);
            break;
          case "auth/invalid-verification-code":
            console.log(error);
            presentDangerToast("Invalid verification code, please try again");
            break;
          default:
            console.error("Unknown error occurred.", error);
            presentDangerToast("Login Failed: An unknown error occurred");
        }
      } else {
        console.error(error);
      }
    }
  };
  return (
    <IonModal isOpen={show2FAModal}>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            <IonCol>
              <IonTitle>Verify Your Identity</IonTitle>
              <IonItem>
                <IonIcon slot="start" icon={informationCircleOutline} />
                <IonText>Check your preferred one-time password application for a code.
                </IonText>
              </IonItem>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <TotpVerificationCode
                verificationCode={verificationCode}
                setVerificationCode={setVerificationCode}
              />
            </IonCol>
            <IonCol>
              <IonButton onClick={handleSubmit}>Submit</IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonModal>
  );
};

export default TotpTwoFASignInModal;
