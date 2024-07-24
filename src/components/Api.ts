import { ApiResponse, PendingAnswers } from "../../common/types";
import { usePushesContext } from "../hooks/usePushesContext";

/**
 * Fetches and merges paginated data from a given URL using the provided token.
 * It fetches data page by page, merging the results into a single object.
 *
 * @param {string} url - The URL to fetch data from.
 * @param {string} token - The authentication token for the request.
 * @param {(data: any) => void} [callback] - Optional callback function to process each page of the fetched data.
 * @returns {Promise<{pushes: any[], [key: string]: any}>} Returns a Promise that resolves to the merged data object or undefined if the request fails or the token is missing.
 */
export const fetchPushes = async (
  url: string,
  token: string,
  fetchAll: boolean,
  callback?: (data: any) => void
): Promise<any> => {
  console.log(`fetchPushes called with fetchAll=${fetchAll}`);
  let urlToUse = "";
  if (fetchAll) {
    console.log("Fetching all pushes");
    urlToUse = url;
  } else {
    console.log("Fetching only the first push");
    // urlToUse = `${url}?limit=1`;
    urlToUse = url;
  }
  if (token) {
    const requestUrl = new URL(urlToUse);
    // Ensure we only fetch active data by adding "active=true" to the query parameters
    requestUrl.searchParams.append("active", "true");

    // Initialize cursor for pagination control
    let cursor;

    // Initialize the object to store all fetched data
    let completeData: ApiResponse = {};

    if (!fetchAll) {
      // If fetching only the first push, we don't need to fetch any subsequent pages
      // Set limit
      // requestUrl.searchParams.set("limit", "1")
      console.log(`fetchPushes: fetchAll is ${fetchAll}. Fetching only the first push`)
      const response = await sendRequest(requestUrl, token);
      const {updatedData} = await parseResponse(response, urlToUse, completeData);
      completeData = updatedData;
    } else {
      console.log(`fetchPushes: fetchAll is ${fetchAll}. Fetching all pushes`)
      do {
        if (cursor) {
          // Set the cursor parameter to fetch the next page of data
          requestUrl.searchParams.set("cursor", cursor);
        }

        const response = await sendRequest(requestUrl, token);

        if (response.ok) {
          const { updatedData, newData } = await parseResponse(
            response,
            urlToUse,
            completeData
          );
          completeData = updatedData;

          // Update cursor for the next page of data
          cursor = newData.cursor;

          if (callback) {
            // Execute the callback function with the new data if provided
            callback(newData);
          }
        } else {
          console.log("Error:", response.status, response.text);
          break;
        }
      } while (cursor); // Continue fetching until there are no more pages
    }

    console.log(`Total pushes fetched: ${completeData.pushes?.length}`);

    // Return the complete merged data
    return completeData;
  } else {
    console.error("Token is null or empty.");

    // Throw an exception
    throw new Error("Invalid token");
  }
};

const sendRequest = async (requestUrl: URL, token: string) => {
  // Perform the API request with the URL and token
  // Set the authentication token in the request headers
  const response = await fetch(requestUrl.toString(), {
    headers: {
      "Access-Token": token,
    },
  });

  return response;
};

const parseResponse = async (
  response: Response,
  urlToUse: string,
  completeData: ApiResponse
) => {
  // Parse the response data as JSON
  const newData = await response.json();
  console.log(`parseResponse: Data from ${urlToUse}:`, newData);

  // Check if data is empty
  if (isObjectEmpty(newData)) {
    console.log("Push array is empty.");
  }

  // Merge the new data with previously fetched data
  // completeData is updated in each iteration with the new data
  // The new data object is spread into completeData, adding or overriding any existing properties
  // So the new completeData object will consist of: old completeData + newData
  completeData = {
    ...completeData, // Spread the existing completeData into the new object, copying all its properties.
    ...newData, // Spread the new data into the new object.  If newData has properties that already exist in completeData, they will be overwritten.
    // For the pushes array, we combine the existing pushes with the new pushes
    // It creates a new array that combines the existing completeData.pushes array (or an empty array if it doesn't exist) with the new data.pushes array.
    // So the new pushes array will consist of: old pushes + new pushes
    pushes: [...(completeData.pushes || []), ...(newData.pushes || [])], // Combine the pushes arrays.
  };

  return { updatedData: completeData, newData };
};

const isObjectEmpty = (obj: any): boolean => {
  if (obj === null || obj === undefined) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj !== 'object') return false;

  // Check if all keys except "cursor" are empty
  const keys = Object.keys(obj).filter(key => key !== 'cursor');
  return keys.every(key => isObjectEmpty(obj[key]));
};