# Rolodex - AI-Powered Contact Management

A modern contact management system with AI-powered features including smart search, voice notes, and intelligent contact merging.

## Features

- 📇 **Smart Contact Management** - Import, organize, and manage your contacts
- 🤖 **AI-Powered Search** - Search contacts using natural language queries like "CEOs in Israel" or "software engineers at startups"
- 🎙️ **Voice Notes** - Add notes to contacts using voice recordings
- 🔄 **Intelligent Merging** - AI-powered duplicate detection and smart contact merging
- 📥 **CSV Import** - Import contacts from LinkedIn and other CSV formats
- 📤 **Export Functionality** - Export your contacts back to CSV (use anywhere, ChatGPT/Claude/Gemini...)

## Prerequisites

- Node.js 18+ (recommended: use [nvm](https://github.com/nvm-sh/nvm) for version management)
- npm or yarn package manager
- API keys for AI services (see below)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/rolodex.git
   cd rolodex
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Required: Anthropic API Key for AI features
   # Get your key at: https://console.anthropic.com/account/keys
   ANTHROPIC_API_KEY=sk...
   
   # Optional: OpenAI API Key for voice transcription
   # Get your key at: https://platform.openai.com/api-keys
   # Only needed if you want to use voice notes feature
   OPENAI_API_KEY=sk-...
   ```

## Getting API Keys

### Anthropic API Key (Required)
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in to your account
3. Navigate to [API Keys](https://console.anthropic.com/account/keys)
4. Click "Create Key"
5. Copy the key and add it to your `.env` file

### OpenAI API Key (Optional - for voice features)
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the key and add it to your `.env` file

## Running the Application

1. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage Guide

### Importing Contacts

1. Click the "Import CSV" button in the top navigation
2. Select a CSV file (supports LinkedIn exports and general CSV formats)
3. The AI will automatically detect the format and normalize the data
4. Review and merge any duplicate contacts

### AI-Powered Search

1. Use the AI Contact Search box at the top of the page
2. Enter natural language queries like:
   - "CEOs in tech companies"
   - "Marketing managers in New York"
   - "People I connected with last month"
3. Toggle "Generate AI summary after search" for insights about your search results

### Adding Voice Notes

1. Click the edit icon on any contact card
2. Click the microphone button
3. Record your note (e.g., "Just had coffee with John, he's interested in our new product")
4. The AI will transcribe and intelligently merge the information

### Managing Duplicates

When importing contacts, the system will:
- Automatically detect duplicates by email, phone, or name
- Show you a side-by-side comparison
- Provide an AI-powered merge preview
- Let you choose to merge, skip, or keep both

## Project Structure

```
rolodex/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── page.tsx           # Main page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── contact/          # Contact-related components
│   ├── import/           # Import flow components
│   └── ui/               # Shadcn UI components
├── lib/                   # Utility functions
│   ├── csv-parsers/      # CSV parsing logic
│   └── contact-merger.ts # Contact merging logic
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript type definitions
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check

### Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **AI Integration**: Vercel AI SDK
- **AI Models**: Anthropic Claude (primary), OpenAI Whisper (voice)
- **State Management**: React Query (TanStack Query)
- **Notifications**: Sonner

## Troubleshooting

### Common Issues

1. **"ANTHROPIC_API_KEY is not set" error**
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

## License

This project is licensed under the MIT License.