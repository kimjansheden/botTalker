import React, { useEffect, useRef, useState } from "react";
import {
  DocumentData,
  QueryConstraint,
  QueryDocumentSnapshot,
  QuerySnapshot,
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import { db } from "../config/FirebaseConfig";
import { useAuth } from "../provider/AuthProvider";
import { Post, PostWithReadableDate, Push } from "../../common/types";
import useToast from "../hooks/useToast";
import { PostContext } from "../context/PostContext";
import { usePushesContext } from "../hooks/usePushesContext";
import useFetchPushes from "../hooks/useFetchPushes";
import { getActionId } from "../components/Helpers";

export const PostProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Map<string, Set<PostWithReadableDate>>>(
    new Map([
      ["all", new Set<PostWithReadableDate>()],
      ["skipped", new Set<PostWithReadableDate>()],
      ["posted", new Set<PostWithReadableDate>()],
    ])
  );
  const [loading, setLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState<{
    [key: string]: QueryDocumentSnapshot<DocumentData> | null;
  }>({
    all: null,
    skipped: null,
    posted: null,
  });
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [loadedPostIds, setLoadedPostIds] = useState<Set<number>>(new Set());
  const { presentDangerToast } = useToast();

  const { botPushes } = usePushesContext();
  const { isLoadingPushes, fetchDataAsync } = useFetchPushes();

  const contentRef = useRef<HTMLIonContentElement>(null);

  // Debug mode state
  const [debugMode, setDebugMode] = useState(false);

  const [numPostsSeen, setNumPostsSeen] = useState<{ [key: string]: number }>({
    all: 0,
    skipped: 0,
    posted: 0,
  });

  const initialFetchRef = useRef(true);

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  const scrollUp = async () => {
    if (contentRef.current) {
      const scrollElement = await contentRef.current.getScrollElement();
      const scrollHeight = scrollElement.scrollHeight;

      // 5 % of scrollHeight
      const ScrollAmount = scrollHeight * 0.05;
      console.log(`Scrolling up by ${ScrollAmount} pixels
      `);
      contentRef.current.scrollByPoint(0, -ScrollAmount, 300);
    } else {
      console.error("contentRef.current is null");
    }
  };

  // Helper function to convert Firestore timestamp to a Date object and then to a readable string
  const convertTimestampToString = (timestamp: Timestamp): string => {
    return new Date(timestamp.seconds * 1000).toLocaleString();
  };

  const updateNumPostsSeen = (filter: string, count: number) => {
    setNumPostsSeen((prev) => ({
      ...prev,
      [filter]: (prev[filter] || 0) + count,
    }));
  };

  const loadCachedData = (filter: string = "all") => {
    if (!user) {
      return;
    }
    try {
      console.log(`loadCachedData: Loading cached data for ${filter}`);
      const cachedPostsData = localStorage.getItem(`${user.uid}_posts`);
      if (cachedPostsData) {
        const parsedPostsData = JSON.parse(cachedPostsData);
        if (
          parsedPostsData &&
          typeof parsedPostsData === "object" &&
          ["all", "posted", "skipped"].every((key) =>
            Array.isArray(parsedPostsData[key])
          )
        ) {
          const cachedPostsMap = new Map<string, Set<PostWithReadableDate>>();
          for (const key in parsedPostsData) {
            if (parsedPostsData.hasOwnProperty(key)) {
              cachedPostsMap.set(key, new Set(parsedPostsData[key]));
            }
          }
          console.log("Setting posts with cachedPostsMap:", cachedPostsMap);
          setPosts(cachedPostsMap);
        } else {
          throw new Error("Invalid posts data");
        }
      }
    } catch (error) {
      console.error("Error loading cached data", error);
      localStorage.removeItem(`${user.uid}_posts`);
    }
  };

  const recreateLastVisible = async (filter: string = "all") => {
    if (filter !== "all" && filter !== "posted" && filter !== "skipped") {
      console.error(`Invalid filter value in recreateLastVisible: ${filter}`);
      return null;
    }

    if (!user) {
      console.error("No user found in recreateLastVisible");
      return null;
    }

    // Recreate the lastVisible doc
    const cachedLastVisibleId = localStorage.getItem(
      `${user.uid}_lastVisible_${filter}`
    );
    if (cachedLastVisibleId) {
      console.log(
        `Recreating lastVisible for ${filter} with last visible ID: ${cachedLastVisibleId}`
      );
      const lastVisibleDocRef = doc(
        db,
        `postHistory/${user?.uid}/posts`,
        cachedLastVisibleId
      );
      const lastVisibleDocSnapshot = await getDoc(lastVisibleDocRef);
      if (lastVisibleDocSnapshot.exists()) {
        setLastVisible((prev) => ({
          ...prev,
          [filter]: lastVisibleDocSnapshot,
        }));
        console.log(
          `Successfully recreated lastVisible for ${filter} with last visible ID: ${cachedLastVisibleId}.`
        );

        return lastVisibleDocSnapshot;
      } else {
        throw new Error("Invalid last visible data");
      }
    } else {
      console.log(
        `Nothing to recreate; no lastVisible data found for ${filter}`
      );
      return null;
    }
  };

  const updatePosts = (newPosts: {
    [filter: string]: PostWithReadableDate[];
  }) => {
    if (!user) {
      return;
    }
    setPosts((prevPosts) => {
      const updatedPosts = new Map(prevPosts);

      for (const filter in newPosts) {
        if (newPosts.hasOwnProperty(filter)) {
          const currentSet = new Set(updatedPosts.get(filter) || []);
          newPosts[filter].forEach((post) => currentSet.add(post));
          updatedPosts.set(filter, currentSet);
        }
      }

      // Save to cache
      const cacheObject: { [key: string]: PostWithReadableDate[] } = {};
      updatedPosts.forEach((value, key) => {
        cacheObject[key] = Array.from(value);
      });
      localStorage.setItem(`${user.uid}_posts`, JSON.stringify(cacheObject));

      return updatedPosts;
    });
  };

  const fetchPostsFromDb = async (
    filter: string = "all",
    lastVisibleDocSnapshot: QueryDocumentSnapshot | null = null,
    highestActionId: number | null = null
  ) => {
    if (!user) {
      presentDangerToast("Failed to fetch post history");
      console.error("No user found");
      return {
        postsData: [],
        querySnapshot: null,
      };
    }

    const numPostsToGet = 10;
    const order: "asc" | "desc" = "desc";
    const postsCollectionRef = collection(db, `postHistory/${user.uid}/posts`);

    const postsDataAll: Post[] = [];
    const postDataPosted: Post[] = [];
    const postDataSkipped: Post[] = [];
    let querySnapshot: QuerySnapshot | null = null;
    let lastVisibleDocSnapshotToUse: QueryDocumentSnapshot | null = null;

    let newPostFound = false;

    const lastVisibleDoc: { [key: string]: QueryDocumentSnapshot | null } = {
      all: null,
      posted: null,
      skipped: null,
    };

    // If we haven't found any new posts but we have found some posts, we need
    // to iterate further until we either reach the end or find a new post
    while (!newPostFound) {
      console.log(
        `Fetching ${numPostsToGet} posts for ${filter} from Firestore`
      );
      if (!lastVisibleDocSnapshot) {
        lastVisibleDocSnapshotToUse = lastVisible[filter];
      } else {
        lastVisibleDocSnapshotToUse = lastVisibleDocSnapshot;
      }

      // If lastVisibleDocSnapshotToUse is null at this stage, we assume it's the initial fetch from db (with empty cache) and therefore allow it to continue. But if we come back here again with initialFetch set to false and lastVisibleDocSnapshotToUse continues to be null, something is not right and the loop should abort.
      if (!lastVisibleDocSnapshotToUse && initialFetchRef.current) {
        console.log(
          "lastVisibleDocSnapshotToUse is null. Assuming initial fetch from db."
        );
        initialFetchRef.current = false;
      } else if (!initialFetchRef.current && !lastVisibleDocSnapshotToUse) {
        console.error(
          "lastVisibleDocSnapshotToUse is null after initial fetch. Aborting loop."
        );
        return {
          postsData: [],
          querySnapshot: null,
        };
      }
      console.log(
        "Starting with Last visible ID:",
        lastVisibleDocSnapshotToUse?.id
      );

      // Build query constraints
      const queryConstraints: QueryConstraint[] = [
        orderBy("action_id", "desc"),
        limit(numPostsToGet),
      ];
      if (filter !== "all") {
        queryConstraints.push(where("status", "==", filter));
      }
      if (lastVisibleDocSnapshotToUse && !highestActionId) {
        console.log(
          "Using startAfter with lastVisibleDocSnapshotToUse:",
          lastVisibleDocSnapshotToUse.id)
        queryConstraints.push(startAfter(lastVisibleDocSnapshotToUse));
      }

      if (highestActionId) {
        console.log(
          "Using where with highestActionId:",
          highestActionId)
        queryConstraints.push(where("action_id", ">", highestActionId));
      }

      // Create query with constraints
      const q = query(postsCollectionRef, ...queryConstraints);

      querySnapshot = await getDocs(q);
      console.log(`Got ${querySnapshot.size} posts`);
      if (querySnapshot.empty) {
        console.log("No more posts found");
        return {
          postsData: [],
          querySnapshot: null,
        };
      }

      querySnapshot.forEach((doc: QueryDocumentSnapshot) => {
        const data = doc.data() as PostWithReadableDate;
        if (data.time_of_post instanceof Timestamp) {
          data.readableTimeOfPost = convertTimestampToString(data.time_of_post);
        } else {
          data.readableTimeOfPost = data.time_of_post;
        }

        if (filter === "all") {
          lastVisibleDoc.all = doc;
        }

        // If we don't already have this post
        if (!loadedPostIds.has(data.action_id)) {
          newPostFound = true;
          loadedPostIds.add(data.action_id);
          postsDataAll.push(data);
          if (data.status === "posted") {
            postDataPosted.push(data);
            lastVisibleDoc.posted = doc;
          } else if (data.status === "skipped") {
            postDataSkipped.push(data);
            lastVisibleDoc.skipped = doc;
          }
        }
      });

      // If we haven't found any new posts but we have found some posts, we need to iterate further until we either reach the end or find a new post
      if (!newPostFound) {
        console.log("No new posts found, but we have more posts to fetch");
        continue;
      }

      updateNumPostsSeen("all", postsDataAll.length);
      updateNumPostsSeen("posted", postDataPosted.length);
      updateNumPostsSeen("skipped", postDataSkipped.length);

      // Set posts
      updatePosts({
        all: postsDataAll,
        posted: postDataPosted,
        skipped: postDataSkipped,
      });

      // Set last visible
      Object.keys(lastVisibleDoc).forEach((key) => {
        if (lastVisibleDoc[key] && "id" in lastVisibleDoc[key]!) {
          localStorage.setItem(
            `${user.uid}_lastVisible_${key}`,
            (lastVisibleDoc[key] as QueryDocumentSnapshot<DocumentData>).id
          );
          console.log(
            `Updated lastVisible cache for ${key} to ${
              (lastVisibleDoc[key] as QueryDocumentSnapshot<DocumentData>).id
            }`
          );

          setLastVisible((prev) => ({
            ...prev,
            [key]: lastVisibleDoc[key] as QueryDocumentSnapshot<DocumentData>,
          }));
          console.log(
            `Updated lastVisible for ${key} to ${lastVisibleDoc[key]?.id}`
          );
        }
      });
    }

    console.log(`Fetched ${postsDataAll.length} posts from Firestore`);
    console.log("First post:", postsDataAll[0]);

    return {
      postsData: postsDataAll,
      querySnapshot,
    };
  };

  const fetchInitialPosts = async (filter: string = "all", forceFetchFromDb: boolean = false) => {
    if (debugMode) {
      console.log("Debug mode: Skipping fetching.");
      return;
    }
    if (!user) {
      presentDangerToast("Failed to fetch post history");
      console.error("No user found");
      return;
    }
    setLoading(true);
    try {
      const cachedPostsDataString = localStorage.getItem(`${user.uid}_posts`);
      let cachedPostsData: { [key: string]: PostWithReadableDate[] } | null =
        null;

      if (cachedPostsDataString && !forceFetchFromDb) {
        console.log(
          "fetchInitialPosts: Found cached postsData."
        );
        try {
          cachedPostsData = JSON.parse(cachedPostsDataString);
          console.log(
            "fetchInitialPosts: Parsed cachedPostsData:",
            cachedPostsData
          );

          // Convert cached arrays to Sets
          if (cachedPostsData) {
            const cachedPostsMap = new Map<string, Set<PostWithReadableDate>>();
            for (const key in cachedPostsData) {
              if (cachedPostsData.hasOwnProperty(key)) {
                cachedPostsMap.set(key, new Set(cachedPostsData[key]));
              }
            }
            console.log("Setting posts with cachedPostsMap:", cachedPostsMap);
            setPosts(cachedPostsMap);
          }
        } catch (error) {
          console.error("Error parsing cached posts data:", error);
          localStorage.removeItem(`${user.uid}_posts`);
        }
      }
      const cachedLastVisibleId = localStorage.getItem(
        `${user.uid}_lastVisible_${filter}`
      );
      // Use cached postsData if we have it
      if (
        cachedPostsData &&
        cachedPostsData[selectedFilter] &&
        cachedPostsData[selectedFilter].length > 0 &&
        cachedLastVisibleId
      ) {
        console.log(`fetchInitialPosts: Using cached postsData for ${filter}`);
        // await loadCachedData(filter);
        setLoading(false);
        return;
      }

      // If cachedPostsData is missing, we need to fetch what we need from the database
      console.log(
        `fetchInitialPosts: No cached postsData found for ${filter}. Fetching from Firestore.`)
      const lastVisibleDocSnapshot = await recreateLastVisible(filter);
      const { postsData, querySnapshot } = await fetchPostsFromDb(
        filter,
        lastVisibleDocSnapshot
      );
    } catch (error) {
      presentDangerToast("Failed to fetch post history");
      console.error("Error fetching post history:", filter, error);
    } finally {
      setLoading(false);
    }
  };

  interface InfiniteScrollCustomEvent extends CustomEvent {
    target: HTMLIonInfiniteScrollElement;
  }
  const fetchMorePosts = async (event: InfiniteScrollCustomEvent) => {
    if (debugMode) {
      console.log("Debug mode: Skipping fetching.");
      (event.target as HTMLIonInfiniteScrollElement).complete();
      return;
    }

    if (!user) {
      presentDangerToast("Failed to fetch more posts");
      console.error("No user found");
      event.target.complete();
      return;
    }
    try {
      console.log("Fetching more posts …");

      const lastVisibleDocSnapshot = await recreateLastVisible(selectedFilter);
      const { postsData } = await fetchPostsFromDb(
        selectedFilter,
        lastVisibleDocSnapshot
      );

      console.log(`Fetched ${postsData.length} more posts`);

      if (postsData.length === 0) {
        console.log("No more posts to load.");
        event.target.complete();
        return;
      }
      scrollUp();
      console.log("Loaded more posts");
    } catch (error) {
      presentDangerToast("Failed to fetch more posts");
      console.error("Error fetching more posts:", selectedFilter, error);
      event.target.complete();
    } finally {
      event.target.complete();
    }
  };

  useEffect(() => {
    if (isLoadingPushes) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [isLoadingPushes]);

  useEffect(() => {
    console.log("useEffect: fetchDataAsync");
    if (debugMode) {
      console.log("Debug mode: Skipping fetching pushes.");
      setLoading(false);
      return;
    }
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      console.log(
        "Calling fetchDataAsync from PostProvider with fetchAll=false"
      );
      await fetchDataAsync(false);
      setLoading(false);
    };

    fetchData();
  }, [user, fetchDataAsync]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    console.log(`useEffect: selectedFilter changed to ${selectedFilter}`);

    if (loading && isLoadingPushes) {
      console.log("Something is still loading …");
      console.log("loading:", loading);
      console.log("isLoadingPushes:", isLoadingPushes);
      return;
    }

    const cachedPostsDataString = localStorage.getItem(`${user.uid}_posts`);
    let cachedPostsData: { [key: string]: PostWithReadableDate[] } | null =
      null;

    if (cachedPostsDataString) {
      try {
        cachedPostsData = JSON.parse(cachedPostsDataString);
        console.log("useEffect: Parsed cachedPostsData:", cachedPostsData);
      } catch (error) {
        console.error("Error parsing cached posts data:", error);
        localStorage.removeItem(`${user.uid}_posts`);
      }
    }

    // If we have saved "accepted" posts in cache and the corresponding action id does NOT exist in botPushes with any title (because it should be completely gone once it's posted), it means that the post has been posted and we need to fetch from db instead of cache.
    const acceptedActionIds = localStorage.getItem("acceptedPosts");
    let newPostExists = false;
    if (
      acceptedActionIds &&
      botPushes.pushes &&
      Array.isArray(botPushes.pushes) &&
      botPushes.pushes.length > 0
    ) {
      console.log("localStorage acceptedPosts:", acceptedActionIds);
      console.log("botPushes:", botPushes);

      const acceptedIdsArray = JSON.parse(acceptedActionIds);
      console.log("acceptedIdsArray:", acceptedIdsArray);

      // Convert ids in array to ints
      acceptedIdsArray.forEach((actionId: string) => {
        const actionIdInt = parseInt(actionId);
        if (!isNaN(actionIdInt)) {
          acceptedIdsArray[acceptedIdsArray.indexOf(actionId)] = actionIdInt;
        }
      });
      console.log("acceptedIdsArray (int):", acceptedIdsArray);
      const pushes: Push[] = botPushes["pushes"];

      Object.values(pushes).forEach((push: Push) => {
        console.log(push);
        const pushActionId = getActionId(push);
        console.log("pushActionId:", pushActionId);
        if (pushActionId && !acceptedIdsArray.includes(pushActionId)) {
          console.log(`Post with action_id ${pushActionId} has been posted.`);
          newPostExists = true;

          // Remove the posted actionId from cache (acceptedIdsArray)
          const updatedAcceptedIdsArray = acceptedIdsArray.filter(
            (id: number) => id !== pushActionId
          );

          // Update localStorage with the new list of accepted posts
          localStorage.setItem(
            "acceptedPosts",
            JSON.stringify(updatedAcceptedIdsArray)
          );
        }
      });
    }

    if (
      cachedPostsData &&
      cachedPostsData[selectedFilter] &&
      cachedPostsData[selectedFilter].length > 0 &&
      !newPostExists
    ) {
      console.log(`Using cached postsData for ${selectedFilter}`);
      loadCachedData();
    } else {
      console.log(`Fetching initial posts for ${selectedFilter}`);
      fetchInitialPosts(selectedFilter);
    }

    setLoading(false);
  }, [user, selectedFilter, botPushes]);

  useEffect(() => {
    console.log("useEffect: botPushes changed to:", botPushes);
  }, [botPushes]);

  return (
    <PostContext.Provider
      value={{
        posts,
        fetchPostsFromDb,
        fetchInitialPosts,
        fetchMorePosts,
        numPostsSeen,
        loading,
        authLoading,
        lastVisible,
        selectedFilter,
        setSelectedFilter,
        debugMode,
        toggleDebugMode,
        contentRef,
      }}
    >
      {children}
    </PostContext.Provider>
  );
};
