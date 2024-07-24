import React, { useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonText,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonInput,
  IonButton,
} from "@ionic/react";
import { useHistory, useLocation } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../config/FirebaseConfig";
import { useAuth } from "../provider/AuthProvider";
import useToast from "../hooks/useToast";

const PushbulletGuide: React.FC = () => {
  const { user } = useAuth();
  const { presentSuccessToast, presentDangerToast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const history = useHistory();
  const location = useLocation();
  const handleSaveApiKey = async (newApiKey: string) => {
    if (!user) {
      presentDangerToast("You must be logged in to add a Pushbullet API key.");
      return;
    }
    try {
      const userDocRef = doc(db, "postHistory", user.uid);
      await updateDoc(userDocRef, {
        pushBulletApiKey: newApiKey,
      });
      localStorage.setItem(
        `pushBulletApiKey-${user.uid}`,
        newApiKey
      );
      presentSuccessToast("Pushbullet API key saved successfully.");

      // Navigate back to settings if the user is not already there
      if (location.pathname !== "/settings") {
        console.log("Navigating back to settings");
        history.push("/settings");
      }
    } catch (error) {
      console.error("Error adding post: ", error);
      presentDangerToast("Failed to save Pushbullet API key.");
    }
  };
  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Pushbullet API Key Guide</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Step 1: Sign Up or Log In</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonText>
            <p>
              1. Go to{" "}
              <a
                href="https://www.pushbullet.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Pushbullet
              </a>
              .
            </p>
            <p>
              2. Click on "Sign Up" if you don't have an account, otherwise
              click on "Log In".
            </p>
            <p>
              3. Sign up with your email, Google account, or Facebook account.
            </p>
            <p>4. Follow the instructions to complete the registration.</p>
          </IonText>
        </IonCardContent>
      </IonCard>

      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Step 2: Navigate to Settings</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonText>
            <p>
              1. Once logged in, click on your profile picture or name at the
              top right.
            </p>
            <p>2. In the dropdown menu, select "Account Settings".</p>
          </IonText>
        </IonCardContent>
      </IonCard>

      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Step 3: Create an Access Key (API Key)</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonText>
            <p>
              1. On the account settings page, scroll down to the "Access
              Tokens" section.
            </p>
            <p>2. Click on "Create Access Token".</p>
            <p>
              3. Copy the generated access token (API key). This will be used to
              authenticate your API calls.
            </p>
          </IonText>
        </IonCardContent>
      </IonCard>

      <IonCard>
        <IonCardHeader>
          <IonCardTitle>
            Step 4: Paste your access token (API key) here
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonText>
            <p>
              1. In the input field below, paste your access token (API key).
            </p>
            <p>2. Press "Save Changes" to save your API key for future use.</p>
          </IonText>
          <IonText color="danger">
            <p>
              Warning: Do not share your API key with anyone else. Anyone with
              access to your API key will have full control over your Pushbullet
              account.
            </p>
          </IonText>
          <IonInput
            value={""}
            placeholder="Paste your Pushbullet API key here"
            onIonChange={(e) => setApiKey(e.detail.value!)}
          />
          <IonButton
            expand="block"
            color="primary"
            onClick={() => handleSaveApiKey(apiKey)}
          >
            Save Changes
          </IonButton>
        </IonCardContent>
      </IonCard>

      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Resources and Links</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonText>
            <p>
              If you want more information or need further assistance, you can
              visit the following links:
            </p>
            <ul>
              <li>
                <a
                  href="https://docs.pushbullet.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Pushbullet API Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://help.pushbullet.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Pushbullet Help Center
                </a>
              </li>
            </ul>
            <p>
              This guide should help you create a Pushbullet API key
              effectively. If you encounter any issues or have questions, do not
              hesitate to contact Pushbullet support or consult their
              documentation.
            </p>
          </IonText>
        </IonCardContent>
      </IonCard>
    </>
  );
};

export default PushbulletGuide;
