/**
 * Web App - Serves the bubble chart visualization
 */

/**
 * Serve the HTML page
 * This runs when someone opens the web app URL
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile("Index")
    .setTitle("LK Bubble 🫧")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Get statistics data for the web app
 * Called from JavaScript in Index.html
 */
function getStatisticsData() {
  try {
    Logger.log("getStatisticsData: Starting...");

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log("getStatisticsData: Got spreadsheet");

    const sheet = ss.getSheetByName("Statistics");
    Logger.log("getStatisticsData: Got sheet");

    if (!sheet) {
      Logger.log("getStatisticsData: Statistics sheet not found");
      return {
        topics: [],
        lastUpdated: null,
        confessionCount: 0,
        message: "Statistics sheet not found",
      };
    }

    const lastRow = sheet.getLastRow();
    Logger.log(`getStatisticsData: lastRow = ${lastRow}`);

    if (lastRow < 2) {
      return {
        topics: [],
        lastUpdated: null,
        confessionCount: 0,
        message: 'No data yet. Run "runCompleteAnalysis" first.',
      };
    }

    // Get all data
    const data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
    Logger.log(`getStatisticsData: Got ${data.length} rows`);

    const topics = data.map((row) => ({
      topic: String(row[0]),
      count: Number(row[1]),
      sentiment: parseFloat(row[2]),
      lastUpdated: String(row[3]), // Convert Date to String!
    }));

    Logger.log(`Returning ${topics.length} topics`);

    return {
      topics: topics,
      lastUpdated: String(data[0][3]), // Convert Date to String!
      confessionCount: 90,
      message: "Data loaded successfully",
    };
  } catch (error) {
    Logger.log("ERROR in getStatisticsData: " + error.toString());
    Logger.log("Stack: " + error.stack);
    return {
      topics: [],
      lastUpdated: null,
      confessionCount: 0,
      message: "Error: " + error.toString(),
    };
  }
}

/**
 * Trigger analysis from the web interface
 */
function triggerAnalysisFromWeb() {
  try {
    const result = runCompleteAnalysis();
    return {
      success: true,
      message: `Analysis complete! Found ${result.topicCount} topics from ${result.confessionCount} confessions.`,
    };
  } catch (error) {
    return {
      success: false,
      message: "Error: " + error.toString(),
    };
  }
}

/**
 * Test function - Run this to verify getStatisticsData works
 */
function testGetStatisticsData() {
  const result = getStatisticsData();
  Logger.log('Test result:');
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}
