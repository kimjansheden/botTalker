import { useContext } from "react";
import { PostContext, PostContextProps } from "../context/PostContext";

export const usePosts = (): PostContextProps => {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error("usePosts must be used within a PostProvider");
  }
  return context;
};
