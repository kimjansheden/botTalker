import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import React, { Suspense, useEffect, useState } from "react";
import useFetchPushes from "../hooks/useFetchPushes";
import SignUp from "./SignUp";
import BotSettings from "./BotSettings";
import { useAuth } from "../provider/AuthProvider";
import BackgroundVideo from "../components/ui/BackgroundVideo";
import "../themes/css/Start.css";

const Start: React.FC = () => {
  const { user, loading: authLoading, pushBulletApiKey } = useAuth();
  const { isLoadingPushes, fetchDataAsync, numNewAnswers } = useFetchPushes();
  const [loadingPushes, setLoadingPushes] = useState(false);

  const loadPushes = async () => {
    if (!user) {
      console.log("User is not authenticated, skipping loadPushes");
      return;
    }

    setLoadingPushes(true);
    console.log("Start Component Loading pushes");
    await fetchDataAsync(true);
    setLoadingPushes(false);
  };

  useEffect(() => {
    console.log("useEffect triggered");
    loadPushes();
  }, [user, pushBulletApiKey]);

  console.log("authLoading:", authLoading);
  console.log("isLoadingPushes:", isLoadingPushes);
  console.log("loadingPushes:", loadingPushes);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Home</IonTitle>
        </IonToolbar>
      </IonHeader>
      {user ? (
        <IonContent className="ion-padding">
          <div className="flex">
            <h1>
              The bot has answered{" "}
              {isLoadingPushes || loadingPushes ? (
                <IonSpinner />
              ) : (
                numNewAnswers
              )}{" "}
              new posts
            </h1>
            <IonButton routerLink="/readposts">
              Read And Act Upon The Answers
            </IonButton>
            <Suspense fallback={<IonSpinner />}>
              <BotSettings />
            </Suspense>
          </div>
        </IonContent>
      ) : (
        <>
          <BackgroundVideo />
          <SignUp />
        </>
      )}
    </IonPage>
  );
};

export default Start;
