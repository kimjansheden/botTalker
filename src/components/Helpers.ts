import { IonToast } from "@ionic/react";
import {
  ButtonStates,
  ParsedData,
  ParsedDataArray,
  PendingAnswers,
  Post,
  Push,
  VisibleContentState,
} from "../../common/types";
import { PUSHBULLET_PUSHES } from "../components/PbConfig";
import { knownKeys } from "../config/PushesKeys";

/**
 * Parses the provided answers data to extract relevant information from each push's body.
 *
 * This function iterates over each push in the provided data, identifying and parsing
 * distinct action blocks within the push body. Each action block is processed to extract
 * key-value pairs, forming a structured representation of the data. The function ensures
 * that action blocks with duplicate action IDs are processed only once. Action blocks
 * that do not strictly start with 'Action ID: [number]\n' are filtered out to maintain
 * data consistency.
 *
 * @param {Record<string, any>} answersData - The data containing pushes to be parsed.
 * Each push should have a body that contains one or more action blocks.
 * @param {React.Dispatch<React.SetStateAction<ButtonStates>>} [setButtonStates] -
 * An optional function to update initial button states based on action IDs. This is useful
 * for managing UI states in response to data parsing.
 *
 * @returns {ParsedDataArray} An array of objects where each object represents
 * parsed data for an action block. Each object contains key-value pairs extracted from the action block.
 *
 * @example
 *
 * const sampleData = {
 *   pushes: [
 *     { body: "Action ID: 123\nKey1: Value1\nKey2: Value2" },
 *     { body: "Action ID: 456\nKeyA: ValueA\nKeyB: ValueB" }
 *   ]
 * };
 *
 * const parsed = parsePushes(sampleData);
 * // Outputs:
 * // [
 * //   { "Action ID": "123", "Key1": "Value1", "Key2": "Value2" },
 * //   { "Action ID": "456", "KeyA": "ValueA", "KeyB": "ValueB" }
 * // ]
 */
export const parsePushes = (
  answersData: Record<string, any>,
  setButtonStates?: React.Dispatch<
    React.SetStateAction<ButtonStates>
  >
): ParsedDataArray => {
  // Initialize an array to store the parsed data for all pushes
  const parsedDataArray: ParsedDataArray = [];

  // Initialize a Set to keep track of processed Action IDs
  const processedActionIDs = new Set<string>();

  // Loop through each push and parse its body
  answersData?.pushes?.forEach((push: any) => {
    const body = push.body;

    // Search the 'body' string for all occurrences of text that starts with "Action ID: ".
    // It uses a regular expression to match any sequence starting with "Action ID: " and continues until
    // it encounters another "Action ID: " or reaches the end of the string. The pattern uses a lazy match
    // ('[\s\S]+?') to ensure it stops at the earliest instance of the next "Action ID: " or the string's end.
    // If no matches are found, an empty array is returned instead of null.
    const actionBlocks =
      body.match(/Action ID: [\s\S]+?(?=Action ID:|$)/g) || [];

    actionBlocks.forEach((actionBlock: string) => {
      // Skip if push has anything more than "Action ID: [number]\n"
      if (!/^Action ID: \d+\n/.test(actionBlock)) return;

      const lines = actionBlock.split("\n");

      // Extract the action ID from the first line
      const actionIdMatch = RegExp(/Action ID: (\w+)/).exec(lines[0]);
      if (!actionIdMatch) return;
      const actionId = actionIdMatch[1];

      // Skip this action if its ID has already been processed
      if (processedActionIDs.has(actionId)) {
        return;
      }

      // Mark this action ID as processed
      processedActionIDs.add(actionId);

      const parsedData: ParsedData = {};
      parsedData["Action ID"] = actionId;

      if (setButtonStates) {
        // If the user has responsed to this action ID, we set the button state to "done"
        if (actionIsHandled(answersData, actionId)) {
          console.log(`Action ID ${actionId} is handled and will be set to 'done'`)
          setButtonStates((prevStates) => ({
            ...prevStates,
            [actionId]: "done",
          }));
        } else {
          console.log(`Action ID ${actionId} is not handled yet`)

          // If the user has not yet responded, we give the button an initial state of "pending"
          setButtonStates((prevStates) => ({
            ...prevStates,
            [actionId]: "pending",
          }));
        }
      }

      let currentKey = "";
      let currentValue = "";

      lines.slice(1).forEach((line: string) => {
        const potentialKey = line.split(": ")[0]; // Extract the potential key from the line
        if (knownKeys.includes(potentialKey)) {
          // Check if the potential key is in the list of known keys
          // If a previous key-value pair was being processed, store it before starting a new one
          if (currentKey && currentValue) {
            parsedData[currentKey] = currentValue.trim();
          }

          // Start processing a new key-value pair
          currentKey = potentialKey;
          currentValue = line.substring(line.indexOf(": ") + 2); // Extract the value part of the line
        } else {
          // If the line is not starting a new key-value pair, append it to the current value
          currentValue += (currentValue ? "\n" : "") + line;
        }
      });

      // After processing all lines, store the last key-value pair
      if (currentKey && currentValue) {
        parsedData[currentKey] = currentValue.trim();
      }

      // Add the parsed data for this action block to the array
      parsedDataArray.push(parsedData);
    });
  });
  return parsedDataArray;
};

