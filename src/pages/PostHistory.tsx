import React, { useEffect, useRef, useState } from "react";
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonSkeletonText,
  IonThumbnail,
  IonTitle,
  IonToolbar,
  RefresherEventDetail,
} from "@ionic/react";
import { usePosts } from "../hooks/usePosts";
import { Post } from "../../common/types";

import "../themes/css/PostHistory.css";
import { chatboxOutline, refreshOutline } from "ionicons/icons";
import { PiRobot } from "react-icons/pi";
import RandomAnimateIcon from "../components/ui/RandomAnimateIcon";

interface PostWithReadableDate extends Post {
  readableTimeOfPost?: string;
}

const PostHistory: React.FC = () => {
  const {
    posts,
    fetchMorePosts,
    fetchInitialPosts,
    fetchPostsFromDb,
    numPostsSeen,
    loading,
    authLoading,
    lastVisible,
    selectedFilter,
    setSelectedFilter,
    debugMode,
    toggleDebugMode,
    contentRef,
  } = usePosts();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const devMode = import.meta.env.DEV;

  const handleFilterChange = (filter: string) => {
    console.log(`Filter changed to ${filter}`);
    if (filter !== "all" && filter !== "posted" && filter !== "skipped") {
      console.error(`Invalid filter value: ${filter}`);
      return;
    }
    setSelectedFilter(filter);
  };

  useEffect(() => {
    const currentPosts = posts.get(selectedFilter);
    if (currentPosts) {
      console.log(
        `Showing ${currentPosts.size} posts with filter ${selectedFilter}`
      );

      // Check and log duplicates
      const uniqueIds = new Set();
      const duplicates: PostWithReadableDate[] = [];

      currentPosts.forEach((post) => {
        if (uniqueIds.has(post.action_id)) {
          duplicates.push(post);
        } else {
          uniqueIds.add(post.action_id);
        }
      });

      if (duplicates.length > 0) {
        console.warn("Duplicate posts detected:", duplicates);
      }
    }
  }, [posts]);

  useEffect(() => {
    console.log(`Last visible all: ${lastVisible.all?.id}`);
    console.log(`Last visible posted: ${lastVisible.posted?.id}`);
    console.log(`Last visible skipped: ${lastVisible.skipped?.id}`);
  }, [lastVisible]);

  useEffect(() => {
    console.log(`numPostsSeen updated:`, numPostsSeen);
  }, [numPostsSeen]);

  const filteredPosts = Array.from(posts.get(selectedFilter) || []).sort(
    (a, b) => b.action_id - a.action_id
  );

  const handleScrollRefresh = async (
    event: CustomEvent<RefresherEventDetail>
  ) => {
    await handleManualRefresh();
    event.detail.complete();
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    const highestActionId =
      filteredPosts.length > 0 ? filteredPosts[0].action_id : 0;
    await fetchPostsFromDb(selectedFilter, null, highestActionId);
    setIsRefreshing(false);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Post History</IonTitle>
        </IonToolbar>
      </IonHeader>
      {devMode && (
        <IonButton onClick={toggleDebugMode}>
          {debugMode ? "Disable Debug Mode" : "Enable Debug Mode"}
        </IonButton>
      )}
      <IonContent className="ion-padding" role="feed" ref={contentRef}>
        <IonRefresher slot="fixed" onIonRefresh={handleScrollRefresh}>
          <IonRefresherContent
            pullingText="Pull to refresh"
            refreshingSpinner="bubbles"
          />
        </IonRefresher>
        <IonSegment
          value={selectedFilter}
          onIonChange={(e) => handleFilterChange(e.detail.value!.toString())}
        >
          <IonSegmentButton value="all">
            <IonLabel>All</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="posted">
            <IonLabel>Posted</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="skipped">
            <IonLabel>Skipped</IonLabel>
          </IonSegmentButton>
        </IonSegment>
        <IonButton
          onClick={handleManualRefresh}
          expand="block"
          color="secondary"
          className="refresh-button"
        >
          <IonIcon
            icon={refreshOutline}
            slot="start"
            className={isRefreshing ? "refreshing-icon" : ""}
          />
          Refresh
        </IonButton>
        {authLoading || loading ? (
          <IonList className="skeleton">
            <IonListHeader>
              <IonSkeletonText animated className="skeleton-20" />
            </IonListHeader>
            <IonItem>
              <IonThumbnail slot="start">
                <IonSkeletonText animated className="skeleton-icon" />
              </IonThumbnail>
              <IonSkeletonText animated className="skeleton-20" />
              <IonSkeletonText animated className="skeleton-20" />
              <IonSkeletonText animated className="skeleton-20" />
              <IonSkeletonText animated className="skeleton-20" />
              <IonSkeletonText animated className="skeleton-20" />
              <IonSkeletonText animated className="skeleton-20" />
            </IonItem>
          </IonList>
        ) : (
          <IonList className="post-history">
            {filteredPosts.map((post, index) => (
              <IonCard className="posts" key={index} role="article">
                <IonCardHeader>
                  <IonCardTitle>Action ID: {post.action_id}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonItem className="post-item">
                    <IonThumbnail slot="start">
                      <IonIcon
                        style={{ width: "100%", height: "100%" }}
                        icon={chatboxOutline}
                      ></IonIcon>
                    </IonThumbnail>
                    <IonLabel>
                      <h5>Original Post</h5>
                      <p>
                        <strong>Unique ID: </strong>
                        {post.original_post.unique_id}
                      </p>
                      <p>
                        <strong>Original Post ID: </strong>
                        {post.original_post_id}
                      </p>
                      <p>
                        <strong>Username:</strong> {post.original_post.username}
                      </p>
                      {post.original_post.quote && (
                        <>
                          <h6>Quote</h6>
                          <p>
                            <strong>Quoted User: </strong>
                            {post.original_post.quote.quoted_user}
                          </p>
                          <p>
                            <strong>Quoted Post: </strong>
                            {post.original_post.quote.quoted_post}
                          </p>
                        </>
                      )}
                      <p>
                        <strong>Post:</strong> {post.original_post.post}
                      </p>
                    </IonLabel>
                  </IonItem>
                  <IonItem className="post-item">
                    <IonThumbnail>
                      <RandomAnimateIcon />
                    </IonThumbnail>
                    <IonLabel>
                      <h5>Bot's Answer</h5>
                      <p>{post.generated_answer}</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem className="post-item">
                    <IonLabel>
                      <h5>Other Information</h5>
                      <p>
                        <strong>Time Of Post:</strong> {post.readableTimeOfPost}
                      </p>
                      <p>
                        <strong>Status:</strong> {post.status}
                      </p>
                    </IonLabel>
                  </IonItem>
                </IonCardContent>
              </IonCard>
            ))}
          </IonList>
        )}
        <IonInfiniteScroll threshold="0" onIonInfinite={fetchMorePosts}>
          <IonInfiniteScrollContent
            loadingSpinner="bubbles"
            loadingText="Loading more posts..."
          ></IonInfiniteScrollContent>
        </IonInfiniteScroll>
      </IonContent>
    </IonPage>
  );
};

export default PostHistory;
