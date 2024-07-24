import { IonButton, IonProgressBar, useIonToast } from "@ionic/react";
import { HandleResponseProps } from "../../common/types";
import { acceptAction, dontAnswerAction, rejectAction } from "./Helpers";
import { usePushesContext } from "../hooks/usePushesContext";
import { useState } from "react";
import { useAuth } from "../provider/AuthProvider";
import useToast from "../hooks/useToast";

export const HandleResponse: React.FC<HandleResponseProps> = ({
  actionId,
  isButtonDisabled,
  botPushes,
}) => {
  const { setButtonStates: setButtonDisabled } = usePushesContext();
  const [isLoading, setIsLoading] = useState(false);
  const { presentDangerToast, presentSuccessToast } = useToast();
  const { pushBulletApiKey } = useAuth();

  const token = pushBulletApiKey;

  if (!token) {
    console.error("No PushBullet API key found in HandleREsponse.");
    presentDangerToast(
      "No PushBullet API key found. Please make sure you have set the key in Bot Settings."
    );
    return null;
  }

  const handleAccept = async (
    actionId: string,
    botPushes: Record<string, any>,
    token: string
  ) => {
    setIsLoading(true);
    await acceptAction(actionId, botPushes, token, setButtonDisabled);
    console.log(
      `Accepting action ${actionId}. botPushes: ${JSON.stringify(
        botPushes,
        null,
        2
      )}. token: ${token}. setButtonDisabled: ${setButtonDisabled}`
    );
    console.log("Answer accepted.");
    setIsLoading(false);
    presentSuccessToast(
      "The answer has been accepted and sent to the bot for posting."
    );
  };
  const handleReject = async (
    actionId: string,
    botPushes: Record<string, any>,
    token: string
  ) => {
    setIsLoading(true);
    await rejectAction(actionId, botPushes, token, setButtonDisabled);
    console.log("Answer rejected.");
    setIsLoading(false);
    presentDangerToast(
      "The answer has been rejected and sent to the bot for regeneration."
    );
  };
  const handleDontAnswer = async (
    actionId: string,
    botPushes: Record<string, any>,
    token: string
  ) => {
    // Ask if the user is sure they want to skip answering this answer; this will permanently delete the message
    setIsLoading(true);
    await dontAnswerAction(actionId, botPushes, token, setButtonDisabled);
    console.log("Answer skipped.");
    setIsLoading(false);
    presentSuccessToast("The answer has been skipped.");
  };
  return (
    <div>
      <IonButton
        color="success"
        disabled={isButtonDisabled || isLoading}
        style={{
          opacity: isButtonDisabled || isLoading ? 0.5 : 1,
        }}
        onClick={() => handleAccept(actionId, botPushes, token)}
      >
        Approve
      </IonButton>
      <IonButton
        color="danger"
        disabled={isButtonDisabled || isLoading}
        style={{
          opacity: isButtonDisabled || isLoading ? 0.5 : 1,
        }}
        onClick={() => handleReject(actionId, botPushes, token)}
      >
        Reject
      </IonButton>
      <IonButton
        color="medium"
        disabled={isButtonDisabled || isLoading}
        style={{
          opacity: isButtonDisabled || isLoading ? 0.5 : 1,
        }}
        onClick={() => handleDontAnswer(actionId, botPushes, token)}
      >
        Skip
      </IonButton>
      {isLoading && <IonProgressBar type="indeterminate" color="success" />}
    </div>
  );
};
