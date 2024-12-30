/**
 * Utility functions for text manipulation and formatting
 */

export function decodeHtmlEntities(text: string) {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

// Add other utility functions here as needed... 