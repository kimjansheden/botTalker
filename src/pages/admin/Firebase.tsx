import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from "@ionic/react";
import React from "react";
import RecaptchaTest from "../RecaptchaTest";

const Firebase: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Firebase Admin Page</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <RecaptchaTest />
      </IonContent>
    </IonPage>
  );
};

export default Firebase;
