import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface ChatChannel {
  id: string
  name: string
  is_direct_message: boolean
  created_by: string
  created_at: string
  user_id: string
}

export interface ChatMessage {
  id: string
  channel_id: string
  sender_id: string
  text_content: string | null
  attachment_name: string | null
  attachment_type: string | null
  attachment_size: number | null
  attachment_storage_path: string | null
  timestamp: string
  sender?: {
    name: string | null
    email: string
  }
}

export function useChat() {
  const { user } = useAuth()
  const [channels, setChannels] = useState<ChatChannel[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchChannels()
      fetchMessages()
      subscribeToMessages()
      subscribeToChannels()
    } else {
      setChannels([])
      setMessages([])
      setLoading(false)
    }
  }, [user])

  const fetchChannels = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('chat_channels')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setChannels(data || [])
    } catch (error) {
      console.error('Error fetching channels:', error)
    }
  }

  const fetchMessages = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:profiles!chat_messages_sender_id_fkey(name),
          sender_email:auth.users!chat_messages_sender_id_fkey(email)
        `)
        .order('timestamp', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage
          setMessages(prev => [...prev, newMessage])
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const subscribeToChannels = () => {
    const subscription = supabase
      .channel('chat_channels')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_channels',
        },
        () => {
          fetchChannels()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const createChannel = async (name: string) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('chat_channels')
        .insert({
          name: name.startsWith('#') ? name : `#${name}`,
          user_id: user.id,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating channel:', error)
      throw error
    }
  }

  const deleteChannel = async (channelId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('chat_channels')
        .delete()
        .eq('id', channelId)
        .eq('created_by', user.id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting channel:', error)
      throw error
    }
  }

  const sendMessage = async (channelId: string, textContent?: string, attachment?: any) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          channel_id: channelId,
          sender_id: user.id,
          text_content: textContent || null,
          attachment_name: attachment?.name || null,
          attachment_type: attachment?.type || null,
          attachment_size: attachment?.size || null,
          attachment_storage_path: attachment?.storage_path || null,
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  return {
    channels,
    messages,
    loading,
    createChannel,
    deleteChannel,
    sendMessage,
    refetch: () => {
      fetchChannels()
      fetchMessages()
    },
  }
}