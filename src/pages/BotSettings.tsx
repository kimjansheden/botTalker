import React, { useCallback, useEffect, useState } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../config/FirebaseConfig";
import { useAuth } from "../provider/AuthProvider";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonText,
  IonLoading,
  IonToast,
  IonInput,
  IonItem,
  IonButton,
  useIonViewDidEnter,
  IonList,
  IonToggle,
  IonButtons,
  IonIcon,
} from "@ionic/react";
import {
  BotSettings as BotSettingsInterface,
  PartialProps,
} from "../../common/types";
import PushbulletGuide from "./PushbulletGuide";
import useToast from "../hooks/useToast";
import useDocumentVisibility from "../hooks/useDocumentVisibility";
import { Location } from "history";
import "../themes/css/BotSettings.css";
import TooltipInfo, { settingDescriptions } from "../components/TooltipInfo";
import { removeCircleOutline } from "ionicons/icons";

const defaultBotSettings: BotSettingsInterface = {
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

const BotSettings: React.FC<PartialProps> = ({ standalone = false }) => {
  const { user, loading: authLoading } = useAuth();

  // botSettings is the latest saved bot settings.
  const [botSettings, setBotSettings] = useState<BotSettingsInterface | null>(
    null
  );
  const [newBotSettings, setNewBotSettings] =
    useState<BotSettingsInterface | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const history = useHistory();
  const isDocumentVisible = useDocumentVisibility();
  const { presentSuccessToast, presentDangerToast } = useToast();

  const [minimumNewTokens, setMinimumNewTokens] = useState(0);
  const [temperature, setTemperature] = useState(0.0);
  const [doSample, setDoSample] = useState(true);
  const [topK, setTopK] = useState(0);
  const [topP, setTopP] = useState(0.0);
  const [repetitionPenalty, setRepetitionPenalty] = useState(0.0);
  const [noRepeatNGramSize, setNoRepeatNGramSize] = useState(0);
  const [modelPath, setModelPath] = useState("");
  const [maxTokens, setMaxTokens] = useState(0);
  const [rewardTokens, setRewardTokens] = useState([""]);
  const [specialTokens, setSpecialTokens] = useState([""]);
  const [pushBulletApiKey, setPushBulletApiKey] = useState("");
  const location = useLocation();
  const settingsSavedMessage = "Settings saved!";

  const devMode = import.meta.env.DEV;

  // Debug mode state
  const [debugMode, setDebugMode] = useState(false);

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  console.log("Dev mode:", devMode);
  console.log("Debug mode:", debugMode);

  // Track unsaved changes
  const [isDirty, setIsDirty] = useState(false);

  /**
   * Hides the loading overlay
   */
  const hideLoadingOverlays = () => {
    console.log("Hiding overlays");
    const overlays = document.querySelectorAll("ion-loading");
    if (overlays && overlays.length > 0) {
      console.log("Overlays found:", overlays);
      overlays.forEach((overlay) => {
        overlay.dismiss().catch(() => {
          console.error("Error dismissing overlay:", overlay);
          overlay.remove(); // Remove the overlay manually if dismiss fails
        });
      });
    }
  };

  const maskSensitiveInfo = (text: string): string => {
    if (text.length <= 5) return text;
    return text.substring(0, 5) + "*".repeat(text.length - 5);
  };

  const maskedPushBulletApiKey = pushBulletApiKey
    ? maskSensitiveInfo(pushBulletApiKey)
    : "";

  useEffect(() => {
    if (
      botSettings &&
      (minimumNewTokens !== botSettings.minimum_new_tokens ||
        temperature !== botSettings.temperature ||
        doSample !== botSettings.do_sample ||
        topK !== botSettings.top_k ||
        topP !== botSettings.top_p ||
        repetitionPenalty !== botSettings.repetition_penalty ||
        noRepeatNGramSize !== botSettings.no_repeat_ngram_size ||
        modelPath !== botSettings.model_path ||
        maxTokens !== botSettings.max_tokens ||
        JSON.stringify(rewardTokens) !==
          JSON.stringify(botSettings.reward_tokens) ||
        JSON.stringify(specialTokens) !==
          JSON.stringify(botSettings.special_tokens))
    ) {
      setIsDirty(true);
    } else {
      setIsDirty(false);
    }
  }, [
    botSettings,
    minimumNewTokens,
    temperature,
    doSample,
    topK,
    topP,
    repetitionPenalty,
    noRepeatNGramSize,
    modelPath,
    maxTokens,
    rewardTokens,
    specialTokens,
  ]);

  const saveChanges = async () => {
    if (debugMode) {
      console.log("Debug mode: Skipping saving.");
      return;
    }

    console.log("Saving changes");

    if (!user || !botSettings) {
      console.log("Tried to save changes but no user or bot settings");
      return;
    }
    setLoading(true);

    try {
      const docRef = doc(db, "postHistory", user.uid);
      const data = {
        botSettings: {
          minimum_new_tokens: minimumNewTokens,
          temperature: temperature.toString().replace(",", "."),
          do_sample: doSample,
          top_k: topK,
          top_p: topP.toString().replace(",", "."),
          repetition_penalty: repetitionPenalty.toString().replace(",", "."),
          no_repeat_ngram_size: noRepeatNGramSize,
          model_path: modelPath,
          max_tokens: maxTokens,
          reward_tokens: rewardTokens,
          special_tokens: specialTokens,
        },
        pushBulletApiKey: pushBulletApiKey,
      };
      await setDoc(docRef, data);

      console.log(
        "data.botSettings has been saved:",
        JSON.stringify(data.botSettings)
      );

      console.log("Setting botSettings cache to new data.botSettings");

      localStorage.setItem(
        `botSettings-${user.uid}`,
        JSON.stringify(data.botSettings)
      );
      // Reset tracked changes
      console.log("Setting newBotSettings to data.botSettings");
      setNewBotSettings(data.botSettings as BotSettingsInterface);

      console.log("Setting botSettings to data.botSettings");
      setBotSettings(data.botSettings as BotSettingsInterface);

      localStorage.setItem(
        `pushBulletApiKey-${user.uid}`,
        data.pushBulletApiKey
      );
      setPushBulletApiKey(data.pushBulletApiKey);

      setError(null);

      // Reset dirty flag when changes are saved
      setIsDirty(false);

      console.log("Settings saved.");
      presentSuccessToast(settingsSavedMessage);
    } catch (error: any) {
      setError("Error saving bot settings: " + error.message);
      presentDangerToast("Error saving bot settings!");
    } finally {
      setLoading(false);
    }
  };

  const fetchBotSettings = async () => {
    if (debugMode) {
      console.log("Debug mode: Skipping fetching.");
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    console.log("Fetching settings …");

    try {
      const cachedBotSettings = localStorage.getItem(`botSettings-${user.uid}`);
      const cachedPushBulletApiKey = localStorage.getItem(
        `pushBulletApiKey-${user.uid}`
      );

      // Use cached botSettings if we have it
      if (cachedBotSettings) {
        console.log("Using cached botSettings");
        setBotSettings(JSON.parse(cachedBotSettings));
        setNewBotSettings(JSON.parse(cachedBotSettings));
      }

      // Use cached pushBulletApiKey if we have it
      if (cachedPushBulletApiKey) {
        console.log("Using cached pushBulletApiKey");
        setPushBulletApiKey(cachedPushBulletApiKey);
      }

      // If either setting is missing, we need to fetch what we need from the database
      if (!cachedBotSettings || !cachedPushBulletApiKey) {
        const docRef = doc(db, "postHistory", user.uid);
        console.log("Getting docSnap with docRef:", docRef);
        const docSnap = await getDoc(docRef);
        console.log("Got docSnap");

        if (docSnap.exists()) {
          const data = docSnap.data();

          // Fetch botSettings if we need it and it's available in the database
          // Else create default botSettings
          if (!cachedBotSettings) {
            console.log(
              "No cached botSettings found. Fetching from database …"
            );
            if (data.botSettings) {
              console.log("botSettings found in database.");
              localStorage.setItem(
                `botSettings-${user.uid}`,
                JSON.stringify(data.botSettings)
              );
              setBotSettings(data.botSettings as BotSettingsInterface);
              setNewBotSettings(data.botSettings as BotSettingsInterface);
            } else {
              console.log(
                "No botSettings found in the database. Creating default botSettings."
              );
              await setDoc(docRef, { botSettings: defaultBotSettings });
              localStorage.setItem(
                `botSettings-${user.uid}`,
                JSON.stringify(defaultBotSettings)
              );
              setBotSettings(defaultBotSettings);
              setNewBotSettings(defaultBotSettings);
            }
          }

          if (!cachedPushBulletApiKey) {
            console.log(
              "No cached pushBulletApiKey found. Fetching from database …"
            );
            if (data.pushBulletApiKey) {
              console.log(
                "PushBullet API key found in database:",
                data.pushBulletApiKey
              );
              localStorage.setItem(
                `pushBulletApiKey-${user.uid}`,
                data.pushBulletApiKey
              );
              setPushBulletApiKey(data.pushBulletApiKey);
            } else {
              console.log("No PushBullet API key found.");
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Error fetching bot settings:", error);
      setError("Error fetching bot settings: " + error.message);
    } finally {
      console.log("Settings fetched. Settings loading to false.");
      console.log("loading:", loading);
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("useEffect: user or pushBulletApiKey changed");
    fetchBotSettings();
  }, [user, pushBulletApiKey]);

  useEffect(() => {
    console.log("useEffect: newBotSettings changed");
    if (newBotSettings) {
      setMinimumNewTokens(newBotSettings.minimum_new_tokens);
      setTemperature(newBotSettings.temperature as number);
      setDoSample(newBotSettings.do_sample);
      setTopK(newBotSettings.top_k);
      setTopP(newBotSettings.top_p as number);
      setRepetitionPenalty(newBotSettings.repetition_penalty as number);
      setNoRepeatNGramSize(newBotSettings.no_repeat_ngram_size);
      setModelPath(newBotSettings.model_path);
      setMaxTokens(newBotSettings.max_tokens);
      setRewardTokens(newBotSettings.reward_tokens);
      setSpecialTokens(newBotSettings.special_tokens);
    }
  }, [newBotSettings]);

  useEffect(() => {
    console.log("useEffect: isDirty or isDocumentVisible changed");
    console.log("isDirty:", isDirty);
    console.log("isDocumentVisible:", isDocumentVisible);
    console.log("loading:", loading);
    const message = "Saving changes …";

    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
      console.log("Event fired:", event);
      if (isDirty) {
        console.log(message);
        event.returnValue = message; // To support Legacy: required for some browsers to show a confirmation dialog
        await saveChanges();
        event.preventDefault();
      }
    };

    const handleVisibilityChange = async () => {
      if (!isDocumentVisible && isDirty) {
        console.log("Document visibility has changed to invisible.");
        console.log(message);
        await saveChanges();
      } else {
        if (!loading) {
          console.log(
            "We are back on the page and it's not loading anymore. If the overlay is still there it should be removed."
          );
          hideLoadingOverlays();
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    handleVisibilityChange();

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty, isDocumentVisible, loading]);

  const handleNavigation = useCallback(
    async (location: Location) => {
      // console.log("handleNavigation:", location);
      // Save changes before navigating away
      if (isDirty) {
        console.log("isDirty:", isDirty);
        console.log("Blocked until changes are saved.");
        await saveChanges();
        history.push(location.pathname);
      }
    },
    [isDirty, saveChanges]
  );

  useEffect(() => {
    console.log("useEffect: history changed");
    const unblock = history.block((tx) => {
      handleNavigation(tx);
    });

    return () => {
      unblock();
    };
  }, [history]);

  type SettingValue = string | boolean | number | string[];

  const handleInputFloats = (
    inputKey: keyof BotSettingsInterface,
    inputValue: string
  ) => {
    console.log("Handling input:", inputKey, inputValue);
    // Uniform decimal representation
    let sanitizedValue = inputValue.replace(".", ",");
    // Allow only numbers and a single decimal point
    const validChars = sanitizedValue.split("").filter((char, index, array) => {
      if (char.match(/[0-9]/)) return true;

      // Checks if character is "." and if the index of the first occurrence of "." is the same as the current index. That way, we only allow one single decimal, because only one index will match the index of the first "."
      if (char === "," && array.indexOf(",") === index) return true;
      return false;
    });

    // Join the valid characters to form the final sanitized value
    sanitizedValue = validChars.join("");

    handleChange(inputKey, sanitizedValue);
  };

  const handleChange = (
    key: keyof BotSettingsInterface,
    value: SettingValue
  ) => {
    console.log("Setting changed:", key, value, typeof value);

    if (newBotSettings) {
      const updatedSettings = { ...newBotSettings };
      switch (key) {
        case "minimum_new_tokens":
          updatedSettings.minimum_new_tokens = value as number;
          break;
        case "temperature":
          updatedSettings.temperature = value as number;
          break;
        case "do_sample":
          updatedSettings.do_sample = value as boolean;
          break;
        case "top_k":
          updatedSettings.top_k = value as number;
          break;
        case "top_p":
          updatedSettings.top_p = value as number;
          break;
        case "repetition_penalty":
          updatedSettings.repetition_penalty = value as number;
          break;
        case "no_repeat_ngram_size":
          updatedSettings.no_repeat_ngram_size = value as number;
          break;
        case "model_path":
          updatedSettings.model_path = value as string;
          break;
        case "max_tokens":
          updatedSettings.max_tokens = value as number;
          break;
        case "reward_tokens":
          // Trim whitespace from each token
          updatedSettings.reward_tokens = (value as string[]).map((token) =>
            token.trim()
          );
          break;
        case "special_tokens":
          // Trim whitespace from each token
          updatedSettings.special_tokens = (value as string[]).map((token) =>
            token.trim()
          );
          break;
        default:
          break;
      }
      setNewBotSettings(updatedSettings);

      console.log("Checking if the setting has been updated");
      const isDirtyCheck =
        JSON.stringify(updatedSettings) !== JSON.stringify(botSettings);
      setIsDirty(isDirtyCheck);
      console.log("new bot settings:", JSON.stringify(updatedSettings));
      console.log("bot settings:", JSON.stringify(botSettings));
      console.log("isDirty:", isDirtyCheck);
    }
  };

  const handleOnSaveClick = async () => {
    if (isDirty) {
      await saveChanges();
    } else {
      presentSuccessToast(settingsSavedMessage);
      console.log("No settings are changed so we don't really need to save.");
    }
  };

  const incrementValue = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    value: number,
    step: number = 0.1
  ) => {
    setter((prevValue) => parseFloat((prevValue + step).toFixed(1)));
  };

  const decrementValue = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    value: number,
    step: number = 0.1
  ) => {
    setter((prevValue) => parseFloat((prevValue - step).toFixed(1)));
  };

  useEffect(() => {
    console.log("Tracking loading. Loading:", loading);
  }, [loading]);

  console.log("Settings component rendered. Loading:", loading);

  useIonViewDidEnter(() => {
    hideLoadingOverlays();
  });

  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipContent, setTooltipContent] = useState("");
  const [popoverEvent, setPopoverEvent] = useState<
    React.MouseEvent | undefined
  >(undefined);

  const handleFocus = () => {
    setShowTooltip(true);
  };

  const handleBlur = () => {
    setShowTooltip(false);
  };

  const handleMouseEnter = (event: React.MouseEvent, description: string) => {
    setTooltipContent(description);
    setPopoverEvent(event);
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const content = (
    <>
      {authLoading || loading ? (
        <IonLoading isOpen={loading} message={"Loading..."} />
      ) : (
        <>
          {devMode && (
            <IonButton onClick={toggleDebugMode}>
              {debugMode ? "Disable Debug Mode" : "Enable Debug Mode"}
            </IonButton>
          )}
          {error ? (
            <IonToast
              isOpen={!!error}
              message={error}
              duration={3000}
              onDidDismiss={() => setError(null)}
            />
          ) : botSettings ? (
            <div className="settings-form">
              <IonList inset={true}>
                <IonItem>
                  <TooltipInfo settingKey="minimum_new_tokens" />
                  <IonInput
                    label="Minimum New Tokens:"
                    labelPlacement="start"
                    type="number"
                    value={minimumNewTokens}
                    title={settingDescriptions.minimum_new_tokens}
                    onMouseEnter={(e) =>
                      handleMouseEnter(
                        e,
                        settingDescriptions.minimum_new_tokens
                      )
                    }
                    onMouseLeave={handleMouseLeave}
                    onIonInput={(e) =>
                      handleChange(
                        "minimum_new_tokens",
                        parseInt(e.detail.value!, 10)
                      )
                    }
                  />
                </IonItem>
                <IonItem>
                  <TooltipInfo settingKey="temperature" />
                  <IonInput
                    label="Tempera&shy;ture:"
                    labelPlacement="start"
                    type="text"
                    inputmode="decimal"
                    step="0.1"
                    value={temperature.toString().replace(".", ",")}
                    title={settingDescriptions.temperature}
                    onMouseEnter={(e) =>
                      handleMouseEnter(e, settingDescriptions.temperature)
                    }
                    onMouseLeave={handleMouseLeave}
                    onIonInput={(e) =>
                      handleInputFloats("temperature", e.detail.value!)
                    }
                  />
                </IonItem>
                <IonItem>
                  <TooltipInfo settingKey="do_sample" />
                  <IonToggle
                    justify="start"
                    checked={doSample}
                    title={settingDescriptions.do_sample}
                    onMouseEnter={(e) =>
                      handleMouseEnter(e, settingDescriptions.do_sample)
                    }
                    onMouseLeave={handleMouseLeave}
                    onIonChange={(e) =>
                      handleChange("do_sample", e.detail.checked)
                    }
                  >
                    Do Sample
                  </IonToggle>
                </IonItem>
                <IonItem>
                  <TooltipInfo settingKey="top_k" />
                  <IonInput
                    label="Top K:"
                    labelPlacement="start"
                    type="number"
                    value={topK}
                    title={settingDescriptions.top_k}
                    onMouseEnter={(e) =>
                      handleMouseEnter(e, settingDescriptions.top_k)
                    }
                    onMouseLeave={handleMouseLeave}
                    onIonInput={(e) =>
                      handleChange("top_k", parseInt(e.detail.value!, 10))
                    }
                  />
                </IonItem>
                <IonItem>
                  <TooltipInfo settingKey="top_p" />
                  <IonInput
                    label="Top P:"
                    labelPlacement="start"
                    type="text"
                    inputmode="decimal"
                    step="0.1"
                    value={topP.toString().replace(".", ",")}
                    title={settingDescriptions.top_p}
                    onMouseEnter={(e) =>
                      handleMouseEnter(e, settingDescriptions.top_p)
                    }
                    onMouseLeave={handleMouseLeave}
                    onIonInput={(e) =>
                      handleInputFloats("top_p", e.detail.value!)
                    }
                  />
                </IonItem>
                <IonItem>
                  <TooltipInfo settingKey="repetition_penalty" />
                  <IonInput
                    label="Repetition Penalty:"
                    labelPlacement="start"
                    type="text"
                    inputmode="decimal"
                    step="0.1"
                    value={repetitionPenalty.toString().replace(".", ",")}
                    title={settingDescriptions.repetition_penalty}
                    onMouseEnter={(e) =>
                      handleMouseEnter(
                        e,
                        settingDescriptions.repetition_penalty
                      )
                    }
                    onMouseLeave={handleMouseLeave}
                    onIonInput={(e) =>
                      handleInputFloats("repetition_penalty", e.detail.value!)
                    }
                  />
                </IonItem>
                <IonItem>
                  <TooltipInfo settingKey="no_repeat_ngram_size" />
                  <IonInput
                    label="No Repeat Ngram Size:"
                    labelPlacement="start"
                    type="number"
                    value={noRepeatNGramSize}
                    title={settingDescriptions.no_repeat_ngram_size}
                    onMouseEnter={(e) =>
                      handleMouseEnter(
                        e,
                        settingDescriptions.no_repeat_ngram_size
                      )
                    }
                    onMouseLeave={handleMouseLeave}
                    onIonInput={(e) =>
                      handleChange(
                        "no_repeat_ngram_size",
                        parseInt(e.detail.value!, 10)
                      )
                    }
                  />
                </IonItem>
                <IonItem>
                  <TooltipInfo settingKey="model_path" />
                  <IonInput
                    label="Model Path:"
                    labelPlacement="start"
                    type="text"
                    value={modelPath}
                    title={settingDescriptions.model_path}
                    onMouseEnter={(e) =>
                      handleMouseEnter(e, settingDescriptions.model_path)
                    }
                    onMouseLeave={handleMouseLeave}
                    onIonInput={(e) =>
                      handleChange("model_path", e.detail.value!)
                    }
                  />
                </IonItem>
                <IonItem>
                  <TooltipInfo settingKey="max_tokens" />
                  <IonInput
                    label="Max Tokens:"
                    labelPlacement="start"
                    type="number"
                    value={maxTokens}
                    title={settingDescriptions.max_tokens}
                    onMouseEnter={(e) =>
                      handleMouseEnter(e, settingDescriptions.max_tokens)
                    }
                    onMouseLeave={handleMouseLeave}
                    onIonInput={(e) =>
                      handleChange("max_tokens", parseInt(e.detail.value!, 10))
                    }
                  />
                </IonItem>
                <IonItem>
                  <TooltipInfo settingKey="reward_tokens" />
                  <IonInput
                    label="Reward Tokens:"
                    labelPlacement="start"
                    type="text"
                    value={rewardTokens.join(", ")}
                    title={settingDescriptions.reward_tokens}
                    onMouseEnter={(e) =>
                      handleMouseEnter(e, settingDescriptions.reward_tokens)
                    }
                    onMouseLeave={handleMouseLeave}
                    onIonInput={(e) =>
                      handleChange("reward_tokens", e.detail.value!.split(","))
                    }
                  />
                </IonItem>
                <IonItem>
                  <TooltipInfo settingKey="special_tokens" />
                  <IonInput
                    label="Special Tokens:"
                    labelPlacement="start"
                    className="input-scroll"
                    type="text"
                    value={specialTokens.join(", ")}
                    title={settingDescriptions.special_tokens}
                    onMouseEnter={(e) =>
                      handleMouseEnter(e, settingDescriptions.special_tokens)
                    }
                    onMouseLeave={handleMouseLeave}
                    onIonInput={(e) =>
                      handleChange("special_tokens", e.detail.value!.split(","))
                    }
                  />
                </IonItem>
                <h2>PushBullet API Key</h2>
                {pushBulletApiKey ? (
                  <IonText>
                    <p id="pb">{maskedPushBulletApiKey}</p>
                    <Link to="/pushbulletguide">Click here to change it.</Link>
                  </IonText>
                ) : (
                  <IonText>
                    No PushBullet API Key found. <PushbulletGuide />
                  </IonText>
                )}
                <p></p>
                <IonButton
                  style={{ maxWidth: "fit-content" }}
                  onClick={handleOnSaveClick}
                >
                  Save All Changes
                </IonButton>
              </IonList>
            </div>
          ) : (
            <IonText>No settings found</IonText>
          )}
        </>
      )}
    </>
  );

  if (standalone) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Settings</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">{content}</IonContent>
      </IonPage>
    );
  }

  return <>{content}</>;
};

export default BotSettings;
