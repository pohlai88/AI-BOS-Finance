import { useState, useRef, useEffect } from 'react'
import { MetaAppShell } from '../components/shell/MetaAppShell'
import { MetaPageHeader } from '../components/MetaPageHeader'
import { mockLynxHistory } from '../mock-data'/mockLynxData'
import { LynxChatMessage } from '../components/lynx/LynxChatMessage'
import { LynxIcon } from '../components/icons/LynxIcon'
import { Send, Sparkles, Info } from 'lucide-react'
import clsx from 'clsx'

const suggestedQuestions = [
  'Why is our EBITDA higher than forecast?',
  'What canon rules govern revenue recognition?',
  'Show me all critical compliance issues',
  'Which fields are bound to SAP_ERP?',
  'Explain the lemon theory lifecycle',
]

export function MetaLynxCodexPage() {
  const [messages, setMessages] = useState(mockLynxHistory)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage = {
      id: `msg_${Date.now()}`,
      role: 'user' as const,
      content: input,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const aiMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant' as const,
        content:
          "I've analyzed your question against the Canon Matrix. This is a simulated response. In production, Lynx would query the real metadata registry, canon rules, and audit trails to provide a forensic answer with evidence.",
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      }
      setMessages((prev) => [...prev, aiMessage])
      setIsTyping(false)
    }, 1500)
  }

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
  }

  return (
    <MetaAppShell>
      <div className="mx-auto flex h-[calc(100vh-120px)] max-w-[1200px] flex-col px-6 py-8 md:px-12 md:py-12">
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
          <div className="mb-6 rounded border border-[#1F1F1F] bg-[#0A0A0A] p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-[#28E7A2]/30 bg-[#28E7A2]/10">
                <LynxIcon className="h-6 w-6 text-[#28E7A2]" />
              </div>
              <div>
                <h3 className="mb-2 font-medium text-white">How Lynx Works</h3>
                <div className="space-y-2 text-sm text-[#888]">
                  <p>
                    Lynx is your AI forensic analyst. It understands your Canon
                    governance structure, metadata registry, and audit trails.
                  </p>
                  <p>
                    Ask business questions in plain language. Lynx will
                    investigate, trace through the Canon hierarchy, and provide
                    evidence-backed answers citing specific governance rules and
                    data points.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CHAT MESSAGES */}
        <div className="flex flex-1 flex-col overflow-hidden rounded border border-[#1F1F1F] bg-[#050505]">
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <LynxIcon className="mb-4 h-16 w-16 text-[#28E7A2]" />
                <h3 className="mb-2 font-medium text-white">
                  Start a Conversation
                </h3>
                <p className="mb-6 max-w-md text-sm text-[#666]">
                  Ask Lynx about your metadata, governance rules, compliance
                  issues, or Canon relationships.
                </p>

                {/* SUGGESTED QUESTIONS */}
                <div className="space-y-2">
                  <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-[#666]">
                    Suggested Questions
                  </div>
                  {suggestedQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestedQuestion(question)}
                      className="block w-full rounded border border-[#1F1F1F] bg-[#0A0A0A] px-4 py-3 text-left text-sm text-[#CCC] transition-all hover:border-[#28E7A2] hover:bg-[#28E7A2]/5"
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-[#666]" />
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
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[#28E7A2]/30 bg-[#28E7A2]/10">
                      <LynxIcon className="h-4 w-4 text-[#28E7A2]" />
                    </div>
                    <div className="flex-1">
                      <div className="rounded border border-[#1F1F1F] bg-[#0A0A0A] p-4">
                        <div className="flex items-center gap-2 text-sm text-[#666]">
                          <div className="flex gap-1">
                            <div
                              className="h-2 w-2 animate-pulse rounded-full bg-[#28E7A2]"
                              style={{ animationDelay: '0ms' }}
                            />
                            <div
                              className="h-2 w-2 animate-pulse rounded-full bg-[#28E7A2]"
                              style={{ animationDelay: '200ms' }}
                            />
                            <div
                              className="h-2 w-2 animate-pulse rounded-full bg-[#28E7A2]"
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
          <div className="border-t border-[#1F1F1F] bg-[#0A0A0A] p-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder="Ask Lynx about your metadata, governance, or canon rules..."
                  className="w-full resize-none rounded border border-[#1F1F1F] bg-[#050505] px-4 py-3 text-sm text-white placeholder:text-[#333] focus:border-[#28E7A2] focus:outline-none"
                  rows={3}
                />
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] text-[#666]">
                    <Info className="h-3 w-3" />
                    Press Enter to send, Shift+Enter for new line
                  </div>
                  <div className="font-mono text-[10px] text-[#666]">
                    {input.length} characters
                  </div>
                </div>
              </div>

              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className={clsx(
                  'flex items-center gap-2 rounded px-6 py-3 font-medium transition-all',
                  input.trim() && !isTyping
                    ? 'bg-[#28E7A2] text-black hover:bg-[#28E7A2]/90'
                    : 'cursor-not-allowed bg-[#111] text-[#666]'
                )}
              >
                <Send className="h-4 w-4" />
                Send
              </button>
            </div>
          </div>
        </div>

        {/* CAPABILITIES */}
        <div className="mt-6 rounded border border-blue-500/20 bg-blue-500/5 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400" />
            <div>
              <div className="mb-1 text-sm font-medium text-white">
                Lynx Capabilities
              </div>
              <div className="space-y-1 text-xs text-[#888]">
                <p>
                  <strong className="text-white">Canon Query:</strong> Trace
                  governance rules from Cell â†’ Transaction â†’ Group
                </p>
                <p>
                  <strong className="text-white">Evidence Retrieval:</strong>{' '}
                  Pull audit logs, metadata changes, and system bindings
                </p>
                <p>
                  <strong className="text-white">Risk Detection:</strong>{' '}
                  Identify compliance violations, misclassifications, and drift
                </p>
                <p>
                  <strong className="text-white">Natural Language:</strong> Ask
                  in plain English, get forensic answers with citations
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MetaAppShell>
  )
}
