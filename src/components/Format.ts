/**
 *
 * @param quotedPost A JSON array string representing a quoted post.
 *
 * @example
 * const quotedPost = '["This is a quoted post in the form of a string with a JSON array"]';
 * const formattedQuotedPost = formatQuotedPost(quotedPost);
 * @returns The quoted post as a string
 */
export function formatQuotedPost(quotedPost: string): string {
  // If quotedPost is a JSON array, use the first element
  // Otherwise, use the string as-is
  try {
    // Attempt to parse the string as a JSON array
    const parsed = JSON.parse(quotedPost);
    if (Array.isArray(parsed)) {
      // If it's an array, use the first element
      quotedPost = parsed[0];
    }
  } catch (e) {
    // If JSON.parse fails, use the string as-is
  }

  if (!quotedPost || quotedPost.length === 0) {
    return "";
  }

  // Remove leading and trailing brackets and quotes if they exist
  quotedPost = quotedPost.replace(/^\['/, "").replace(/'\]$/, "");

  // Replace all occurrences of \n with an actual line break
  return quotedPost.replace(/\\n/g, "\n");
}
