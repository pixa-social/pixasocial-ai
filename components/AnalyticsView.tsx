

import React, { useState, useCallback, useMemo, useRef } from 'react';
import html2canvas from 'html2canvas';
import { Persona, OceanScores, UserProfile, ViewName, RSTProfile, AIPersonaAnalysis, AIOceanResponse, AIComparisonResponse } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { generateJson } from '../services/aiService';
import { PrerequisiteMessageCard } from './ui/PrerequisiteMessageCard';
import { useNavigateToView } from '../hooks/useNavigateToView';
import OceanRadarChart from './analytics/OceanRadarChart';
import OceanIntroductionGraphic from './analytics/OceanIntroductionGraphic';
import { ArrowDownTrayIcon } from './ui/Icons';
import { Tabs, Tab } from './ui/Tabs';
import { CopyButton } from './ui/CopyButton';


interface AnalyticsViewProps {
  currentUser: UserProfile;
  personas: Persona[];
  onNavigate?: (view: ViewName) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ currentUser, personas, onNavigate }) => {
  const [analysisMode, setAnalysisMode] = useState<'compare' | 'single'>('compare');
  
  const [selectedPersonaId, setSelectedPersonaId] = useState<number | null>(null);
  const [selectedPersonaId2, setSelectedPersonaId2] = useState<number | null>(null);
  
  const [oceanScores, setOceanScores] = useState<OceanScores | null>(null);
  const [oceanScores2, setOceanScores2] = useState<OceanScores | null>(null);
  const [textAnalysis, setTextAnalysis] = useState<AIPersonaAnalysis | null>(null);
  const [comparisonAnalysis, setComparisonAnalysis] = useState<string | null>(null);


  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigateTo = useNavigateToView(onNavigate);
  const comparisonRef = useRef<HTMLDivElement>(null);
  
  const hasNoCredits = currentUser.ai_usage_count_monthly >= currentUser.role.max_ai_uses_monthly;

  const personaOptions = useMemo(() => personas.map(p => ({ value: p.id, label: p.name })), [personas]);

  const personaOptions2 = useMemo(() => {
    if (!selectedPersonaId) return [];
    return personas
      .filter(p => p.id !== selectedPersonaId)
      .map(p => ({ value: p.id, label: p.name }));
  }, [personas, selectedPersonaId]);
  
  const clearResults = useCallback(() => {
      setOceanScores(null);
      setOceanScores2(null);
      setTextAnalysis(null);
      setComparisonAnalysis(null);
      setError(null);
  }, []);
  
  const handleModeChange = useCallback((newMode: 'compare' | 'single') => {
      setAnalysisMode(newMode);
      setSelectedPersonaId(null);
      setSelectedPersonaId2(null);
      clearResults();
  }, [clearResults]);
  
  const handleTabChange = useCallback((index: number) => {
    const newMode = index === 0 ? 'compare' : 'single';
    handleModeChange(newMode);
  }, [handleModeChange]);

  const handleComparePersonas = useCallback(async () => {
    if (!selectedPersonaId || !selectedPersonaId2) {
      setError("Please select two different personas to compare.");
      return;
    }
    const persona1 = personas.find(p => p.id === selectedPersonaId);
    const persona2 = personas.find(p => p.id === selectedPersonaId2);
    if (!persona1 || !persona2) {
      setError("One or both selected personas could not be found.");
      return;
    }

    setIsLoading(true);
    clearResults();

    const createComparisonPrompt = (p1: Persona, p2: Persona) => {
        const rst1 = p1.rst_profile as unknown as RSTProfile | null;
        const rst2 = p2.rst_profile as unknown as RSTProfile | null;
        return `
            You are a psychological analyst comparing two distinct audience personas. Based on the details provided for Persona 1 and Persona 2, perform the following tasks and return your response as a single, valid JSON object.

            Persona 1 Details:
            - Name: ${p1.name}
            - Demographics: ${p1.demographics}
            - Psychographics: ${p1.psychographics}
            - Initial Beliefs: ${p1.initial_beliefs}
            - Vulnerabilities: ${p1.vulnerabilities?.join(', ') || 'Not specified'}
            - RST Profile: BAS: ${rst1?.bas || 'N/A'}, BIS: ${rst1?.bis || 'N/A'}, FFFS: ${rst1?.fffs || 'N/A'}

            Persona 2 Details:
            - Name: ${p2.name}
            - Demographics: ${p2.demographics}
            - Psychographics: ${p2.psychographics}
            - Initial Beliefs: ${p2.initial_beliefs}
            - Vulnerabilities: ${p2.vulnerabilities?.join(', ') || 'Not specified'}
            - RST Profile: BAS: ${rst2?.bas || 'N/A'}, BIS: ${rst2?.bis || 'N/A'}, FFFS: ${rst2?.fffs || 'N/A'}

            JSON Output Requirements:
            Your entire response must be a single JSON object with three top-level keys: "persona1Scores", "persona2Scores", and "comparisonText".

            1. "persona1Scores": An object with scores from 0.0 to 1.0 for Persona 1 on each of the five OCEAN traits: "creativity", "organization", "sociability", "kindness", and "emotionalStability".
            2. "persona2Scores": An object with scores from 0.0 to 1.0 for Persona 2 on each of the five OCEAN traits.
            3. "comparisonText": A concise, insightful paragraph (2-3 sentences) comparing and contrasting the two personas based on their OCEAN profiles. Highlight key differences and similarities and suggest what this means for targeting them.
        `;
    };
    
    const systemInstruction = "You are a psychological analyst. Based on persona details, you will score them on the Big Five OCEAN personality traits and provide a comparison. 'emotionalStability' is the inverse of Neuroticism; a high score means the persona is calm and emotionally stable. Ensure all scores are between 0.0 and 1.0. Your entire output must be a single, valid JSON object as requested.";

    const result = await generateJson<AIComparisonResponse>(createComparisonPrompt(persona1, persona2), currentUser, systemInstruction);

    if (result.data) {
        const validateScores = (scores: OceanScores | null, personaName: string) => {
             if (!scores) return `AI did not return data for ${personaName}.`;
             const isValid = Object.values(scores).every(val => typeof val === 'number' && val >= 0 && val <= 1);
            return isValid ? null : `AI returned invalid data for ${personaName}.`;
        };
        let errors: string[] = [];

        const p1Error = validateScores(result.data.persona1Scores, persona1.name);
        const p2Error = validateScores(result.data.persona2Scores, persona2.name);
        if (p1Error) errors.push(p1Error);
        if (p2Error) errors.push(p2Error);

        if (errors.length > 0) {
            setError(errors.join('\n'));
        } else {
            setOceanScores(result.data.persona1Scores);
            setOceanScores2(result.data.persona2Scores);
            setComparisonAnalysis(result.data.comparisonText);
        }
    } else {
        setError(result.error || "Failed to generate comparison.");
    }

    setIsLoading(false);
  }, [selectedPersonaId, selectedPersonaId2, personas, currentUser, clearResults]);


  const handleSinglePersonaAnalysis = useCallback(async () => {
    if (!selectedPersonaId) {
      setError("Please select a persona to analyze.");
      return;
    }
    const persona = personas.find(p => p.id === selectedPersonaId);
    if (!persona) {
      setError("Selected persona could not be found.");
      return;
    }

    setIsLoading(true);
    clearResults();

    const rstProfile = persona.rst_profile as unknown as RSTProfile | null;
    const prompt = `
      Based on the following audience persona, generate a detailed psychological analysis.
      Persona Details:
      - Name: ${persona.name}
      - Demographics: ${persona.demographics}
      - Psychographics: ${persona.psychographics}
      - Initial Beliefs: ${persona.initial_beliefs}
      - Vulnerabilities: ${persona.vulnerabilities?.join(', ') || 'Not specified'}
      - RST Profile: BAS: ${rstProfile?.bas || 'N/A'}, BIS: ${rstProfile?.bis || 'N/A'}, FFFS: ${rstProfile?.fffs || 'N/A'}
      
      Your task is to respond with a single, valid JSON object. This object must contain two main keys: "oceanScores" and "analysis".
      1.  "oceanScores": An object with scores from 0.0 to 1.0 for each of the five OCEAN traits: "creativity" (Openness), "organization" (Conscientiousness), "sociability" (Extraversion), "kindness" (Agreeableness), and "emotionalStability" (low Neuroticism).
      2.  "analysis": An object containing two string fields:
          - "explanation": A brief, insightful paragraph explaining what the OCEAN scores reveal about this persona's personality and likely behaviors.
          - "strategy": A concise, actionable paragraph outlining a recommended campaign strategy to effectively engage this persona, based on their personality profile.
      
      Ensure all scores are numbers between 0.0 and 1.0. The explanation and strategy should be well-written and directly derived from the persona data.
    `;
    const systemInstruction = "You are a psychological analyst. Based on persona details, you will score them on the Big Five OCEAN personality traits and provide a brief explanation and a recommended campaign strategy. 'emotionalStability' is the inverse of Neuroticism. Ensure your entire output is a single, valid JSON object as requested.";
    
    const result = await generateJson<AIOceanResponse>(prompt, currentUser, systemInstruction);

    if (result.data && result.data.oceanScores && result.data.analysis) {
        setOceanScores(result.data.oceanScores);
        setTextAnalysis(result.data.analysis);
    } else {
        setError(result.error || "Failed to generate analysis. The AI returned incomplete or invalid data.");
    }

    setIsLoading(false);
  }, [selectedPersonaId, personas, currentUser, clearResults]);


  const handleDownloadImage = useCallback(async () => {
    const element = comparisonRef.current;
    if (!element || !oceanScores) return;

    const persona1 = personas.find(p => p.id === selectedPersonaId);
    let downloadName = `persona_analysis_${persona1?.name || 'persona'}.png`;

    if (analysisMode === 'compare' && oceanScores2) {
        const persona2 = personas.find(p => p.id === selectedPersonaId2);
        downloadName = `persona_comparison_${persona1?.name}_vs_${persona2?.name}.png`;
    }

    const canvas = await html2canvas(element, { backgroundColor: '#1f2937', useCORS: true });
    const data = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = data;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [oceanScores, oceanScores2, personas, selectedPersonaId, selectedPersonaId2, analysisMode]);

  const showPrerequisiteMessage = personas.length === 0;

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-textPrimary mb-6">Persona Analytics</h2>
      
      <OceanIntroductionGraphic />

      {showPrerequisiteMessage && (
        <PrerequisiteMessageCard
          title="Prerequisite Missing"
          message="Please create at least one Persona in 'Audience Modeling' before running an analysis."
          action={onNavigate ? { label: 'Go to Audience Modeling', onClick: () => navigateTo(ViewName.AudienceModeling) } : undefined }
        />
      )}
      {error && <Card className="mb-4 bg-red-500/10 border-l-4 border-danger text-danger p-4"><p>{error}</p></Card>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Configuration" className="md:col-span-1">
            <Tabs onTabChange={handleTabChange}>
                <Tab label="Compare Personas">
                    <div className="pt-4 space-y-4">
                        <Select 
                            label="Select Persona 1" 
                            options={personaOptions} 
                            value={selectedPersonaId || ''} 
                            onChange={e => { 
                                setSelectedPersonaId(Number(e.target.value)); 
                                setSelectedPersonaId2(null); 
                                clearResults();
                            }}
                            required disabled={showPrerequisiteMessage || isLoading} 
                        />
                        <Select 
                            label="Compare With" 
                            options={personaOptions2} 
                            value={selectedPersonaId2 || ''} 
                            onChange={e => {
                                setSelectedPersonaId2(Number(e.target.value)); 
                                clearResults();
                            }}
                            required disabled={showPrerequisiteMessage || isLoading || !selectedPersonaId} 
                        />
                        {hasNoCredits && (
                             <p className="mt-4 text-sm text-yellow-400 text-center">You have used all your AI credits for this month.</p>
                        )}
                        <Button 
                            variant="primary" 
                            onClick={handleComparePersonas} 
                            isLoading={isLoading && analysisMode === 'compare'}
                            className="w-full mt-2"
                            disabled={!selectedPersonaId || !selectedPersonaId2 || isLoading || showPrerequisiteMessage || hasNoCredits}
                            title={hasNoCredits ? "You have no AI credits remaining." : "Compare personas"}
                        >
                            {isLoading && analysisMode === 'compare' ? 'Comparing...' : 'Compare Personas'}
                        </Button>
                    </div>
                </Tab>
                <Tab label="Single Analysis">
                    <div className="pt-4 space-y-4">
                        <Select 
                            label="Select Persona" 
                            options={personaOptions} 
                            value={selectedPersonaId || ''} 
                            onChange={e => {
                                setSelectedPersonaId(Number(e.target.value));
                                setSelectedPersonaId2(null);
                                clearResults();
                            }}
                            required disabled={showPrerequisiteMessage || isLoading} 
                        />
                        {hasNoCredits && (
                             <p className="mt-4 text-sm text-yellow-400 text-center">You have used all your AI credits for this month.</p>
                        )}
                        <Button 
                            variant="primary" 
                            onClick={handleSinglePersonaAnalysis} 
                            isLoading={isLoading && analysisMode === 'single'}
                            className="w-full mt-2"
                            disabled={!selectedPersonaId || isLoading || showPrerequisiteMessage || hasNoCredits}
                            title={hasNoCredits ? "You have no AI credits remaining." : "Analyze persona"}
                        >
                             {isLoading && analysisMode === 'single' ? 'Analyzing...' : 'Analyze Persona'}
                        </Button>
                    </div>
                </Tab>
            </Tabs>
        </Card>

        <Card title="Analysis Results" className="md:col-span-2 min-h-[400px]">
          {isLoading && <LoadingSpinner text="AI is analyzing the persona(s)..." />}
          
          {!isLoading && !oceanScores && !error && (
            <p className="text-textSecondary text-center py-10">Select persona(s) and click the button to see the analysis.</p>
          )}
          
          <div ref={comparisonRef} className="bg-card">
            {analysisMode === 'compare' && oceanScores && oceanScores2 && (
              <div className="p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="text-center">
                      <h4 className="text-xl font-bold text-primary mb-2">{personas.find(p => p.id === selectedPersonaId)?.name}</h4>
                      <div className="w-full h-80">
                          <OceanRadarChart scores={oceanScores} color="#38bdf8" gradientId="persona1-gradient" />
                      </div>
                  </div>
                  <div className="text-center">
                      <h4 className="text-xl font-bold text-accent mb-2">{personas.find(p => p.id === selectedPersonaId2)?.name}</h4>
                      <div className="w-full h-80">
                          <OceanRadarChart scores={oceanScores2} color="#22d3ee" gradientId="persona2-gradient"/>
                      </div>
                  </div>
                </div>
                {comparisonAnalysis && (
                    <Card title="AI-Powered Comparison" className="bg-background mt-6">
                        <div className="relative group">
                            <p className="text-textSecondary leading-relaxed">{comparisonAnalysis}</p>
                            <CopyButton textToCopy={comparisonAnalysis} size="sm" className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </Card>
                )}
              </div>
            )}

            {analysisMode === 'single' && oceanScores && (
                 <div className="p-4">
                    <h4 className="text-2xl font-bold text-primary text-center mb-2">{personas.find(p => p.id === selectedPersonaId)?.name}</h4>
                    <div className="w-full h-80 max-w-lg mx-auto">
                        <OceanRadarChart scores={oceanScores} color="#38bdf8" gradientId="persona1-gradient" />
                    </div>
                </div>
            )}
          </div>
          
          {analysisMode === 'single' && textAnalysis && (
            <div className="space-y-6 mt-4">
                <Card title="AI-Powered Analysis & Strategy" className="bg-background">
                    <div className="relative group">
                        <h5 className="text-lg font-semibold text-textPrimary mb-1">Psychological Explanation</h5>
                        <p className="text-textSecondary leading-relaxed">{textAnalysis.explanation}</p>
                        <CopyButton textToCopy={textAnalysis.explanation} size="sm" className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="relative group mt-4">
                        <h5 className="text-lg font-semibold text-textPrimary mb-1">Recommended Campaign Strategy</h5>
                        <p className="text-textSecondary leading-relaxed">{textAnalysis.strategy}</p>
                        <CopyButton textToCopy={textAnalysis.strategy} size="sm" className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </Card>
            </div>
          )}
          
          {!isLoading && oceanScores && (
            <div className="mt-6 text-center">
                <Button onClick={handleDownloadImage} variant="secondary" leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}>
                    Download Chart as PNG
                </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};