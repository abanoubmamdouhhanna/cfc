export function capitalizeWords(sentence) {
    return sentence
      .toLowerCase() // Ensure the rest of the letters are lowercase
      .split(" ") // Split the sentence into words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
      .join(" "); // Join words back into a sentence
  }
 