import React, { useState, useRef, useEffect } from "react";
import {
  IonPage,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonButton,
  IonInput,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonText,
} from "@ionic/react";
import {
  RecaptchaVerifier,
  PhoneAuthProvider,
} from "firebase/auth";
import { useAuth } from "../provider/AuthProvider";
import { auth } from "../config/FirebaseConfig";
import useToast from "../hooks/useToast";
import { PartialProps } from "../../common/types";
import SmsTwoFAModal from "./SmsTwoFAModal";

const SMSTwoFA: React.FC<PartialProps> = ({ standalone = false }) => {
  const { user } = useAuth();
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneNumberError, setPhoneNumberError] = useState<string | null>(null);
  const [isPhoneValid, setIsPhoneValid] = useState<boolean>();
  const [isTouched, setIsTouched] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const { presentSuccessToast, presentDangerToast } = useToast();

  const setupReCaptchaVerifier = async () => {
    if (!user) return null;
    console.log("Setting up reCAPTCHA verifier...");
    auth.useDeviceLanguage();
    console.log("auth.languageCode:", auth.languageCode);
    const recaptchaVerifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      {
        size: "invisible",
        callback: (response: any) => {
          // reCAPTCHA solved, allow the user to proceed.
        },
      }
    );
    console.log("recaptchaVerifier:", recaptchaVerifier);
    // Store the recaptchaVerifier instance so it can be used in the verifyPhoneNumber function.
    recaptchaVerifierRef.current = recaptchaVerifier;
    return recaptchaVerifier;
  };

  useEffect(() => {
    if (recaptchaVerifierRef.current) return;
    setupReCaptchaVerifier();
  }, [user]);

  const normalizePhoneNumber = (phone: string): string => {
    // Remove all non-numeric characters except the leading +
    let cleaned = phone.replace(/[^\d+]/g, "");

    // Add country code if missing (using Sweden as default country)
    if (cleaned.startsWith("0") && !cleaned.startsWith("+")) {
      cleaned = `+46${cleaned.substring(1)}`;
    }

    return cleaned;
  };

  const handleSetup2FA = async () => {
    let recaptchaVerifier: RecaptchaVerifier | null;
    try {
      const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
      if (!validatePhoneNumber(normalizedPhoneNumber)) {
        throw new Error("Invalid phone number format");
      }

      if (!recaptchaVerifierRef.current) {
        recaptchaVerifier = await setupReCaptchaVerifier();
      } else {
        recaptchaVerifier = recaptchaVerifierRef.current;
      }
      if (!recaptchaVerifier) return;
      console.log("handleSetup2FA: using recaptchaVerifier", recaptchaVerifier);
      console.log("Sending SMS with phone number:", normalizedPhoneNumber);
      const appVerifier = recaptchaVerifier;
      if (!appVerifier) {
        throw new Error("reCAPTCHA verifier is not initialized");
      }

      const provider = new PhoneAuthProvider(auth);
      const verificationId = await provider.verifyPhoneNumber(
        normalizedPhoneNumber,
        appVerifier
      );
      setVerificationId(verificationId);
      setShow2FAModal(true);
      console.log("show2FAModal:", show2FAModal);
      presentSuccessToast("SMS sent. Please check your phone.");
    } catch (error) {
      presentDangerToast("Failed to send SMS. Please try again.");
      console.error("Error sending SMS:", error);
    }
  };

  const validatePhoneNumber = (phoneNum: string): boolean => {
    const phoneRegex = /^\+?[0-9]{1,15}$/;
    return phoneRegex.test(phoneNum);
  };

  const validate = (ev: Event) => {
    const value = (ev.target as HTMLInputElement).value;
    // console.log("phone number input value:", value)

    setIsPhoneValid(undefined);
    setPhoneNumber(value);

    if (value === "") return;

    const validPhoneNumber = validatePhoneNumber(value);
    // console.log("validPhoneNumber:", validPhoneNumber)

    validPhoneNumber ? setIsPhoneValid(true) : setIsPhoneValid(false);
  };

  const markTouched = () => {
    setIsTouched(true);
  };

  useEffect(() => {
    console.log("show2FAModal changed:", show2FAModal);
  }, [show2FAModal]);  

  const content = (
    <>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Setup Two-Factor Authentication</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            <IonCol>
              <IonItem>
                <IonInput
                  className={`${isPhoneValid && "ion-valid"} ${
                    isPhoneValid === false && "ion-invalid"
                  } ${isTouched && "ion-touched"}`}
                  label="Phone Number"
                  labelPlacement="stacked"
                  type="tel"
                  inputMode="tel"
                  placeholder="+467234567890"
                  value={phoneNumber}
                  helperText="Enter a valid phone number"
                  errorText="Invalid phone number"
                  onIonInput={(e) => validate(e)}
                  onIonBlur={() => markTouched()}
                />
              </IonItem>
              {phoneNumberError && (
                <IonText color="danger">
                  <p>{phoneNumberError}</p>
                </IonText>
              )}
              <IonButton
                expand="block"
                color="primary"
                onClick={handleSetup2FA}
                disabled={!isPhoneValid || !phoneNumber}
              >
                Setup SMS 2FA
              </IonButton>
              <div id="recaptcha-container"></div>
            </IonCol>
          </IonRow>
        </IonGrid>
        <SmsTwoFAModal
          show2FAModal={show2FAModal}
          setShow2FAModal={setShow2FAModal}
          verificationId={verificationId}
          verificationCode={verificationCode}
          setVerificationCode={setVerificationCode}
        />
      </IonContent>
    </>
  );

  if (standalone) {
    return <IonPage>{content}</IonPage>;
  }

  return <>{content}</>;
};

export default SMSTwoFA;
