/**
 * Data Processor - Reads confession data from Google Sheets
 */

/**
 * Get the most recent N confessions
 * Combines text from multiple columns (D, E, F, G)
 */
function getRecentConfessions() {
  const sheet = getConfessionsSheet();

  if (!sheet) {
    Logger.log("Error: Could not find sheet: " + CONFIG.SHEET_NAME);
    return [];
  }

  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    Logger.log("No confession data found");
    return [];
  }

  // Calculate starting row for recent confessions
  const startRow = Math.max(2, lastRow - CONFIG.CONFESSION_LIMIT + 1);
  const numRows = lastRow - startRow + 1;

  // Get all data at once for performance
  const dataRange = sheet.getRange(startRow, 1, numRows, 11);
  const data = dataRange.getValues();

  const confessions = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const textParts = [];

    // Combine text from multiple confession columns
    // Column D (index 3)
    if (row[3] && String(row[3]).trim()) {
      textParts.push(String(row[3]).trim());
    }

    // Column E (index 4)
    if (row[4] && String(row[4]).trim()) {
      textParts.push(String(row[4]).trim());
    }

    // Column F (index 5)
    if (row[5] && String(row[5]).trim()) {
      textParts.push(String(row[5]).trim());
    }

    // Column G - Questions (index 6)
    if (row[6] && String(row[6]).trim()) {
      textParts.push(String(row[6]).trim());
    }

    // Only include if there's actual content
    if (textParts.length > 0) {
      confessions.push({
        timestamp: row[0],
        category: row[2] || "Unknown",
        urgency: row[1] || "Không",
        text: textParts.join(" | "),
        rowNumber: startRow + i,
      });
    }
  }

  Logger.log(
    `Extracted ${confessions.length} confessions from rows ${startRow} to ${lastRow}`
  );
  return confessions;
}

/**
 * Prepare confession texts for AI analysis
 * Optimized to fit more confessions by being smart about text length
 */
function prepareTextForAI(confessions) {
  if (!confessions || confessions.length === 0) {
    return "";
  }

  let text = "Analyze Vietnamese student confessions, extract topics:\n\n";

  confessions.forEach((confession, index) => {
    // Smart trimming: longer confessions get cut more aggressively
    let maxLength;
    if (confession.text.length > 500) {
      maxLength = 150; // Very long confessions - take first 150 chars
    } else if (confession.text.length > 300) {
      maxLength = 200; // Medium confessions - take first 200 chars
    } else {
      maxLength = 300; // Short confessions - keep more context
    }

    const trimmedText = confession.text.substring(0, maxLength);
    // Shorter format: remove index numbers, just use newlines
    text += `${trimmedText}\n---\n`;
  });

  return text;
}

/**
 * Test function - Run this to verify data extraction works
 */
function testDataExtraction() {
  Logger.log("=== Testing Data Extraction ===");

  const confessions = getRecentConfessions();
  Logger.log(`Total confessions: ${confessions.length}`);

  if (confessions.length > 0) {
    Logger.log("\n=== First Confession Sample ===");
    Logger.log(`Timestamp: ${confessions[0].timestamp}`);
    Logger.log(`Category: ${confessions[0].category}`);
    Logger.log(`Text: ${confessions[0].text.substring(0, 150)}...`);

    Logger.log("\n=== Last Confession Sample ===");
    const last = confessions[confessions.length - 1];
    Logger.log(`Timestamp: ${last.timestamp}`);
    Logger.log(`Category: ${last.category}`);
    Logger.log(`Text: ${last.text.substring(0, 150)}...`);
  }

  return confessions;
}
