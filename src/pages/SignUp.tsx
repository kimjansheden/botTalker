import React, { useRef, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import {
  MultiFactorError,
  MultiFactorResolver,
  PhoneAuthProvider,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  deleteUser,
  getMultiFactorResolver,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, db } from "../config/FirebaseConfig";
import { useAuth } from "../provider/AuthProvider";
import {
  IonPage,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonInput,
  IonButton,
} from "@ionic/react";
import useToast from "../hooks/useToast";
import { Timestamp, addDoc, collection, doc, setDoc } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { BotSettings, PartialProps, Post } from "../../common/types";
import SmsTwoFAModal from "../components/SmsTwoFAModal";
import Demo from "./demo/Demo";
import ChooseTwoFAModal from "../components/modals/ChooseTwoFAModal";
import TotpTwoFASignInModal from "../components/TotpTwoFASignInModal";
import BackgroundVideo from "../components/ui/BackgroundVideo";

const SignUp: React.FC<PartialProps> = ({ standalone = false }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { user, loading } = useAuth();
  const { presentSuccessToast, presentDangerToast } = useToast();
  const history = useHistory();
  const location = useLocation();
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const [showSMS2FAModal, setShowSMS2FAModal] = useState(false);
  const [showChooseFAModal, setShowChooseFAModal] = useState(false);
  const [showTOTP2FAModal, setShowTOTP2FAModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [multiFactorResolver, setMultiFactorResolver] =
    useState<MultiFactorResolver | null>(null);

  console.log("Rendering SignUp.tsx …");

  const setupReCaptchaVerifier = async () => {
    console.log("Setting up reCAPTCHA verifier...");
    auth.useDeviceLanguage();
    console.log("auth.languageCode:", auth.languageCode);
    if (recaptchaVerifierRef.current) {
      console.log("recaptchaVerifier already exists");
      return recaptchaVerifierRef.current;
    }
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

    recaptchaVerifierRef.current = recaptchaVerifier;
    return recaptchaVerifier;
  };

  const handleSignUp = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const userId = userCredential.user.uid;
      console.log("User registered with ID:", userId);

      // Send email verification
      await sendEmailVerification(userCredential.user);
      presentSuccessToast("Verification email sent. Please check your inbox.");

      // Create a new document in Firestore for the user with their UID as document ID
      const userDocRef = doc(db, "postHistory", userId);

      const botSettings: BotSettings = {
        minimum_new_tokens: 75,
        temperature: 0.5,
        do_sample: true,
        top_k: 40,
        top_p: 0.7,
        repetition_penalty: 2.0,
        no_repeat_ngram_size: 2,
        model_path: "",
        max_tokens: 256,
        reward_tokens: [],
        special_tokens: [],
      };
      const userDocData = {
        userId,
        pushBulletApiKey: "",
        botSettings: botSettings,
        lastPostTimestamp: Timestamp.fromMillis(0),
      };
      console.log("User doc:", userDocData);
      console.log("Trying to create UID document with path:", userDocRef.path);
      await setDoc(userDocRef, userDocData);
      console.log(`User Doc created with path ${userDocRef.path}`);

      // Create a sub-collection "posts" with an initial dummy document
      // We need to create a dummy document because Firestore requires a document to exist before we can create a sub-collection
      const postsCollectionRef = collection(db, `postHistory/${userId}/posts`);
      const dummyPost: Post = {
        action_id: 0,
        original_post: {
          unique_id: 0,
          username: "XXXXX",
          quote: {
            quoted_user: "The Quoted User",
            quoted_post: ["The Quoted Post"],
          },
          post: "The Original Post",
        },
        generated_answer: "The Bot's Generated Answer.",
        original_post_id: 0,
        time_of_post: Timestamp.now(),
        status: "posted",
      };
      console.log("Dummy post:", dummyPost);
      const dummyPostRef = await addDoc(postsCollectionRef, dummyPost);
      console.log(`Dummy post created with path ${dummyPostRef.path}`);

      presentSuccessToast("User registered!");

      // Log out the user to force email verification
      await signOut(auth);
      history.push("/login");
    } catch (error) {
      setError((error as Error).message);
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "auth/email-already-in-use":
            presentDangerToast("Email already in use.");
            break;
          case "auth/invalid-email":
            presentDangerToast("Invalid email.");
            break;
          case "auth/weak-password":
            // Parse the error.message to only get the part between "Firebase: " and "("
            const errorMessage = error.message.substring(
              error.message.indexOf("Firebase: ") + "Firebase: ".length,
              error.message.indexOf("(")
            );
            presentDangerToast(`${errorMessage}.`);
            break;
          // Add more cases as needed
          default:
            presentDangerToast("Registration failed. Please try again.");
        }
      } else {
        presentDangerToast("An unexpected error occurred. Please try again.");
      }
      console.error("Signup error", error);

      // Delete the user if an error has occured
      if (user) {
        await deleteUser(user);
      }
    }
  };

  const handleSignIn = async () => {
    try {
      console.log("Signing in ...");
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("User logged in with ID:", userCredential.user.uid);
      if (!userCredential.user.emailVerified) {
        presentDangerToast(
          "Email not verified. Please verify your email before logging in."
        );
        await signOut(auth);
        return;
      }

      presentSuccessToast("You have been logged in!");

      // If current page is /login, navigate to /start
      if (location.pathname === "/login") {
        history.push("/start");
      }
    } catch (error) {
      setError((error as Error).message);
      if (error instanceof FirebaseError) {
        if (error.code === "auth/multi-factor-auth-required") {
          console.error("Multi-factor authentication required:", error);
          const resolver = getMultiFactorResolver(
            auth,
            error as MultiFactorError
          );
          const enrolledFactors = resolver.hints.map(
            (info) => info.displayName
          );
          console.log("Enrolled factors:", enrolledFactors);
          setMultiFactorResolver(resolver);
          setShowChooseFAModal(true);
          return;
        }
        switch (error.code) {
          case "auth/invalid-credential":
            presentDangerToast(
              "Invalid credentials. Please check your email and password."
            );
            break;
          case "auth/user-not-found":
            presentDangerToast("No user found with this email.");
            break;
          case "auth/wrong-password":
            presentDangerToast("Incorrect password. Please try again.");
            break;
          // Add more cases as needed
          default:
            presentDangerToast("Login failed. Please try again.");
        }
      } else {
        presentDangerToast("An unexpected error occurred. Please try again.");
      }
      console.error("Login error", error);
    }
  };

  const handleTOTPVerification = async () => {
    setShowTOTP2FAModal(true);
  };

  const handleSMSVerification = async () => {
    if (!multiFactorResolver) {
      console.log("handleSMSVerification: No multiFactorResolver");
      return;
    }
    const phoneInfoOptions = {
      multiFactorHint: multiFactorResolver.hints.find(
        (hint) => hint.factorId === "phone"
      ),
      session: multiFactorResolver.session,
    };
    const phoneAuthProvider = new PhoneAuthProvider(auth);

    try {
      let recaptchaVerifier: RecaptchaVerifier | null;
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifier = await setupReCaptchaVerifier();
      } else {
        recaptchaVerifier = recaptchaVerifierRef.current;
      }

      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions,
        recaptchaVerifier
      );
      setVerificationId(verificationId);
      setShowSMS2FAModal(true);
    } catch (smsError) {
      presentDangerToast("Failed to send SMS for 2FA. Please try again.");
      console.error("Error sending SMS for 2FA:", smsError);
    }
  };

  console.log("user:", user);
  console.log("loading:", loading);

  const content = (
    <>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            <IonCol>
              <IonItem>
                <IonInput
                  label="Email"
                  labelPlacement="floating"
                  type="email"
                  placeholder="Enter email"
                  autocomplete="email"
                  value={email}
                  onIonInput={(e) => setEmail(e.detail.value!)}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label="Password"
                  labelPlacement="floating"
                  type="password"
                  autocomplete="new-password"
                  placeholder="Enter password"
                  value={password}
                  onIonInput={(e) => setPassword(e.detail.value!)}
                />
              </IonItem>
              {/* {error && <IonText color="danger">{error}</IonText>} */}
              <IonGrid>
                <IonRow>
                  <IonCol>
                    <IonButton
                      expand="block"
                      color="primary"
                      onClick={handleSignUp}
                      id="sign-up-button"
                    >
                      Sign Up
                    </IonButton>
                  </IonCol>
                  <IonCol>
                    <IonButton
                      expand="block"
                      color="secondary"
                      onClick={handleSignIn}
                    >
                      Sign In
                    </IonButton>
                  </IonCol>
                </IonRow>
              </IonGrid>
              <div id="recaptcha-container"></div>
            </IonCol>
          </IonRow>
        </IonGrid>
        <SmsTwoFAModal
          show2FAModal={showSMS2FAModal}
          setShow2FAModal={setShowSMS2FAModal}
          verificationId={verificationId}
          verificationCode={verificationCode}
          setVerificationCode={setVerificationCode}
          multiFactorResolver={multiFactorResolver}
        />
        <ChooseTwoFAModal
          show2FAModal={showChooseFAModal}
          setShow2FAModal={setShowChooseFAModal}
          handleSMSVerification={handleSMSVerification}
          handleTOTPVerification={handleTOTPVerification}
          multiFactorResolver={multiFactorResolver}
        />
        <TotpTwoFASignInModal
          show2FAModal={showTOTP2FAModal}
          setShow2FAModal={setShowTOTP2FAModal}
          verificationCode={verificationCode}
          setVerificationCode={setVerificationCode}
          multiFactorResolver={multiFactorResolver}
        />
        <Demo />
      </IonContent>
    </>
  );

  if (standalone) {
    return (
      <IonPage>
        <IonToolbar>
          <IonTitle data-testid="sign-up-title">Sign Up</IonTitle>
        </IonToolbar>
        {content}
      </IonPage>
    );
  }

  return <>{content}</>;
};

export default SignUp;
