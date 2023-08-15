const checkBannedWords = (originalPrompt, banishedWords) => {
    // Function to clean the string as per given rules
    const startTime = new Date().getTime();

    const cleanString = (str) =>
        str.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ').replace(/\s{2,}/g, ' ').trim();

    // Clean the original string
    const cleanedPrompt = cleanString(originalPrompt);

    // Check if any of the cleaned banished words exist in the cleaned string
    const match = banishedWords.some(word => cleanedPrompt.includes(cleanString(word)));

    const endTime = new Date().getTime();
    // console.log(`Time taken to check banned words: ${endTime - startTime}ms`);

    return {
        cleanedPrompt,
        match
    };
}

module.exports = checkBannedWords;
