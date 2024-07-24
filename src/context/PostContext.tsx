import { InfiniteScrollCustomEvent } from "@ionic/react";
import {
  QueryDocumentSnapshot,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { createContext } from "react";
import { Post, PostWithReadableDate } from "../../common/types";

export interface PostContextProps {
  posts: Map<string, Set<PostWithReadableDate>>;
  fetchPostsFromDb: (
    filter: string,
    lastVisibleDocSnapshot: QueryDocumentSnapshot | null,
    highestActionId: number | null
  ) => Promise<{
    postsData: Post[];
    querySnapshot: QuerySnapshot<DocumentData, DocumentData> | null;
  }>;
  fetchInitialPosts: (filter: string, forceFetchFromDb: boolean) => Promise<void>;
  fetchMorePosts: (event: InfiniteScrollCustomEvent) => void;
  numPostsSeen: { [key: string]: number };
  loading: boolean;
  lastVisible: {
    [key: string]: QueryDocumentSnapshot<DocumentData> | null;
  };
  authLoading: boolean;
  selectedFilter: string;
  setSelectedFilter: React.Dispatch<React.SetStateAction<string>>;
  debugMode: boolean;
  toggleDebugMode: () => void;
  contentRef: React.RefObject<HTMLIonContentElement>;
}

export const PostContext = createContext<PostContextProps | undefined>(
  undefined
);
