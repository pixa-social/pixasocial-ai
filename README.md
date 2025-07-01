# PixaSocial Ai - Strategic Social Engagement Suite

PixaSocial Ai is a React-based web application designed for planning, simulating, and evaluating social engagement strategies. It leverages behavioral insights, psychological frameworks like Reinforcement Sensitivity Theory (RST), AI-driven assistance, and decentralized real-time communication to support global campaign managers.

## Features

*   **Dashboard:** Dynamic overview of your campaign data, upcoming posts, and quick actions.
*   **Audience Modeling:** Create detailed audience personas using RST (BAS, BIS, FFFS) and AI-assisted suggestions.
*   **Operator Builder:** Design campaign mechanics (Hope, Fear, Custom, etc.) based on Pavlovian conditioning principles, tailored to specific personas.
*   **Content Planner:** Generate multi-platform content (X, Facebook, Instagram, Email, Posters) with AI, including text, image prompts, meme text, and video ideas. Features iterative regeneration, tone control, image processing (meme text overlay), and platform selection.
*   **Calendar:** Schedule and visualize your content plan with an interactive calendar, featuring drag-and-drop rescheduling and status updates.
*   **Content Library:** Upload, store, and manage reusable media assets (images, videos) locally.
*   **Team Chat:** Real-time, decentralized chat for team collaboration using GunDB. Supports text messages and file attachments (with image previews).
*   **Feedback Simulator:** Predict audience reactions (sentiment, engagement, risks) to your content using AI.
*   **Audit Tool:** Apply the 8D problem-solving process to your campaigns with AI assistance.
*   **Methodology:** In-app documentation explaining the core concepts and workflows.
*   **Admin Panel:** Configure and manage API keys for various AI providers (Gemini, OpenAI, etc.) and select the active provider.
*   **Settings:** Simulate connecting social media accounts, manage user profile details (e.g., wallet address), and manage team members (mock invitations).
*   **Simulated Authentication:** Homepage, login, and registration flow (client-side, using `localStorage`).
*   **Persistent Data:**
    *   Campaign data (personas, operators, drafts, scheduled posts, AI configs, user/team settings) is saved in `localStorage`.
    *   Chat messages are persisted via GunDB, offering decentralized storage.
*   **Responsive Design:** UI adapts to different screen sizes.
*   **Toast Notifications:** User-friendly feedback for actions.

## Tech Stack

*   **Frontend:** React 19, TypeScript
*   **Styling:** Tailwind CSS (via CDN)
*   **AI Integration:** Google Gemini API (`@google/genai`), OpenAI API (`openai`), and other compatible APIs.
*   **Decentralized Real-time Chat:** GunDB (`gun`)
*   **Calendar:** `react-big-calendar`
*   **Date Management:** `date-fns`
*   **Charts:** `recharts` (though not heavily used in the current Dashboard)
*   **No Build Step Required for this Version:** Runs directly from `index.html` using ES modules and CDNs (esm.sh).

## Prerequisites

Before you begin, ensure you have the following:

