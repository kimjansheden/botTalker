import { PropsWithChildren, useState } from "react";
import {
  ApiResponse,
  PendingAnswers,
  ButtonStates,
} from "../../common/types";
import { PushesContext } from "../context/PushesContext";

/**
 * Provider component for PushesContext.
 *
 * This component wraps its children with PushesContext, allowing any nested component to access
 * and manipulate the shared state related to user info, bot pushes, button states, and parsed data.
 * This is useful for managing global state across the application without passing props manually.
 *
 * @param {PropsWithChildren} children - The child components to be wrapped by this provider.
 * @returns {JSX.Element} The provider component with context value.
 *
 * @example
 * // Usage in a main App component
 * const App: React.FC = () => {
 *   return (
 *     <IonApp>
 *       <PushesProvider>
 *         <IonReactRouter>
 *           <IonSplitPane contentId="main">
 *             <Menu />
 *             <IonRouterOutlet id="main">
 *               <Route path="/" exact={true}>
 *                 <Redirect to="/start" />
 *               </Route>
 *               <Route path="/start" exact={true}>
 *                 <Start />
 *               </Route>
 *               <Route path="/readposts" exact={true}>
 *                 <ReadPosts />
 *               </Route>
 *               <Route path="/deleteposts" exact={true}>
 *                 <DeletePosts />
 *               </Route>
 *             </IonRouterOutlet>
 *           </IonSplitPane>
 *         </IonReactRouter>
 *       </PushesProvider>
 *     </IonApp>
 *   );
 * };
 */
export const PushesProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [pbUserInfo, setPbUserInfo] = useState<ApiResponse>({});
  const [botPushes, setBotPushes] = useState<PendingAnswers>({});
  const [buttonDisabled, setButtonDisabled] = useState<ButtonStates>({});
  const [parsedDataArray, setParsedDataArray] = useState<
    { [key: string]: string }[]
  >([]);
  const [numNewAnswers, setNumNewAnswers] = useState<number>(0);

  return (
    <PushesContext.Provider
      value={{
        pbUserInfo,
        setPbUserInfo,
        botPushes,
        setBotPushes,
        numNewAnswers,
        setNumNewAnswers,
        buttonStates: buttonDisabled,
        setButtonStates: setButtonDisabled,
        parsedDataArray,
        setParsedDataArray,
      }}
    >
      {children}
    </PushesContext.Provider>
  );
};
