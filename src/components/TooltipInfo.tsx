import React, { useRef, useState } from "react";
import { IonIcon, IonPopover, IonButton, IonContent } from "@ionic/react";
import { informationCircleOutline } from "ionicons/icons";
import "../themes/css/tooltips.css";

interface TooltipInfoProps {
  settingKey: keyof typeof settingDescriptions;
}

export const settingDescriptions = {
  minimum_new_tokens:
    "The minimum number of new tokens to generate. Increasing this value ensures a longer minimum output, while decreasing it allows for shorter outputs if deemed appropriate by the model.",
  temperature:
    "Controls the randomness of predictions by scaling the logits before applying softmax. A low temperature (e.g., 0.2) makes the output more deterministic and repetitive, while a high temperature (e.g., 1.0) makes it more random and creative.",
  do_sample:
    "Whether or not to use sampling; use greedy decoding otherwise. Turning on sampling (true) can produce more varied results, while turning it off (false) makes the output more predictable.",
  top_k:
    "The number of highest probability vocabulary tokens to keep for top-k-filtering. Increasing this value allows the model to consider more options, potentially increasing diversity. Decreasing it makes the model consider fewer options, increasing determinism.",
  top_p:
    "If set to a number < 1, only the most probable tokens with probabilities that add up to top_p or higher are kept for generation. Increasing this value allows more tokens to be considered, enhancing diversity. Decreasing it makes the model more selective, increasing determinism.",
  repetition_penalty:
    "The parameter for repetition penalty. 1.0 means no penalty. Increasing this value discourages the model from repeating tokens, while decreasing it allows more repetition.",
  no_repeat_ngram_size:
    "If set to int > 0, all ngrams of that size can only occur once.\nAn n-gram is a sequence of n words.\nFor example, a 2-gram (bigram) is a sequence of two words, and a 3-gram (trigram) is a sequence of three words.\nIncreasing this value reduces the chances of repeated phrases of that length, making the text more varied.\nDecreasing it allows for more repetition, making the text potentially more repetitive.\nFor example, if set to 3 (trigram), and the text contains the phrase 'the cat sat', the model will avoid generating 'the cat sat' again in the same text.",
  model_path:
    "Path to the model to be used for generation. Changing this value switches the model being used.",
  max_tokens:
    "The maximum number of tokens to generate. Increasing this value allows longer outputs. Decreasing it restricts the output length.",
  reward_tokens:
    "The words you want the model to prioritize in its output. These tokens are sent to the logits processor, which increases their probability of being used in the generated text. Adding more tokens or increasing their weight can bias the output towards these tokens.",
  special_tokens:
    "List of special tokens to be used in the generation. Modifying this list changes which tokens are treated as special, potentially altering the structure and content of the output.",
};

const TooltipInfo: React.FC<TooltipInfoProps> = ({ settingKey }) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popover = useRef<HTMLIonPopoverElement>(null);

  const openPopover = (e: any) => {
    popover.current!.event = e;
    setPopoverOpen(true);
  };

  return (
    <>
      <IonButton
        className="tool-tip"
        fill="clear"
        onClick={openPopover}
      >
        <IonIcon icon={informationCircleOutline} />
      </IonButton>
      <IonPopover
        ref={popover}
        isOpen={popoverOpen}
        onDidDismiss={() => setPopoverOpen(false)}
      >
        <IonContent class="ion-padding">
          {settingDescriptions[settingKey]}
        </IonContent>
      </IonPopover>
    </>
  );
};

export default TooltipInfo;
