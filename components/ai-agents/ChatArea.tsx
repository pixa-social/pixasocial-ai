
import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@ai-sdk/react';
import { Persona, UserProfile, AdminPersona } from '../../types';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { PaperAirplaneIcon, DownloadIcon } from '../ui/Icons';
import { ChatMessage } from './ChatMessage';
import { PersonaSelector } from './PersonaSelector';
import { WelcomeScreen } from './WelcomeScreen';
import { Mic, Search, Bot } from 'lucide-react';
import { Switch } from '../ui/Switch';
import { SmartReplies } from './SmartReplies';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { useAIAgentChat } from './hooks/useAIAgentChat';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
type UseChatHelpers = ReturnType<typeof useChat>;
type ChatState = ReturnType<typeof useAIAgentChat>['state'];
type ChatHandlers = ReturnType<typeof useAIAgentChat>['handlers'];

interface ChatAreaProps {
  currentUser: UserProfile;
  personas: Persona[];
  activePersona: Persona | null;
  chatState: ChatState;
  chatHandlers: ChatHandlers;
  chatHelpers: UseChatHelpers;
}

/* ------------------------------------------------------------------ */
/* Animation variants                                                 */
/* ------------------------------------------------------------------ */
const loadingVariants = { initial: { opacity: 0 }, animate: { opacity: 1 } };

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export const ChatArea: React.FC<ChatAreaProps> = ({
  currentUser,
  personas,
  activePersona,
  chatState,
  chatHandlers,
  chatHelpers,
}) => {
  const { messages, input, handleInputChange, isLoading } = chatHelpers;
  const { isGoogleSearchEnabled, smartReplies } = chatState;
  const { setIsGoogleSearchEnabled, handleSendMessage, handleSmartReply, exportChat } =
    chatHandlers;

  /* refs & local state */
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  /* scroll to bottom on new messages / loading change */
  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isLoading]);

  /* callbacks wrapped in useCallback to preserve reference equality */
  const handlePersonaSelect = useCallback(
    (persona: Persona | AdminPersona) => {
      if ('user_id' in persona) { // This is a type guard for Persona
        chatHandlers.handleSetActivePersona(persona);
      }
      // An admin persona cannot be selected from within an active chat area,
      // so we don't need an else block.
      setPopoverOpen(false);
    },
    [chatHandlers],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    },
    [],
  );

  /* memoize placeholder since activePersona is stable */
  const placeholderText = useMemo(
    () => `Message ${activePersona?.name || 'your agent'}…`,
    [activePersona?.name],
  );

  /* early-exit for welcome screen */
  if (!activePersona) {
    return (
      <WelcomeScreen
        personas={personas}
        activePersona={null}
        onSelectPersona={handlePersonaSelect}
      />
    );
  }

  return (
    <main className="flex-1 flex flex-col bg-card overflow-hidden">
      {/* Header ------------------------------------------------------ */}
      <header className="flex items-center justify-between p-3 border-b border-border bg-card/80 backdrop-blur-sm z-10">
        <PersonaSelector
          personas={personas}
          activePersona={activePersona}
          onSelect={handlePersonaSelect}
          open={popoverOpen}
          onOpenChange={setPopoverOpen}
          sentiment={chatState.sentiment}
        />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" leftIcon={<DownloadIcon className="w-4 h-4" />}>
              Export
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-1">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => exportChat('md')}
            >
              as Markdown (.md)
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => exportChat('pdf')}
            >
              as PDF (.pdf)
            </Button>
          </PopoverContent>
        </Popover>
      </header>

      {/* Scrollable messages ---------------------------------------- */}
      <div ref={chatContainerRef} className="flex-grow w-full overflow-y-auto" data-chat-export-area="true">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 w-full space-y-6">
          <AnimatePresence>
            {messages.map((m) => (
              <ChatMessage
                key={m.id}
                message={m}
                currentUser={currentUser}
                activePersona={activePersona}
              />
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              variants={loadingVariants}
              initial="initial"
              animate="animate"
              className="flex items-start gap-4"
            >
              <ChatMessage
                message={{ id: 'loading', role: 'assistant', content: '' }}
                currentUser={currentUser}
                activePersona={activePersona}
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* Input area -------------------------------------------------- */}
      <div className="w-full mt-auto p-4 border-t border-border bg-card/50">
        <div className="max-w-4xl mx-auto">
          {smartReplies.length > 0 && !isLoading && (
            <SmartReplies replies={smartReplies} onSelect={handleSmartReply} />
          )}

          <form ref={formRef} onSubmit={handleSendMessage}>
            <Card className="p-2 sm:p-3 relative shadow-2xl">
              <Textarea
                value={input}
                onChange={handleInputChange}
                onKeyDown={onKeyDown}
                placeholder={placeholderText}
                className="text-base bg-transparent border-none focus:ring-0 resize-none pr-24"
                containerClassName="flex-grow mb-0"
                rows={1}
                aria-label="Chat input"
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  title="Voice input (coming soon)"
                  aria-label="Voice input"
                >
                  <Mic className="w-5 h-5" />
                </Button>
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || !input.trim()}
                  aria-label="Send message"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </Button>
              </div>
            </Card>
          </form>

          {/* Footer toggles ------------------------------------------ */}
          <div className="flex justify-center items-center gap-4 mt-3">
            <div
              className="flex items-center gap-2 text-sm text-muted-foreground"
              title="Enable Google Search for grounded, up-to-date answers with sources."
            >
              <Switch
                checked={isGoogleSearchEnabled}
                onCheckedChange={setIsGoogleSearchEnabled}
                id="google-search-switch"
              />
              <label
                htmlFor="google-search-switch"
                className="flex items-center gap-1 cursor-pointer"
              >
                <Search className="w-4 h-4" /> Grounded Search
              </label>
            </div>

            <div
              className="flex items-center gap-1 text-sm text-muted-foreground"
              title="Enable to upload documents for the agent to use as context. (Coming Soon)"
            >
              <Bot className="w-4 h-4" /> RAG / Persona Lens
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
