import { appCheck } from "../config/FirebaseConfig";
import { getToken } from "firebase/app-check";

const RecaptchaTest: React.FC = () => {
  const requestToken = async () => {
    try {
      const appCheckTokenResult = await getToken(appCheck, true);
      console.log("App Check token:", appCheckTokenResult.token);
    } catch (error) {
      console.error("Error requesting App Check token:", error);
    }
  };

  return <button onClick={requestToken}>Request reCAPTCHA Token</button>;
};

export default RecaptchaTest;
