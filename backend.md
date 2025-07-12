# PixaSocial AI - Backend Specification

## 1. Introduction

This document outlines the backend architecture and specifications for the PixaSocial Ai application. The backend will be responsible for user authentication, data persistence, AI service proxying, real-time communication, and file management, transforming the current client-side prototype into a robust, multi-user web application.

### 1.1. Core Responsibilities

*   Securely manage user accounts and authentication.
*   Store and manage all campaign-related data (Personas, Operators, Content Drafts, etc.).
*   Act as a secure proxy for all AI API calls (Gemini, OpenAI, etc.), protecting API keys.
*   Provide real-time chat functionality for team collaboration.
*   Manage file uploads and storage for the Content Library and chat attachments.
*   Enforce business logic and data validation, including AI credit usage.

### 1.2. Technology Stack Considerations

This document will primarily reference a **Node.js** environment, potentially using **Express.js** or a similar framework (like NestJS for a more structured approach).

*   **Database:**
    *   **MongoDB:** A NoSQL document database, good for flexible schemas and scalability. Schemas will be described with Mongoose-like syntax.
    *   **Supabase (PostgreSQL):** An open-source Firebase alternative, providing a PostgreSQL database, authentication, real-time subscriptions, and storage. Schemas will be described in SQL-like terms.
*   **Authentication:** JWT (JSON Web Tokens) for stateless authentication.
*   **Real-time Communication (for Chat):**
    *   **Socket.IO** (if using a custom Node.js server).
    *   **Supabase Realtime** (if using Supabase, leveraging its built-in capabilities).
*   **File Storage:**
    *   **AWS S3, Google Cloud Storage, or similar** (for custom Node.js server).
    *   **Supabase Storage** (if using Supabase).
*   **Object-Relational Mapper (ORM) / Object-Document Mapper (ODM):**
    *   **Mongoose** for MongoDB.
    *   **Prisma** or **TypeORM** if using Node.js with PostgreSQL (or Supabase direct SDK).
*   **Email Service (for password reset, invitations):**
    *   SendGrid, Mailgun, AWS SES.
*   **Scheduled Jobs (for credit reset):**
    *   **pg_cron** for PostgreSQL/Supabase.
    *   Node-cron or similar for Node.js server.

## 2. Authentication and User Management

Handles user registration, login, session management, and profile updates.

### 2.1. User Model

**MongoDB (Mongoose Schema):**

```javascript
const UserSchema = new mongoose.Schema({
  name: { type: String, required: false },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  walletAddress: { type: String, trim: true },
  teamIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date }
});
```

**Supabase (PostgreSQL Table):**

```sql
-- Note: Supabase provides its own 'auth.users' table.
-- You will extend it using a separate 'profiles' table linked by user_id.
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  wallet_address TEXT,
  ai_usage_count_monthly INT DEFAULT 0 NOT NULL, -- ADD THIS FIELD
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2. API Endpoints

*   **`POST /api/v1/auth/register`**
    *   **Request Body:** `{ name?: string, email, password }`
    *   **Logic:**
        1.  Validate input.
        2.  Check if email already exists.
        3.  Hash password (e.g., using bcrypt).
        4.  Create new user record in `auth.users` (Supabase handles this) and `profiles`.
    *   **Response:** `201 Created` with `{ message: "User registered successfully" }` or user object (excluding password).

*   **`POST /api/v1/auth/login`**
    *   **Request Body:** `{ email, password }`
    *   **Logic:**
        1.  Find user by email.
        2.  Compare hashed password.
        3.  If valid, generate JWT (containing user ID, possibly role).
    *   **Response:** `200 OK` with `{ token, user: { id, name, email, walletAddress, teamIds, aiUsageCount, role } }`.

*   **`GET /api/v1/auth/me`** (Requires Authentication)
    *   **Logic:** Validate JWT from Authorization header, fetch user details including profile, role, and AI usage.
    *   **Response:** `200 OK` with user object (excluding password).

*   **`POST /api/v1/auth/forgot-password`**
    *   **Request Body:** `{ email }`
    *   **Logic:**
        1.  Find user by email.
        2.  Generate a unique, short-lived password reset token.
        3.  Store token and expiry on user record.
        4.  Send email with password reset link (containing token).
    *   **Response:** `200 OK` with `{ message: "Password reset email sent if user exists." }`.

*   **`POST /api/v1/auth/reset-password`**
    *   **Request Body:** `{ token, newPassword }`
    *   **Logic:**
        1.  Find user by reset token and check expiry.
        2.  Validate new password strength.
        3.  Hash new password.
        4.  Update user's password, clear reset token.
    *   **Response:** `200 OK` with `{ message: "Password reset successfully." }`.

*   **`PUT /api/v1/users/me`** (Requires Authentication)
    *   **Request Body:** `{ name?: string, walletAddress?: string }` (or any updatable fields from User/Profile model).
    *   **Logic:** Update user's profile information.
    *   **Response:** `200 OK` with updated user object.

## 3. Team Management

Manages teams, members, and invitations. (The current frontend has basic team member email list; this section expands it for a real backend).

### 3.1. Team & Invitation Models

**MongoDB (Mongoose Schemas):**

```javascript
const TeamMemberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
  joinedAt: { type: Date, default: Date.now }
});

