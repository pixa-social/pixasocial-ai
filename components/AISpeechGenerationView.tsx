import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Select, SelectOption } from './ui/Select';
import { Textarea } from './ui/Textarea';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { useToast } from './ui/ToastProvider';
import { useAppDataContext } from './MainAppLayout';
import { generateText } from '../services/aiService';
import { supabase } from '../services/supabaseClient';
import { SparklesIcon, MegaphoneIcon, DownloadIcon, UsersIcon, VideoCameraIcon, PlusCircleIcon, ArrowDownOnSquareIcon } from './ui/Icons';
import { EmptyState } from './ui/EmptyState';
import { ViewName, RoleName, ContentLibraryAsset } from '../types';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

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
const FFMPEG_CORE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js';


export const AISpeechGenerationView: React.FC = () => {
    const { currentUser, personas, contentLibraryAssets, handlers, onNavigate } = useAppDataContext();
    const { addAsset } = handlers;
    const { showToast } = useToast();
    const ffmpegRef = useRef(new FFmpeg());

    // State
    const [textInput, setTextInput] = useState("Welcome to PixaSocial's advanced text to speech service. Our cutting-edge technology transforms written content into natural-sounding audio.");
    const [selectedVoice, setSelectedVoice] = useState<string>("Joanna");
    const [selectedEngine, setSelectedEngine] = useState<string>("neural");
    const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [status, setStatus] = useState<{ message: string; type: 'processing' | 'success' | 'error' } | null>(null);
    const [isConverting, setIsConverting] = useState(false);
    const [isGeneratingAiContent, setIsGeneratingAiContent] = useState(false);

    // FFmpeg-related state
    const [selectedVideo, setSelectedVideo] = useState<ContentLibraryAsset | null>(null);
    const [ffmpegProgress, setFfmpegProgress] = useState(0);
    const [isProcessingVideo, setIsProcessingVideo] = useState(false);
    const [outputVideoUrl, setOutputVideoUrl] = useState<string | null>(null);
    const [processedVideoFile, setProcessedVideoFile] = useState<File | null>(null);
    
    const personaOptions = useMemo(() => [{ value: '', label: 'Select Audience...' }, ...personas.map(p => ({ value: p.id.toString(), label: p.name }))], [personas]);
    const videoOptions = useMemo(() => contentLibraryAssets.filter(a => a.type === 'video').map(v => ({ value: v.id, label: v.name })), [contentLibraryAssets]);

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
        if (!textInput.trim()) { setStatus({ message: 'Please enter some text to convert.', type: 'error' }); return; }
        if (textInput.length > MAX_CHARS) { setStatus({ message: `Text exceeds ${MAX_CHARS} character limit.`, type: 'error' }); return; }
        
        setIsConverting(true);
        setAudioUrl(null);
        setOutputVideoUrl(null);
        setStatus({ message: 'Converting text to speech...', type: 'processing' });
        try {
            const { data, error } = await supabase.functions.invoke('text-to-speech', { body: { text: textInput, voiceId: selectedVoice, engine: selectedEngine } });
            if (error || data?.error) throw new Error(data?.error || error?.message || "An unknown error occurred during processing.");
            if (!data?.audioB64) throw new Error('Invalid response: No audio data received.');

            const audioBytes = Uint8Array.from(atob(data.audioB64), c => c.charCodeAt(0));
            const audioBlob = new Blob([audioBytes], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(audioBlob);
            setAudioUrl(url);
            setStatus({ message: 'Conversion successful!', type: 'success' });
        } catch (err) {
            setStatus({ message: `Error: ${(err as Error).message}`, type: 'error' });
        } finally {
            setIsConverting(false);
        }
    }, [textInput, selectedVoice, selectedEngine]);

    const handleCombineVideo = async () => {
        if (!audioUrl || !selectedVideo?.publicUrl) {
            showToast("Please generate audio and select a video first.", 'error');
            return;
        }
        setIsProcessingVideo(true);
        setOutputVideoUrl(null);
        setFfmpegProgress(0);
        showToast("Starting video processing... This may take a moment.", 'info');

        try {
            const ffmpeg = ffmpegRef.current;
            ffmpeg.on('log', ({ message }) => console.log(message));
            ffmpeg.on('progress', ({ progress }) => setFfmpegProgress(Math.round(progress * 100)));
            
            const coreURL = await toBlobURL(FFMPEG_CORE_URL, 'application/javascript');
            await ffmpeg.load({ coreURL });
            
            ffmpeg.writeFile('input.mp4', await fetchFile(selectedVideo.publicUrl));
            ffmpeg.writeFile('audio.mp3', await fetchFile(audioUrl));

            await ffmpeg.exec(['-i', 'input.mp4', '-i', 'audio.mp3', '-c:v', 'copy', '-c:a', 'aac', '-map', '0:v:0', '-map', '1:a:0', '-shortest', 'output.mp4']);
            
            const data = await ffmpeg.readFile('output.mp4');
            const newFile = new File([data], `${selectedVideo.name}-voiceover.mp4`, { type: 'video/mp4' });
            setOutputVideoUrl(URL.createObjectURL(newFile));
            setProcessedVideoFile(newFile);
            showToast("Video processing complete!", "success");

        } catch (err) {
            showToast(`Video processing failed: ${(err as Error).message}`, "error");
            console.error(err);
        } finally {
            setIsProcessingVideo(false);
        }
    };
    
    const handleSaveToLibrary = async () => {
        if (!processedVideoFile) {
            showToast("No processed video to save.", "error");
            return;
        }
        await addAsset(processedVideoFile, processedVideoFile.name, ['voiceover', 'generated']);
    };
    
    if (isFreeUser) {
        return ( <div className="p-6"><EmptyState title="Upgrade to Unlock AI Speech Generation" description="Upgrade to transform text into natural-sounding audio." action={{ label: "Upgrade Your Plan", onClick: () => onNavigate(ViewName.Settings) }} icon={<MegaphoneIcon className="w-8 h-8 text-primary" />}/></div >);
    }
    if (personas.length === 0) {
        return ( <div className="p-6"><EmptyState title="Create a Persona to Begin" description="Create a persona to generate tailored content for speech generation." action={{ label: "Go to Audience Modeling", onClick: () => onNavigate(ViewName.AudienceModeling) }} icon={<UsersIcon className="w-8 h-8 text-primary" />}/></div >);
    }
    
    return (
        <div className="p-6">
            <header className="text-center mb-8"><h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">AI Speech Generation</h2><p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Transform content into natural audio with AI voices, and even combine it with video.</p></header>
            <div className="max-w-3xl mx-auto space-y-6">
                 <Card title="Step 1: Get Your Text Content"><div className="flex flex-col md:flex-row gap-4 items-end"><Select label="Select your audience" options={personaOptions} value={selectedPersonaId} onChange={(e) => setSelectedPersonaId(e.target.value)} containerClassName="flex-grow" disabled={isGeneratingAiContent} /><Button onClick={handleGenerateAiContent} isLoading={isGeneratingAiContent} disabled={!selectedPersonaId || isGeneratingAiContent || hasNoCredits} leftIcon={<SparklesIcon className="w-5 h-5"/>} className="w-full md:w-auto">Generate Content with AI</Button></div>{hasNoCredits && <p className="text-xs text-yellow-400 mt-2 text-center md:text-right">You have used all AI credits.</p>}</Card>
                 <Card title="Step 2: Generate Speech"><Textarea label="Enter Your Text" value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Type or paste text here..." rows={6} /><div className={`text-xs text-right mt-1 ${charCount > MAX_CHARS ? 'text-destructive' : 'text-muted-foreground'}`}>{charCount} / {MAX_CHARS}</div><div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4"><Select label="Voice" options={VOICE_OPTIONS} value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} /><Select label="Engine" options={ENGINE_OPTIONS} value={selectedEngine} onChange={(e) => setSelectedEngine(e.target.value)} /></div><Button onClick={handleConvertToSpeech} isLoading={isConverting} disabled={isConverting || charCount > MAX_CHARS} className="w-full mt-6" size="lg" leftIcon={<MegaphoneIcon className="w-5 h-5"/>}>Convert to Speech</Button></Card>
                {status && (<div className={`p-3 rounded-md text-sm text-center font-medium ${status.type === 'processing' && 'bg-yellow-400/20 text-yellow-300'} ${status.type === 'success' && 'bg-success/20 text-success'} ${status.type === 'error' && 'bg-destructive/20 text-destructive'}`}>{status.message}</div>)}
                {audioUrl && !isProcessingVideo && !outputVideoUrl && (<Card className="animate-fadeIn"><h3 className="text-lg font-semibold text-foreground text-center mb-4">Your Audio is Ready</h3><audio src={audioUrl} controls className="w-full" /><a href={audioUrl} download="pixasocial-speech.mp3"><Button variant="secondary" className="w-full mt-4" leftIcon={<DownloadIcon className="w-5 h-5"/>}>Download MP3</Button></a></Card>)}
                {audioUrl && (
                <Card title="Step 3: Combine with Video (Optional)" icon={<VideoCameraIcon className="w-5 h-5"/>} className="animate-fadeIn">
                    <Select label="Select Video from Library" options={videoOptions} value={selectedVideo?.id || ''} onChange={e => setSelectedVideo(contentLibraryAssets.find(v => v.id === e.target.value) || null)} containerClassName="mb-4" />
                    {selectedVideo && <video key={selectedVideo.id} src={selectedVideo.publicUrl || ''} controls className="w-full rounded-md max-h-48 bg-black" />}
                    <Button onClick={handleCombineVideo} isLoading={isProcessingVideo} disabled={!selectedVideo || isProcessingVideo} className="w-full mt-4" leftIcon={<PlusCircleIcon className="w-5 h-5"/>}>Combine Audio & Video</Button>
                </Card>
                )}
                {(isProcessingVideo || outputVideoUrl) && (
                <Card title="Video Output" className="animate-fadeIn">
                    {isProcessingVideo && <div className="text-center space-y-3"><LoadingSpinner text={`Processing... ${ffmpegProgress}%`} /><div className="w-full bg-border rounded-full h-2.5"><div className="bg-primary h-2.5 rounded-full" style={{ width: `${ffmpegProgress}%` }}></div></div></div>}
                    {outputVideoUrl && !isProcessingVideo && (
                        <div className="space-y-4">
                            <video src={outputVideoUrl} controls className="w-full rounded-lg bg-black" />
                            <div className="flex gap-2">
                                <Button asChild variant="secondary" className="flex-1"><a href={outputVideoUrl} download={processedVideoFile?.name || 'processed-video.mp4'}><DownloadIcon className="w-4 h-4 mr-2"/> Download Video</a></Button>
                                <Button onClick={handleSaveToLibrary} className="flex-1" variant="outline"><ArrowDownOnSquareIcon className="w-4 h-4 mr-2"/> Save to Library</Button>
                            </div>
                        </div>
                    )}
                </Card>
                )}
            </div>
        </div>
    );
};