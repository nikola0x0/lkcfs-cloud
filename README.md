# LK Confessions Bubble 🫧

AI-powered Vietnamese high school confession analysis system with bubble visualization.

## 📋 Features

- 🤖 **Dual AI System**: Google Gemini (primary) + OpenRouter (fallback)
- 🚀 **1,500 requests/day** with Gemini primary (30x more than OpenRouter!)
- 🎯 **100% Free Operation**: Optimized for free tiers (no credits needed!)
- 📊 Neo-brutalist bubble chart visualization
- 😊 Sentiment analysis (positive/neutral/negative)
- ⏰ Automatic updates every 2 hours via Google Apps Script
- 📱 Mobile-responsive design
- 🇻🇳 Vietnamese GenZ slang interface
- 🧠 Configurable AI thinking depth for better analysis

## 🚀 Setup

### 1. Dual AI Setup (Both Free!)

#### A. Google Gemini API (Primary - Recommended!)

1. Sign up at https://makersuite.google.com/app/apikey
2. Get your FREE API key
3. Click "Create API Key" → Copy the key

**Model:** Gemini 2.5 Flash

- **Context**: 1,048,576 tokens input, 65,536 output (HUGE!)
- **Rate Limits**: 15 requests/min, 1,500 requests/day (30x more!)
- **PRIMARY API**: Used for all regular analysis
- **Thinking capability**: Configurable reasoning depth (0/8192/24576 tokens)

#### B. OpenRouter API (Emergency Fallback)

1. Sign up at https://openrouter.ai
2. Get your API key from https://openrouter.ai/keys

**Rate Limits:**

- **Free Tier**: 50 requests/day (resets at midnight UTC)
- **Usage**: Only when Gemini fails (preserves your quota!)

**🎉 No Credits Needed!**

- System uses Gemini primarily (1,500 requests/day)
- Falls back to OpenRouter only if Gemini fails
- Combined: Virtually unlimited uptime!

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your values:

- `GEMINI_API_KEY`: Get from https://makersuite.google.com/app/apikey (PRIMARY)
- `OPENROUTER_API_KEY`: Get from https://openrouter.ai/keys (fallback)
- `SPREADSHEET_ID`: Your Google Sheets ID (from URL)

### 3. Google Apps Script Deployment

1. Open your Google Sheet
2. Go to **Extensions → Apps Script**
3. Copy all files from `gas-scripts/` folder:

   - `1-Config.gs`
   - `2-DataFetcher.gs`
   - `3-AIAnalyzer.gs`
   - `4-StatisticsWriter.gs`
   - `5-WebApp.gs`
   - `6-Index-Bubbles.html` (rename to `Index.html`)

4. **Important**: Update `1-Config.gs` with your actual API keys:

   - `GEMINI_API_KEY`: Your Gemini key (PRIMARY - most important!)
   - `OPENROUTER_API_KEY`: Your OpenRouter key (fallback only)
   - `SPREADSHEET_ID`: Your Sheet ID

5. Deploy as Web App:
   - Click **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**

### 4. Setup Auto-Refresh

Run once in Apps Script:

```javascript
setupAutoRefresh();
```

This creates a trigger to run analysis every hour.

## 📁 Project Structure

```
lkcfs-cloud/
├── .env                          # Your secrets (NOT committed)
├── .env.example                  # Template for secrets
├── .gitignore                    # Protect secrets
├── README.md                     # This file
└── gas-scripts/                  # Google Apps Script files
    ├── 1-Config.gs              # Configuration
    ├── 2-DataFetcher.gs         # Fetch confessions from sheet
    ├── 3-AIAnalyzer.gs          # AI topic extraction
    ├── 4-StatisticsWriter.gs    # Write results + triggers
    ├── 5-WebApp.gs              # Web app server
    └── 6-Index-Bubbles.html     # Frontend UI
```

## ⚙️ Configuration

### AI Model Selection

The system uses **Gemini-primary architecture** with automatic fallback:

**Primary AI (always used first):**

- `gemini-2.5-flash` - Google's latest model ⭐ **Primary**
  - 1M+ token context
  - 1,500 requests/day
  - Thinking capability for deeper reasoning
  - Excellent Vietnamese support

**Fallback AI (emergency only):**

- `tngtech/deepseek-r1t2-chimera:free` - OpenRouter emergency backup
  - 163K context
  - 50 requests/day
  - Only used when Gemini fails

**Configuration** in `.env` or `1-Config.gs`:

```javascript
GEMINI_MODEL=gemini-2.5-flash              // Primary (1,500/day)
OPENROUTER_MODEL=tngtech/deepseek-r1t2-chimera:free  // Fallback (50/day)
GEMINI_THINKING_BUDGET=8192  // Reasoning depth: 0/8192/24576
```

### Analysis Settings (`.env` or `1-Config.gs`)

- `CONFESSION_LIMIT`: Number of recent confessions to analyze (default: 90)
- `MIN_TOPIC_COUNT`: Minimum confessions per topic (default: 2)
- `AUTO_REFRESH_HOURS`: Auto-refresh interval in hours (default: 2)
  - **2 hours** = 12 API calls/day ✅ **FREE tier optimized**
  - **1 hour** = 24 API calls/day (requires monitoring)
  - **4 hours** = 6 API calls/day (maximum buffer)

### AI Prompt Tuning

Edit `3-AIAnalyzer.gs` → `systemPrompt` to adjust topic extraction:

- Make topics more/less specific
- Change sentiment weighting
- Adjust topic count (5-15 range)

## 🔒 Security

- ⚠️ **Never commit `.env`** - it contains your API key
- ⚠️ **Never commit real API keys in `1-Config.gs`** - Use placeholder "YOUR_OPENROUTER_API_KEY_HERE"
- ✅ `.env.example` is safe to commit (no secrets)
- ✅ `.gitignore` protects your secrets
- 🔑 When deploying to Google Apps Script, manually replace the placeholder with your real API key
- 🚨 **If you accidentally push API keys to GitHub**: Revoke them immediately at https://openrouter.ai/keys

## 🎨 UI Customization

### Colors (CSS in `6-Index-Bubbles.html`)

```css
.header {
  background: #ff6b9d;
} /* Header pink */
.controls {
  background: #fff095;
} /* Controls yellow */
.legend {
  background: #c4f0ff;
} /* Legend blue */
body {
  background: #f5e6d3;
} /* Page beige */
```

### Sentiment Colors

```javascript
Positive: #34A853 (green)
Neutral: #FBBC04 (yellow)
Negative: #EA4335 (red)
```

## 📊 How It Works

1. **Data Collection**: Google Form → Google Sheets
2. **Analysis Trigger**: Apps Script runs **every 2 hours** (12 API calls/day)
3. **AI Extraction**: Google Gemini analyzes last 90 confessions (falls back to OpenRouter if needed)
4. **Topic Generation**: AI extracts 5-15 interesting topics with sentiment (using thinking for deeper analysis)
5. **Storage**: Results saved to "Statistics" sheet (cached)
6. **Visualization**: Web app displays bubble chart
7. **Client Refresh**: Browser reloads from **cached sheet** every 30 minutes (no API calls)

## 🐛 Troubleshooting

### "Rate limit exceeded" (Gemini)

**Problem**: You've hit Gemini's 1,500 requests/day limit (very rare!)

**This should NEVER happen with default settings!** The system only makes 12 requests/day.

**Possible Causes**:

1. Excessive manual testing
2. Multiple triggers running simultaneously
3. Shared API key with other projects

**Solutions**:

1. **Automatic fallback**: System will use OpenRouter automatically
2. **Wait for reset**: Gemini limits reset quickly (per-minute basis)
3. **Check triggers**: Verify only ONE trigger exists with `ScriptApp.getProjectTriggers()`

### "Rate limit exceeded: free-models-per-day" (OpenRouter)

**Problem**: OpenRouter fallback hit its 50 requests/day limit.

**This means Gemini failed AND OpenRouter is exhausted** (extremely rare!)

**Solutions**:

1. **Wait for Gemini**: Usually recovers within minutes
2. **Wait for OpenRouter reset**: Midnight UTC
3. **Check API keys**: Verify both keys are valid
4. **Optional**: Add OpenRouter credits at https://openrouter.ai/settings/integrations

### "Statistics sheet not found"

Run `runCompleteAnalysis()` manually in Apps Script

### "Data received: null"

Check that `getStatisticsData()` converts Dates to Strings (line 59, 66 in `5-WebApp.gs`)

### Bubbles are ovals not circles

Ensure no padding on `.bubble`, only on `.bubble span` (CSS)

### Topics too generic/specific

Edit AI prompt in `3-AIAnalyzer.gs` lines 75-120

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2025 Le Tien Phat

## 👨‍💻 Author

**Le Tien Phat** ([@nikola0x0](https://github.com/nikola0x0))

Built for Long Khánh High School Confessions.
