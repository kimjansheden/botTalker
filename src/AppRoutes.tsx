import React from "react";
import { Redirect, Route } from "react-router-dom";
import Start from "./pages/Start";
import ReadPosts from "./pages/ReadPosts";
import { DeletePosts } from "./pages/DeletePosts";
import PostHistory from "./pages/PostHistory";
import SignUp from "./pages/SignUp";
import SignOut from "./pages/SignOut";
import AddPost from "./pages/demo/AddPost";
import BotSettings from "./pages/BotSettings";
import PushbulletGuide from "./pages/PushbulletGuide";
import { PostProvider } from "./provider/PostProvider";
import UserSettings from "./pages/UserSettings";
import Firebase from "./pages/admin/Firebase";

const AppRoutes: React.FC = () => {
  return (
    <>
      <Route path="/" exact={true}>
        <Redirect to="/start" />
      </Route>
      <Route path="/start" exact={true}>
        <Start />
      </Route>
      <Route path="/readposts" exact={true}>
        <ReadPosts />
      </Route>
      <Route path="/deleteposts" exact={true}>
        <DeletePosts />
      </Route>
      <Route path="/firebase" exact={true}>
        <Firebase />
      </Route>
      <Route path="/posthistory" exact={true}>
        <PostProvider>
          <PostHistory />
        </PostProvider>
      </Route>
      <Route path="/login" exact={true}>
        <SignUp standalone={true} />
      </Route>
      <Route path="/logout" exact={true}>
        <SignOut />
      </Route>
      <Route path="/addposts" exact={true}>
        <AddPost />
      </Route>
      <Route path="/settings" exact={true}>
        <BotSettings standalone={true} />
      </Route>
      <Route path="/pushbulletguide" exact={true}>
        <PushbulletGuide />
      </Route>
      <Route path="/usersettings" exact={true}>
        <UserSettings />
      </Route>
    </>
  );
};

export default AppRoutes;
