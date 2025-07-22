

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useChat, Message } from '@ai-sdk/react';
import { useToast } from '../../ui/ToastProvider';
import { supabase, supabaseUrl } from '../../../services/supabaseClient';
import { Persona, RSTProfile, ChatSession, UserProfile, Sentiment, GroundingSource, SmartReply, Database } from '../../../types';
import * as dataService from '../../../services/dataService';
import { generateJson } from '../../../services/aiService';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const useAIAgentChat = (currentUser: UserProfile, personas: Persona[]) => {
    const { showToast } = useToast();
    
    const [chatHeaders, setChatHeaders] = useState<Record<string, string>>({});
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [isLoadingSessions, setIsLoadingSessions] = useState(true);
    const [activePersona, setActivePersona] = useState<Persona | null>(null);
    const activeSessionIdRef = useRef(activeSessionId);

    const [isGoogleSearchEnabled, setIsGoogleSearchEnabled] = useState(false);
    const [sentiment, setSentiment] = useState<Sentiment>(null);
    const [insights, setInsights] = useState<string[] | null>(null);
    const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
    const [smartReplies, setSmartReplies] = useState<SmartReply[]>([]);
    
    useEffect(() => { activeSessionIdRef.current = activeSessionId; }, [activeSessionId]);
    
    useEffect(() => {
        const getAuthHeaders = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error || !session) {
                showToast('Authentication session error. Please log in again.', 'error');
            } else {
                setChatHeaders({
                    'Authorization': `Bearer ${session.access_token}`,
                });
            }
        };
        getAuthHeaders();
    }, [showToast]);

    const systemPrompt = useMemo(() => {
        if (!activePersona) return 'You are a helpful AI assistant.';
        const rst = activePersona.rst_profile as unknown as RSTProfile | null;
        return `You are an AI Agent acting as "${activePersona.name}". Adhere to this profile:
- Demographics: ${activePersona.demographics}
- Psychographics: ${activePersona.psychographics}
- Beliefs: ${activePersona.initial_beliefs}
- RST Profile: BAS=${rst?.bas}, BIS=${rst?.bis}, FFFS=${rst?.fffs}.

Your persona is the most important instruction.

When chatting, communicate naturally as this person would. Your goal is a realistic, human-like conversation.
**Do NOT use hashtags** in your replies unless you are specifically asked to generate social media content, a marketing campaign, or a similar brand message.`;
    }, [activePersona]);

    const getSentimentForMessage = useCallback(async (text: string) => {
        const result = await generateJson<{ sentiment: 'positive' | 'neutral' | 'negative' }>(
            `Analyze the sentiment of this text: "${text}". Respond with JSON: {"sentiment": "..."}`,
            currentUser
        );
        return result.data?.sentiment || null;
    }, [currentUser]);

    const getSmartReplies = useCallback(async (history: Message[]) => {
        const conversation = history.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n');
        const result = await generateJson<{ replies: string[] }>(
            `Based on this conversation snippet:\n${conversation}\n\nSuggest three short, relevant follow-up questions or replies for the user. Respond with JSON: {"replies": ["...", "...", "..."]}`,
            currentUser
        );
        return (result.data?.replies || []).map(text => ({ id: Math.random().toString(), text }));
    }, [currentUser]);

    const chatHelpers = useChat({
      api: `${supabaseUrl}/functions/v1/ai-proxy-chat`,
      headers: chatHeaders,
      onError: async (error) => { 
        showToast(error.message, 'error');
        if (error.message.includes('session is invalid')) {
            await supabase.auth.signOut();
        }
      },
      onFinish: async (message) => {
        const sessionId = activeSessionIdRef.current;
        const groundingData = (message as any).experimental_customData?.grounding_sources;

        if (sessionId && message.role === 'assistant') {
            await supabase.from('chat_messages').insert({ 
                session_id: sessionId, 
                user_id: currentUser.id, 
                role: 'assistant', 
                content: message.content,
                grounding_sources: groundingData || null,
            });
            const currentSentiment = await getSentimentForMessage(message.content);
            setSentiment(currentSentiment);
            const replies = await getSmartReplies([...chatHelpers.messages, message]);
            setSmartReplies(replies);
        }
        
        if (groundingData) {
            chatHelpers.setMessages(
                chatHelpers.messages.map(m => 
                    m.id === message.id 
                        ? { ...m, grounding_sources: groundingData }
                        : m
                )
            );
        }
      }
    });

    const fetchSessions = useCallback(async () => {
        setIsLoadingSessions(true);
        const { data, error } = await supabase.from('chat_sessions').select('*').eq('user_id', currentUser.id).order('updated_at', { ascending: false });
        if (error) { showToast(`Error fetching chat history: ${error.message}`, 'error'); } 
        else { setChatSessions((data as ChatSession[]) || []); }
        setIsLoadingSessions(false);
    }, [currentUser.id, showToast]);

    useEffect(() => { fetchSessions(); }, [fetchSessions]);

    useEffect(() => {
        if (personas.length > 0 && !activePersona) {
            setActivePersona(personas[0]);
        }
    }, [personas, activePersona]);

    const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const currentInput = chatHelpers.input;
        if (!currentInput.trim() || !activePersona) return;
        setSmartReplies([]);

        let sessionId = activeSessionIdRef.current;
        
        try {
            if (!sessionId) {
                const { data: newSession, error } = await supabase.from('chat_sessions').insert({
                    user_id: currentUser.id,
                    persona_id: activePersona.id,
                    title: currentInput.substring(0, 50)
                }).select().single();
                if (error) throw error;
                sessionId = newSession.id;
                setChatSessions(prev => [newSession as ChatSession, ...prev]);
                setActiveSessionId(sessionId);
                activeSessionIdRef.current = sessionId;
            }
            
            await supabase.from('chat_messages').insert({
                session_id: sessionId,
                user_id: currentUser.id,
                role: 'user',
                content: currentInput
            });

            chatHelpers.handleSubmit(e, {
                data: {
                    system_prompt: systemPrompt,
                    is_google_search_enabled: isGoogleSearchEnabled,
                },
            });
        } catch (error) {
            showToast(`Error sending message: ${(error as Error).message}`, 'error');
        }
    };
    
    const handleSmartReply = (text: string) => {
        chatHelpers.setInput(text);
        
        setTimeout(() => {
            const fakeForm = document.createElement('form');
            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
            Object.defineProperty(submitEvent, 'currentTarget', { value: fakeForm });
            handleSendMessage(submitEvent as unknown as React.FormEvent<HTMLFormElement>);
        }, 0);
    };

    const handleNewChat = useCallback(() => {
        setActiveSessionId(null);
        setActivePersona(personas[0] || null);
        chatHelpers.setMessages([]);
        setSentiment(null);
        setInsights(null);
        setSmartReplies([]);
    }, [personas, chatHelpers]);

    const handleSelectSession = useCallback(async (session: ChatSession) => {
        setActiveSessionId(session.id);
        const persona = personas.find(p => p.id === session.persona_id) || personas[0] || null;
        setActivePersona(persona);
        chatHelpers.setMessages([]);
        setSentiment(null); setInsights(null); setSmartReplies([]);
        const { data, error } = await supabase.from('chat_messages').select('*').eq('session_id', session.id).order('created_at', { ascending: true });
        if (error) { showToast(`Failed to load messages: ${error.message}`, 'error'); }
        else { chatHelpers.setMessages((data as Message[]) || []); }
    }, [personas, showToast, chatHelpers]);

    const handleDeleteSession = useCallback(async (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to permanently delete this chat history?")) return;

        const { error } = await dataService.deleteChatSession(sessionId);

        if (error) {
            showToast(`Failed to delete session: ${error.message}`, 'error');
            console.error("Deletion error:", error);
        } else {
            showToast("Chat deleted successfully.", "success");
            fetchSessions();
            if (activeSessionId === sessionId) {
                handleNewChat();
            }
        }
    }, [showToast, activeSessionId, handleNewChat, fetchSessions]);

    const handleSetActivePersona = useCallback((persona: Persona) => {
        setActivePersona(persona);
        if (!activeSessionId) chatHelpers.setMessages([]);
    }, [activeSessionId, chatHelpers]);

    const handleGenerateInsights = useCallback(async () => {
        setIsGeneratingInsights(true);
        const conversation = chatHelpers.messages.map(m => `${m.role === 'user' ? 'User' : activePersona?.name || 'Agent'}: ${m.content}`).join('\n\n');
        const prompt = `Analyze this conversation and extract the key insights, takeaways, or action items. Return a JSON object: {"insights": ["...", "...", "..."]}`;
        const result = await generateJson<{ insights: string[] }>(prompt, currentUser);
        if (result.data?.insights) setInsights(result.data.insights);
        else showToast(result.error || "Failed to generate insights.", 'error');
        setIsGeneratingInsights(false);
    }, [chatHelpers.messages, activePersona, currentUser, showToast]);
    
    const exportChat = useCallback((format: 'md' | 'pdf') => {
        const title = chatSessions.find(s => s.id === activeSessionId)?.title || 'chat-export';
        const content = chatHelpers.messages.map(m => `**${m.role === 'user' ? currentUser.name : activePersona?.name}**: ${m.content}`).join('\n\n---\n\n');
        
        if (format === 'md') {
            const blob = new Blob([`# Chat with ${activePersona?.name}\n\n${content}`], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title}.md`;
            a.click();
            URL.revokeObjectURL(url);
        } else { // pdf
            const chatContainer = document.querySelector('[data-chat-export-area="true"]') as HTMLElement;
            if (chatContainer) {
                html2canvas(chatContainer, { backgroundColor: '#1f2937' }).then(canvas => {
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = pdf.internal.pageSize.getHeight();
                    const canvasWidth = canvas.width;
                    const canvasHeight = canvas.height;
                    const ratio = canvasWidth / canvasHeight;
                    const width = pdfWidth;
                    const height = width / ratio;
                    pdf.addImage(imgData, 'PNG', 0, 0, width, height > pdfHeight ? pdfHeight : height);
                    if (height > pdfHeight) pdf.addPage();
                    pdf.save(`${title}.pdf`);
                });
            }
        }
        showToast(`Exporting chat as ${format.toUpperCase()}...`, 'success');
    }, [activeSessionId, activePersona, chatHelpers.messages, currentUser.name, chatSessions]);


    return {
        state: {
            chatSessions,
            activeSessionId,
            isLoadingSessions,
            activePersona,
            isGoogleSearchEnabled,
            sentiment,
            insights,
            isGeneratingInsights,
            smartReplies,
        },
        handlers: {
            handleSendMessage,
            handleNewChat,
            handleSelectSession,
            handleDeleteSession,
            handleSetActivePersona,
            setIsGoogleSearchEnabled,
            handleGenerateInsights,
            handleSmartReply,
            exportChat,
        },
        chatHelpers
    };
}
