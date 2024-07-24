import { User } from "firebase/auth";
import { ReactNode } from "react";
import { FieldValue, Timestamp } from "firebase/firestore";
import { IconType } from "react-icons";

/**
 * Represents an answer containing an original post and a generated answer.
 *
 * @example
 * const answer: Answer = {
 *   original_post: {
 *     username: "user123",
 *     quote: {
 *       quoted_user: "user456",
 *       quoted_post: ["This is a quoted post."]
 *     },
 *     post: "This is the original post."
 *   },
 *   generated_answer: "This is the generated answer."
 * };
 */
export interface Post {
  action_id: number;
  original_post: {
    unique_id: number;
    username: string;
    quote: {
      quoted_user: string;
      quoted_post: string[];
    };
    post: string;
  };
  generated_answer: string;
  original_post_id: number;
  time_of_post: Timestamp;
  status: string
}

/**
 * BotSettings represents the configuration settings for the Model.
 *
 * @property {number} minimum_new_tokens - An integer representing the minimum number of new tokens.
 * @property {number} temperature - A float representing the sampling temperature.
 * @property {boolean} do_sample - A boolean indicating whether to sample or not.
 * @property {number} top_k - An integer representing the top K tokens to consider during sampling.
 * @property {number} top_p - A float representing the nucleus sampling probability.
 * @property {number} repetition_penalty - A float representing the repetition penalty.
 * @property {number} no_repeat_ngram_size - An integer representing the size of no repeat n-grams.
 * @property {string} model_path - A string representing the path to the model.
 * @property {number} max_tokens - An integer representing the maximum number of tokens.
 * @property {string[]} reward_tokens - An array of strings representing reward tokens.
 * @property {string[]} special_tokens - An array of strings representing special tokens.
 *
 * @example
 * const botSettings: BotSettings = {
 *   minimum_new_tokens: 75,
 *   temperature: 0.5,
 *   do_sample: true,
 *   top_k: 40,
 *   top_p: 0.7,
 *   repetition_penalty: 2.0,
 *   no_repeat_ngram_size: 2,
 *   model_path: "",
 *   max_tokens: 256,
 *   reward_tokens: [],
 *   special_tokens: []
 * };
 */
export interface BotSettings {
  minimum_new_tokens: number; // int
  temperature: number | string; // float
  do_sample: boolean;
  top_k: number; // int
  top_p: number | string; // float
  repetition_penalty: number | string; // float
  no_repeat_ngram_size: number; // int
  model_path: string;
  max_tokens: number; // int
  reward_tokens: string[];
  special_tokens: string[];
}

/**
 * Represents a collection of pending answers, indexed by their IDs.
 *
 * @example
 * const pendingAnswers: PendingAnswers = {
 *   "1": {
 *     original_post: {
 *       username: "user123",
 *       quote: {
 *         quoted_user: "user456",
 *         quoted_post: ["This is a quoted post."]
 *       },
 *       post: "This is the original post."
 *     },
 *     generated_answer: "This is the generated answer."
 *   },
 *   "2": {
 *     original_post: {
 *       username: "user789",
 *       quote: {
 *         quoted_user: "user012",
 *         quoted_post: ["Another quoted post."]
 *       },
 *       post: "Another original post."
 *     },
 *     generated_answer: "Another generated answer."
 *   }
 * };
 * 
 * @example Iterate over pushes
 * const { botPushes } = usePushesContext();
 * 
 * Object.values(botPushes).forEach((push: Post) => {
 *   // Process each push
 * });
 */
export interface PendingAnswers {
  [id: string]: Post;
}

/**
 * A dictionary representing parsed data with key-value pairs as strings.
 *
 * @example
 * const parsedData: ParsedData = {
 *   "Action ID": "123",
 *   "Key1": "Value1",
 *   "Key2": "Value2"
 * };
 */
export interface ParsedData {
  [key: string]: string;
}

/**
 * Represents a collection of parsed data arrays.
 *
 * @example
 * const parsedDataArray: ParsedDataArray = [
 *   { "Action ID": "123", "Key1": "Value1", "Key2": "Value2" },
 *   { "Action ID": "456", "KeyA": "ValueA", "KeyB": "ValueB" }
 * ];
 */
