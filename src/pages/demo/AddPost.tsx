import React, { useState } from "react";
import {
  IonPage,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonInput,
  IonTextarea,
  IonButton,
} from "@ionic/react";
import { useAuth } from "../../provider/AuthProvider";
import { db } from "../../config/FirebaseConfig";
import {
  collection,
  addDoc,
  Timestamp,
  serverTimestamp,
  doc,
  setDoc,
} from "firebase/firestore";
import useToast from "../../hooks/useToast";
import { Post } from "../../../common/types";

/**
 * This component emulates the data that a real post contains being sent to the database.
 * It is used by admins and in demo to add a post to the database.
 * @returns
 */
const AddPost: React.FC = () => {
  const { user } = useAuth();
  const { presentSuccessToast, presentDangerToast } = useToast();
  const [username, setUsername] = useState("");
  const [actionId, setActionId] = useState(0);
  const [uniqueId, setUniqueId] = useState(0);
  const [quotedUser, setQuotedUser] = useState("");
  const [quotedPost, setQuotedPost] = useState<string[]>([]);
  const [post, setPost] = useState("");
  const [generatedAnswer, setGeneratedAnswer] = useState("");
  const [originalPostId, setOriginalPostId] = useState(0);

  const handleAddPost = async () => {
    if (!user) {
      presentDangerToast("You must be logged in to add a post.");
      return;
    }

    try {
      const newPost: Post = {
        action_id: actionId,
        original_post: {
          unique_id: uniqueId,
          username: username,
          quote: {
            quoted_user: quotedUser,
            quoted_post: quotedPost,
          },
          post: post,
        },
        generated_answer: generatedAnswer,
        original_post_id: originalPostId,
        time_of_post: Timestamp.now(),
        status: "posted",
      };

      const userDocRef = doc(db, `postHistory/${user.uid}`);

      // Add a new document in posts sub-collection under user's document
      const postsCollectionRef = collection(
        db,
        `postHistory/${user.uid}/posts`
      );
      console.log("collectionRef:", postsCollectionRef.path);
      console.log("post:", newPost);
      await addDoc(postsCollectionRef, newPost);

      // Update the lastPostTimestamp
      await setDoc(
        userDocRef,
        { lastPostTimestamp: serverTimestamp() },
        { merge: true }
      );

      presentSuccessToast("Post added!");
    } catch (error) {
      console.error("Error adding post: ", error);
      presentDangerToast("Failed to add post.");
    }
  };

  return (
    <IonPage>
      <IonToolbar>
        <IonTitle>Add Post</IonTitle>
      </IonToolbar>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            <IonCol>
              <IonItem>
                <IonInput
                  label="Action ID"
                  labelPlacement="floating"
                  type="number"
                  value={actionId}
                  onIonChange={(e) =>
                    setActionId(parseInt(e.detail.value!, 10))
                  }
                />
              </IonItem>
              <IonItem>
                <IonTitle>original_post</IonTitle>
                <IonItem>
                  <IonInput
                    label="Unique ID"
                    labelPlacement="floating"
                    type="number"
                    value={uniqueId}
                    onIonChange={(e) =>
                      setUniqueId(parseInt(e.detail.value!, 10))
                    }
                  />
                </IonItem>
                <IonItem>
                  <IonInput
                    label="Username"
                    labelPlacement="floating"
                    value={username}
                    onIonChange={(e) => setUsername(e.detail.value!)}
                  />
                </IonItem>
                <IonItem>
                  <IonTitle>quote</IonTitle>
                  <IonItem>
                    <IonInput
                      label="Quoted User"
                      labelPlacement="floating"
                      value={quotedUser}
                      onIonChange={(e) => setQuotedUser(e.detail.value!)}
                    />
                  </IonItem>
                  <IonItem>
                    <IonInput
                      label="Quoted Post"
                      labelPlacement="floating"
                      value={quotedPost.join(",")}
                      onIonChange={(e) =>
                        setQuotedPost(e.detail.value!.split(","))
                      }
                    />
                  </IonItem>
                </IonItem>
                <IonItem>
                  <IonInput
                    label="Post"
                    labelPlacement="floating"
                    value={post}
                    onIonChange={(e) => setPost(e.detail.value!)}
                  />
                </IonItem>
              </IonItem>
              <IonItem>
                <IonInput
                  label="Generated Answer"
                  labelPlacement="floating"
                  value={generatedAnswer}
                  onIonChange={(e) => setGeneratedAnswer(e.detail.value!)}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label="Original Post ID"
                  labelPlacement="floating"
                  type="number"
                  value={originalPostId}
                  onIonChange={(e) =>
                    setOriginalPostId(parseInt(e.detail.value!, 10))
                  }
                />
              </IonItem>
              <IonButton expand="block" onClick={handleAddPost}>
                Add Post
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default AddPost;