*   **A Modern Web Browser:** Chrome, Firefox, Safari, or Edge.
*   **An Internet Connection:** Required to load dependencies from the CDN and for real-time chat functionality.
*   **Git:** To clone the repository.
*   **Node.js (Optional):** Required only if you want to use the `npx serve` command for the local development server. You can download it from [nodejs.org](https://nodejs.org/).

## Local Development Setup

While you can open `index.html` directly in a browser, running a local development server is the recommended approach. It avoids potential issues with browser security policies (like CORS) and ensures the application runs in a web-like environment (`http://` protocol instead of `file:///`).

### 1. Clone the Repository

First, clone the project to your local machine:

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Start the Development Server

You have several options to serve the `index.html` file. Choose one of the following methods.

#### Option A: Using Python (Recommended if you have Python installed)

Python comes with a built-in web server.

1.  Make sure you have Python 3 installed. You can check by running `python3 --version`.
2.  In the project's root directory (where `index.html` is located), run:

    ```bash
    # For Python 3
    python3 -m http.server

    # If the above doesn't work, you might be on an older system with Python 2
    # python -m SimpleHTTPServer
    ```
3.  Open your browser and navigate to `http://localhost:8000`.

#### Option B: Using Node.js and `serve` (Recommended if you have Node.js)

The `serve` package is a simple, zero-configuration command-line utility for static files.

1.  Make sure you have Node.js and npm installed (`npm` comes with Node.js).
2.  In the project's root directory, run the following command. `npx` will temporarily install and run the `serve` package without adding it to your project.

    ```bash
    npx serve
    ```
3.  The command will output a local address, typically `http://localhost:3000`. Open this URL in your browser.

#### Option C: Using a VS Code Extension

If you are using Visual Studio Code as your editor, the **Live Server** extension is an excellent choice.

1.  Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) from the VS Code Marketplace.
2.  Open the project folder in VS Code.
3.  Right-click on the `index.html` file in the Explorer panel and select "Open with Live Server".
4.  This will automatically open a new tab in your default browser with the application running. It also provides live reloading.

### 3. Application Dependencies

This project is configured to run **without a local build step or package manager like `npm install`**. All dependencies are loaded directly in the browser from a CDN (Content Delivery Network) via an `importmap` in `index.html`.

This means:
- You **do not** need to run `npm install`.
- An internet connection is required during development to fetch these libraries.

The key dependencies loaded via CDN include:
- **React & ReactDOM:** For the user interface.
- **Tailwind CSS:** For styling.
- **@google/genai:** The Google Gemini AI SDK.
- **date-fns:** For date manipulation.
- **react-big-calendar:** For the calendar view.
- **recharts:** For charts and graphs.
- **gun:** For decentralized real-time chat.
- **react-hook-form, zod:** For form management and validation.

## Deployment

### Deploying to Vercel

You can easily deploy this static application for free on Vercel.

1.  **Push to a Git Repository:** Ensure your project is pushed to a GitHub, GitLab, or Bitbucket repository.

