/**
 * AI Analyzer - Uses Google Gemini API as primary, OpenRouter as fallback
 */

// OpenRouter fallback model (used when Gemini fails)
// Gemini Free tier = 1,500 requests/day (PRIMARY - 30x more generous!)
// OpenRouter Free tier = 50 requests/day (FALLBACK - saves for emergencies)
const OPENROUTER_FALLBACK_MODELS = [
  "tngtech/deepseek-r1t2-chimera:free"            // Chimera (good reasoning, emergency backup)
];

/**
 * Analyze confessions using AI with Gemini-primary architecture
 * Priority: Gemini (1,500/day) → OpenRouter (50/day)
 */
function analyzeWithAI(confessions) {
  if (!confessions || confessions.length === 0) {
    Logger.log('No confessions to analyze');
    return [];
  }

  const confessionText = prepareTextForAI(confessions);

  // Try Gemini FIRST (primary API with 1,500 requests/day)
  if (CONFIG.USE_GEMINI_FALLBACK) {
    Logger.log('🚀 Using Google Gemini API (primary - 1,500 requests/day)');
    try {
      const result = analyzeWithGemini(confessionText);
      if (result) {
        Logger.log('✅ Gemini analysis successful');
        return result;
      }
    } catch (geminiError) {
      Logger.log('⚠️ Gemini failed, falling back to OpenRouter: ' + geminiError.toString());
    }
  }

  // Gemini failed or disabled, try OpenRouter models as fallback
  Logger.log('🔄 Falling back to OpenRouter (50 requests/day)');
  const modelsToTry = [CONFIG.OPENROUTER_MODEL, ...OPENROUTER_FALLBACK_MODELS.filter(m => m !== CONFIG.OPENROUTER_MODEL)];

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    try {
      Logger.log(`Trying OpenRouter model ${i + 1}/${modelsToTry.length}: ${model}`);
      const result = tryAnalyzeWithModel(confessionText, model);
      if (result) {
        Logger.log(`✅ Success with OpenRouter model: ${model}`);
        return result;
      }
    } catch (error) {
      const errorMsg = error.toString();

      // Check if it's a rate limit error (429)
      if (errorMsg.includes('429') || errorMsg.includes('Rate limit')) {
        Logger.log(`⚠️ Model ${model} hit rate limit, trying next model...`);
        continue;
      }

      // For other errors (404, etc), log and try next model
      Logger.log(`❌ Model ${model} failed: ${errorMsg}`);
      if (i === modelsToTry.length - 1) {
        // Last model, throw comprehensive error
        throw new Error('All AI services failed:\n' +
          '1. Google Gemini exhausted or failed (1,500/day limit)\n' +
          '2. OpenRouter models exhausted or rate limited (50/day)\n' +
          'Solutions:\n' +
          '- Wait for Gemini reset (usually recovers quickly)\n' +
          '- Wait for OpenRouter reset at midnight UTC\n' +
          '- Check API keys at https://makersuite.google.com/app/apikey\n' +
          'Original error: ' + errorMsg);
      }
      continue;
    }
  }

  // This should never be reached due to the throw above, but just in case
  throw new Error('All AI services exhausted. Please check API keys and rate limits.');
}

/**
 * Try to analyze with a specific model
 */
