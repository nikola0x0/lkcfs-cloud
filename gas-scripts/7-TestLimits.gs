/**
 * Test script to find maximum confession limit
 */

/**
 * Test different confession limits to find the maximum
 */
function findMaxConfessionLimit() {
  const testLimits = [50, 100, 150, 200, 250, 300];
  const results = [];

  Logger.log('=== Testing Maximum Confession Limit ===');
  Logger.log('This will test different limits to find the optimal number\n');

  for (let i = 0; i < testLimits.length; i++) {
    const limit = testLimits[i];
    Logger.log(`\n--- Testing ${limit} confessions ---`);

    try {
      // Temporarily override the limit
      const originalLimit = CONFIG.CONFESSION_LIMIT;
      CONFIG.CONFESSION_LIMIT = limit;

      // Get confessions
      const confessions = getRecentConfessions();
      Logger.log(`✓ Successfully read ${confessions.length} confessions`);

      // Prepare text for AI
      const confessionText = prepareTextForAI(confessions);
      const textLength = confessionText.length;
      const estimatedTokens = Math.ceil(textLength / 4); // Rough estimate: 1 token ≈ 4 chars

      Logger.log(`✓ Text length: ${textLength} characters`);
      Logger.log(`✓ Estimated tokens: ${estimatedTokens}`);

      // Try AI analysis
      Logger.log(`→ Sending to OpenRouter...`);
      const startTime = new Date().getTime();
      const topics = analyzeWithAI(confessions);
      const endTime = new Date().getTime();
      const duration = (endTime - startTime) / 1000;

      Logger.log(`✓ SUCCESS! Got ${topics.length} topics in ${duration}s`);

      results.push({
        limit: limit,
        confessions: confessions.length,
        textLength: textLength,
        estimatedTokens: estimatedTokens,
        topics: topics.length,
        duration: duration,
        status: 'SUCCESS'
      });

      // Restore original limit
      CONFIG.CONFESSION_LIMIT = originalLimit;

      // Wait 2 seconds between requests to avoid rate limits
      Utilities.sleep(2000);

    } catch (error) {
      Logger.log(`✗ FAILED: ${error.toString()}`);
      results.push({
        limit: limit,
        status: 'FAILED',
        error: error.toString()
      });

      // If we hit a failure, stop testing higher limits
      Logger.log(`\n→ Stopping tests - found the limit!`);
      break;
    }
  }

  // Print summary
  Logger.log('\n\n=== SUMMARY ===');
  Logger.log('Limit | Confessions | Tokens | Topics | Duration | Status');
  Logger.log('------|-------------|--------|--------|----------|--------');

  let maxSuccessful = 0;
  results.forEach(result => {
    if (result.status === 'SUCCESS') {
      Logger.log(
        `${result.limit} | ${result.confessions} | ${result.estimatedTokens} | ${result.topics} | ${result.duration.toFixed(1)}s | ✓`
      );
      maxSuccessful = result.limit;
    } else {
      Logger.log(`${result.limit} | - | - | - | - | ✗ ${result.error}`);
    }
  });

  Logger.log('\n=== RECOMMENDATION ===');
  Logger.log(`Maximum successful limit: ${maxSuccessful} confessions`);
  Logger.log(`Recommended safe limit: ${Math.floor(maxSuccessful * 0.9)} confessions (90% of max for reliability)`);

  return results;
}

/**
 * Quick test with current CONFIG limit
 */
function testCurrentLimit() {
  Logger.log(`=== Testing Current Limit: ${CONFIG.CONFESSION_LIMIT} confessions ===\n`);

  try {
    const confessions = getRecentConfessions();
    Logger.log(`✓ Read ${confessions.length} confessions`);

    const confessionText = prepareTextForAI(confessions);
    const estimatedTokens = Math.ceil(confessionText.length / 4);
    Logger.log(`✓ Estimated input tokens: ${estimatedTokens}`);
    Logger.log(`✓ Text length: ${confessionText.length} characters`);

    Logger.log('\n→ Running AI analysis...');
    const startTime = new Date().getTime();
    const topics = analyzeWithAI(confessions);
    const endTime = new Date().getTime();

    Logger.log(`\n✓ SUCCESS!`);
    Logger.log(`- Extracted ${topics.length} topics`);
    Logger.log(`- Duration: ${((endTime - startTime) / 1000).toFixed(1)} seconds`);
    Logger.log('\nTopics found:');
    topics.forEach((topic, index) => {
      Logger.log(`${index + 1}. ${topic.topic} (${topic.count} confessions, sentiment: ${topic.sentiment})`);
    });

    return true;
  } catch (error) {
    Logger.log(`\n✗ FAILED: ${error.toString()}`);
    Logger.log('\nRecommendation: Reduce CONFESSION_LIMIT in Config.gs');
    return false;
  }
}
