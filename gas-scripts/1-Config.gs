/**
 * Configuration file for Long Khánh Confessions Analysis System
 *
 * INSTRUCTIONS:
 * 1. Get your free Gemini API key from: https://makersuite.google.com/app/apikey
 * 2. Replace 'YOUR_GEMINI_API_KEY_HERE' below with your actual key
 */

const CONFIG = {
  // ========== API CONFIGURATION ==========
  // OpenRouter API (using free DeepSeek model)
  // IMPORTANT: Replace this with your actual API key from https://openrouter.ai/keys
  OPENROUTER_API_KEY: "YOUR_OPENROUTER_API_KEY_HERE",
  OPENROUTER_API_URL: "https://openrouter.ai/api/v1/chat/completions",
  OPENROUTER_MODEL: "tngtech/deepseek-r1t2-chimera:free", // 163K context, free!

  // ========== SHEET CONFIGURATION ==========
  SPREADSHEET_ID: "1iWKEbc70RrxPBUXBj2xNJkq92LcFRUF7LBGzNRQgmxg", // Your Google Sheet ID
  SHEET_NAME: "Form_Responses1", // Your main sheet name (the tab with confession data)
  STATISTICS_SHEET_NAME: "Statistics", // Results will be written here

  // Column indices (A=1, B=2, C=3, D=4, E=5, etc.)
  COLUMNS: {
    TIMESTAMP: 1, // Column A - Dấu thời gian
    URGENCY: 2, // Column B - Confessions của bạn có gấp không?
    CATEGORY: 3, // Column C - Chuyên mục
    CONFESSION_E: 4, // Column D - Điều bạn muốn gửi gắm là?
    CONFESSION_F: 5, // Column E - Điều bạn muốn gửi gắm là?
    CONFESSION_G: 6, // Column F - Điều bạn muốn gửi gắm là?
    QUESTION_H: 7, // Column G - Điều bạn muốn được giải đáp là?
    CONFESSION_L: 10, // Column J - Điều bạn muốn gửi gắm là?
    CONFESSION_M: 11, // Column K - Điều bạn muốn gửi gắm là?
  },

  // ========== ANALYSIS SETTINGS ==========
  CONFESSION_LIMIT: 90, // Analyze last 90 confessions (exactly 1 week of data)
  MIN_TOPIC_COUNT: 2, // Minimum confessions per topic (lowered to show more topics)
  AUTO_REFRESH_MINUTES: 60, // Auto-refresh every hour (production setting)
};

/**
 * Get the spreadsheet (works everywhere)
 */
function getSpreadsheet() {
  // For container-bound scripts, getActiveSpreadsheet works everywhere including web apps
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Get the confessions sheet
 */
function getConfessionsSheet() {
  return getSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
}

/**
 * Get or create the statistics sheet
 */
function getStatisticsSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.STATISTICS_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.STATISTICS_SHEET_NAME);
    initializeStatisticsSheet(sheet);
  }

  return sheet;
}

/**
 * Initialize statistics sheet with headers
 */
function initializeStatisticsSheet(sheet) {
  sheet
    .getRange(1, 1, 1, 4)
    .setValues([["Topic Name", "Count", "Avg Sentiment", "Last Updated"]]);

  sheet
    .getRange(1, 1, 1, 4)
    .setFontWeight("bold")
    .setBackground("#4285F4")
    .setFontColor("#FFFFFF");

  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, 4);
}

/**
 * Debug function - Find the exact sheet names
 */
function debugSheetNames() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();

  Logger.log('=== ALL SHEET NAMES IN YOUR SPREADSHEET ===');
  sheets.forEach(function(sheet, index) {
    Logger.log('Sheet ' + (index + 1) + ': "' + sheet.getName() + '"');
  });

  Logger.log('\n=== Current CONFIG.SHEET_NAME ===');
  Logger.log('"' + CONFIG.SHEET_NAME + '"');
}
