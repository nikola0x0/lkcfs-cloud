/**
 * AI Analyzer - Uses OpenRouter API to extract topics and sentiment
 */

/**
 * Analyze confessions using OpenRouter AI
 */
function analyzeWithAI(confessions) {
  if (!confessions || confessions.length === 0) {
    Logger.log('No confessions to analyze');
    return [];
  }

  const confessionText = prepareTextForAI(confessions);

  const systemPrompt = `You are analyzing Vietnamese high school student confessions. Extract topics that capture WHAT STUDENTS ARE ACTUALLY TALKING ABOUT - include the juicy details!

Return ONLY a valid JSON array (no markdown, no explanations) with this exact format:
[
  {
    "topic": "Topic name in Vietnamese (4-8 words)",
    "count": 5,
    "sentiment": 0.3
  }
]

CRITICAL Requirements:
- Return 5-15 topics maximum
- Only include topics mentioned by at least ${CONFIG.MIN_TOPIC_COUNT} confessions
- Be SPECIFIC and INTERESTING! Include the actual details students mention:

  ❌ TOO BORING: "Thích bạn nhưng không dám nói" (generic!)
  ✅ INTERESTING: "Crush ngồi gần nhưng hổng dám hỏi tên"
  ✅ INTERESTING: "Thầy X dạy khó hiểu quá"

  ❌ TOO BORING: "Mất đồ ở trường"
  ✅ INTERESTING: "Bình nước mất tích giờ ra chơi"
  ✅ INTERESTING: "Đồng phục thể dục chậm trễ giữa kỳ"

  ❌ TOO BORING: "Áp lực thi cuối kỳ"
  ✅ INTERESTING: "Toán cuối kỳ sợ rớt môn"
  ✅ INTERESTING: "Học kỳ 2 lười quá chạy deadline"

- INCLUDE SPECIFIC DETAILS: subjects, teacher names (abbreviated), specific items, time periods, emotions
- If multiple confessions mention the SAME SPECIFIC THING → include it!
- Make topics CATCHY - students should think "omg that's so relatable!"
- Focus on what makes each confession UNIQUE and INTERESTING
- Sentiment: -1.0 (very negative) to +1.0 (very positive)
- Return ONLY the JSON array, no other text`;

  const userPrompt = `Extract topics from these Vietnamese student confessions:

${confessionText}

Remember: Return ONLY the JSON array, no markdown code blocks, no explanations.`;

  try {
    const requestBody = {
      model: CONFIG.OPENROUTER_MODEL,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 4096
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + CONFIG.OPENROUTER_API_KEY,
        'HTTP-Referer': 'https://lkcfs.edu.vn',
        'X-Title': 'LK Confessions Analyzer'
      },
      payload: JSON.stringify(requestBody),
      muteHttpExceptions: true
    };

    Logger.log('Sending request to OpenRouter...');
    const response = UrlFetchApp.fetch(CONFIG.OPENROUTER_API_URL, options);
    const responseCode = response.getResponseCode();

    if (responseCode !== 200) {
      throw new Error(`API Error ${responseCode}: ${response.getContentText()}`);
    }

    const result = JSON.parse(response.getContentText());
    Logger.log('Full API Response: ' + JSON.stringify(result));

    if (!result.choices || result.choices.length === 0) {
      throw new Error('No response from OpenRouter API');
    }

    const aiResponse = result.choices[0].message.content;
    Logger.log('AI Response: ' + aiResponse);

    // Clean response - remove markdown code blocks if present
    let cleanedResponse = aiResponse.trim();
    cleanedResponse = cleanedResponse.replace(/```json\s*/g, '');
    cleanedResponse = cleanedResponse.replace(/```\s*/g, '');
    cleanedResponse = cleanedResponse.trim();

    // Extract JSON array
    const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from AI response: ' + cleanedResponse);
    }

    const topics = JSON.parse(jsonMatch[0]);

    // Filter by minimum count
    const filteredTopics = topics.filter(t => t.count >= CONFIG.MIN_TOPIC_COUNT);

    Logger.log(`Extracted ${filteredTopics.length} topics`);
    return filteredTopics;

  } catch (error) {
    Logger.log('Error in AI analysis: ' + error.toString());
    throw error;
  }
}

/**
 * Test AI analysis
 */
function testAIAnalysis() {
  Logger.log('=== Testing AI Analysis with OpenRouter ===');

  const confessions = getRecentConfessions();
  Logger.log(`Got ${confessions.length} confessions`);

  const topics = analyzeWithAI(confessions);
  Logger.log(`\nExtracted ${topics.length} topics:`);

  topics.forEach((topic, index) => {
    Logger.log(`${index + 1}. ${topic.topic} (Count: ${topic.count}, Sentiment: ${topic.sentiment})`);
  });

  return topics;
}
