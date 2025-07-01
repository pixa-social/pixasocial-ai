import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and anonymous key are required.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Authentication Middleware
const authenticateToken = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token missing' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error || !data) {
      return res.status(403).json({ message: 'Invalid token or user not found' });
    }

    req.user = data;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// User Authentication Endpoints
app.post('/api/v1/auth/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from('users')
    .insert([{ name, email, password_hash: passwordHash }])
    .select()
    .single();

  if (error) {
    return res.status(400).json({ message: 'User registration failed', error: error.message });
  }

  return res.status(201).json({ message: 'User registered successfully', user: data });
});

app.post('/api/v1/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isPasswordValid = await bcrypt.compare(password, data.password_hash);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: data.id }, jwtSecret, { expiresIn: '1h' });
  return res.status(200).json({ token, user: { id: data.id, name: data.name, email: data.email } });
});

app.get('/api/v1/auth/me', authenticateToken, (req, res) => {
  return res.status(200).json({ user: req.user });
});

// Team Management Endpoints
app.post('/api/v1/teams', authenticateToken, async (req, res) => {
  const { name } = req.body;
  const ownerId = req.user.id;

  const { data, error } = await supabase
    .from('teams')
    .insert([{ name, owner_id: ownerId }])
    .select()
    .single();

  if (error) {
    return res.status(400).json({ message: 'Team creation failed', error: error.message });
  }

  await supabase.from('team_members').insert([{ team_id: data.id, user_id: ownerId, role: 'owner' }]);

  return res.status(201).json({ team: data });
});

app.get('/api/v1/teams', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  const { data, error } = await supabase
    .from('team_members')
    .select('team_id, teams(*)')
    .eq('user_id', userId);

  if (error) {
    return res.status(400).json({ message: 'Failed to fetch teams', error: error.message });
  }

  return res.status(200).json({ teams: data.map(member => member.teams) });
});

// AI Provider Configuration Endpoints
app.get('/api/v1/ai-configs', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  const { data, error } = await supabase
    .from('ai_provider_user_configs')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    return res.status(400).json({ message: 'Failed to fetch AI configs', error: error.message });
  }

  return res.status(200).json({ configs: data.map(config => ({ ...config, encrypted_api_key: !!config.encrypted_api_key })) });
});

app.put('/api/v1/ai-configs', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const configs = req.body;

  const updates = configs.map(async (config: any) => {
    const { data, error } = await supabase
      .from('ai_provider_user_configs')
      .upsert({
        user_id: userId,
        provider_id: config.provider_id,
        encrypted_api_key: config.apiKey ? await bcrypt.hash(config.apiKey, 10) : null,
        is_enabled: config.is_enabled,
        models: config.models,
        base_url: config.base_url
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update config for ${config.provider_id}: ${error.message}`);
    }

    return data;
  });

  try {
    const updatedConfigs = await Promise.all(updates);
    return res.status(200).json({ configs: updatedConfigs });
  } catch (error) {
    return res.status(400).json({ message: 'Failed to update AI configs', error: error.message });
  }
});

// Campaign Data Management (Personas as an example)
app.post('/api/v1/personas', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const persona = req.body;

  const { data, error } = await supabase
    .from('personas')
    .insert([{ ...persona, user_id: userId }])
    .select()
    .single();

  if (error) {
    return res.status(400).json({ message: 'Failed to create persona', error: error.message });
  }

  return res.status(201).json({ persona: data });
});

app.get('/api/v1/personas', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  const { data, error } = await supabase
    .from('personas')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    return res.status(400).json({ message: 'Failed to fetch personas', error: error.message });
  }

  return res.status(200).json({ personas: data });
});

// Content Library Endpoints
app.post('/api/v1/content-library/upload', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { name, type, file } = req.body;

  // This is a placeholder for actual file upload logic to Supabase Storage
  const { data, error } = await supabase
    .from('content_library_assets')
    .insert([{ user_id: userId, name, type, storage_path: 'placeholder/path', file_name: file.name, file_type: file.type, size: file.size }])
    .select()
    .single();

  if (error) {
    return res.status(400).json({ message: 'Failed to upload asset', error: error.message });
  }

  return res.status(201).json({ asset: data });
});

// Real-time Chat with Socket.IO
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_channel', async ({ channelId, token }) => {
    try {
      const decoded = jwt.verify(token, jwtSecret) as { userId: string };
      const { data, error } = await supabase
        .from('chat_channels')
        .select('*')
        .eq('id', channelId)
        .single();

      if (error || !data) {
        socket.emit('error', { message: 'Channel not found' });
        return;
      }

      socket.join(channelId);
      socket.emit('channel_joined', { channelId });
    } catch (error) {
      socket.emit('error', { message: 'Authentication failed' });
    }
  });

  socket.on('send_message', async ({ channelId, text, token }) => {
    try {
      const decoded = jwt.verify(token, jwtSecret) as { userId: string };
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([{ channel_id: channelId, sender_id: decoded.userId, text_content: text }])
        .select()
        .single();

      if (error) {
        socket.emit('error', { message: 'Failed to send message' });
        return;
      }

      io.to(channelId).emit('new_message', { message: data });
    } catch (error) {
      socket.emit('error', { message: 'Authentication failed' });
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
