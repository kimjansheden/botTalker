import { useEffect, useRef, useState } from "react";
import { fetchPushes } from "../components/Api";
import { PUSHBULLET_PUSHES, PUSHBULLET_USERINFO } from "../components/PbConfig";
import { usePushesContext } from "../hooks/usePushesContext";
import { parsePushes } from "../components/Helpers";
import { ParsedDataArray } from "../../common/types";
import { useAuth } from "../provider/AuthProvider";

/**
 * Custom hook to fetch and handle Pushbullet pushes.
 * 
 * This hook manages the state and side effects related to fetching user and bot pushes
 * from the Pushbullet API. It also parses the fetched data for further use in the application.
 * @returns {{fetchDataAsync: (fetchAll?: boolean) => Promise<void>;isLoading: boolean;}} - An object containing the fetchDataAsync function and the loading state.
 * @example // Example usage of useFetchPushes
import React, { useEffect } from 'react';
import useFetchPushes from './path/to/useFetchPushes';

const MyComponent = () => {

  const { fetchDataAsync, isLoading } = useFetchPushes();

  useEffect(() => {
    fetchDataAsync();
  }, [fetchDataAsync]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <div>Data fetched successfully!</div>;
};
 */
const useFetchPushes = (): {
  fetchDataAsync: (fetchAll: boolean) => Promise<void>;
  isLoadingPushes: boolean;
  numNewAnswers: number;
} => {
  const {
    pbUserInfo,
    setPbUserInfo,
    botPushes,
    setBotPushes,
    numNewAnswers,
    setNumNewAnswers,
    buttonStates,
    setButtonStates,
    setParsedDataArray,
  } = usePushesContext();

  const { pushBulletApiKey } = useAuth();

  const [isLoadingPushes, setIsLoadingPushes] = useState(false);
  const isFetching = useRef(false); // Ref to track if fetching is in progress
  const hasFetched = useRef(false); // Ref to track if data has already been fetched

  const token = pushBulletApiKey;

  /**
   * Asynchronously fetches user and bot pushes from Pushbullet.
   */
  const fetchDataAsync = async (fetchAll: boolean) => {
    console.log(`fetchDataAsync called with fetchAll=${fetchAll}`);

    // Avoid multiple fetches
    if (isFetching.current || hasFetched.current) {
      console.log("Already fetching or fetched, returning.");
      return;
    }

    if (!token) {
      console.log("No token available, returning.");
      return;
    }

    isFetching.current = true;
    setIsLoadingPushes(true);
    try {
      const pbUserData = await fetchPushes(
        PUSHBULLET_USERINFO,
        token,
        fetchAll
      );
      const botPushesData = await fetchPushes(
        PUSHBULLET_PUSHES,
        token,
        fetchAll
      );

      setPbUserInfo(pbUserData);
      setBotPushes(botPushesData);
      hasFetched.current = true; // Mark as fetched
      console.log("Pushes data fetched successfully!");
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoadingPushes(false);
      isFetching.current = false; // Reset the ref after fetching
      console.log("Fetching completed.");
    }
  };

  const getNumNewAnswers = () => {
    console.log("getNumNewAnswers called");
    console.log(
      "isFetching.current:",
      isFetching.current,
      "hasFetched.current:",
      hasFetched.current
    );

    // Calculate the number of new answers
    const newAnswers = botPushes?.pushes
      ? Object.keys(botPushes.pushes).length
      : 0;
    console.log("newAnswers:", newAnswers);
    return newAnswers;
  };

  // useEffect(() => {
  //   if (!hasFetched.current) {
  //     fetchDataAsync();
  //   }
  // }, [token]);

  useEffect(() => {
    if (botPushes) {
      console.log("buttonStates before parsePushes:", buttonStates);
      // Parse the answers data to extract structured information from each push's body
      const parsedDataArray: ParsedDataArray = parsePushes(
        botPushes,
        setButtonStates
      );
      setParsedDataArray(parsedDataArray);

      const numNewAnswers = getNumNewAnswers();
      setNumNewAnswers(numNewAnswers);
    }
  }, [botPushes, pbUserInfo]);

  useEffect(() => {
    if (buttonStates) {
      console.log("buttonStates changed:", buttonStates);
    }
  }, [buttonStates]);

  return { fetchDataAsync, isLoadingPushes, numNewAnswers };
};

export default useFetchPushes;
