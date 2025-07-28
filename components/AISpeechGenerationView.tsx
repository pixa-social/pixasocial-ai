import React, { useState, useCallback, useMemo } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Select, SelectOption } from './ui/Select';
import { Textarea } from './ui/Textarea';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { useToast } from './ui/ToastProvider';
import { useAppDataContext } from './MainAppLayout';
import { generateText } from '../services/aiService';
import { supabase } from '../services/supabaseClient';
import { SparklesIcon, MegaphoneIcon, DownloadIcon, UsersIcon } from './ui/Icons';
import { EmptyState } from './ui/EmptyState';
import { ViewName, RoleName } from '../types';

// Constants for the view
const VOICE_OPTIONS: SelectOption[] = [
    { value: "Joanna", label: "Joanna (Female - US)" },
    { value: "Matthew", label: "Matthew (Male - US)" },
    { value: "Salli", label: "Salli (Female - US)" },
    { value: "Brian", label: "Brian (Male - British)" },
    { value: "Amy", label: "Amy (Female - British)" },
    { value: "Emma", label: "Emma (Female - British)" },
];

const ENGINE_OPTIONS: SelectOption[] = [
    { value: "neural", label: "Neural (Highest quality)" },
    { value: "standard", label: "Standard" },
];

const MAX_CHARS = 3000;

