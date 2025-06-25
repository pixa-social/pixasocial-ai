
# PixaSocial Ai - Strategic Social Engagement Suite

PixaSocial Ai is a React-based web application designed for planning, simulating, and evaluating social engagement strategies. It leverages behavioral insights, psychological frameworks like Reinforcement Sensitivity Theory (RST), and AI-driven assistance to support global campaign managers.

## Features

*   **Dashboard:** Dynamic overview of your campaign data, upcoming posts, and quick actions.
*   **Audience Modeling:** Create detailed audience personas using RST (BAS, BIS, FFFS) and AI-assisted suggestions.
*   **Operator Builder:** Design campaign mechanics (Hope, Fear, Custom, etc.) based on Pavlovian conditioning principles, tailored to specific personas.
*   **Content Planner:** Generate multi-platform content (X, Facebook, Instagram, Email) with AI, including text, image prompts, meme text, and video ideas. Features iterative regeneration, tone control, and platform selection.
*   **Calendar:** Schedule and visualize your content plan with an interactive calendar.
*   **Feedback Simulator:** Predict audience reactions (sentiment, engagement, risks) to your content using AI.
*   **Audit Tool:** Apply the 8D problem-solving process to your campaigns with AI assistance.
*   **Data Analyzer:** (Client-Side) Ingest and preview customer data from CSV/JSON files for future analysis.
*   **Admin Panel:** Configure and manage API keys for various AI providers (Gemini, OpenAI, etc.).
*   **Settings:** Simulate connecting social media accounts for campaign planning.
*   **Simulated Authentication:** Homepage, login, and registration flow (client-side, using `localStorage`).
*   **Persistent Data:** Personas, operators, drafts, scheduled posts, and settings are saved in `localStorage`.
*   **Responsive Design:** UI adapts to different screen sizes.

## Tech Stack

*   **Frontend:** React 19, TypeScript
*   **Styling:** Tailwind CSS (via CDN)
*   **AI Integration:** Google Gemini API, OpenAI API (and other compatible APIs like Deepseek, GroqCloud)
*   **Modules:**
    *   `react-big-calendar` for the Calendar view.
    *   `date-fns` for date localization.
    *   `recharts` for charts (though current dashboard charts are removed for dynamic content).
*   **No Build Step Required for this Version:** Runs directly from `index.html` using ES modules and CDNs (esm.sh).

## Prerequisites

*   A modern web browser (e.g., Chrome, Firefox, Safari, Edge).
*   An internet connection (to load CDN resources like Tailwind CSS, React, and AI SDKs).

## Getting Started

1.  **Clone the Repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Open in Browser:**
    *   Simply open the `index.html` file directly in your web browser.
    *   No compilation or local server is strictly necessary to run this version of the application.

## API Key Configuration

PixaSocial Ai integrates with various AI models. API keys are required for these services to function.

*   **Admin Panel:** The primary way to manage API keys is through the "Admin Panel" within the application.
    *   Navigate to `Admin Panel` from the sidebar.
    *   Enter your API keys for the desired providers (e.g., Google Gemini, OpenAI).
    *   Select an "Active AI Provider."
    *   **Security Warning:** API keys entered here are stored in your browser's `localStorage`. This is for ease of use in a development/prototype setting and is **not secure for production environments or shared computers.**

*   **Google Gemini & `process.env.API_KEY`:**
    *   The application's `aiService.ts` is written to potentially use `process.env.API_KEY` for Google Gemini.
    *   In this pure client-side setup, `process.env` is not directly available as it would be in a Node.js environment.
    *   If you wish to use a "hardcoded" Gemini key without the Admin Panel (e.g., for personal testing and if you modify the code):
        1.  Open `services/aiService.ts`.
        2.  Locate the `getApiKeyForProvider` function.
        3.  For the `AiProviderType.Gemini` case, you could modify it to return your key directly if `config.apiKey` is not set.
        *However, using the Admin Panel is the intended way for this client-side version.*

## Key Modules Overview

*   **`App.tsx`:** Main application component, handles routing, global state, and data persistence.
*   **`components/`:** Contains all UI components, organized by view or UI element type.
    *   `components/ui/`: Reusable UI elements like `Button`, `Card`, `Input`, `Toast`.
    *   `components/auth/`: Components for the authentication flow (Homepage, Login, Register).
    *   Other component files correspond to the main views (e.g., `AudienceModelingView.tsx`, `ContentPlannerView.tsx`).
*   **`services/aiService.ts`:** Handles all interactions with AI providers (Gemini, OpenAI, etc.). This is where API calls are made.
*   **`constants.ts`:** Stores application-wide constants like navigation items, API model names, and UI options.
*   **`types.ts`:** Defines TypeScript interfaces and types used throughout the application.
*   **`index.html`:** The main entry point, includes CDN links and Tailwind CSS configuration.
*   **`index.tsx`:** Mounts the React application to the DOM.

## Development

*   **Editing:** You can directly edit the `.tsx` and `.ts` files. Changes will be reflected when you refresh `index.html` in your browser.
*   **Main Application Logic:** `App.tsx` orchestrates the views and global state.
*   **View Components:** Each feature module (e.g., Audience Modeling) has its primary component in the `components/` directory (e.g., `AudienceModelingView.tsx`).

## Important Notes & Limitations

*   **Client-Side Application:** All logic, including simulated authentication and data storage, runs in the user's browser.
*   **Simulated Authentication:** The login/registration system uses `localStorage` and is for demonstration purposes only. It is not secure.
*   **Data Persistence:** Campaign data (personas, operators, drafts, settings) is stored in `localStorage`. This data will persist in the browser until explicitly cleared or if the browser's storage is wiped. It is not tied to the mock user accounts across different browsers or if `localStorage` is cleared.
*   **API Key Security:** As mentioned, API keys entered in the Admin Panel are stored in `localStorage`. Be cautious if using real, sensitive API keys, especially on shared machines.
*   **AI Provider Integrations:**
    *   The application provides a framework to connect to multiple AI providers.
    *   Full functionality (text, JSON, images, streaming) is implemented for Google Gemini and OpenAI.
    *   Other providers like Deepseek and GroqCloud are supported via their OpenAI-compatible APIs for text/JSON.
    *   Anthropic and Qwen are placeholders and would require their specific SDKs/API logic to be fully implemented in `aiService.ts`.
*   **`services/geminiService.ts`:** This file is currently empty and appears to be a remnant. All AI provider logic is handled by `services/aiService.ts`.

This README provides a basic guide to get PixaSocial Ai up and running for exploration and client-side development.
```