import React, { useState, useEffect } from "react";
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
  TotpMultiFactorGenerator,
  TotpSecret,
  multiFactor,
} from "firebase/auth";
import { useAuth } from "../provider/AuthProvider";
import useToast from "../hooks/useToast";
import { PartialProps } from "../../common/types";
import { FirebaseError } from "firebase/app";
import TotpTwoFAModal from "./TotpTwoFAModal";
import QRCode from "qrcode";
import { useHistory } from "react-router-dom";
import TotpVerificationCode from "./TotpVerificationCode";

const TOTPTwoFA: React.FC<PartialProps> = ({ standalone = false }) => {
  const { user } = useAuth();
  const [show2FAModal, setShow2FAModal] = useState(false);

  // Code from user input
  const [verificationCode, setVerificationCode] = useState("");

  const { presentSuccessToast, presentDangerToast } = useToast();
  const [totpSecretKey, setTotpSecretKey] = useState<string>("");
  const [totpSecret, setTotpSecret] = useState<TotpSecret | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [secretDeadline, setSecretDeadline] = useState<number | null>(null);
  const [isSecretDeadlinePassed, setIsSecretDeadlinePassed] =
    useState<boolean>(false);
  const [secretTimeLeft, setSecretTimeLeft] = useState<number | null>(null);
  const history = useHistory();

  const isEnrollmentDeadlineExceeded = () => {
    if (!totpSecret) {
      console.log("isEnrollmentDeadlineExceeded: No TOTP secret found");
      setIsSecretDeadlinePassed(false);
      return false;
    }

    console.log("isEnrollmentDeadlineExceeded: TOTP secret found");

    const deadline = totpSecret.enrollmentCompletionDeadline;
    const currentTime = new Date().getTime();
    const currentTimeString = new Date().toUTCString();
    const deadlineTime = new Date(deadline).getTime();

    const isExceeded = currentTime > deadlineTime;
    const timeLeft = isExceeded ? 0 : deadlineTime - currentTime;
    setSecretTimeLeft(timeLeft);
    setIsSecretDeadlinePassed(isExceeded);

    console.log("deadline:", deadline);
    console.log("currentTimeString:", currentTimeString);
    console.log("currentTime:", currentTime);
    console.log("deadlineTime:", deadlineTime);
    console.log("isExceeded:", isExceeded);
    console.log("timeLeft:", timeLeft);
    return isExceeded;
  };

  const formatTimeLeft = (timeLeft: number): string => {
    const hours = Math.floor(timeLeft / 3600000);
    const minutes = Math.floor((timeLeft % 3600000) / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const handleSetup2FA = async () => {
    const totpSecret = await generateTotpSecret();
    await generateQRCode(totpSecret);
  };

  const generateTotpSecret = async (): Promise<TotpSecret | null> => {
    if (!user || !user.email) {
      console.log("No user or user email found");
      return null;
    }
    try {
      // Generate a TOTP secret.
      const multiFactorSession = await multiFactor(user).getSession();
      const totpSecret = await TotpMultiFactorGenerator.generateSecret(
        multiFactorSession
      );
      setTotpSecret(totpSecret);
      console.log("Set TotpSecret to:", totpSecret);
      console.log("Returning totpSecret:", totpSecret);
      return totpSecret;
    } catch (error: any) {
      console.log(error);
      if (
        error instanceof FirebaseError &&
          error.code === "auth/requires-recent-login"
      ) {
        try {
          console.log(`User needs to reauthenticate: ${error}`);
          setShow2FAModal(true);
          return null;
        } catch (reauthError) {
          presentDangerToast("Reauthentication failed. Please try again.");
          console.error("Error reauthenticating:", reauthError);
          return null;
        }
      } else {
        presentDangerToast("Failed to generate TOTP Secret. Please try again.");
        console.error("Error generating TOTP Secret:", error);
        return null;
      }
    }
  };

  const generateQRCode = async (newSecret: TotpSecret | null = null) => {
    if (!user || !user.email) {
      console.log("No user or user email found");
      return;
    }

    const secretToUse = newSecret ? newSecret : totpSecret;

    if (!secretToUse) {
      console.log("No TOTP secret found");
      return;
    }

    // Generate QR code URL
    const totpUri = secretToUse.generateQrCodeUrl(user.email, "FlashbackBot");
    console.log("Generated TOTP URI:", totpUri);
    const qrCodeUrl = await QRCode.toDataURL(totpUri);
    console.log("Generated QR Code URL:", qrCodeUrl);

    setQrCodeUrl(qrCodeUrl);

    // Also display this key:
    const secretKey = secretToUse.secretKey;
    setTotpSecretKey(secretKey);

    // Extract and log details from TOTP URI
    const url = new URL(totpUri);
    const issuer = url.searchParams.get("issuer");
    const label = url.pathname.split(":")[1];
    console.log("Secret Key:", secretKey);
    console.log("Issuer:", issuer);
    console.log("Label:", label);
  };

  const finalizeEnrollment = async () => {
    // Ask the user for a verification code from the authenticator app

    if (!totpSecret) {
      console.log("No TOTP secret found");
      return;
    }
    if (!user) {
      console.log("No user found");
      return;
    }
    if (isEnrollmentDeadlineExceeded()) {
      presentDangerToast("TOTP secret has expired. Generating a new one...");
      await handleSetup2FA();
      return;
    }

    try {
      const multiFactorAssertion =
        TotpMultiFactorGenerator.assertionForEnrollment(
          totpSecret,
          verificationCode
        );
      await multiFactor(user).enroll(multiFactorAssertion, "TOTP");
      presentSuccessToast("Congratulations, you have set up TOTP!");
      // Reload the page
      window.location.reload();
    } catch (error) {
      presentDangerToast(
        "Failed to finalize TOTP enrollment. Please try again."
      );
      console.error("Error finalizing TOTP enrollment:", error);
    }
  };

  useEffect(() => {
    console.log("show2FAModal changed:", show2FAModal);
  }, [show2FAModal]);

  // Check if deadline is passed
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("useEffect: Checking if enrollment deadline is passed.");
      isEnrollmentDeadlineExceeded();
    }, 10000);

    // If no secret found, start the process
    // This renders the cancel button useless, however …
    // It will prompt the user for password indefinitely
    // TODO: Think the UX over
    // if (!totpSecret) {
    //   handleSetup2FA();
    // }
    return () => clearInterval(interval);
  }, [totpSecret]);

  // Generate new secret when deadline is passed
  useEffect(() => {
    console.log("useEffect: isSecretDeadlinePassed:", isSecretDeadlinePassed);
    if (isSecretDeadlinePassed || !totpSecret) {
      handleSetup2FA();
    }
  }, [isSecretDeadlinePassed, totpSecret]);

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
            <IonCol size="2">
              {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code for TOTP" />}
            </IonCol>
            <IonCol>
              <IonText>
                <h2>Steps to enable one-time password 2Fa:</h2>
                <ol>
                  <li>
                    Scan the QR code with your authenticator app or enter the
                    Secret Key manually in your authenticator app.
                  </li>
                  <li>
                    Enter a verification code from your authenticator app and
                    click "Finalize Enrollment".
                  </li>
                </ol>
              </IonText>
              {secretTimeLeft !== null && (
                <IonText>
                  {secretTimeLeft !== null && (
                    <p>
                      Time left to complete enrollment:{" "}
                      {formatTimeLeft(secretTimeLeft)}
                    </p>
                  )}
                </IonText>
              )}
            </IonCol>
            <IonCol size="5">
              <TotpVerificationCode
                verificationCode={verificationCode}
                setVerificationCode={setVerificationCode}
              />
              <IonButton
                expand="block"
                onClick={finalizeEnrollment}
                disabled={!verificationCode}
              >
                Finalize Enrollment
              </IonButton>
              <div id="recaptcha-container"></div>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="2" style={{ textAlign: "center" }}>
              <IonText>Secret Key: {totpSecretKey}</IonText>
            </IonCol>
          </IonRow>
        </IonGrid>
        <TotpTwoFAModal
          show2FAModal={show2FAModal}
          setShow2FAModal={setShow2FAModal}
          generateTotpSecret={generateTotpSecret}
          generateQRCode={generateQRCode}
        />
      </IonContent>
    </>
  );

  if (standalone) {
    return <IonPage>{content}</IonPage>;
  }

  return <>{content}</>;
};

export default TOTPTwoFA;
