import { useState, useRef, useEffect } from 'react';
import { MetaAppShell } from '../components/shell/MetaAppShell';
import { MetaPageHeader } from '../components/MetaPageHeader';
import { mockLynxHistory } from '../data/mockLynxData';
import { LynxChatMessage } from '../components/lynx/LynxChatMessage';
import { LynxIcon } from '../components/icons/LynxIcon';
import { Send, Sparkles, Info } from 'lucide-react';
import clsx from 'clsx';

const suggestedQuestions = [
  'Why is our EBITDA higher than forecast?',
  'What canon rules govern revenue recognition?',
  'Show me all critical compliance issues',
  'Which fields are bound to SAP_ERP?',
  'Explain the lemon theory lifecycle',
];

export function MetaLynxCodexPage() {
  const [messages, setMessages] = useState(mockLynxHistory);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = {
      id: `msg_${Date.now()}`,
      role: 'user' as const,
      content: input,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant' as const,
        content:
          "I've analyzed your question against the Canon Matrix. This is a simulated response. In production, Lynx would query the real metadata registry, canon rules, and audit trails to provide a forensic answer with evidence.",
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <MetaAppShell>
      <div className="px-6 py-8 md:px-12 md:py-12 max-w-[1200px] mx-auto h-[calc(100vh-120px)] flex flex-col">
        {/* HEADER */}
        <div className="mb-6">
          <MetaPageHeader
            variant="document"
            code="META_07"
            title="LYNX CODEX"
            subtitle="AI INVESTIGATOR"
            description="Natural language interface to your metadata estate. Ask questions, get canon-backed answers with evidence."
          />
        </div>

        {/* INTRO CARD */}
        {messages.length === 0 && (
          <div className="mb-6 bg-[#0A0A0A] border border-[#1F1F1F] rounded p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#28E7A2]/10 border border-[#28E7A2]/30 rounded-full flex items-center justify-center flex-shrink-0">
                <LynxIcon className="w-6 h-6 text-[#28E7A2]" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-2">How Lynx Works</h3>
                <div className="text-sm text-[#888] space-y-2">
                  <p>
                    Lynx is your AI forensic analyst. It understands your Canon governance
                    structure, metadata registry, and audit trails.
                  </p>
                  <p>
                    Ask business questions in plain language. Lynx will investigate, trace through
                    the Canon hierarchy, and provide evidence-backed answers citing specific
                    governance rules and data points.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CHAT MESSAGES */}
        <div className="flex-1 bg-[#050505] border border-[#1F1F1F] rounded overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <LynxIcon className="w-16 h-16 text-[#28E7A2] mb-4" />
                <h3 className="text-white font-medium mb-2">Start a Conversation</h3>
                <p className="text-[#666] text-sm mb-6 max-w-md">
                  Ask Lynx about your metadata, governance rules, compliance issues, or Canon
                  relationships.
                </p>

                {/* SUGGESTED QUESTIONS */}
                <div className="space-y-2">
                  <div className="text-[10px] font-mono text-[#666] uppercase tracking-wider mb-3">
                    Suggested Questions
                  </div>
                  {suggestedQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestedQuestion(question)}
                      className="block w-full text-left px-4 py-3 bg-[#0A0A0A] border border-[#1F1F1F] rounded text-sm text-[#CCC] hover:border-[#28E7A2] hover:bg-[#28E7A2]/5 transition-all"
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-[#666]" />
                        {question}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <LynxChatMessage key={message.id} message={message} />
                ))}

                {isTyping && (
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-[#28E7A2]/10 border border-[#28E7A2]/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <LynxIcon className="w-4 h-4 text-[#28E7A2]" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded p-4">
                        <div className="flex items-center gap-2 text-[#666] text-sm">
                          <div className="flex gap-1">
                            <div
                              className="w-2 h-2 bg-[#28E7A2] rounded-full animate-pulse"
                              style={{ animationDelay: '0ms' }}
                            />
                            <div
                              className="w-2 h-2 bg-[#28E7A2] rounded-full animate-pulse"
                              style={{ animationDelay: '200ms' }}
                            />
                            <div
                              className="w-2 h-2 bg-[#28E7A2] rounded-full animate-pulse"
                              style={{ animationDelay: '400ms' }}
                            />
                          </div>
                          Analyzing canon matrix...
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* INPUT BAR */}
          <div className="border-t border-[#1F1F1F] p-4 bg-[#0A0A0A]">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask Lynx about your metadata, governance, or canon rules..."
                  className="w-full bg-[#050505] border border-[#1F1F1F] rounded px-4 py-3 text-white text-sm focus:outline-none focus:border-[#28E7A2] placeholder:text-[#333] resize-none"
                  rows={3}
                />
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] text-[#666]">
                    <Info className="w-3 h-3" />
                    Press Enter to send, Shift+Enter for new line
                  </div>
                  <div className="text-[10px] text-[#666] font-mono">{input.length} characters</div>
                </div>
              </div>

              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className={clsx(
                  'px-6 py-3 rounded font-medium transition-all flex items-center gap-2',
                  input.trim() && !isTyping
                    ? 'bg-[#28E7A2] text-black hover:bg-[#28E7A2]/90'
                    : 'bg-[#111] text-[#666] cursor-not-allowed',
                )}
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </div>
        </div>

        {/* CAPABILITIES */}
        <div className="mt-6 bg-blue-500/5 border border-blue-500/20 rounded p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm text-white font-medium mb-1">Lynx Capabilities</div>
              <div className="text-xs text-[#888] space-y-1">
                <p>
                  <strong className="text-white">Canon Query:</strong> Trace governance rules from
                  Cell → Transaction → Group
                </p>
                <p>
                  <strong className="text-white">Evidence Retrieval:</strong> Pull audit logs,
                  metadata changes, and system bindings
                </p>
                <p>
                  <strong className="text-white">Risk Detection:</strong> Identify compliance
                  violations, misclassifications, and drift
                </p>
                <p>
                  <strong className="text-white">Natural Language:</strong> Ask in plain English,
                  get forensic answers with citations
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MetaAppShell>
  );
}