2.  **Vercel Setup:**
    *   Sign up or log in to your [Vercel](https://vercel.com/) account.
    *   On your dashboard, click "Add New..." -> "Project".
    *   Import the Git repository containing your project.

3.  **Configure Project:**
    *   Vercel will likely detect this as a project with no framework. It will choose "Other" as the **Framework Preset**. This is correct.
    *   Expand the "Build and Output Settings" section.
    *   Ensure the following settings are applied:
        *   **Build Command:** Leave this **blank**. This project requires no build step.
        *   **Output Directory:** Leave this as the default. Vercel will correctly serve the root directory.
        *   **Install Command:** Leave this **blank**.
    *   You do **not** need to set up environment variables here (see note below).

4.  **Deploy:**
    *   Click the "Deploy" button. Vercel will deploy your site and provide you with a live URL.

5.  **Post-Deployment: Configure API Keys on the Live Site (CRUCIAL):**
    *   **Important:** Vercel's Environment Variables (set in the project dashboard) are for build-time and server-side functions. They are **not accessible** by client-side JavaScript in the browser for security reasons. Therefore, the code's ability to check `process.env.API_KEY` will not work on your live deployment.
    *   After your app is deployed, you **must** visit your live Vercel URL, log in, and navigate to the **Admin Panel**.
    *   In the Admin Panel, enter your AI provider API keys.
    *   The application will save these keys securely in *your* browser's local storage, scoped only to that domain. This is the intended way for the live application to function.

## API Key Configuration

PixaSocial Ai integrates with various AI models. API keys are required for these services to function.

*   **Admin Panel (Primary Method for Live & Local):** The primary way to manage API keys is through the "Admin Panel" within the application.
    *   Navigate to `Admin Panel` from the sidebar.
    *   Enter your API keys for the desired providers (e.g., Google Gemini, OpenAI).
    *   Select an "Active AI Provider."
    *   **Security Warning:** API keys entered here are stored in your browser's `localStorage`. This is for ease of use in a development/prototype setting and is **not secure for production environments or shared computers.**

*   **Google Gemini & `process.env.API_KEY` (For Backend/Build Environments):**
    *   The application's AI service files (e.g., `services/ai/geminiAIService.ts`) are written to potentially use `process.env.API_KEY` for Google Gemini if available in the execution context and no overriding key is provided in the Admin Panel.
    *   In the current pure client-side setup, this `process.env` check will not work in a deployed browser environment. It is included for forward-compatibility with a potential future backend (see `backend.md`). **For this version, always use the Admin Panel to set your keys.**

## Key Modules Overview

*   **`App.tsx`:** Main application component, handles routing, global state, and data persistence for most campaign data.
*   **`components/`:** Contains all UI components, organized by view or UI element type.
    *   `components/ui/`: Reusable UI elements like `Button`, `Card`, `Input`, `Toast`.
    *   `components/auth/`: Components for the authentication flow (Homepage, Login, Register).
    *   `components/audience-modeling/`, `components/content-planner/`: Sub-components for specific views.
    *   Other component files correspond to the main views (e.g., `AudienceModelingView.tsx`, `ContentPlannerView.tsx`, `ChatView.tsx`).
*   **`services/`:**
    *   `services/aiService.ts`: Main entry point for AI operations, delegating to provider-specific services.
    *   `services/ai/geminiAIService.ts`: Handles interactions specifically with the Google Gemini API.
    *   `services/ai/openAICompatibleAIService.ts`: Handles interactions with OpenAI and other OpenAI-compatible APIs.
    *   `services/ai/aiUtils.ts`: Utility functions for AI configuration management and response parsing.
*   **`constants.ts`:** Stores application-wide constants like navigation items, API model names, and UI options.
*   **`types.ts`:** Defines TypeScript interfaces and types used throughout the application.
*   **`index.html`:** The main entry point, includes CDN links and Tailwind CSS configuration.
*   **`index.tsx`:** Mounts the React application to the DOM.
*   **`backend.md`:** While the current application is client-side, this markdown file outlines a potential backend architecture for future development into a full-stack application.

## Important Notes & Limitations

*   **Client-Side Application:** All logic, including simulated authentication and data storage (localStorage, GunDB's local persistence), runs in the user's browser.
*   **Simulated Authentication:** The login/registration system uses `localStorage` and is for demonstration purposes only. It is not secure.
*   **Data Persistence:**
    *   Most campaign data (personas, operators, drafts, AI configs, settings) is stored in `localStorage`. This data will persist in the browser until explicitly cleared.
    *   **Chat messages** are handled by GunDB. GunDB attempts to persist data decentrally via connected peers and uses local browser storage (IndexedDB via `rindexed` adapter) as a fallback. Data availability in chat can depend on peer connectivity and local storage integrity.
*   **API Key Security:** As mentioned, API keys entered in the Admin Panel are stored in `localStorage`. Be cautious if using real, sensitive API keys.
*   **AI Provider Integrations:**
    *   The application provides a framework to connect to multiple AI providers.
    *   Full functionality (text, JSON, images, streaming) is implemented for Google Gemini and OpenAI.
    *   Other providers like Deepseek and GroqCloud are supported via their OpenAI-compatible APIs for text/JSON and streaming.
    *   Anthropic and Qwen are placeholders and would require their specific SDKs/API logic to be fully implemented.
*   **Content Library Storage:** Uploaded media assets in the Content Library are stored as base64 data URLs in `localStorage`. This is suitable for a prototype but has size limitations and is not efficient for large files or many assets.

This README provides a guide to get PixaSocial Ai up and running for exploration and client-side development.
