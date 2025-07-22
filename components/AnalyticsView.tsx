import React, { useState, useCallback, useMemo, useRef } from 'react';
import html2canvas from 'html2canvas';
import { Persona, OceanScores, ViewName, RSTProfile, AIPersonaAnalysis, AIOceanResponse, AIComparisonResponse, AIAudienceSnapshotResponse } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { generateJson } from '../services/aiService';
import { EmptyState } from './ui/EmptyState';
import { useNavigate } from 'react-router-dom';
import OceanRadarChart from './analytics/OceanRadarChart';
import OceanIntroductionGraphic from './analytics/OceanIntroductionGraphic';
import { ArrowDownTrayIcon, UsersIcon, LightBulbIcon, TargetIcon } from './ui/Icons';
import { Tabs, Tab } from './ui/Tabs';
import { CopyButton } from './ui/CopyButton';
import { useAppDataContext } from './MainAppLayout';
import { VIEW_PATH_MAP } from '../constants';

export const AnalyticsView: React.FC = () => {
  const { currentUser, personas, onNavigate } = useAppDataContext();
  const navigate = useNavigate();

  const [analysisMode, setAnalysisMode] = useState<'compare' | 'single' | 'snapshot'>('snapshot');
  const [selectedPersonaId, setSelectedPersonaId] = useState<number | null>(null);
  const [selectedPersonaId2, setSelectedPersonaId2] = useState<number | null>(null);
  const [oceanScores, setOceanScores] = useState<OceanScores | null>(null);
  const [oceanScores2, setOceanScores2] = useState<OceanScores | null>(null);
  const [textAnalysis, setTextAnalysis] = useState<AIPersonaAnalysis | null>(null);
  const [comparisonAnalysis, setComparisonAnalysis] = useState<string | null>(null);
  const [audienceSnapshot, setAudienceSnapshot] = useState<AIAudienceSnapshotResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);
  
  const hasNoCredits = currentUser.ai_usage_count_monthly >= currentUser.role.max_ai_uses_monthly;
  const personaOptions = useMemo(() => personas.map(p => ({ value: p.id, label: p.name })), [personas]);
  const personaOptions2 = useMemo(() => {
    if (!selectedPersonaId) return [];
    return personas.filter(p => p.id !== selectedPersonaId).map(p => ({ value: p.id, label: p.name }));
  }, [personas, selectedPersonaId]);
  
  const clearResults = useCallback(() => {
      setOceanScores(null); setOceanScores2(null); setTextAnalysis(null);
      setComparisonAnalysis(null); setAudienceSnapshot(null); setError(null);
  }, []);
  
  const handleTabChange = useCallback((index: number) => {
    const modes: ('snapshot' | 'compare' | 'single')[] = ['snapshot', 'compare', 'single'];
    setAnalysisMode(modes[index]);
    setSelectedPersonaId(null); setSelectedPersonaId2(null); clearResults();
  }, [clearResults]);

  const handleGenerateSnapshot = useCallback(async () => {
    if (personas.length < 2) { setError("Please create at least two personas to generate an audience snapshot."); return; }
    setIsLoading(true); clearResults();
    const personaSummaries = personas.map(p => ({ name: p.name, demographics: p.demographics, psychographics: p.psychographics, rst_profile: p.rst_profile }));
    const prompt = `Analyze the following array of audience personas to create a high-level "Audience Snapshot". Personas Array: ${JSON.stringify(personaSummaries, null, 2)} Your task is to respond with a single, valid JSON object with three keys: "averageOceanScores", "strategicSummary", and "archetypes". 1. "averageOceanScores": An object with the AVERAGE scores (from 0.0 to 1.0) for the ENTIRE audience across the five OCEAN traits: "creativity", "organization", "sociability", "kindness", "emotionalStability". 2. "strategicSummary": A concise, insightful paragraph summarizing the overall audience personality. 3. "archetypes": An array of 2-3 distinct audience archetypes you've identified. For each archetype object, include: "name", "description", and "recommendedStrategy".`;
    const systemInstruction = "You are a senior market research analyst specializing in psychographics. Aggregate persona data to provide a portfolio-level strategic overview. Ensure all scores are numbers between 0.0 and 1.0. Your entire output must be a single, valid JSON object as requested.";
    const result = await generateJson<AIAudienceSnapshotResponse>(prompt, currentUser, systemInstruction);
    if (result.data?.averageOceanScores && result.data.strategicSummary && result.data.archetypes) { setAudienceSnapshot(result.data); }
    else { setError(result.error || "Failed to generate audience snapshot. The AI returned incomplete or invalid data."); }
    setIsLoading(false);
  }, [personas, currentUser, clearResults]);

  const handleComparePersonas = useCallback(async () => {
    if (!selectedPersonaId || !selectedPersonaId2) { setError("Please select two different personas to compare."); return; }
    const persona1 = personas.find(p => p.id === selectedPersonaId);
    const persona2 = personas.find(p => p.id === selectedPersonaId2);
    if (!persona1 || !persona2) { setError("One or both selected personas could not be found."); return; }
    setIsLoading(true); clearResults();
    const rst1 = persona1.rst_profile as unknown as RSTProfile | null;
    const rst2 = persona2.rst_profile as unknown as RSTProfile | null;
    const prompt = `You are a psychological analyst comparing two distinct audience personas. Based on the details provided for Persona 1 and Persona 2, perform the following tasks and return your response as a single, valid JSON object. Persona 1 Details: Name: ${persona1.name}, Demographics: ${persona1.demographics}, Psychographics: ${persona1.psychographics}, Initial Beliefs: ${persona1.initial_beliefs}, Vulnerabilities: ${persona1.vulnerabilities?.join(', ') || 'Not specified'}, RST Profile: BAS: ${rst1?.bas || 'N/A'}, BIS: ${rst1?.bis || 'N/A'}, FFFS: ${rst1?.fffs || 'N/A'}. Persona 2 Details: Name: ${persona2.name}, Demographics: ${persona2.demographics}, Psychographics: ${persona2.psychographics}, Initial Beliefs: ${persona2.initial_beliefs}, Vulnerabilities: ${persona2.vulnerabilities?.join(', ') || 'Not specified'}, RST Profile: BAS: ${rst2?.bas || 'N/A'}, BIS: ${rst2?.bis || 'N/A'}, FFFS: ${rst2?.fffs || 'N/A'}. Your entire response must be a single JSON object with three top-level keys: "persona1Scores", "persona2Scores", and "comparisonText". 1. "persona1Scores": An object with scores from 0.0 to 1.0 for Persona 1 on each of the five OCEAN traits: "creativity", "organization", "sociability", "kindness", and "emotionalStability". 2. "persona2Scores": An object with scores from 0.0 to 1.0 for Persona 2 on each of the five OCEAN traits. 3. "comparisonText": A concise, insightful paragraph (2-3 sentences) comparing and contrasting the two personas based on their OCEAN profiles.`;
    const systemInstruction = "You are a psychological analyst. Score them on Big Five OCEAN traits. 'emotionalStability' is the inverse of Neuroticism. All scores between 0.0 and 1.0. Your output must be a single, valid JSON object.";
    const result = await generateJson<AIComparisonResponse>(prompt, currentUser, systemInstruction);
    if (result.data) { setOceanScores(result.data.persona1Scores); setOceanScores2(result.data.persona2Scores); setComparisonAnalysis(result.data.comparisonText); }
    else { setError(result.error || "Failed to generate comparison."); }
    setIsLoading(false);
  }, [selectedPersonaId, selectedPersonaId2, personas, currentUser, clearResults]);

  const handleSinglePersonaAnalysis = useCallback(async () => {
    if (!selectedPersonaId) { setError("Please select a persona to analyze."); return; }
    const persona = personas.find(p => p.id === selectedPersonaId);
    if (!persona) { setError("Selected persona could not be found."); return; }
    setIsLoading(true); clearResults();
    const rstProfile = persona.rst_profile as unknown as RSTProfile | null;
    const prompt = `Based on the following audience persona, generate a detailed psychological analysis. Persona Details: Name: ${persona.name}, Demographics: ${persona.demographics}, Psychographics: ${persona.psychographics}, Initial Beliefs: ${persona.initial_beliefs}, Vulnerabilities: ${persona.vulnerabilities?.join(', ') || 'Not specified'}, RST Profile: BAS: ${rstProfile?.bas || 'N/A'}, BIS: ${rstProfile?.bis || 'N/A'}, FFFS: ${rstProfile?.fffs || 'N/A'}. Your task is to respond with a single, valid JSON object with two keys: "oceanScores" and "analysis". 1. "oceanScores": An object with scores from 0.0 to 1.0 for each OCEAN trait: "creativity", "organization", "sociability", "kindness", and "emotionalStability". 2. "analysis": An object with "explanation" and "strategy" fields.`;
    const systemInstruction = "You are a psychological analyst. Score on Big Five OCEAN traits. 'emotionalStability' is the inverse of Neuroticism. Ensure your entire output is a single, valid JSON object.";
    const result = await generateJson<AIOceanResponse>(prompt, currentUser, systemInstruction);
    if (result.data && result.data.oceanScores && result.data.analysis) { setOceanScores(result.data.oceanScores); setTextAnalysis(result.data.analysis); }
    else { setError(result.error || "Failed to generate analysis."); }
    setIsLoading(false);
  }, [selectedPersonaId, personas, currentUser, clearResults]);

  const handleDownloadImage = useCallback(async () => {
    const element = comparisonRef.current;
    if (!element || (!oceanScores && !audienceSnapshot)) return;
    let downloadName = 'persona_analysis.png';
    if (analysisMode === 'snapshot' && audienceSnapshot) downloadName = 'audience_snapshot.png';
    else if (analysisMode === 'single' && oceanScores) { const persona = personas.find(p => p.id === selectedPersonaId); downloadName = `persona_analysis_${persona?.name || 'persona'}.png`; }
    else if (analysisMode === 'compare' && oceanScores && oceanScores2) { const p1 = personas.find(p => p.id === selectedPersonaId); const p2 = personas.find(p => p.id === selectedPersonaId2); downloadName = `comparison_${p1?.name}_vs_${p2?.name}.png`; }
    const canvas = await html2canvas(element, { backgroundColor: '#111827', useCORS: true });
    const data = canvas.toDataURL('image/png'); const link = document.createElement('a'); link.href = data; link.download = downloadName; document.body.appendChild(link); link.click(); document.body.removeChild(link);
  }, [oceanScores, oceanScores2, audienceSnapshot, personas, selectedPersonaId, selectedPersonaId2, analysisMode]);

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-textPrimary mb-6">Persona Analytics</h2>
      <OceanIntroductionGraphic />
      {personas.length === 0 && ( <EmptyState
        title="No Personas to Analyze"
        description="Create an audience persona in the 'Audience Modeling' section to unlock powerful psychographic analytics."
        action={{ label: 'Go to Audience Modeling', onClick: () => onNavigate(ViewName.AudienceModeling) }}
        icon={<UsersIcon className="w-8 h-8 text-primary" />}
      /> )}
      {error && <Card className="mb-4 bg-red-500/10 border-l-4 border-danger text-danger p-4"><p>{error}</p></Card>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Configuration" className="md:col-span-1">
            <Tabs onTabChange={handleTabChange} defaultActiveTab={0}>
                <Tab label="Snapshot" icon={<UsersIcon className="w-4 h-4"/>}><div className="pt-4 space-y-4 text-center"><p className="text-sm text-textSecondary">Get a high-level overview of your entire audience.</p>{hasNoCredits && <p className="mt-4 text-sm text-yellow-400">You have no AI credits remaining.</p>}<Button variant="primary" onClick={handleGenerateSnapshot} isLoading={isLoading && analysisMode === 'snapshot'} className="w-full mt-2" disabled={personas.length < 2 || isLoading || hasNoCredits} title={hasNoCredits ? "No AI credits." : (personas.length < 2 ? "Requires 2+ personas" : "Generate Snapshot")}>{isLoading && analysisMode === 'snapshot' ? 'Analyzing...' : 'Generate Audience Snapshot'}</Button></div></Tab>
                <Tab label="Compare"><div className="pt-4 space-y-4"><Select label="Select Persona 1" options={personaOptions} value={selectedPersonaId || ''} onChange={e => { setSelectedPersonaId(Number(e.target.value)); setSelectedPersonaId2(null); clearResults(); }} required disabled={personas.length === 0 || isLoading} /><Select label="Compare With" options={personaOptions2} value={selectedPersonaId2 || ''} onChange={e => { setSelectedPersonaId2(Number(e.target.value)); clearResults(); }} required disabled={personas.length === 0 || isLoading || !selectedPersonaId} />{hasNoCredits && <p className="mt-4 text-sm text-yellow-400 text-center">No AI credits left.</p>}<Button variant="primary" onClick={handleComparePersonas} isLoading={isLoading && analysisMode === 'compare'} className="w-full mt-2" disabled={!selectedPersonaId || !selectedPersonaId2 || isLoading || personas.length === 0 || hasNoCredits} title={hasNoCredits ? "No AI credits remaining." : "Compare personas"}>{isLoading && analysisMode === 'compare' ? 'Comparing...' : 'Compare Personas'}</Button></div></Tab>
                <Tab label="Single"><div className="pt-4 space-y-4"><Select label="Select Persona" options={personaOptions} value={selectedPersonaId || ''} onChange={e => { setSelectedPersonaId(Number(e.target.value)); setSelectedPersonaId2(null); clearResults(); }} required disabled={personas.length === 0 || isLoading} />{hasNoCredits && <p className="mt-4 text-sm text-yellow-400 text-center">No AI credits left.</p>}<Button variant="primary" onClick={handleSinglePersonaAnalysis} isLoading={isLoading && analysisMode === 'single'} className="w-full mt-2" disabled={!selectedPersonaId || isLoading || personas.length === 0 || hasNoCredits} title={hasNoCredits ? "No AI credits remaining." : "Analyze persona"}>{isLoading && analysisMode === 'single' ? 'Analyzing...' : 'Analyze Persona'}</Button></div></Tab>
            </Tabs>
        </Card>
        <Card title="Analysis Results" className="md:col-span-2 min-h-[400px]">
          {isLoading && <LoadingSpinner text="AI is analyzing..." />}
          {!isLoading && !oceanScores && !error && !audienceSnapshot && <p className="text-textSecondary text-center py-10">Select an analysis type and persona(s) to see the results.</p>}
          <div ref={comparisonRef} className="bg-card">
            {analysisMode === 'snapshot' && audienceSnapshot && <div className="p-4"><h4 className="text-2xl font-bold text-primary text-center mb-2">Audience Snapshot</h4><div className="w-full h-96 max-w-lg mx-auto"><OceanRadarChart scores={audienceSnapshot.averageOceanScores} color="#38bdf8" gradientId="snapshot-gradient" /></div></div>}
            {analysisMode === 'compare' && oceanScores && oceanScores2 && <div className="p-4"><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="text-center"><h4 className="text-xl font-bold text-primary mb-2">{personas.find(p => p.id === selectedPersonaId)?.name}</h4><div className="w-full h-80"><OceanRadarChart scores={oceanScores} color="#38bdf8" gradientId="persona1-gradient" /></div></div><div className="text-center"><h4 className="text-xl font-bold text-accent mb-2">{personas.find(p => p.id === selectedPersonaId2)?.name}</h4><div className="w-full h-80"><OceanRadarChart scores={oceanScores2} color="#22d3ee" gradientId="persona2-gradient"/></div></div></div></div>}
            {analysisMode === 'single' && oceanScores && <div className="p-4"><h4 className="text-2xl font-bold text-primary text-center mb-2">{personas.find(p => p.id === selectedPersonaId)?.name}</h4><div className="w-full h-80 max-w-lg mx-auto"><OceanRadarChart scores={oceanScores} color="#38bdf8" gradientId="persona1-gradient" /></div></div>}
          </div>
          {analysisMode === 'snapshot' && audienceSnapshot && <div className="space-y-6 mt-4"><Card title="Strategic Summary" className="bg-background"><div className="relative group"><p className="text-textSecondary leading-relaxed">{audienceSnapshot.strategicSummary}</p><CopyButton textToCopy={audienceSnapshot.strategicSummary} size="sm" className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity" /></div></Card><Card title="Key Audience Archetypes" className="bg-background"><div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{audienceSnapshot.archetypes.map((archetype, index) => ( <div key={index} className="p-4 rounded-lg bg-card/50 border border-border"><h5 className="font-semibold text-primary flex items-center mb-1"><TargetIcon className="w-4 h-4 mr-2"/> {archetype.name}</h5><p className="text-sm text-textSecondary italic mb-2">"{archetype.description}"</p><p className="text-sm text-textSecondary"><strong className="text-textPrimary font-medium">Strategy:</strong> {archetype.recommendedStrategy}</p></div>))}</div></Card></div>}
          {analysisMode === 'compare' && comparisonAnalysis && <Card title="AI-Powered Comparison" className="bg-background mt-6"><div className="relative group"><p className="text-textSecondary leading-relaxed">{comparisonAnalysis}</p><CopyButton textToCopy={comparisonAnalysis} size="sm" className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity" /></div></Card>}
          {analysisMode === 'single' && textAnalysis && <div className="space-y-6 mt-4"><Card title="Persona Analysis & Strategy" className="bg-background"><div className="relative group"><h5 className="text-lg font-semibold text-textPrimary mb-1">Psychological Explanation</h5><p className="text-textSecondary leading-relaxed">{textAnalysis.explanation}</p><CopyButton textToCopy={textAnalysis.explanation} size="sm" className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity" /></div><div className="relative group mt-4"><h5 className="text-lg font-semibold text-textPrimary mb-1">Recommended Campaign Strategy</h5><p className="text-textSecondary leading-relaxed">{textAnalysis.strategy}</p><CopyButton textToCopy={textAnalysis.strategy} size="sm" className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity" /></div></Card></div>}
          {!isLoading && (oceanScores || audienceSnapshot) && <div className="mt-6 text-center"><Button onClick={handleDownloadImage} variant="secondary" leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}>Download Chart as PNG</Button></div>}
        </Card>
      </div>
    </div>
  );
};
