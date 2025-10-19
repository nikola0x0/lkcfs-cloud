# LK Confessions Bubble 🫧

AI-powered Vietnamese high school confession analysis system with bubble visualization.

## 📋 Features

- 🤖 AI topic extraction using OpenRouter (DeepSeek R1T2)
- 📊 Neo-brutalist bubble chart visualization
- 😊 Sentiment analysis (positive/neutral/negative)
- ⏰ Automatic hourly updates via Google Apps Script triggers
- 📱 Mobile-responsive design
- 🇻🇳 Vietnamese GenZ slang interface

## 🚀 Setup

### 1. Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your values:

- `OPENROUTER_API_KEY`: Get from https://openrouter.ai/keys
- `SPREADSHEET_ID`: Your Google Sheets ID (from URL)

### 2. Google Apps Script Deployment

1. Open your Google Sheet
2. Go to **Extensions → Apps Script**
3. Copy all files from `gas-scripts/` folder:

   - `1-Config.gs`
   - `2-DataFetcher.gs`
   - `3-AIAnalyzer.gs`
   - `4-StatisticsWriter.gs`
   - `5-WebApp.gs`
   - `6-Index-Bubbles.html` (rename to `Index.html`)

4. **Important**: Update `1-Config.gs` with your actual API key and Sheet ID

5. Deploy as Web App:
   - Click **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**

### 3. Setup Auto-Refresh

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

### Analysis Settings (`.env` or `1-Config.gs`)

- `CONFESSION_LIMIT`: Number of recent confessions to analyze (default: 90)
- `MIN_TOPIC_COUNT`: Minimum confessions per topic (default: 2)
- `AUTO_REFRESH_MINUTES`: Auto-refresh interval (default: 60)

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
2. **Analysis Trigger**: Apps Script runs every hour
3. **AI Extraction**: OpenRouter analyzes last 90 confessions
4. **Topic Generation**: AI extracts 5-15 interesting topics with sentiment
5. **Storage**: Results saved to "Statistics" sheet
6. **Visualization**: Web app displays bubble chart
7. **Client Refresh**: Browser reloads display every 30 minutes

## 🐛 Troubleshooting

### "Statistics sheet not found"

Run `runCompleteAnalysis()` manually in Apps Script

### "Data received: null"

Check that `getStatisticsData()` converts Dates to Strings (line 59, 66 in `5-WebApp.gs`)

### Bubbles are ovals not circles

Ensure no padding on `.bubble`, only on `.bubble span` (CSS)

### Topics too generic/specific

Edit AI prompt in `3-AIAnalyzer.gs` lines 16-49

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2025 Le Tien Phat

## 👨‍💻 Author

**Le Tien Phat** ([@nikola0x0](https://github.com/nikola0x0))

Built for Long Khánh High School Confessions.