/**
 * Toggles the visibility of a content type for a given action ID within the state.
 * If the content type is already visible, it removes it, otherwise, it adds it.
 *
 * @param {string} actionId - The ID associated with the action to toggle content visibility for.
 * @param {string} contentType - The type of content to be toggled visible and invisible.
 * @param {React.Dispatch<React.SetStateAction<VisibleContentState>>} setVisibleContent - The state dispatch function to update the visibility of content (the state).
 */
export const togglePost = (
  actionId: string,
  contentType: string,
  setVisibleContent: React.Dispatch<React.SetStateAction<VisibleContentState>>
) => {
  // The function receives the current state as an argument, and returns a new state.
  setVisibleContent((prevState) => {
    // Using a Set to keep track of currently visible content types for the given action ID
    const currentVisibleTypes = new Set(prevState[actionId] || []);

    // Check if the content type is already visible
    if (currentVisibleTypes.has(contentType)) {
      // If it is, remove it from the set
      currentVisibleTypes.delete(contentType);
    } else {
      // If it is not, add it to the set
      currentVisibleTypes.add(contentType);
    }
    // Return the new state with the updated visibility for the given action ID
    return { ...prevState, [actionId]: [...currentVisibleTypes] };
  });
};

export const deletePushByIden = async (token: string, iden: string) => {
  try {
    const response = await fetch(
      `https://api.pushbullet.com/v2/pushes/${iden}`,
      {
        method: "DELETE",
        headers: {
          "Access-Token": token,
        },
      }
    );
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    console.log("Push deleted.");
  } catch (error) {
    console.error("Error deleting push:", error);
  }
};

/**
 * Sends a response to the bot via Pushbullet's API. It checks if a push with the specified
 * action ID already exists with either an 'Accept' or 'Reject' response to prevent duplicates.
 *
 * This will delete the current push and create a new one with the appropriate title and the up-to-date Generated Answer.
 * @async
 * @function sendResponseToBot
 * @param {string} actionId - The unique identifier for the action to respond to.
 * @param {string} responseTitle - The response to send, expected to be 'Accept' or 'Reject'.
 * @param {Record<string, any>} botPushes - An object containing the pending answers from the bot.
 * @param {string} token - The Pushbullet API access token.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const sendResponseToBot = async (
  actionId: string,
  responseTitle: string,
  botPushes: Record<string, any>,
  token: string
): Promise<void> => {
  // Find if the actionId already has a push with 'Accept' or 'Reject'.
  console.log("botPushes:", botPushes);
  console.log("Action ID:", actionId);

  // Check if the push with this Action ID has already been accepted or rejeted
  const pushIsHandled = actionIsHandled(botPushes, actionId);
  const iden = getIden(botPushes, actionId);

  console.log("existingPush:", pushIsHandled);

  // If the push has not already been accepted, rejected or skipped, we send it to the bot with our answer and the current Generated Answer
  if (!pushIsHandled) {
    try {
      // Find the existing push
      const push = botPushes.pushes.find(
        (p: { iden: string }) => p.iden === iden
      );
      if (push) {
        // Get the current body and title
        let pushBody = push.body;
        console.log("Current body:", pushBody);
        const fetchResponse = await fetch(`${PUSHBULLET_PUSHES}`, {
          method: "POST",
          headers: {
            "Access-Token": token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "note",
            title: responseTitle,
            body: pushBody,
          }),
        });
        if (!fetchResponse.ok) {
          const errorResponse = await fetchResponse.json(); // Läser svaret som JSON
          throw new Error(
            `Network response was not ok: ${fetchResponse.status} ${
              fetchResponse.statusText
            }, Details: ${JSON.stringify(errorResponse)}`
          );
        }
      } else {
        console.log("Push not found");
        IonToast({
          message: "Push not found",
          duration: 2000,
          color: "danger",
          position: "top",
        });
      }
    } catch (error) {
      console.error(
        "There has been a problem with your fetch operation:",
        error
      );
    }

    // Delete the old push
    if (iden) {
      deletePushByIden(token, iden);
    }
  }
};

/**
 * Asynchronously triggers an 'Accept' response to be sent to the bot for a specific action.
 * It wraps the `sendResponseToBot` call in a try/catch to handle any asynchronous errors.
 * @async
 * @function acceptAction
 * @param {string} actionId - The unique identifier for the action to accept.
 * @param {PendingAnswers} botPushes - An object containing the pending answers from the bot.
 * @param {string} token - The Pushbullet API access token.
 * @param {React.Dispatch<React.SetStateAction<ButtonStates>>} setButtonDisabled - The state dispatch function to update the button's disabled status.
 * @returns {Promise<void>} - A promise that resolves when the 'Accept' operation is complete.
 */