const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [TeamMemberSchema],
  createdAt: { type: Date, default: Date.now }
});

const TeamInvitationSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  email: { type: String, required: true, lowercase: true, trim: true }, // Email of the invitee
  token: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined', 'expired'], default: 'pending' },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});
```

**Supabase (PostgreSQL Tables):**

```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE team_role AS ENUM ('owner', 'admin', 'member');
CREATE TABLE team_members (
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role team_role DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  status invitation_status DEFAULT 'pending',
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
*(User's current team can be a primary team or derived from `team_members` table)*

### 3.2. API Endpoints

*   **`POST /api/v1/teams`** (Req Auth): Create a new team. User becomes owner.
*   **`GET /api/v1/teams`** (Req Auth): List teams user belongs to.
*   **`GET /api/v1/teams/{teamId}`** (Req Auth, Member of team): Get team details.
*   **`POST /api/v1/teams/{teamId}/invitations`** (Req Auth, Owner/Admin):
    *   **Request Body:** `{ email: string }`
    *   **Logic:** Create `TeamInvitation`, generate unique token, send email. (Max 3 members logic from frontend constants needs to be enforced here).
*   **`GET /api/v1/invitations/{inviteToken}`**: Verify invitation token.
*   **`POST /api/v1/invitations/{inviteToken}/accept`** (Req Auth if user exists, or part of registration flow):
    *   **Logic:** Validate token. Add user to `TeamMembers`. Update `User`'s `teamIds`. Mark invitation as 'accepted'.
*   **`DELETE /api/v1/teams/{teamId}/members/{userIdToRemove}`** (Req Auth, Owner/Admin): Remove a member.
*   **`GET /api/v1/teams/{teamId}/members`** (Req Auth, Member of team): List team members.

## 4. AI Provider Configuration Management

Securely stores API keys and manages configurations per user or team.

### 4.1. AIProviderUserConfig Model

**MongoDB:**

```javascript
const AIProviderUserConfigSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Or teamId
  providerId: { type: String, required: true }, // e.g., 'Gemini', 'OpenAI'
  encryptedApiKey: { type: String, required: false }, // API Key encrypted
  isEnabled: { type: Boolean, default: true },
  // Storing models and baseURL allows overriding defaults if necessary per user/team
  models: { 
    text: [{ type: String }],
    image: [{ type: String }],
    chat: [{ type: String }]
  },
  baseURL: { type: String }
});
// Unique compound index on userId and providerId
```

**Supabase/PostgreSQL:**

```sql
CREATE TABLE ai_provider_user_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Or team_id
  provider_id TEXT NOT NULL, -- AiProviderType enum values
  encrypted_api_key TEXT,
  is_enabled BOOLEAN DEFAULT TRUE,
  models JSONB, -- {"text": ["model1"], "image": ["img_model1"]}
  base_url TEXT,
  UNIQUE(user_id, provider_id)
);
```

### 4.2. API Endpoints

*   **`GET /api/v1/ai-configs`** (Req Auth):
    *   **Logic:** Fetch all AI provider configurations for the authenticated user. Decrypt keys *only if absolutely necessary for transfer to a secure client-side context (generally avoid)*. Ideally, keys stay on backend. The frontend `AdminPanel` would fetch configs *without* keys, and keys are only used by the backend proxy. If frontend needs to know *if* a key is set, return a boolean.
    *   **Response:** Array of `AiProviderConfig` objects (with `apiKey` field being a boolean like `hasApiKey: true/false` or omitted).
*   **`PUT /api/v1/ai-configs`** (Req Auth):
    *   **Request Body:** Array of `AiProviderConfig` objects to update/create. API keys should be sent for encryption.
    *   **Logic:** For each config, find or create. If API key is provided, encrypt it (e.g., using AES-256 with a key derived from user's master key or a dedicated encryption key). Store.
    *   **Response:** `200 OK` with updated configurations (again, `apiKey` as boolean).
*   **`PUT /api/v1/ai-configs/active`** (Req Auth):
    *   **Request Body:** `{ activeProvider: AiProviderType }`
    *   **Logic:** Store user's preferred active AI provider (e.g., in User model or separate preferences table).
    *   **Response:** `200 OK`.

**Encryption:** API keys MUST be encrypted at rest. Use Node.js `crypto` module or managed KMS.

## 5-8. Campaign Data Management (Personas, Operators, Content Drafts, Scheduled Posts)

These follow standard CRUD patterns.

### 5.1. Persona Model (Example)

**MongoDB:**

```javascript
const RSTProfileSchema = new mongoose.Schema({
  bas: { type: String, enum: ['Not Assessed', 'Low', 'Medium', 'High'], default: 'Not Assessed' },
  bis: { type: String, enum: ['Not Assessed', 'Low', 'Medium', 'High'], default: 'Not Assessed' },
  fffs: { type: String, enum: ['Not Assessed', 'Low', 'Medium', 'High'], default: 'Not Assessed' }
}, { _id: false });

const PersonaSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Or teamId
  name: { type: String, required: true },
  demographics: { type: String, required: true },
  psychographics: { type: String, required: true },
  initialBeliefs: { type: String, required: true },
  vulnerabilities: [{ type: String }],
  avatarUrl: { type: String },
  rstProfile: RSTProfileSchema,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

**Supabase/PostgreSQL:**

```sql
CREATE TYPE rst_trait_level AS ENUM ('Not Assessed', 'Low', 'Medium', 'High');
CREATE TABLE personas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Or team_id
  name TEXT NOT NULL,
  demographics TEXT NOT NULL,
  psychographics TEXT NOT NULL,
  initial_beliefs TEXT NOT NULL,
  vulnerabilities TEXT[],
  avatar_url TEXT,
  rst_profile_bas rst_trait_level DEFAULT 'Not Assessed',
  rst_profile_bis rst_trait_level DEFAULT 'Not Assessed',
  rst_profile_fffs rst_trait_level DEFAULT 'Not Assessed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2. Generic CRUD API Endpoints (Apply to Personas, Operators, Content Drafts, Scheduled Posts)

Replace `{entity}` with `personas`, `operators`, `content-drafts`, `scheduled-posts`.
All require authentication and should be scoped to the `userId` or `teamId`.

*   **`POST /api/v1/{entity}`**: Create a new entity.
*   **`GET /api/v1/{entity}`**: List all entities for the user/team.
*   **`GET /api/v1/{entity}/{id}`**: Get a specific entity.
*   **`PUT /api/v1/{entity}/{id}`**: Update an entity.
*   **`DELETE /api/v1/{entity}/{id}`**: Delete an entity.

**Specific Considerations for Content Drafts:**
The `platformContents` field is a map.
**MongoDB:** Can store as a nested object or `Map`.
**Supabase/PostgreSQL:** Could be a JSONB column.

```javascript
// Example PlatformContentDetail for Mongoose sub-document
const PlatformContentDetailSchema = new mongoose.Schema({
  content: String,
  hashtags: [String],
  mediaType: String, // 'none', 'image', 'video'
  subject: String,
  imageSourceType: String, // 'generate', 'upload', 'library'
  imagePrompt: String,
  // For uploadedImageBase64, store as file path/URL after upload
  uploadedImageFilename: String, // or uploadedImageStoragePath
  libraryAssetId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentLibraryAsset' },
  memeText: String,
  // For processedImageUrl, store as file path/URL after processing
  processedImageFilename: String, // or processedImageStoragePath
  videoIdea: String
}, { _id: false });

// In ContentDraftSchema:
// platformContents: { type: Map, of: PlatformContentDetailSchema }
```

**Scheduled Posts:** Dates should be stored in UTC and handled carefully with timezones.

## 9. Content Library

Handles storage and retrieval of media assets.

### 9.1. ContentLibraryAsset Model

**MongoDB:**

```javascript
const ContentLibraryAssetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Or teamId
  name: { type: String, required: true },
  type: { type: String, enum: ['image', 'video'], required: true },
  storagePath: { type: String, required: true }, // e.g., 'user_id/assets/filename.jpg' in S3/GCS
  fileName: { type: String, required: true },
  fileType: { type: String, required: true }, // MIME type
  size: { type: Number, required: true }, // In bytes
  uploadedAt: { type: Date, default: Date.now }
});
```

**Supabase/PostgreSQL:**

```sql
CREATE TABLE content_library_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Or team_id
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  storage_path TEXT NOT NULL, -- Path within Supabase Storage or other provider
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- MIME type
  size BIGINT NOT NULL, -- In bytes
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 9.2. API Endpoints

*   **`POST /api/v1/content-library/upload`** (Req Auth):
    *   **Request:** `multipart/form-data` with file and `name` field.
    *   **Logic:**
        1.  Validate file type, size (as per frontend constants).
        2.  Upload file to chosen storage (S3, GCS, Supabase Storage). Get back URL/path.
        3.  Create `ContentLibraryAsset` record in DB with metadata and storage path.
    *   **Response:** `201 Created` with asset metadata.
*   **`GET /api/v1/content-library`** (Req Auth): List assets for user/team. Should include pre-signed URLs if files are private.
*   **`DELETE /api/v1/content-library/{assetId}`** (Req Auth):
    *   **Logic:** Delete file from storage, then delete DB record.
    *   **Response:** `204 No Content`.

## 10. Connected Social Accounts

This section describes the backend implementation for a real OAuth 2.0 flow.

### 10.1. ConnectedAccount Model

The model needs to securely store authentication tokens provided by the social platforms.

**Supabase/PostgreSQL:**

```sql
-- Ensure the pgcrypto extension is enabled for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE connected_accounts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'Instagram', 'Facebook', etc.
  platform_account_id TEXT NOT NULL, -- The user's ID on the social platform
  display_name TEXT NOT NULL,
  profile_image_url TEXT,
  -- Encrypt tokens at rest using a strong secret key managed by the backend
  encrypted_access_token TEXT NOT NULL,
  encrypted_refresh_token TEXT, -- For services that use refresh tokens
  scopes TEXT[], -- The permissions granted by the user
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- If the access token has an expiry
  UNIQUE(user_id, platform)
);
```

### 10.2. API Endpoints for OAuth 2.0 Flow

*   **`GET /api/v1/connect/{platform}`** (Requires Authentication)
    *   **Logic:**
        1.  The backend retrieves its `client_id` and required `scopes` for the requested `{platform}` from secure environment variables.
        2.  It generates a unique, unguessable `state` parameter and stores it in the user's session (e.g., in a secure, httpOnly cookie) to prevent CSRF attacks.
        3.  It constructs the full authorization URL for the social platform, including `response_type=code`, `client_id`, `redirect_uri` (pointing to the callback endpoint below), `scope`, and the `state` parameter.
        4.  It responds with a `302 Found` redirect, sending the user's browser to the platform's authentication and consent screen.

*   **`GET /api/v1/connect/{platform}/callback`**
    *   **Logic:**
        1.  This endpoint is the `redirect_uri` registered with the social platform. The platform redirects the user here after they grant permission.
        2.  The endpoint receives a `code` and `state` in the query parameters.
        3.  **Security Check:** It compares the received `state` with the one stored in the user's session. If they don't match, the request is aborted to prevent CSRF.
        4.  The backend makes a secure, server-to-server `POST` request to the platform's token endpoint, exchanging the `code`, its `client_id`, and its `client_secret` for an `access_token` and (if applicable) a `refresh_token`.
        5.  The backend encrypts the received tokens using a strong encryption key (e.g., AES-256-GCM) before storing them.
        6.  It uses the newly acquired access token to make a call to the platform's API to get the user's profile information (like `platform_account_id`, `display_name`, `profile_image_url`).
        7.  It creates or updates the record in the `connected_accounts` table for the authenticated user with all the retrieved and encrypted information.
        8.  Finally, it redirects the user back to the frontend's settings page (e.g., `https://app.pixasocial.ai/settings?connection_status=success&platform={platform}`).

*   **`GET /api/v1/connected-accounts`** (Requires Authentication)
    *   **Logic:** Lists the user's connected accounts, providing non-sensitive information like `platform`, `displayName`, and `profileImageUrl`. It **must not** return the tokens.
    *   **Response:** `200 OK` with an array of connected accounts.

*   **`DELETE /api/v1/connected-accounts/{platform_account_id}`** (Requires Authentication)
    *   **Logic:**
        1.  Removes the corresponding record from the `connected_accounts` table.
        2.  (Optional but recommended) Makes an API call to the social platform to revoke the token, invalidating the application's access.
    *   **Response:** `204 No Content`.


## 11. AI Service Proxy & Credit System

All AI calls from the frontend go through these backend endpoints. The backend then uses the appropriate (user/team-configured) AI provider and securely stored API key, while also enforcing usage limits.

### 11.1. Common Logic for AI Endpoints

1.  Identify authenticated user/team.
2.  **Credit Check:**
    *   Fetch the user's current `ai_usage_count_monthly` and their role's `max_ai_uses_monthly`.
    *   If `usage >= max`, return a `403 Forbidden` error with a clear message (e.g., "AI credit limit reached").
3.  **Execution Config:** Determine active AI provider and model from user/team config (fallback to defaults if needed).
4.  Retrieve (and decrypt if necessary) the API key for that provider.
5.  Initialize the AI SDK (Gemini, OpenAI, etc.) with the key and any specific baseURL.
6.  Make the actual API call to the AI provider.
7.  **On successful response, increment the user's credit usage:**
    *   `UPDATE profiles SET ai_usage_count_monthly = ai_usage_count_monthly + 1 WHERE user_id = :userId;`
8.  Return the response (or error) to the client.

### 11.2. API Endpoints

*   **`POST /api/v1/ai/generate-text`** (Req Auth)
    *   **Request Body:** `{ prompt: string, systemInstruction?: string, useGoogleSearch?: boolean }`
    *   **Response:** `{ text: string | null, error?: string, groundingChunks?: GroundingChunk[] }`
    *   **Logic:** If `useGoogleSearch` is true and provider is Gemini, use `tools: [{googleSearch: {}}]`.

*   **`POST /api/v1/ai/generate-json`** (Req Auth)
    *   **Request Body:** `{ prompt: string, systemInstruction?: string }`
    *   **Response:** `{ data: T | null, error?: string, groundingChunks?: GroundingChunk[] }` (where T is the expected JSON structure)
    *   **Logic:** Use `responseMimeType: "application/json"` for Gemini, `response_format: { type: "json_object" }` for OpenAI.

*   **`POST /api/v1/ai/generate-image`** (Req Auth)
    *   **Request Body:** `{ prompt: string, numberOfImages?: number }`
    *   **Response:** `{ images: string[] | null, error?: string }` (images as base64 strings)

*   **WebSocket or SSE endpoint for `/api/v1/ai/stream-text`** (Req Auth)
    *   **Initial Message/Query Params:** `{ prompt: string, systemInstruction?: string }`
    *   **Logic:** Perform credit check upon connection/initial message.
    *   **Server-Sent Events / WebSocket Messages:** Stream text chunks as they arrive from the AI provider. Increment usage once the stream starts successfully.

### 11.3. Monthly Credit Reset (Supabase Implementation)

To automatically reset `ai_usage_count_monthly` to 0 for all users at the beginning of each month, use `pg_cron`.

**Step 1: Create a PostgreSQL Function**
Go to the Supabase SQL Editor and run this command to create a function that performs the reset.

```sql
CREATE OR REPLACE FUNCTION public.reset_monthly_ai_usage()
RETURNS void
LANGUAGE sql
AS $$
  UPDATE public.profiles
  SET ai_usage_count_monthly = 0;
$$;
```

**Step 2: Schedule the Job with pg_cron**
This job will run at midnight (UTC) on the first day of every month.

```sql
-- This command must be run by a superuser. You may need to contact Supabase support
-- or use the dashboard if direct superuser access isn't available.
-- It only needs to be run ONCE.

SELECT cron.schedule(
  'reset-monthly-ai-credits', -- Job name
  '0 0 1 * *', -- CRON schedule: at 00:00 on day-of-month 1
  $$ SELECT public.reset_monthly_ai_usage() $$
);
```

To verify the job is scheduled, you can run: `SELECT * FROM cron.job;`. To unschedule: `SELECT cron.unschedule('reset-monthly-ai-credits');`.

## 12. Feedback Simulator Backend

Leverages the AI Service Proxy.

*   **`POST /api/v1/ai/simulate-feedback`** (Req Auth)
    *   **Request Body:** `{ personaDetails: { name, demographics, etc. }, contentToSimulate: string }`
        *   (Alternatively, `personaId` and backend fetches details).
    *   **Logic:**
        1.  Construct detailed prompt for AI (similar to frontend `FeedbackSimulatorView.tsx`).
        2.  Call internal AI Service Proxy's `generate-json` endpoint.
    *   **Response:** `FeedbackSimulationResult` or error object.

## 13. Audit Tool Backend

Leverages the AI Service Proxy.

*   **`POST /api/v1/ai/generate-audit-plan`** (Req Auth)
    *   **Request Body:** `{ campaignObjective: string }`
    *   **Logic:**
        1.  Construct detailed prompt for AI (similar to frontend `AuditToolView.tsx`).
        2.  Call internal AI Service Proxy's `generate-json` endpoint to get the 8D steps content.
    *   **Response:** Object where keys are "D0" through "D8" and values are the generated content strings, or error.

## 14. Team Chat

Requires real-time capabilities.

### 14.1. Models (MongoDB Example)

```javascript
const ChatChannelSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true }, // For team-wide channels
  name: { type: String, required: true }, // e.g., "#general", "DM:user1_user2"
  isDirectMessage: { type: Boolean, default: false },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // For DMs or private channels
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});
// Ensure channel name is unique per team for public channels, or unique pair for DMs.

const ChatMessageAttachmentSchema = new mongoose.Schema({
  storagePath: { type: String, required: true },
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  size: { type: Number, required: true }
}, { _id: false });

const ChatMessageSchema = new mongoose.Schema({
  channelId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatChannel', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String },
  attachment: ChatMessageAttachmentSchema, // If file attached
  timestamp: { type: Date, default: Date.now }
});
```

**Supabase/PostgreSQL (Simplified Example):**
Supabase Realtime can listen to DB changes on `chat_messages` table.

```sql
CREATE TABLE chat_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_direct_message BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
  -- For DMs, name could be a sorted concatenation of user IDs.
  -- Members can be a join table chat_channel_members(channel_id, user_id)
);

CREATE TABLE chat_messages (
  id BIGSERIAL PRIMARY KEY, -- Use bigserial for ordered IDs
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  text_content TEXT,
  attachment_storage_path TEXT,
  attachment_file_name TEXT,
  attachment_file_type TEXT,
  attachment_size BIGINT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```
*(Custom channels from frontend `CustomChannel` type are represented by `ChatChannelSchema`/`chat_channels`)*

### 14.2. WebSocket API (e.g., using Socket.IO)

*   **Connection:** Client connects, authenticates (e.g., sends JWT).
*   **Events (Client to Server):**
    *   `join_channel`: `{ channelId }` (Server validates user access to channel).
    *   `leave_channel`: `{ channelId }`
    *   `send_message`: `{ channelId, text?, attachmentMetadata? }`
        *   If `attachmentMetadata` is present, implies a file is being/has been uploaded via a REST endpoint first.
    *   `start_typing`: `{ channelId }`
    *   `stop_typing`: `{ channelId }`
*   **Events (Server to Client):**
    *   `new_message`: `{ messageObject }` (Broadcast to members of the channel).
    *   `typing`: `{ channelId, userId, userName }`
    *   `user_joined_channel`: `{ channelId, userId, userName }`
    *   `user_left_channel`: `{ channelId, userId, userName }`
    *   `channel_created`: `{ channelObject }` (Broadcast to team members).
    *   `channel_deleted`: `{ channelId }` (Broadcast to team members).

### 14.3. REST APIs for Chat

*   **`POST /api/v1/chat/channels`** (Req Auth):
    *   **Request Body:** `{ name: string, teamId: string, isDirectMessage?: boolean, memberIds?: string[] (for DM) }`
    *   **Logic:** Create a new channel. If public, associate with team. If DM, ensure only two members and generate unique channel name/ID.
*   **`GET /api/v1/chat/channels`** (Req Auth): List channels user has access to (team channels + DMs).
*   **`DELETE /api/v1/chat/channels/{channelId}`** (Req Auth, Owner/Creator): Delete a custom channel.
*   **`GET /api/v1/chat/channels/{channelId}/messages`** (Req Auth): Fetch message history (paginated).
*   **`POST /api/v1/chat/channels/{channelId}/attachments`** (Req Auth):
    *   **Request:** `multipart/form-data` with file.
    *   **Logic:** Uploads file (similar to Content Library), returns metadata (path, name, type, size). Client then sends `send_message` WebSocket event with this metadata.
    *   **Response:** `{ attachment: { storagePath, fileName, fileType, size } }`.

## 15. Security Considerations

*   **Input Validation:** Validate all incoming data (lengths, types, formats). Use libraries like Joi or Zod.
*   **Authentication & Authorization:** Secure JWT implementation. Enforce authorization for all routes (user owns resource, or is part of team, etc.).
*   **API Key Management:** Encrypt API keys at rest. Restrict access to decrypted keys.
*   **Password Hashing:** Use strong hashing algorithms (bcrypt, Argon2).
*   **Rate Limiting:** Protect against brute-force attacks and API abuse.
*   **CORS:** Configure correctly.
*   **HTTPS:** Enforce for all communication.
*   **XSS, CSRF Protection:** Use standard middleware and best practices.
*   **Dependency Security:** Regularly scan dependencies for vulnerabilities.
*   **Least Privilege:** Ensure backend processes and database users have only necessary permissions.

## 16. Deployment and Scalability

*   **Containerization:** Docker for consistent environments.
*   **Cloud Platforms:** AWS (EC2, ECS, Lambda), Google Cloud (Compute Engine, Cloud Run, Functions), Azure, Heroku, Vercel/Netlify (for serverless functions). Supabase handles its own infrastructure.
*   **Database Scaling:** Managed database services often provide scaling options. Consider read replicas for PostgreSQL. MongoDB sharding for very large scale.
*   **Load Balancing:** Distribute traffic across multiple instances of the backend application.
*   **Stateless Application:** Design backend services to be stateless if possible, to simplify scaling. JWTs help with this.
*   **Caching:** Use Redis or Memcached for frequently accessed data that doesn't change often.
*   **Background Jobs:** For tasks like sending emails or long AI processing, use a queue system (RabbitMQ, SQS, BullMQ).

## 17. Conclusion

This document provides a comprehensive outline for the PixaSocial Ai backend. Each section will require further detailed design and implementation. The choice between MongoDB and Supabase (or another PostgreSQL provider) will influence specific implementation details, particularly around database interaction, real-time features, and authentication.