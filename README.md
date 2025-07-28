# PixaSocial Ai - Strategic Social Engagement Suite

PixaSocial Ai is a React-based web application designed for planning, simulating, and evaluating social engagement strategies. It leverages behavioral insights, psychological frameworks like Reinforcement Sensitivity Theory (RST), AI-driven assistance, and decentralized real-time communication to support global campaign managers.

## Features

*   **Dashboard:** Dynamic overview of your campaign data, upcoming posts, and quick actions.
*   **Audience Modeling:** Create detailed audience personas using RST (BAS, BIS, FFFS) and AI-assisted suggestions.
*   **Analytics:** Generate and visualize OCEAN (Big Five) personality scores for your personas with AI-powered analysis and radar charts.
*   **Operator Builder:** Design campaign mechanics (Hope, Fear, Custom, etc.) based on Pavlovian conditioning principles, tailored to specific personas.
*   **Content Planner:** Generate multi-platform content (X, Facebook, Instagram, Email, Posters) with AI, including text, image prompts, meme text, and video ideas.
*   **Calendar:** Schedule and visualize your content plan with an interactive calendar.
*   **Content Library:** Upload, store, and manage reusable media assets (images, videos).
*   **Team Chat:** Real-time, decentralized chat for team collaboration using GunDB.
*   **Feedback Simulator:** Predict audience reactions (sentiment, engagement, risks) to your content using AI.
*   **Campaign Blueprint:** Apply the 8D problem-solving process to your campaigns with AI assistance.
*   **Admin Panel & Settings:** Configure AI providers and manage user/team settings.
*   **Authentication & Data Persistence:** User accounts and campaign data are managed via Supabase.

## Tech Stack

*   **Runtime & Tooling:** [Bun](https://bun.sh/)
*   **Frontend:** React 19, TypeScript
*   **Styling:** Tailwind CSS (via CDN)
*   **AI Integration:** Google Gemini API (`@google/genai`), OpenAI API (`openai`), and other compatible APIs.
*   **Database & Auth:** [Supabase](https://supabase.com/)
*   **Decentralized Real-time Chat:** GunDB (`gun`)
*   **Forms:** React Hook Form & Zod
*   **Calendar:** `react-big-calendar`
*   **Charts:** `recharts`
*   **Date Management:** `date-fns`

## Local Development Setup with Bun

This project is configured to run using the Bun toolkit, which provides a fast runtime, bundler, and package manager all-in-one.

### 1. Install Bun

If you don't have Bun installed, run the following command in your terminal:

```bash
curl -fsSL https://bun.sh/install | bash
```
(Follow the on-screen instructions to add Bun to your shell's PATH)

### 2. Clone the Repository

```bash
git clone <repository-url>
cd <repository-directory>
```

### 3. Install Dependencies

Install all the necessary packages using Bun. This is significantly faster than `npm install`.

```bash
bun install
```

### 4. Run the Development Server

Start the development server with hot-reloading. Bun will automatically handle TypeScript/JSX.

```bash
bun dev
```
The application will be available at `http://localhost:3000` by default.

### Available Scripts

*   `bun dev`: Starts the development server with hot-reloading.
*   `bun build`: Creates a production-ready, optimized build of the application in the `./dist` directory.
*   `bun start`: Serves the production build from the `./dist` directory.
*   `bun format`: Formats the entire codebase using Biome.
*   `bun lint`: Lints the entire codebase using Biome.

## Deployment

### Deploying to Vercel

You can easily deploy this application for free on Vercel.

1.  **Push to a Git Repository:** Ensure your project is pushed to a GitHub, GitLab, or Bitbucket repository.

2.  **Vercel Setup:**
    *   Sign up or log in to your [Vercel](https://vercel.com/) account.
    *   On your dashboard, click "Add New..." -> "Project".
    *   Import the Git repository containing your project.

3.  **Configure Project:**
    *   Vercel will automatically detect this as a **Bun** project and configure the build settings correctly.
    *   **Build Command:** Should be automatically set to `bun run build`.
    *   **Output Directory:** Should be automatically set to `dist`.
    *   You do **not** need to set up environment variables in Vercel for the client-side app to work. API keys are managed through the application's Admin Panel.

4.  **Deploy:** Click the "Deploy" button.

## API Key Configuration

PixaSocial Ai integrates with various AI models, which require API keys.

*   **Admin Panel (Primary Method):** The primary way to manage API keys is through the **Admin Panel** within the live application.
    *   Navigate to `Admin Panel` from the sidebar.
    *   Enter your API keys for the desired providers (e.g., Google Gemini, OpenAI). These keys are stored in your Supabase database.
    *   Select an "Active AI Provider" for the application to use.

## Important Notes

*   **Data Persistence:** All major data (user profiles, personas, operators, drafts, scheduled posts) is stored in your Supabase database. The Content Library and Team Chat Channels use browser `localStorage` for persistence in this version.
*   **Team Chat:** Chat messages are handled by GunDB, a decentralized database. It attempts to persist data via connected peers and uses local browser storage (IndexedDB) as a fallback.
*   **Content Library Storage:** Uploaded media assets in the Content Library are stored as base64 data URLs in `localStorage`. This is suitable for a prototype but has size limitations.