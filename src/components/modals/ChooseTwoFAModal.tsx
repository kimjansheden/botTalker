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
import { MultiFactorResolver } from "firebase/auth";
import { informationCircleOutline } from "ionicons/icons";
import React, { useEffect } from "react";

interface TwoFAModalProps {
  show2FAModal: boolean;
  setShow2FAModal: React.Dispatch<React.SetStateAction<boolean>>;
  handleSMSVerification: () => Promise<void>;
  handleTOTPVerification: () => Promise<void>;
  multiFactorResolver?: MultiFactorResolver | null;
}

const ChooseTwoFAModal: React.FC<TwoFAModalProps> = ({
  show2FAModal,
  setShow2FAModal,
  handleSMSVerification,
  handleTOTPVerification,
  multiFactorResolver,
}) => {
  console.log("ChooseTwoFAModal: show2FAModal is", show2FAModal);
  const [useSms, setUseSms] = React.useState<boolean>(false);
  const [useTotp, setUseTotp] = React.useState<boolean>(false);
  const [smsAvailable, setSmsAvailable] = React.useState<boolean>(false);
  const [totpAvailable, setTotpAvailable] = React.useState<boolean>(false);

  useEffect(() => {
    if (useSms) {
      setShow2FAModal(false);
      handleSMSVerification();
    }
    if (useTotp) {
      setShow2FAModal(false);
      handleTOTPVerification();
    }
  }, [useSms, useTotp]);

  useEffect(() => {
    if (!multiFactorResolver) {
      return;
    }
    multiFactorResolver.hints.forEach((hint) => {
      if (hint.factorId === "phone") {
        setSmsAvailable(true);
      }
      if (hint.factorId === "totp") {
        setTotpAvailable(true);
      }
    });
  }, [multiFactorResolver]);

  return (
    <IonModal isOpen={show2FAModal}>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            <IonCol>
              <IonTitle>Choose 2FA Method</IonTitle>
              <IonItem>
                <IonIcon slot="start" icon={informationCircleOutline} />
                <IonText>Choose how you would like to authenticate.</IonText>
              </IonItem>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonButton
                disabled={!smsAvailable}
                onClick={() => setUseSms(true)}
              >
                SMS
              </IonButton>
            </IonCol>
            <IonCol>
              <IonButton
                disabled={!totpAvailable}
                onClick={() => setUseTotp(true)}
              >
                Authenticator App
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonModal>
  );
};

export default ChooseTwoFAModal;
