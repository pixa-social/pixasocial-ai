# PixaSocial Ai - Strategic Social Engagement Suite

PixaSocial Ai is a sophisticated, React-based web application designed for global campaign managers, strategists, and content creators. It moves beyond traditional social media scheduling by integrating **behavioral psychology**, **AI-driven assistance**, and structured strategic frameworks to help you plan, simulate, and execute high-impact social engagement campaigns.

Our platform empowers you to understand your audience on a deeper level, craft messages that resonate with their core motivations, and predict their reactions, giving you an unparalleled strategic advantage.

## Tech Stack

PixaSocial Ai is built with a modern, performant, and scalable tech stack:

*   **Runtime & Tooling:** [Bun](https://bun.sh/) (Runtime, Bundler, Package Manager)
*   **Frontend:** React 19, TypeScript, Tailwind CSS
*   **Routing:** React Router
*   **State Management:** React Hooks & Context API
*   **Backend as a Service (BaaS):** [Supabase](https://supabase.com/)
    *   **Database:** Supabase Postgres
    *   **Authentication:** Supabase Auth
    *   **Storage:** Supabase Storage for assets like avatars and content library files.
    *   **Serverless Functions:** Supabase Edge Functions (Deno) for secure backend logic.
*   **AI Integration:**
    *   Google Gemini API (`@google/genai`)
    *   OpenAI API (`openai`) & various OpenAI-compatible providers (Groq, etc.)
    *   Vercel AI SDK for streaming and unified provider access.
*   **Real-time Chat:** GunDB (`gun`) for decentralized team communication.
*   **UI Components:** Radix UI primitives, Framer Motion for animations.
*   **Forms:** React Hook Form & Zod for validation.
*   **Charts & Calendar:** `recharts` & `react-big-calendar`.

## How It Works: Backend & Architecture

The application is architected with a secure and scalable backend powered by Supabase:

*   **Client-Side:** The React frontend is a powerful user interface for managing all campaign activities.
*   **Supabase Backend:** All core data—including user profiles, personas, operators, content drafts, and settings—is stored securely in a Supabase Postgres database. Authentication is handled by Supabase Auth, supporting email/password and OAuth providers.
*   **Edge Functions:** All interactions with third-party APIs (like AI models and social media platforms) are proxied through **Supabase Edge Functions**. This is a critical security feature:
    *   **API Key Security:** Your sensitive API keys are stored and used only on the server-side, never exposed to the client's browser.
    *   **Unified Logic:** Functions like `ai-proxy` and `text-to-speech` contain the logic to interact with services like Google Gemini, OpenAI, and AWS Polly, providing a consistent interface for the frontend.
    *   **Secure Connections:** Functions for connecting social accounts (e.g., `connect-reddit`, `connect-google-business`) handle the OAuth 2.0 flow securely on the backend.

This architecture ensures that the application is not only feature-rich but also secure and robust.

## Key Modules & Features Explained

PixaSocial Ai's power comes from its interconnected modules, which guide you through a strategic workflow.

#### 1. **Audience Modeling**
*   **What it is:** The foundation of your strategy. This module lets you create detailed audience personas.
*   **How it works:** Instead of just demographics, you define psychographics, goals, fears, and core beliefs. It integrates the **Reinforcement Sensitivity Theory (RST)**, a neuropsychological model that helps you understand an individual's sensitivity to rewards (BAS), punishments (BIS), and threats (FFFS). You can create personas from scratch, use AI suggestions, or import from a global library of pre-built templates managed by an admin.

#### 2. **Operator Builder**
*   **What it is:** Your strategic toolkit for influencing perception. An "Operator" is a campaign mechanic based on principles of Pavlovian conditioning.
*   **How it works:** You define a desired response you want from a persona (e.g., "feel a sense of urgency") and link it to a conditioned stimulus (e.g., your brand's hashtag) by associating it with an unconditioned stimulus (e.g., a countdown timer). The AI can help you design these components, and you can even analyze an operator's predicted effectiveness on a specific persona.

#### 3. **Content Planner**
*   **What it is:** An AI-powered content generation engine.
*   **How it works:** Select a persona and an operator, and the AI will generate tailored content for multiple social platforms (X, Facebook, Instagram, Email, Posters, etc.). It crafts text, image prompts, meme text, and video ideas that align with your strategy. You can edit, regenerate, and save all generated content as drafts.

#### 4. **AI Agents**
*   **What it is:** A conversational AI chat interface.
*   **How it works:** Chat directly with your created personas. The AI adopts the persona's personality, beliefs, and communication style, allowing you to test ideas, gather insights, or role-play interactions in a safe environment. You can also import pre-built template agents from a global library to quickly start new conversations.

#### 5. **Analytics & Feedback Simulator**
*   **Analytics:** Generate **BRM (Behavioral Resonance Model)** scores for your personas. The AI provides a full analysis, a radar chart, and strategic recommendations based on the persona's psychological profile.
*   **Feedback Simulator:** Predict audience reactions before you post. Input your content and select a persona, and the AI will forecast audience sentiment (Positive, Neutral, Negative), predict engagement levels, and identify potential risks or misinterpretations.

#### 6. **Campaign Blueprint (Audit Tool)**
*   **What it is:** A strategic planning tool based on the **8D (Eight Disciplines) problem-solving framework**.
*   **How it works:** Define your primary campaign objective, and the AI will generate a comprehensive, structured plan covering everything from team establishment and root cause analysis to implementation and prevention of recurrence.

#### 7. **Social Poster & Calendar**
*   **Social Poster:** A central hub to create and publish posts to your connected social media accounts. You can compose new posts, attach media from your Content Library, and publish directly.
*   **Calendar:** An interactive calendar to visualize, manage, and schedule all your planned content. Drag and drop to reschedule posts and maintain a clear overview of your campaign timeline.

#### 8. **Content Library**
*   A centralized repository for all your media assets. Upload images and videos to reuse them across the Content Planner and Social Poster, ensuring brand consistency and streamlining your workflow.

---

## Local Development Setup

This project is configured to run using the **Bun toolkit**.

### 1. Prerequisites
First, ensure you have Bun installed. If not, run the following command in your terminal:
```bash
curl -fsSL https://bun.sh/install | bash
```
Follow the on-screen instructions to add Bun to your shell's `PATH`.

### 2. Clone the Repository
```bash
git clone <repository-url>
cd pixasocial-ai # Or your repository directory name
```

### 3. Install Dependencies
Use Bun to install all the necessary packages. This is significantly faster than `npm install`.
```bash
bun install
```

### 4. Configure Environment Variables
You need to connect the application to your own Supabase project.

1.  Create a new project on [Supabase](https://supabase.com/).
2.  In your Supabase project dashboard, go to **Project Settings > API**.
3.  Create a file named `.env` in the root of your local project directory.
4.  Copy the contents of the example below into your `.env` file and replace the placeholder values with your actual Supabase credentials.

**`.env.example`:**
```env
# Supabase Project URL and Anon Key (from Project Settings > API)
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
```
*Note: Using a `.env` file is the recommended and more secure practice for local development, even if the source code contains hard-coded fallback keys.*

### 5. Run the Development Server
Start the development server with hot-reloading. Bun will automatically handle TypeScript and JSX compilation.
```bash
bun dev
```
The application will be available at `http://localhost:3000` by default.

## Available Scripts

*   `bun dev`: Starts the development server with hot-reloading.
*   `bun build`: Creates a production-ready, optimized build in the `./public` directory.
*   `bun start`: Serves the production build from the `./public` directory.
*   `bun lint`: Lints the entire codebase using Biome.
*   `bun format`: Formats the entire codebase using Biome.

## API Key Configuration

PixaSocial Ai integrates with various AI models, which require API keys.

*   **Admin Panel (Primary Method):** For the live application, the primary way to manage API keys is through the **Admin Panel**. Navigate to `Admin Panel > AI Providers` to enter your keys for services like Google Gemini, OpenAI, etc. These are stored securely in your Supabase database.
*   **Environment Variables (For Edge Functions):** Some backend Edge Functions that connect to services like AWS Polly for text-to-speech may require environment variables to be set directly in your Supabase project settings. Go to **Project Settings > Edge Functions** to configure these secrets for your deployed application. For local development, these can be added to a `.env` file.