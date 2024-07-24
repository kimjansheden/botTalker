import { IonInput, IonItem } from "@ionic/react";
import React from "react";

interface TotpVerificationCodeProps {
  verificationCode: string;
  setVerificationCode: React.Dispatch<React.SetStateAction<string>>;
}

// This component renders a text input for the verification code
const TotpVerificationCode: React.FC<TotpVerificationCodeProps> = ({
  verificationCode,
  setVerificationCode,
}) => {
  return (
    <IonItem>
      <input
        type="text"
        name="fake"
        autoComplete="off"
        style={{ display: "none" }}
      />
      <IonInput
        type="text"
        placeholder="Enter your one-time code"
        name="verificationCode"
        value={verificationCode}
        autocomplete="off"
        onIonInput={(e) => setVerificationCode(e.detail.value!)}
      />
    </IonItem>
  );
};

export default TotpVerificationCode;