export const acceptAction = async (
  actionId: string,
  botPushes: PendingAnswers,
  token: string,
  setButtonDisabled: React.Dispatch<React.SetStateAction<ButtonStates>>
): Promise<void> => {
  try {
    await sendResponseToBot(actionId, "Accept", botPushes, token);
    // Update state to "done" when the accept is successful
    setButtonDisabled((prevState) => ({ ...prevState, [actionId]: "done" }));

    // Read existing accepted ids from localStorage
    const currentAcceptedIds = localStorage.getItem("acceptedPosts");

    // Parse the existing ids, or initialize an empty array if none exist
    const acceptedIdsArray = currentAcceptedIds ? JSON.parse(currentAcceptedIds) : [];

    // Add the new actionId to the array
    acceptedIdsArray.push(actionId);

    // Save the updated array back to localStorage
    localStorage.setItem("acceptedPosts", JSON.stringify(acceptedIdsArray));
  } catch (error) {
    console.error("Failed to accept action:", error);
    // If an error occurs, update the state to 'failed'
    setButtonDisabled((prevState) => ({ ...prevState, [actionId]: "failed" }));
  }
};

/**
 * Asynchronously triggers a 'Reject' response to be sent to the bot for a specific action.
 * It wraps the `sendResponseToBot` call in a try/catch to handle any asynchronous errors.
 *
 * @async
 * @function rejectAction
 * @param {string} actionId - The unique identifier for the action to reject.
 * @param {PendingAnswers} botPushes - An object containing the pending answers from the bot.
 * @param {string} token - The Pushbullet API access token.
 * @param {React.Dispatch<React.SetStateAction<ButtonStates>>} setButtonDisabled - The state dispatch function to update the button's disabled status.
 * @returns {Promise<void>} - A promise that resolves when the 'Reject' operation is complete.
 */
export const rejectAction = async (
  actionId: string,
  botPushes: PendingAnswers,
  token: string,
  setButtonDisabled: React.Dispatch<React.SetStateAction<ButtonStates>>
): Promise<void> => {
  try {
    await sendResponseToBot(actionId, "Reject", botPushes, token);
    // Update the state to 'done' when the rejection is successful
    setButtonDisabled((prevState) => ({ ...prevState, [actionId]: "done" }));
  } catch (error) {
    console.error("Failed to reject action:", error);
    // If an error occurs, update the state to 'failed'
    setButtonDisabled((prevState) => ({ ...prevState, [actionId]: "failed" }));
  }
};

/**
 * Asynchronously triggers a 'Skip' response to be sent to the bot for a specific action.
 * It wraps the `sendResponseToBot` call in a try/catch to handle any asynchronous errors.
 *
 * @async
 * @function skipAction
 * @param {string} actionId - The unique identifier for the action to skip.
 * @param {PendingAnswers} botPushes - An object containing the pending answers from the bot.
 * @param {string} token - The Pushbullet API access token.
 * @param {React.Dispatch<React.SetStateAction<ButtonStates>>} setButtonDisabled - The state dispatch function to update the button's disabled status.
 * @returns {Promise<void>} - A promise that resolves when the 'Skip' operation is complete.
 */
export const dontAnswerAction = async (
  actionId: string,
  botPushes: PendingAnswers,
  token: string,
  setButtonDisabled: React.Dispatch<React.SetStateAction<ButtonStates>>
): Promise<void> => {
  try {
    await sendResponseToBot(actionId, "Skip", botPushes, token);
    // Update the state to 'done' when the answer is successful
    setButtonDisabled((prevState) => ({ ...prevState, [actionId]: "done" }));
  } catch (error) {
    console.error("Failed to reject action:", error);
    // If an error occurs, update the state to 'failed'
    setButtonDisabled((prevState) => ({ ...prevState, [actionId]: "failed" }));
  }
};

