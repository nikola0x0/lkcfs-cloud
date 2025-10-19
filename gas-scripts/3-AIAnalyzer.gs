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

  const systemPrompt = `You are analyzing Vietnamese high school student confessions. Extract topics that show what's TRENDING at school right now - specific enough to be interesting, general enough to group similar confessions.

Return ONLY a valid JSON array (no markdown, no explanations) with this exact format:
[
  {
    "topic": "Topic name in Vietnamese (4-8 words)",
    "count": 5,
    "sentiment": 0.3
  }
]

CRITICAL Requirements:
- Return 5-12 topics maximum
- Only include topics mentioned by at least ${CONFIG.MIN_TOPIC_COUNT} confessions
- Balance SPECIFICITY with GROUPING:

  ❌ TOO SPECIFIC: "Crush bạn THTV B3, Xuân Nghi B4, Nhật Long A10" → Don't list individual names
  ❌ TOO GENERAL: "Hỏi thông tin bạn học / Crush" → Too boring!
  ✅ JUST RIGHT: "Xin info bạn nữ/nam xinh/đẹp trong trường" → Tells what's happening without naming people

  ❌ TOO SPECIFIC: "Review thầy Văn Trung dạy khó hiểu"
  ❌ TOO GENERAL: "Góp ý giáo viên"
  ✅ JUST RIGHT: "Thầy Văn dạy khó hiểu muốn đổi lớp" → Mentions subject/issue, groups similar teachers

  ❌ TOO SPECIFIC: "Mất ví, son, tiền dưới gốc cây"
  ❌ TOO GENERAL: "Mất đồ ở trường"
  ✅ JUST RIGHT: "Mất đồ ở căn tin giữa giờ ra chơi" → Tells WHERE and WHEN

  ❌ TOO SPECIFIC: "Xin tài liệu Toán thầy Đức 12, lớp 11 cũ"
  ❌ TOO GENERAL: "Xin tài liệu học tập"
  ✅ JUST RIGHT: "Xin tài liệu ôn Toán cuối kỳ lớp 12" → Tells WHAT subject and WHY

  ✅ MORE GOOD EXAMPLES:
  - "Đồng phục thể dục chậm phát nửa kỳ"
  - "Lập đội bóng chuyền nữ thiếu người"
  - "Lớp C12 friendly với cả trường"
  - "Kiểm duyệt confes lỏng quá nhiều spam"
  - "Toán cuối kỳ khó sợ rớt môn"

RULES:
- Group confessions asking about DIFFERENT people → "Xin info bạn đẹp/xinh trong trường"
- Group confessions about DIFFERENT teachers of SAME subject → "Thầy Văn dạy khó hiểu"
- Group confessions about SIMILAR items lost → "Mất đồ ở căn tin"
- Keep SPECIFIC DETAILS that make it interesting: subjects, locations, time, emotions, specific events
- Remove IDENTIFYING INFO: don't list specific names, classes (A10, B3, etc)
- If 3+ confessions mention THE EXACT SAME SPECIFIC THING → keep it specific!
- Make students think "oh yeah that's happening right now!"
- Count represents how many confessions match this topic
- Sentiment: -1.0 (very negative) to +1.0 (very positive), averaged across grouped confessions
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
