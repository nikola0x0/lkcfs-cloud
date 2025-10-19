/**
 * SIMPLE TEST VERSION - Web App
 */

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index-Simple')
    .setTitle('LK Bubble Test')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Get statistics data - SIMPLE VERSION
 */
function getStatisticsData() {
  try {
    Logger.log('[TEST] getStatisticsData called');

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Statistics');

    if (!sheet) {
      Logger.log('[TEST] No Statistics sheet found');
      return { error: 'No Statistics sheet', topics: [] };
    }

    const lastRow = sheet.getLastRow();
    Logger.log('[TEST] lastRow: ' + lastRow);

    if (lastRow < 2) {
      return { error: 'No data', topics: [], lastUpdated: null, confessionCount: 0 };
    }

    const data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
    Logger.log('[TEST] Got ' + data.length + ' rows');

    const topics = [];
    for (var i = 0; i < data.length; i++) {
      topics.push({
        topic: String(data[i][0]),
        count: Number(data[i][1]),
        sentiment: parseFloat(data[i][2]),
        lastUpdated: String(data[i][3])  // Convert Date to String!
      });
    }

    const result = {
      topics: topics,
      lastUpdated: String(data[0][3]),  // Convert Date to String!
      confessionCount: 90,
      success: true
    };

    Logger.log('[TEST] Returning: ' + JSON.stringify(result));
    return result;

  } catch (e) {
    Logger.log('[TEST] ERROR: ' + e.toString());
    return { error: e.toString(), topics: [], stack: e.stack };
  }
}
