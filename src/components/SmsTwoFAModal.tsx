import {
  IonModal,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonTitle,
  IonItem,
  IonInput,
  IonButton,
} from "@ionic/react";
import {
  PhoneAuthProvider,
  User,
  multiFactor,
  PhoneMultiFactorGenerator,
  MultiFactorResolver,
} from "firebase/auth";
import { auth } from "../config/FirebaseConfig";
import useToast from "../hooks/useToast";

interface TwoFAModalProps {
  show2FAModal: boolean;
  setShow2FAModal: React.Dispatch<React.SetStateAction<boolean>>;
  verificationId: string;
  verificationCode: string;
  setVerificationCode: React.Dispatch<React.SetStateAction<string>>;
  multiFactorResolver?: MultiFactorResolver | null;
}

const SmsTwoFAModal: React.FC<TwoFAModalProps> = ({
  show2FAModal,
  setShow2FAModal,
  verificationId,
  verificationCode,
  setVerificationCode,
  multiFactorResolver,
}) => {
  const { presentSuccessToast, presentDangerToast } = useToast();
  const handleVerify2FA = async () => {
    try {
      const credential = PhoneAuthProvider.credential(
        verificationId,
        verificationCode
      );
      const multiFactorAssertion =
        PhoneMultiFactorGenerator.assertion(credential);
      const currentUser = auth.currentUser as User;
      if (currentUser) {
        const multiFactorUser = multiFactor(currentUser);
        await multiFactorUser.enroll(multiFactorAssertion, "SMS");
      } else if (multiFactorResolver) {
        await multiFactorResolver.resolveSignIn(multiFactorAssertion);
      } else {
        throw new Error("User is not authenticated");
      }
      presentSuccessToast("2FA verified successfully!");
      setShow2FAModal(false);
    } catch (error) {
      presentDangerToast("Invalid verification code. Please try again.");
      console.error("Error verifying 2FA:", error);
    }
  };
  return (
    <IonModal isOpen={show2FAModal}>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            <IonCol>
              <IonTitle>Enter Verification Code</IonTitle>
              <IonItem>
                <IonInput
                  label="Verification Code"
                  labelPlacement="stacked"
                  type="text"
                  placeholder="Enter the code you received on your phone"
                  value={verificationCode}
                  onIonInput={(e) => setVerificationCode(e.detail.value!)}
                />
              </IonItem>
              <IonButton
                expand="block"
                color="primary"
                onClick={handleVerify2FA}
              >
                Verify 2FA
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonModal>
  );
};

export default SmsTwoFAModal;