/**
 * Checks if an action has already been handled based on the provided bot pushes.
 *
 * This function iterates through the `pushes` array within the `botPushes` dictionary to determine
 * if any push notification contains the specified `actionId` in its body and has a title of
 * "Accept", "Reject", or "Skip".
 *
 * @param {Record<string, any>} botPushes - A dictionary containing push notifications. The key "pushes"
 * should map to an array of push notification objects.
 * @param {string} actionId - The action ID to check for within the push notifications.
 * @returns {boolean} - Returns true if a matching push notification is found, otherwise false.
 */
const actionIsHandled = (
  botPushes: Record<string, any>,
  actionId: string
): boolean => {
  console.log("checkExistingPushes, botPushes:", botPushes);
  console.log("checkExistingPushes, botPushes['pushes']:", botPushes["pushes"]);
  console.log("checkExistingPushes, actionId:", actionId);
  const pushes: Push[] = botPushes["pushes"];
  // botPushes is a dictionary
  // botPushes["pushes"] is an array of dictionaries
  return pushes.some((push) => {
    const matches =
      (push.title === "Accept" ||
        push.title === "Reject" ||
        push.title === "Skip") &&
      push.body.includes(`Action ID: ${actionId}`);
    console.log(`Checking push: ${push.body}, Matches: ${matches}`);
    return matches;
  });
};

export const getActionId = (from: Push): number => {
  const actionIdRegex = /Action ID: (\w+)/;
  const match = from.body.match(actionIdRegex);
  return match ? parseInt(match[1], 10) : -1;
};

const getIden = (botPushes: Record<string, any>, actionId: string) => {
  console.log("getIden, botPushes:", botPushes);
  console.log("getIden, botPushes['pushes']:", botPushes["pushes"]);
  console.log("getIden, actionId:", actionId);
  const pushes: Push[] = botPushes["pushes"];
  // botPushes is a dictionary
  // pushes (i.e. botPushes["pushes"]) is an array of dictionaries
  for (const push of pushes) {
    const matches = push.body.includes(`Action ID: ${actionId}`);
    console.log(`Checking push: ${push.body}, Matches: ${matches}`);
    if (matches) {
      return push.iden;
    }
  }
  return null;
};

/**
 * Updates the 'Generated Answer' in the push's body and sends the updated push to the bot.
 *
 * @async
 * @function updateGeneratedAnswer
 * @param {string} actionId - The unique identifier for the action to respond to.
 * @param {string} newGeneratedAnswer - The new generated answer to update in the push's body.
 * @param {Record<string, any>} botPushes - An object containing the pending answers from the bot.
 * @param {string} token - The Pushbullet API access token.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
export const updateGeneratedAnswer = async (
  actionId: string,
  newGeneratedAnswer: string,
  botPushes: Record<string, any>,
  token: string
): Promise<void> => {
  // Find the push that matches the actionId
  const iden = getIden(botPushes, actionId);

  if (iden) {
    // Find the existing push
    const push = botPushes.pushes.find(
      (p: { iden: string }) => p.iden === iden
    );
    if (push) {
      // Get the current body and title
      let pushBody = push.body;
      let title = push.title;
      console.log("Current body:", pushBody);
      console.log("Current title:", title);

      // Update 'Generated Answer'
      const updatedPushBody = pushBody.replace(
        /Generated Answer: .*/,
        `Generated Answer: ${newGeneratedAnswer}`
      );
      console.log("Updated body:", updatedPushBody);

      // Send the update as a new push via Pushbullet API
      try {
        const fetchResponse = await fetch(PUSHBULLET_PUSHES, {
          method: "POST",
          headers: {
            "Access-Token": token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "note",
            title: title,
            body: updatedPushBody,
          }),
        });

        if (!fetchResponse.ok) {
          const errorResponse = await fetchResponse.json();
          throw new Error(
            `Network response was not ok: ${fetchResponse.status} ${
              fetchResponse.statusText
            }, Details: ${JSON.stringify(errorResponse)}`
          );
        }
      } catch (error) {
        console.error(
          "There has been a problem with your fetch operation:",
          error
        );
      }

      // Delete the old push
      deletePushByIden(token, iden);
      console.log("The answer has been edited.");
    } else {
      console.error("Push not found for iden:", iden);
    }
  } else {
    console.error("Iden not found for actionId:", actionId);
  }
};