function tryAnalyzeWithModel(confessionText, model) {
  try {
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
- **IMPORTANT**: If 3+ confessions mention THE SAME person/class/teacher → KEEP IT SPECIFIC!
  ✅ "Thầy Văn Trung dạy Văn khó hiểu" (if 5 confessions about him specifically)
  ✅ "Lớp 12A1 ồn ào làm phiền lớp khác" (if many confessions about this class)
  ✅ "Bạn Minh 12C học giỏi giúp bạn" (if many confessions praise this person)
- Remove names ONLY if confessions are about DIFFERENT people
- Make students think "oh yeah that's happening right now!"
- Count represents how many confessions match this topic
- Sentiment: -1.0 (very negative) to +1.0 (very positive), averaged across grouped confessions
- Return ONLY the JSON array, no other text`;

  const userPrompt = `Extract topics from these Vietnamese student confessions:

${confessionText}

Remember: Return ONLY the JSON array, no markdown code blocks, no explanations.`;

  const requestBody = {
    model: model,  // Use the model passed as parameter
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
 * Analyze with Google Gemini API (Ultimate Fallback)
 * Called when all OpenRouter models fail or hit rate limits
 */
function analyzeWithGemini(confessionText) {
  if (!CONFIG.USE_GEMINI_FALLBACK) {
    throw new Error('Gemini fallback is disabled');
  }

  if (CONFIG.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
    throw new Error('Gemini API key not configured. Get one at https://makersuite.google.com/app/apikey');
  }

  Logger.log(`🚨 Trying ultimate fallback: Google Gemini API (${CONFIG.GEMINI_MODEL})`);

  const prompt = `You are analyzing Vietnamese high school student confessions. Extract topics that show what's TRENDING at school right now - specific enough to be interesting, general enough to group similar confessions.

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
- **IMPORTANT**: If 3+ confessions mention THE SAME person/class/teacher → KEEP IT SPECIFIC!
  ✅ "Thầy Văn Trung dạy Văn khó hiểu" (if 5 confessions about him specifically)
  ✅ "Lớp 12A1 ồn ào làm phiền lớp khác" (if many confessions about this class)
  ✅ "Bạn Minh 12C học giỏi giúp bạn" (if many confessions praise this person)
- Remove names ONLY if confessions are about DIFFERENT people
- Make students think "oh yeah that's happening right now!"
- Count represents how many confessions match this topic
- Sentiment: -1.0 (very negative) to +1.0 (very positive), averaged across grouped confessions

Extract topics from these Vietnamese student confessions:

${confessionText}`;

  try {
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              topic: {
                type: "string",
                description: "Topic name in Vietnamese"
              },
              count: {
                type: "integer",
                description: "Number of confessions about this topic"
              },
              sentiment: {
                type: "number",
                description: "Average sentiment from -1.0 to 1.0"
              }
            },
            required: ["topic", "count", "sentiment"]
          }
        },
        thinkingConfig: {
          thinkingBudget: CONFIG.GEMINI_THINKING_BUDGET,  // Configurable thinking budget
          includeThoughts: true  // Include thought summaries for debugging
        }
      }
    };

    const geminiEndpoint = CONFIG.GEMINI_API_URL + CONFIG.GEMINI_MODEL + ':generateContent?key=' + CONFIG.GEMINI_API_KEY;

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(requestBody),
      muteHttpExceptions: true
    };

    Logger.log('Gemini Endpoint: ' + geminiEndpoint);
    const response = UrlFetchApp.fetch(geminiEndpoint, options);
    const responseCode = response.getResponseCode();

    if (responseCode !== 200) {
      throw new Error(`Gemini API Error ${responseCode}: ${response.getContentText()}`);
    }

    const result = JSON.parse(response.getContentText());
    Logger.log('Full Gemini Response: ' + JSON.stringify(result));

    // Check response structure
    if (!result.candidates || result.candidates.length === 0) {
      throw new Error('No candidates in Gemini response: ' + JSON.stringify(result));
    }

    if (!result.candidates[0].content) {
      throw new Error('No content in Gemini candidate: ' + JSON.stringify(result.candidates[0]));
    }

    if (!result.candidates[0].content.parts || result.candidates[0].content.parts.length === 0) {
      throw new Error('No parts in Gemini content: ' + JSON.stringify(result.candidates[0].content));
    }

    // Gemini 2.5 with thinking returns multiple parts: thoughts + answer
    const parts = result.candidates[0].content.parts;
    let thoughtSummary = '';
    let jsonResponse = '';

    // Separate thoughts from the actual JSON response
    for (const part of parts) {
      if (part.thought) {
        thoughtSummary += part.text;
      } else if (part.text) {
        jsonResponse = part.text;
      }
    }

    // Log the thinking process for debugging
    if (thoughtSummary) {
      Logger.log('🧠 Gemini Thinking Summary: ' + thoughtSummary.substring(0, 500) + '...');
    }

    Logger.log('Gemini JSON Response: ' + jsonResponse);

    // Parse the JSON response
    const topics = JSON.parse(jsonResponse);

    if (!Array.isArray(topics)) {
      throw new Error('Gemini response is not an array: ' + jsonResponse);
    }

    // Filter by minimum count
    const filteredTopics = topics.filter(t => t.count >= CONFIG.MIN_TOPIC_COUNT);

    // Log token usage
    if (result.usageMetadata) {
      Logger.log(`📊 Token usage - Thinking: ${result.usageMetadata.thoughtsTokenCount || 0}, Output: ${result.usageMetadata.candidatesTokenCount}, Total: ${result.usageMetadata.totalTokenCount}`);
    }

    Logger.log(`✅ Gemini succeeded! Extracted ${filteredTopics.length} topics`);
    return filteredTopics;

  } catch (error) {
    Logger.log('Gemini fallback failed: ' + error.toString());
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