export type ParsedDataArray = Array<{ [key: string]: string }>;

/**
 * Represents a generic API response with dynamic properties.
 *
 * @example
 * const apiResponse: ApiResponse = {
 *   status: "success",
 *   data: { key: "value" }
 * };
 */
export type ApiResponse = Record<string, any>;

/**
 * Represents the visibility state of content types, indexed by action IDs.
 *
 * @example
 * const visibleContentState: VisibleContentState = {
 *   "123": ["Quoted Post", "Original Post"],
 *   "456": ["Generated Answer"]
 * };
 */
export type VisibleContentState = {
  [actionId: string]: string[];
};

/**
 * Represents a push notification.
 *
 * @property {string} body - The body content of the push.
 * @property {string} title - The title of the push.
 * @property {string} iden - The identifier of the push.
 *
 * @example
 * const push: Push = {
 *   body: "This is the body of the push.",
 *   title: "Push Title",
 *   iden: "abc123"
 * };
 */
export interface Push {
  body: string;
  title: string;
  iden: string;
  // Add other relevant properties such as "active", "created", etc. if necessary
}

/**
 * Represents the disabled state of buttons, indexed by action IDs.
 * 
 * Initial state is "pending".
 *
 * @example
 * const buttonState: ButtonDisabledState = {
 *   "123": "done",
 *   "456": "pending"
 * };
 */
export interface ButtonStates {
  [actionId: string]: "done" | "pending" | "failed"
}

/**
 * Represents the properties required to update a generated answer.
 *
 * @property {string} actionId - The ID of the action.
 * @property {string} newGeneratedAnswer - The new generated answer.
 * @property {Record<string, any>} botPushes - The bot pushes data.
 * @property {string} token - The authentication token.
 *
 * @example
 * const updateProps: UpdateGeneratedAnswerProps = {
 *   actionId: "123",
 *   newGeneratedAnswer: "Updated generated answer.",
 *   botPushes: { "pushes": [] },
 *   token: "abc123token"
 * };
 */
export interface UpdateGeneratedAnswerProps {
  actionId: string;
  newGeneratedAnswer: string;
  botPushes: Record<string, any>;
  token: string;
}

/**
 * Represents the properties required to handle acceptance, rejection and skipping of an action.
 *
 * @property {string} actionId - The ID of the action.
 * @property {boolean} isButtonDisabled - The state of the button.
 * @property {Record<string, any>} botPushes - The bot pushes data.
 * @property {string} token - The authentication token.
 *
 * @example
 * const handleProps: HandleResponseProps = {
 *   actionId: "123",
 *   isButtonDisabled: true,
 *   botPushes: { "pushes": [] },
 *   token: "abc123token"
 * };
 */
export interface HandleResponseProps {
  actionId: string;
  isButtonDisabled: boolean;
  botPushes: Record<string, any>;
}

/**
 * Represents a page in the app.
 * @property {string} url - The URL of the page.
 * @property {string} iosIcon - The iOS icon of the page.
 * @property {string} mdIcon - The MD icon of the page.
 * @property {string} title - The title of the page.
 *
 * @example
 * const page: AppPage = {
 *   url: "/home",
 *   iosIcon: "ios-home",
 *   mdIcon: "md-home",
 *   otherIcon: <PiRobot />,
 *   title: "Home"
 * };
 */
export interface AppPage {
  url: string;
  iosIcon: string;
  mdIcon: string;
  otherIcon?: JSX.Element;
  title: string;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

export interface AuthContextType {
  user: User | null;
  role: string | null; 
  loading: boolean;
  emailVerified: boolean | null;
  isSMS2FA: boolean | null;
  isTOTP2FA: boolean | null;
  pushBulletApiKey: string | null;
}

export interface AuthProviderProps {
  children: ReactNode;
}

export interface PostWithReadableDate extends Post {
  readableTimeOfPost?: string;
}

export interface PartialProps {
  standalone?: boolean;
}