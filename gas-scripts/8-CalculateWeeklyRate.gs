/**
 * Calculate how many confessions per week
 */
function calculateWeeklyConfessionRate() {
  Logger.log('=== Calculating Weekly Confession Rate ===\n');

  const sheet = getConfessionsSheet();
  const lastRow = sheet.getLastRow();

  // Get timestamps from last 500 confessions to calculate rate
  const numRows = Math.min(500, lastRow - 1);
  const startRow = lastRow - numRows + 1;

  const timestamps = sheet.getRange(startRow, 1, numRows, 1).getValues();

  // Get first and last timestamp
  const oldestDate = new Date(timestamps[0][0]);
  const newestDate = new Date(timestamps[numRows - 1][0]);

  // Calculate time span in days
  const timeSpanMs = newestDate - oldestDate;
  const timeSpanDays = timeSpanMs / (1000 * 60 * 60 * 24);
  const timeSpanWeeks = timeSpanDays / 7;

  // Calculate rate
  const confessionsPerDay = numRows / timeSpanDays;
  const confessionsPerWeek = confessionsPerDay * 7;

  Logger.log(`Analyzed ${numRows} confessions`);
  Logger.log(`Oldest: ${oldestDate.toLocaleDateString('vi-VN')}`);
  Logger.log(`Newest: ${newestDate.toLocaleDateString('vi-VN')}`);
  Logger.log(`Time span: ${timeSpanDays.toFixed(1)} days (${timeSpanWeeks.toFixed(1)} weeks)`);
  Logger.log(`\n--- RATES ---`);
  Logger.log(`${confessionsPerDay.toFixed(1)} confessions per day`);
  Logger.log(`${confessionsPerWeek.toFixed(0)} confessions per week`);
  Logger.log(`\n--- RECOMMENDATION ---`);
  Logger.log(`To cover exactly 1 week, set CONFESSION_LIMIT to: ${Math.ceil(confessionsPerWeek)}`);

  // Check what date range current limit covers
  const currentLimit = CONFIG.CONFESSION_LIMIT;
  const daysWithCurrentLimit = currentLimit / confessionsPerDay;

  Logger.log(`\n--- CURRENT SETTING ---`);
  Logger.log(`Current CONFESSION_LIMIT: ${currentLimit}`);
  Logger.log(`This covers approximately: ${daysWithCurrentLimit.toFixed(1)} days`);

  return {
    confessionsPerDay: confessionsPerDay,
    confessionsPerWeek: Math.ceil(confessionsPerWeek),
    currentLimitDays: daysWithCurrentLimit
  };
}

/**
 * Show date range of last N confessions
 */
function showDateRangeForLimit(limit) {
  Logger.log(`=== Date Range for ${limit} Confessions ===\n`);

  const sheet = getConfessionsSheet();
  const lastRow = sheet.getLastRow();

  const startRow = Math.max(2, lastRow - limit + 1);
  const timestamps = sheet.getRange(startRow, 1, limit, 1).getValues();

  const oldestDate = new Date(timestamps[0][0]);
  const newestDate = new Date(timestamps[limit - 1][0]);

  const timeSpanMs = newestDate - oldestDate;
  const timeSpanDays = timeSpanMs / (1000 * 60 * 60 * 24);

  Logger.log(`${limit} confessions span from:`);
  Logger.log(`  Oldest: ${oldestDate.toLocaleString('vi-VN')}`);
  Logger.log(`  Newest: ${newestDate.toLocaleString('vi-VN')}`);
  Logger.log(`  Time span: ${timeSpanDays.toFixed(1)} days`);

  return timeSpanDays;
}