export const AISpeechGenerationView: React.FC = () => {
    const { currentUser, personas, onNavigate } = useAppDataContext();
    const { showToast } = useToast();

    // State
    const [textInput, setTextInput] = useState("Welcome to PixaSocial's advanced text to speech service. Our cutting-edge technology transforms written content into natural-sounding audio.");
    const [selectedVoice, setSelectedVoice] = useState<string>("Joanna");
    const [selectedEngine, setSelectedEngine] = useState<string>("neural");
    const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [status, setStatus] = useState<{ message: string; type: 'processing' | 'success' | 'error' } | null>(null);
    const [isConverting, setIsConverting] = useState(false);
    const [isGeneratingAiContent, setIsGeneratingAiContent] = useState(false);
    
    const personaOptions = useMemo(() => [{ value: '', label: 'Select Audience...' }, ...personas.map(p => ({ value: p.id.toString(), label: p.name }))], [personas]);
    const hasNoCredits = currentUser.ai_usage_count_monthly >= currentUser.role.max_ai_uses_monthly;
    const isFreeUser = currentUser.role.name === RoleName.Free;
    const charCount = textInput.length;

    const handleGenerateAiContent = useCallback(async () => {
        if (!selectedPersonaId) {
            showToast('Please select an audience persona first.', 'error');
            return;
        }
        const persona = personas.find(p => p.id === parseInt(selectedPersonaId, 10));
        if (!persona) {
            showToast('Selected persona not found.', 'error');
            return;
        }

        setIsGeneratingAiContent(true);
        setStatus({ message: 'Generating AI content...', type: 'processing' });

        const prompt = `Write a short, engaging welcome message or announcement (around 50-70 words) suitable for audio, targeted at this persona: ${persona.name} (${persona.demographics}). The tone should be appropriate for a social media audio clip.`;
        const result = await generateText(prompt, currentUser);

        if (result.text) {
            setTextInput(result.text);
            setStatus({ message: 'AI content generated successfully!', type: 'success' });
        } else {
            setStatus({ message: result.error || 'Failed to generate content.', type: 'error' });
        }
        setIsGeneratingAiContent(false);
    }, [selectedPersonaId, personas, currentUser, showToast]);

    const handleConvertToSpeech = useCallback(async () => {
        if (!textInput.trim()) {
            setStatus({ message: 'Please enter some text to convert.', type: 'error' });
            return;
        }
        if (textInput.length > MAX_CHARS) {
            setStatus({ message: `Text exceeds ${MAX_CHARS} character limit.`, type: 'error' });
            return;
        }
        setIsConverting(true);
        setAudioUrl(null);
        setStatus({ message: 'Converting text to speech...', type: 'processing' });
        try {
            const { data, error } = await supabase.functions.invoke('text-to-speech', {
                body: { text: textInput, voiceId: selectedVoice, engine: selectedEngine }
            });

            if (error) {
                console.error("Supabase Function Invocation Error:", error);
                if (error.message.includes("Failed to send") || error.message.includes("invoke")) {
                    throw new Error("Failed to connect to the speech generation service. Please check your network and try again.");
                } else {
                    throw new Error(error.message || "An error occurred during processing.");
                }
            }

            if (data?.error) { 
                throw new Error(data.error);
            }

            if (!data?.audioB64) {
                throw new Error('Invalid response: No audio data received from the server.');
            }

            const audioBytes = Uint8Array.from(atob(data.audioB64), c => c.charCodeAt(0));
            const audioBlob = new Blob([audioBytes], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(audioBlob);
            setAudioUrl(url);
            setStatus({ message: 'Conversion successful!', type: 'success' });
        } catch (err) {
            console.error('TTS Error (Catch Block):', err);
            const errorMessage = (err as Error).message || 'An unknown error occurred connecting to the service.';
            setStatus({ message: `Error: ${errorMessage}`, type: 'error' });
        } finally {
            setIsConverting(false);
        }
    }, [textInput, selectedVoice, selectedEngine, showToast]);
    
    if (isFreeUser) {
        return (
            <div className="p-6">
                <EmptyState
                    title="Upgrade to Unlock AI Speech Generation"
                    description="This feature is available on our paid plans. Upgrade your account to transform text into natural-sounding audio for your campaigns."
                    action={{ label: "Upgrade Your Plan", onClick: () => onNavigate(ViewName.Settings) }}
                    icon={<MegaphoneIcon className="w-8 h-8 text-primary" />}
                />
            </div>
        );
    }

    if (personas.length === 0) {
        return (
            <div className="p-6">
                <EmptyState
                    title="Create a Persona to Begin"
                    description="The AI Speech Generation tool uses Audience Personas to generate tailored content. Please create at least one persona to get started."
                    action={{ label: "Go to Audience Modeling", onClick: () => onNavigate(ViewName.AudienceModeling) }}
                    icon={<UsersIcon className="w-8 h-8 text-primary" />}
                />
            </div>
        );
    }
    
    return (
        <div className="p-6">
            <header className="text-center mb-8">
                <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">AI Speech Generation</h2>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Transform your content into natural-sounding audio with AI-powered voices.</p>
            </header>

            <div className="max-w-3xl mx-auto space-y-6">
                 <Card>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <Select
                            label="Select your audience"
                            options={personaOptions}
                            value={selectedPersonaId}
                            onChange={(e) => setSelectedPersonaId(e.target.value)}
                            containerClassName="flex-grow"
                            disabled={isGeneratingAiContent}
                        />
                        <Button onClick={handleGenerateAiContent} isLoading={isGeneratingAiContent} disabled={!selectedPersonaId || isGeneratingAiContent || hasNoCredits} leftIcon={<SparklesIcon className="w-5 h-5"/>} className="w-full md:w-auto">
                            Generate Content with AI
                        </Button>
                    </div>
                    {hasNoCredits && <p className="text-xs text-yellow-400 mt-2 text-center md:text-right">You have used all your AI credits for this month.</p>}
                 </Card>

                 <Card>
                    <Textarea 
                        label="Enter Your Text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Type or paste your text here..."
                        rows={6}
                    />
                    <div className={`text-xs text-right mt-1 ${charCount > MAX_CHARS ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {charCount} / {MAX_CHARS} characters
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <Select label="Voice" options={VOICE_OPTIONS} value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} />
                        <Select label="Engine" options={ENGINE_OPTIONS} value={selectedEngine} onChange={(e) => setSelectedEngine(e.target.value)} />
                    </div>

                    <Button onClick={handleConvertToSpeech} isLoading={isConverting} disabled={isConverting || charCount > MAX_CHARS} className="w-full mt-6" size="lg" leftIcon={<MegaphoneIcon className="w-5 h-5"/>}>
                        Convert to Speech
                    </Button>
                 </Card>

                {status && (
                    <div className={`p-3 rounded-md text-sm text-center font-medium
                        ${status.type === 'processing' && 'bg-yellow-400/20 text-yellow-300'}
                        ${status.type === 'success' && 'bg-success/20 text-success'}
                        ${status.type === 'error' && 'bg-destructive/20 text-destructive'}`
                    }>
                        {status.message}
                    </div>
                )}

                {audioUrl && (
                    <Card className="animate-fadeIn">
                        <h3 className="text-lg font-semibold text-foreground text-center mb-4">Your Audio is Ready</h3>
                        <audio src={audioUrl} controls className="w-full" />
                        <a href={audioUrl} download="pixasocial-speech.mp3">
                            <Button variant="secondary" className="w-full mt-4" leftIcon={<DownloadIcon className="w-5 h-5"/>}>
                                Download MP3
                            </Button>
                        </a>
                    </Card>
                )}
            </div>
        </div>
    );
};
