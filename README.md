# Rolomind - AI-Powered Contact Management

AI contact management system (Rolodex) including AI search, contact voice edits, and intelligent contact import.

## Features

- 📇 **Smart Contact Management** - Import, organize, and manage your contacts
- 🤖 **AI-Powered Search** - Search contacts using natural language queries like "CEOs in Israel" or "software engineers at startups"
- 🎙️ **Voice Notes** - Add notes to contacts using voice recordings
- 🔄 **Intelligent Merging** - AI-powered duplicate detection and smart contact merging
- 📥 **CSV Import** - Import contacts from LinkedIn and other CSV formats
- 📤 **Export Functionality** - Export your contacts back to CSV (use anywhere, ChatGPT/Claude/Gemini...)

## Rolomind.com
Instead of installing and running the app locally, you can use [rolomind.com](https://rolomind.com?ref=github).
Pricing is usage-based + % fee, so you pay only for the AI costs you incur.

## Prerequisites

- Node.js 18+ (recommended: use [nvm](https://github.com/nvm-sh/nvm) for version management)
- npm or yarn package manager
- API keys for AI services (see below)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/agamm/rolomind.git
   cd rolomind
   ```

2. **Install dependencies**
   ```bash
   npm install --force
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```bash
   mv .env.example .env
   ```

   Edit the `.env` file and add your API keys:
   - AI LLM (OpenRouter): https://openrouter.ai/api-keys
   - Voice LLM (OpenAI): https://platform.openai.com/api-keys

## Running the Application

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)


### Technology Stack

- **Framework**: Next.js 15 with App Router
- **Styling/UI**: Tailwind CSS / Shadcn
- **AI Integration**: Vercel AI SDK via openrouter.
- **AI Models**: Anthropic Claude (primary), OpenAI Whisper (voice)
- **State Management**: React Query (TanStack Query)
- **Authentication**: Better-auth
- **Database**: DrizzleORM with libsql, production Turso.
- **Deployment**: Vercel
- **Testing**: Vitest
- **Payment**: Polar

## Troubleshooting

### Common Issues

1. **"OPENROUTER_API_KEY is not set" error**
   - Make sure you've created a `.env` file in the root directory
   - Verify your API key is correct and active

2. **Voice recording not working**
   - Ensure you have OPENAI_API_KEY set in your `.env` file
   - Check browser permissions for microphone access

3. **Import failing for large CSV files**
   - The system processes files in chunks for better performance
   - For very large files (10k+ contacts), the import may take a few minutes

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

See NEXT-STEPS.md for next steps I plan to tackle.

## License

This project is licensed under the GNU AFFERO GENERAL PUBLIC LICENSE v3 License. See LICENSE for details about commercial use.