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
  IonIcon,
  IonText,
} from "@ionic/react";
import {
  EmailAuthProvider,
  TotpSecret,
  reauthenticateWithCredential,
} from "firebase/auth";
import useToast from "../hooks/useToast";
import { useAuth } from "../provider/AuthProvider";
import { useState } from "react";
import { informationCircleOutline, informationOutline } from "ionicons/icons";

interface TwoFAModalProps {
  show2FAModal: boolean;
  setShow2FAModal: React.Dispatch<React.SetStateAction<boolean>>;
  generateTotpSecret: () => Promise<TotpSecret | null>;
  generateQRCode: (newSecret: TotpSecret | null) => Promise<void>;
}

const TotpTwoFAModal: React.FC<TwoFAModalProps> = ({
  show2FAModal,
  setShow2FAModal,
  generateTotpSecret,
  generateQRCode
}) => {
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const { presentSuccessToast, presentDangerToast } = useToast();
  const handleReauthSubmit = async () => {
    if (!user || !user.email) return;
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // Hide the reauth modal
      setShow2FAModal(false);
      
      // Retry generating the TOTP secret after reauthentication
      const totpSecret = await generateTotpSecret();
      await generateQRCode(totpSecret);
    } catch (error) {
      presentDangerToast("Reauthentication failed. Please try again.");
      console.error("Error reauthenticating:", error);
    }
  };

  const handleClose = () => setShow2FAModal(false);

  return (
    <IonModal isOpen={show2FAModal}>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            <IonCol>
              <IonTitle>Enter Your Password</IonTitle>
              <IonItem>
                <IonIcon slot="start" icon={informationCircleOutline} />
                <IonText>
                    You need to Re-Authenticate in order to enable 2FA.
                </IonText>
              </IonItem>
            </IonCol>
            <IonCol>
              <IonItem>
                <IonInput
                  label="Password"
                  labelPlacement="stacked"
                  type="password"
                  value={password}
                  onIonChange={(e) => setPassword(e.detail.value!)}
                  placeholder="Enter your password"
                  autocomplete="current-password"
                />
              </IonItem>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
            <IonButton
                expand="block"
                color="primary"
                onClick={handleReauthSubmit}
              >
                Submit
              </IonButton>
            </IonCol>
            <IonCol>
            <IonButton expand="block" color="medium" onClick={handleClose}>
                Cancel
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonModal>
  );
};

export default TotpTwoFAModal;
