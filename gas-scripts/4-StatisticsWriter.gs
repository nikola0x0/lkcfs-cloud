/**
 * Statistics Writer - Writes analyzed data to Statistics sheet
 */

/**
 * Write topic statistics to the Statistics sheet
 */
function writeStatistics(topics) {
  if (!topics || topics.length === 0) {
    Logger.log("No topics to write");
    return;
  }

  const sheet = getStatisticsSheet();
  const timestamp = new Date();

  // Clear old data (keep header row)
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).clearContent();
  }

  // Prepare data rows
  const dataRows = topics.map((topic) => [
    topic.topic,
    topic.count,
    topic.sentiment.toFixed(2),
    timestamp,
  ]);

  // Write to sheet
  if (dataRows.length > 0) {
    sheet.getRange(2, 1, dataRows.length, 4).setValues(dataRows);

    // Format the data
    sheet.getRange(2, 2, dataRows.length, 1).setNumberFormat("0"); // Count as integer
    sheet.getRange(2, 3, dataRows.length, 1).setNumberFormat("0.00"); // Sentiment as decimal
    sheet
      .getRange(2, 4, dataRows.length, 1)
      .setNumberFormat("yyyy-mm-dd hh:mm:ss"); // Timestamp

    // Auto-resize columns
    sheet.autoResizeColumns(1, 4);

    Logger.log(`Wrote ${dataRows.length} topics to Statistics sheet`);
  }
}

/**
 * Main function to run the complete analysis
 * This is what you'll trigger manually or via time-based trigger
 */
function runCompleteAnalysis() {
  try {
    Logger.log("=== Starting Complete Analysis ===");

    // Step 1: Get recent confessions
    Logger.log("Step 1: Reading confessions...");
    const confessions = getRecentConfessions();

    if (confessions.length === 0) {
      throw new Error("No confessions found to analyze");
    }

    Logger.log(`Found ${confessions.length} confessions to analyze`);

    // Step 2: Analyze with AI
    Logger.log("Step 2: Analyzing with DeepSeek R1T2 Chimera...");
    const topics = analyzeWithAI(confessions);

    if (topics.length === 0) {
      throw new Error("No topics extracted from AI analysis");
    }

    Logger.log(`Extracted ${topics.length} topics`);

    // Step 3: Write to Statistics sheet
    Logger.log("Step 3: Writing statistics...");
    writeStatistics(topics);

    Logger.log("=== Analysis Complete ===");
    Logger.log(
      `Successfully analyzed ${confessions.length} confessions into ${topics.length} topics`
    );

    return {
      success: true,
      confessionCount: confessions.length,
      topicCount: topics.length,
      topics: topics,
    };
  } catch (error) {
    Logger.log("ERROR: " + error.toString());
    throw error;
  }
}

/**
 * Set up automatic trigger to run analysis periodically
 * Run this once to enable auto-refresh
 */
function setupAutoRefresh() {
  // Delete existing triggers first
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach((trigger) => {
    if (trigger.getHandlerFunction() === "runCompleteAnalysis") {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Only create new trigger if AUTO_REFRESH_MINUTES > 0
  if (CONFIG.AUTO_REFRESH_MINUTES > 0) {
    // Use everyHours for 60 minutes, or everyMinutes for shorter intervals (1, 5, 10, 15, 30)
    if (CONFIG.AUTO_REFRESH_MINUTES >= 60) {
      ScriptApp.newTrigger("runCompleteAnalysis")
        .timeBased()
        .everyHours(Math.floor(CONFIG.AUTO_REFRESH_MINUTES / 60))
        .create();

      Logger.log(
        `Auto-refresh enabled: will run every ${Math.floor(CONFIG.AUTO_REFRESH_MINUTES / 60)} hour(s)`
      );
    } else {
      ScriptApp.newTrigger("runCompleteAnalysis")
        .timeBased()
        .everyMinutes(CONFIG.AUTO_REFRESH_MINUTES)
        .create();

      Logger.log(
        `Auto-refresh enabled: will run every ${CONFIG.AUTO_REFRESH_MINUTES} minutes`
      );
    }
  } else {
    Logger.log("Auto-refresh is disabled (AUTO_REFRESH_MINUTES = 0)");
  }
}

/**
 * Remove automatic trigger
 */
function removeAutoRefresh() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach((trigger) => {
    if (trigger.getHandlerFunction() === "runCompleteAnalysis") {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  Logger.log("Auto-refresh disabled");
}
