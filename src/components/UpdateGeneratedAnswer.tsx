import { IonButton, IonProgressBar, useIonToast } from "@ionic/react";
import { updateGeneratedAnswer } from "./Helpers";
import { UpdateGeneratedAnswerProps } from "../../common/types";
import useFetchPushes from "../hooks/useFetchPushes";
import { useState } from "react";

/**
 * Saves the edited content.
 *
 * @async
 * @function updateGeneratedAnswer
 * @param {string} actionId - The unique identifier for the action to respond to.
 * @param {string} newGeneratedAnswer - The new generated answer to save.
 * @param {Record<string, any>} botPushes - An object containing the pending answers from the bot.
 * @param {string} token - The Pushbullet API access token.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
export const UpdateGeneratedAnswer: React.FC<UpdateGeneratedAnswerProps> = ({
  actionId,
  newGeneratedAnswer,
  botPushes,
  token,
}) => {
  const [presentToast] = useIonToast();
  const { fetchDataAsync } = useFetchPushes();
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (actionId: string, newGeneratedAnswer: string) => {
    setIsLoading(true);
    console.log(
      "Saving the edited Generated Answer: ",
      actionId,
      newGeneratedAnswer
    );
    await updateGeneratedAnswer(actionId, newGeneratedAnswer, botPushes, token);

    // Fetch the updated pushes
    await fetchDataAsync(true);

    setIsLoading(false);

    presentToast({
      message: "The answer has been edited.",
      duration: 5000,
      color: "success",
      position: "middle",
      cssClass: "toast",
    });
  };
  return (
    <div>
      <IonButton onClick={() => handleSave(actionId, newGeneratedAnswer)}>
        Save
      </IonButton>
      {isLoading && <IonProgressBar type="indeterminate" color="success" />}
    </div>
  );
};

export default UpdateGeneratedAnswer;
