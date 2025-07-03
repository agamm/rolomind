# Rolomind

AI-powered contact management system (Rolodex) with natural language search and intelligent import capabilities.

## Production

Visit [rolomind.com](https://rolomind.com) for the hosted version with usage-based pricing.

## Quick Start

```bash
# Clone and install
git clone https://github.com/agamm/rolomind.git
cd rolomind
npm install --force

# Set up environment
cp .env.example .env

# Run development server
npm run dev

# Configure AI API Keys
# After starting the app, go to Settings > AI Keys to configure:
# - OpenRouter API key (required): Get from https://openrouter.ai/api-keys
# - OpenAI API key (optional, for voice features): Get from https://platform.openai.com/api-keys
```

Open [http://localhost:3000](http://localhost:3000)

## Features

- **AI Search**: Natural language queries like "CEOs in Dallas" or "developers at startups"
- **Smart Import**: Automatically detects and imports LinkedIn, Google, and custom CSV formats
- **Voice Notes**: Add contact notes via voice recording
- **Duplicate Detection**: AI-powered contact merging
- **Export**: Download contacts as CSV for use anywhere

## Testing

```bash
# Run all tests
npm test


# Run tests with coverage
npm run test:coverage
```

## Tech Stack

- Next.js 15, TypeScript, Tailwind CSS
- AI: Vercel AI SDK, OpenRouter (Claude), OpenAI (Whisper)
- Database: Drizzle ORM with SQLite/LibSQL
- Testing: Vitest

## License

GNU AGPL v3 - See LICENSE for details