import React, { useState } from "react";
import { usePushesContext } from "../hooks/usePushesContext";
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import RawPushesDisplay from "../components/RawPushesDisplay";
import { deletePushByIden } from "../components/Helpers";
import useFetchPushes from "../hooks/useFetchPushes";
import { useAuth } from "../provider/AuthProvider";
import useToast from "../hooks/useToast";

export const DeletePosts: React.FC = () => {
  const { pbUserInfo, botPushes } = usePushesContext();
  const [pushIden, setPushIden] = useState("");
  const { pushBulletApiKey } = useAuth();
  const token = pushBulletApiKey;
  const { fetchDataAsync } = useFetchPushes();
  const { presentDangerToast, presentSuccessToast } = useToast();

  if (!token) {
    console.error("No PushBullet API key found in DeletePosts.");
    presentDangerToast(
      "No PushBullet API key found. Please make sure you have set the key in Bot Settings."
    );
    return null;
  }

  const handleDeleteAndRefresh = async () => {
    console.log("Deleting push with iden:", pushIden);
    await deletePushByIden(token, pushIden);
    fetchDataAsync(true);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Raw Pushes</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <RawPushesDisplay pbUserInfo={pbUserInfo} botPushes={botPushes} />
        <IonInput
          value={pushIden}
          placeholder="Enter push iden to delete"
          onIonChange={(e) => setPushIden(e.detail.value!)}
        />
        <IonButton onClick={handleDeleteAndRefresh}>Delete Push</IonButton>
      </IonContent>
    </IonPage>
  );
};
