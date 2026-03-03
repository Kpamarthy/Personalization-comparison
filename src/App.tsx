import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  User, 
  Bot, 
  Settings2, 
  Check, 
  ChevronDown, 
  ShoppingBag, 
  History, 
  MessageSquare,
  Sparkles,
  Info,
  Trash2,
  X,
  ShieldCheck,
  RotateCcw,
  Star,
  Leaf,
  Clock
} from 'lucide-react';
import { PersonalizationType, Message, Vertical, Product, FeatureType } from './types';
import { PERSONALIZATION_OPTIONS } from './constants';
import { generateShoppingResponse, extractConversationContext, generateStarterPrompts } from './services/geminiService';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { ProactiveAgentFeed } from './components/ProactiveAgentFeed';

// Helper to parse prompts from config string
const parsePromptsFromConfig = (config: string) => {
  if (!config) return [];
  
  // Find the section starting with "Prompts:" (case insensitive)
  const promptsRegex = /prompts:([\s\S]*)$/i;
  const match = config.match(promptsRegex);
  if (!match) return [];
  
  let sectionContent = match[1].trim();
  if (!sectionContent) return [];

  // Remove common intro patterns that users might include
  // e.g. "For Home Improvement, use the following standard starter prompts: "
  sectionContent = sectionContent.replace(/^.*standard starter prompts:?\s*/i, '');
  sectionContent = sectionContent.replace(/^.*use the following prompts:?\s*/i, '');
  sectionContent = sectionContent.replace(/^.*here are some prompts:?\s*/i, '');
  
  const lines = sectionContent.split('\n');
  const prompts: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Match lines starting with common bullet points or numbers
    // e.g., "- Prompt", "* Prompt", "1. Prompt", "• Prompt"
    const promptMatch = trimmed.match(/^[-*•\d.]+\s*(.*)$/);
    if (promptMatch && promptMatch[1].trim()) {
      prompts.push(promptMatch[1].trim());
    } else {
      // If no bullet, it might be a comma-separated list on this line
      if (trimmed.includes(',')) {
        const parts = trimmed.split(',').map(p => p.trim()).filter(p => p);
        prompts.push(...parts);
      } else if (!trimmed.includes(':')) {
        // Only add if it doesn't look like another header
        prompts.push(trimmed);
      }
    }
    
    if (prompts.length >= 10) break; // Collect a few more then slice
  }
  
  // Final cleanup and limit to 3
  return prompts
    .map(p => p.trim())
    .filter(p => p.length > 0 && p.length < 100)
    .slice(0, 3);
};

const ProductCard = ({ product }: { product: Product }) => (
  <div className="min-w-[180px] max-w-[180px] bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow shrink-0">
    <div className="relative h-32 bg-slate-100">
      <img 
        src={product.image} 
        alt={product.name} 
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
      {product.isEcoFriendly && (
        <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full shadow-sm">
          <Leaf size={10} />
        </div>
      )}
    </div>
    <div className="p-3">
      <h4 className="text-[11px] font-bold text-slate-800 line-clamp-2 h-8 mb-1 leading-tight">
        {product.name}
      </h4>
      <div className="flex items-center gap-1 mb-2">
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              size={10} 
              className={i < Math.floor(product.rating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"} 
            />
          ))}
        </div>
        <span className="text-[9px] text-slate-400 font-medium">({product.reviews})</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-900">{product.price}</span>
        <button className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-tighter">
          Add
        </button>
      </div>
    </div>
  </div>
);

const ChatMessage = ({ 
  message, 
  onSuggestionClick,
  variant = 'standard'
}: { 
  message: Message, 
  onSuggestionClick?: (s: string) => void,
  variant?: 'standard' | 'personalized'
}) => {
  const isUser = message.role === 'user';
  const [displayedContent, setDisplayedContent] = useState(isUser || !message.isStreaming ? message.content : '');
  const [isTyping, setIsTyping] = useState(message.isStreaming);

  useEffect(() => {
    if (isUser || !message.isStreaming) {
      setDisplayedContent(message.content.trim().replace(/\\n/gi, '\n'));
      setIsTyping(false);
      return;
    }

    // If it's a real-time stream (content is updating), just show it
    // We detect this if the content changes while isStreaming is true
    setDisplayedContent(message.content.trim().replace(/\\n/gi, '\n'));
    
    // We only stop "typing" (showing the cursor) when the message is no longer marked as streaming
    if (!message.isStreaming) {
      setIsTyping(false);
    } else {
      setIsTyping(true);
    }
  }, [message.content, message.isStreaming, isUser]);

  const suggestionStyles = variant === 'personalized' 
    ? 'text-emerald-700 bg-emerald-50 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200'
    : 'text-slate-800 bg-slate-100 border-slate-200 hover:bg-slate-200 hover:border-slate-300';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`flex max-w-[90%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-2`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-indigo-600' : (variant === 'personalized' ? 'bg-emerald-600' : 'bg-slate-400')}`}>
          {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
        </div>
        <div className="flex flex-col gap-2">
          <div className={`px-4 py-2 rounded-2xl text-sm ${
            isUser 
              ? 'bg-blue-600 text-white rounded-tr-none' 
              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
          }`}>
            {isUser ? (
              displayedContent
            ) : (
              <div className="markdown-body prose prose-sm max-w-none min-h-[1.25rem]">
                {displayedContent ? (
                  <Markdown 
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      // @ts-ignore
                      personalization: ({ node, ...props }) => {
                        const type = props.type as PersonalizationType;
                        const reason = props.reason as string;
                        const option = PERSONALIZATION_OPTIONS.find(o => o.id === type);
                        
                        if (!option) return <span>{props.children}</span>;
                        
                        return (
                          <span className="relative group inline">
                            <span className={`${option.color.text} font-semibold underline decoration-dotted decoration-2 underline-offset-4 cursor-help`}>
                              {props.children}
                            </span>
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-3 bg-slate-900 text-white text-[11px] rounded-xl shadow-2xl z-50 pointer-events-none">
                              <span className="flex items-center gap-2 mb-1.5">
                                <span className={`w-2 h-2 rounded-full ${option.color.dot} block`} />
                                <span className="font-bold uppercase tracking-wider text-[10px] opacity-80 block">{option.label}</span>
                              </span>
                              <span className="leading-relaxed font-normal italic block">{reason}</span>
                              <span className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900 block" />
                            </span>
                          </span>
                        );
                      }
                    }}
                  >
                    {displayedContent}
                  </Markdown>
                ) : (
                  <div className="flex gap-1 items-center py-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
                      className="w-1 h-1 bg-slate-400 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
                      className="w-1 h-1 bg-slate-400 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
                      className="w-1 h-1 bg-slate-400 rounded-full"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Products Carousel */}
          {!isUser && !isTyping && message.products && message.products.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1"
            >
              {message.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </motion.div>
          )}
          
          {/* Suggestions */}
          {!isUser && !isTyping && message.suggestions && message.suggestions.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap gap-2 mt-1"
            >
              {message.suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => onSuggestionClick?.(suggestion)}
                  className={`text-[11px] font-medium px-3 py-1.5 rounded-full transition-all shadow-sm border ${suggestionStyles}`}
                >
                  {suggestion}
                </button>
              ))}
            </motion.div>
          )}

          {/* Response Time */}
          {!isUser && !isTyping && message.responseTime && message.responseTime > 2000 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 mt-2 text-[10px] font-medium text-slate-400"
            >
              <Clock size={10} />
              <span>Response time: {(message.responseTime / 1000).toFixed(1)}s</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPersonalization, setSelectedPersonalization] = useState<PersonalizationType[]>([]);
  const [selectedVertical, setSelectedVertical] = useState<Vertical>('Home Improvement');
  const [selectedFeatures, setSelectedFeatures] = useState<FeatureType[]>([FeatureType.CONTEXT_AWARENESS_COMPARISON]);
  const [isFeatureDropdownOpen, setIsFeatureDropdownOpen] = useState(false);
  const [isPersonalizedAssistantEnabled, setIsPersonalizedAssistantEnabled] = useState(false);
  const [leftMessages, setLeftMessages] = useState<Message[]>([]);
  const [rightMessages, setRightMessages] = useState<Message[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isVerticalDropdownOpen, setIsVerticalDropdownOpen] = useState(false);
  const [showContextModal, setShowContextModal] = useState(false);
  const [showGuardrailsModal, setShowGuardrailsModal] = useState(false);
  const [showStandardConfigsModal, setShowStandardConfigsModal] = useState(false);
  const [derivedContext, setDerivedContext] = useState<string>('');
  const [hasNewContext, setHasNewContext] = useState(false);
  const [guardrails, setGuardrails] = useState<string>(() => {
    const saved = localStorage.getItem('assistant_guardrails');
    return saved || 'Always be helpful and polite. Focus on sustainable and energy-efficient recommendations when possible.';
  });
  const [standardConfigs, setStandardConfigs] = useState<string>(() => {
    const saved = localStorage.getItem('standard_assistant_configs');
    const defaultPrompts = '\n\nPrompts:\n- Create a lawn care plan\n- Remodel my kitchen\n- Visualize a yard makeover';
    const defaultVal = 'Be helpful, professional, and direct. Use standard sentence case (not all caps). Use proper markdown formatting with headers and bullet points.' + defaultPrompts;
    
    if (!saved) return defaultVal;

    // If we have a saved value but it's missing the prompts section OR the prompts section is empty
    const hasPrompts = saved.toLowerCase().includes('prompts:');
    const parsedPrompts = parsePromptsFromConfig(saved);
    
    if (!hasPrompts || parsedPrompts.length === 0) {
      // If it has the header but no prompts, replace/append
      if (hasPrompts) {
        return saved.split(/prompts:/i)[0].trim() + defaultPrompts;
      }
      return saved.trim() + defaultPrompts;
    }
    
    return saved;
  });

  const resetStandardConfigs = () => {
    const defaultPrompts = '\n\nPrompts:\n- Create a lawn care plan\n- Remodel my kitchen\n- Visualize a yard makeover';
    const defaultVal = 'Be helpful, professional, and direct. Use standard sentence case (not all caps). Use proper markdown formatting with headers and bullet points.' + defaultPrompts;
    setStandardConfigs(defaultVal);
  };

  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const lastInitKey = useRef<string>('');

  useEffect(() => {
    localStorage.setItem('assistant_guardrails', guardrails);
  }, [guardrails]);

  useEffect(() => {
    localStorage.setItem('standard_assistant_configs', standardConfigs);
  }, [standardConfigs]);

  useEffect(() => {
    if (leftScrollRef.current) {
      leftScrollRef.current.scrollTop = leftScrollRef.current.scrollHeight;
    }
  }, [leftMessages]);

  useEffect(() => {
    if (rightScrollRef.current) {
      rightScrollRef.current.scrollTop = rightScrollRef.current.scrollHeight;
    }
  }, [rightMessages]);

  useEffect(() => {
    let isMounted = true;
    const currentKey = `${selectedVertical}-${JSON.stringify(selectedPersonalization)}-${guardrails}-${standardConfigs}-${isPersonalizedAssistantEnabled}`;
    
    // Prevent re-initializing if the core dependencies haven't actually changed
    if (lastInitKey.current === currentKey) return;
    
    // 1. Set initial greetings immediately so user isn't waiting on AI
    const leftGreeting: Message = {
      id: `greeting-left-${Date.now()}`,
      role: 'assistant',
      content: `Hi Kalyan, I'm your ${selectedVertical.toLowerCase()} agent. How can I help you?`,
      timestamp: Date.now(),
      suggestions: parsePromptsFromConfig(standardConfigs),
      isStreaming: false
    };

    const personalizedStaticPrompts = isPersonalizedAssistantEnabled && selectedPersonalization.length > 0
      ? [
          ...PERSONALIZATION_OPTIONS
            .filter(opt => selectedPersonalization.includes(opt.id) && opt.id !== PersonalizationType.USER_PROFILE)
            .flatMap(opt => opt.starterPrompts),
          ...PERSONALIZATION_OPTIONS
            .filter(opt => selectedPersonalization.includes(opt.id) && opt.id === PersonalizationType.USER_PROFILE)
            .flatMap(opt => opt.starterPrompts)
        ].slice(0, 3)
      : [];

    const rightGreeting: Message = {
      id: `greeting-right-${Date.now()}`,
      role: 'assistant',
      content: isPersonalizedAssistantEnabled 
        ? `Hi Kalyan, I'm your **personal** ${selectedVertical.toLowerCase()} agent. How can I help you?`
        : `Hi Kalyan, I'm your ${selectedVertical.toLowerCase()} agent. How can I help you?`,
      timestamp: Date.now(),
      suggestions: personalizedStaticPrompts.length > 0 
        ? personalizedStaticPrompts 
        : parsePromptsFromConfig(standardConfigs),
      isStreaming: false
    };

    setLeftMessages([leftGreeting]);
    setRightMessages([rightGreeting]);
    lastInitKey.current = currentKey;

    // 2. Fetch dynamic prompts in the background
    const isDynamicStarterEnabled = true;

    const initDynamicPrompts = async () => {
      if (!isDynamicStarterEnabled) return;

      const activeContext = PERSONALIZATION_OPTIONS
        .filter(opt => selectedPersonalization.includes(opt.id))
        .map(opt => `${opt.label}:\n${opt.content}`)
        .join('\n\n');

      const dynamicPrompts = await generateStarterPrompts(selectedVertical, activeContext, guardrails);

      if (!isMounted || dynamicPrompts.length === 0) return;

      // Only update if we are still on the first message (the greeting)
      setRightMessages(prev => {
        if (prev.length === 1 && prev[0].role === 'assistant') {
          return [{ ...prev[0], suggestions: dynamicPrompts }];
        }
        return prev;
      });
    };

    initDynamicPrompts();
    return () => { isMounted = false; };
  }, [selectedVertical, selectedPersonalization, guardrails, standardConfigs, isPersonalizedAssistantEnabled, selectedFeatures]);

  const togglePersonalization = (type: PersonalizationType) => {
    setSelectedPersonalization(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handlePersonalizationToggle = () => {
    const newValue = !isPersonalizedAssistantEnabled;
    setIsPersonalizedAssistantEnabled(newValue);
    if (!newValue) {
      setSelectedPersonalization([]);
    } else {
      setSelectedPersonalization([
        PersonalizationType.USER_PROFILE,
        PersonalizationType.SHOPPING_HISTORY,
        PersonalizationType.CONVERSATION_CONTEXT
      ]);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setLeftMessages(prev => [...prev, userMessage]);
    setRightMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Prepare personalization context
    const isPersonalizedConversationEnabled = true; // Default to true if personalized assistant is enabled
    const activeContext = (isPersonalizedAssistantEnabled && isPersonalizedConversationEnabled)
      ? [
          ...PERSONALIZATION_OPTIONS
            .filter(opt => selectedPersonalization.includes(opt.id))
            .map(opt => `${opt.label}:\n${opt.content}`),
          derivedContext ? `Derived from current conversation:\n${derivedContext}` : ''
        ].filter(Boolean).join('\n\n')
      : '';

    try {
      // Generate responses
      const leftStartTime = Date.now();
      const rightStartTime = Date.now();
      
      const leftId = (Date.now() + 1).toString();
      const rightId = (Date.now() + 2).toString();

      // Add initial empty assistant messages
      const initialLeftMsg: Message = {
        id: leftId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true
      };
      const initialRightMsg: Message = {
        id: rightId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true
      };

      setLeftMessages(prev => [...prev, initialLeftMsg]);
      setRightMessages(prev => [...prev, initialRightMsg]);

      const updateMessage = (panel: 'left' | 'right', id: string, updates: Partial<Message>) => {
        const setMessages = panel === 'left' ? setLeftMessages : setRightMessages;
        setMessages(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
      };

      const leftPromise = generateShoppingResponse(
        input, 
        false, 
        selectedVertical, 
        [], 
        (text, isComplete, metadata) => {
          const duration = Date.now() - leftStartTime;
          updateMessage('left', leftId, { 
            content: text, 
            isStreaming: !isComplete,
            responseTime: isComplete ? duration : undefined,
            ...(metadata || {})
          });
        },
        undefined, 
        undefined, 
        standardConfigs
      );
      
      const rightPromise = generateShoppingResponse(
        input, 
        isPersonalizedAssistantEnabled, 
        selectedVertical, 
        isPersonalizedAssistantEnabled ? selectedPersonalization : [], 
        (text, isComplete, metadata) => {
          const duration = Date.now() - rightStartTime;
          updateMessage('right', rightId, { 
            content: text, 
            isStreaming: !isComplete,
            responseTime: isComplete ? duration : undefined,
            ...(metadata || {})
          });
        },
        activeContext, 
        guardrails,
        undefined,
        isPersonalizedAssistantEnabled
      );

      const [leftResponse, rightResponse] = await Promise.all([leftPromise, rightPromise]);

      if (isPersonalizedAssistantEnabled) {
        // Extract new context from the conversation (USER MESSAGES ONLY)
        const userMessagesOnly = [...rightMessages, userMessage, { role: 'assistant', content: rightResponse.text }]
          .filter(m => m.role === 'user')
          .map(m => ({
            role: m.role,
            content: m.content
          }));
        
        const newContext = await extractConversationContext(userMessagesOnly, activeContext);
        if (newContext && newContext !== "No additional context derived." && newContext !== derivedContext) {
          setDerivedContext(newContext);
          setHasNewContext(true);
        }
      }
    } catch (error) {
      console.error("Failed to get responses", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    const leftGreeting: Message = {
      id: `greeting-left-${Date.now()}`,
      role: 'assistant',
      content: `Hi Kalyan, I'm your ${selectedVertical.toLowerCase()} agent. How can I help you?`,
      timestamp: Date.now(),
      suggestions: parsePromptsFromConfig(standardConfigs),
      isStreaming: false
    };

    // Features and personalization are reset to off on clear
    const rightGreeting: Message = {
      id: `greeting-right-${Date.now()}`,
      role: 'assistant',
      content: `Hi Kalyan, I'm your ${selectedVertical.toLowerCase()} agent. How can I help you?`,
      timestamp: Date.now(),
      suggestions: parsePromptsFromConfig(standardConfigs),
      isStreaming: false
    };

    setLeftMessages([leftGreeting]);
    setRightMessages([rightGreeting]);
    setSelectedFeatures([FeatureType.CONTEXT_AWARENESS_COMPARISON]);
    setIsPersonalizedAssistantEnabled(false);
    setSelectedPersonalization([]);
    setDerivedContext('');
    setHasNewContext(false);
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8f9fa]">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 relative z-30">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <ShoppingBag className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            {selectedFeatures.includes(FeatureType.BACKGROUND_AGENTS) ? (
              <>Shopping Concierge <span className="text-slate-400 font-normal">Autonomous</span></>
            ) : (
              <>Shopping Assistant <span className="text-slate-400 font-normal">Comparison</span></>
            )}
          </h1>
          
          {/* Feature Selection Dropdown */}
          <div className="relative ml-4">
            <button 
              onClick={() => setIsFeatureDropdownOpen(!isFeatureDropdownOpen)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all shadow-sm"
            >
              <Settings2 size={14} className="text-slate-400" />
              <span>
                {selectedFeatures.length === 0 
                  ? "Feature Selection" 
                  : selectedFeatures.length === 1 
                    ? selectedFeatures[0] 
                    : `${selectedFeatures.length} Features Selected`}
              </span>
              <ChevronDown size={14} className={`transition-transform ${isFeatureDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isFeatureDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsFeatureDropdownOpen(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-20 p-1"
                  >
                    {Object.values(FeatureType).map((feature) => {
                      const isSelected = selectedFeatures.includes(feature);
                      return (
                        <button
                          key={feature}
                          onClick={() => {
                            setSelectedFeatures([feature]);
                            setIsFeatureDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors text-left text-sm ${
                            isSelected ? 'text-indigo-600 font-semibold bg-indigo-50/50' : 'text-slate-700'
                          }`}
                        >
                          {feature}
                          {isSelected && <Check size={14} />}
                        </button>
                      );
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Vertical Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsVerticalDropdownOpen(!isVerticalDropdownOpen)}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors border border-slate-200"
            >
              {selectedVertical}
              <ChevronDown size={14} className={`transition-transform ${isVerticalDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isVerticalDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsVerticalDropdownOpen(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-20 p-1"
                  >
                    {(['Home Improvement', 'Apparel', 'Grocery'] as Vertical[]).map((v) => (
                      <button
                        key={v}
                        onClick={() => {
                          setSelectedVertical(v);
                          setIsVerticalDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors text-left text-sm ${
                          selectedVertical === v ? 'text-indigo-600 font-semibold bg-indigo-50/50' : 'text-slate-700'
                        }`}
                      >
                        {v}
                        {selectedVertical === v && <Check size={14} />}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleClear}
            disabled={leftMessages.length === 0 && rightMessages.length === 0}
            className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all border border-transparent hover:border-red-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 disabled:cursor-not-allowed"
          >
            <Trash2 size={14} />
            Clear Chat
          </button>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            <Sparkles size={14} className="text-indigo-500" />
            Powered by Gemini
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden p-4 gap-4">
        {selectedFeatures.includes(FeatureType.BACKGROUND_AGENTS) ? (
          <ProactiveAgentFeed />
        ) : (
          <>
            {/* Left Panel: Non-Personalized */}
            <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-400" />
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider leading-none">Standard shopping agent</h2>
              </div>
              <button 
                onClick={() => setShowStandardConfigsModal(true)}
                className="px-2 py-0.5 text-[9px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-all uppercase tracking-tighter"
              >
                Configs
              </button>
            </div>
            <span className="text-[10px] font-medium text-slate-400 uppercase hidden sm:block">No context access</span>
          </div>
          <div 
            ref={leftScrollRef}
            className="flex-1 overflow-y-auto px-4 pb-4 pt-12 scroll-smooth"
          >
            {leftMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 opacity-60">
                <Bot size={48} strokeWidth={1} />
                <p className="text-sm">Ask me anything about shopping!</p>
              </div>
            ) : (
              <>
                {leftMessages.map(msg => (
                  <div key={msg.id}>
                    <ChatMessage 
                      message={msg} 
                      variant="standard"
                      onSuggestionClick={(s) => {
                        setInput(s);
                        // Trigger send automatically
                        setTimeout(() => {
                          const form = document.querySelector('form');
                          if (form) form.requestSubmit();
                        }, 0);
                      }}
                    />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Right Panel: Personalized */}
        <div className={`flex-1 flex flex-col rounded-2xl border shadow-sm overflow-hidden ring-1 transition-all duration-500 ${
          isPersonalizedAssistantEnabled 
            ? 'border-emerald-100 ring-emerald-50 bg-emerald-50/20' 
            : 'border-slate-200 ring-transparent bg-white'
        }`}>
          <div className={`px-4 py-3 border-b flex items-center justify-between transition-colors duration-300 shrink-0 ${
            isPersonalizedAssistantEnabled 
              ? 'border-emerald-50 bg-emerald-50/30' 
              : 'border-slate-100 bg-slate-50/50'
          }`}>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isPersonalizedAssistantEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  <h2 className={`text-sm font-semibold uppercase tracking-wider leading-none transition-colors ${isPersonalizedAssistantEnabled ? 'text-emerald-800' : 'text-slate-700'}`}>
                    {isPersonalizedAssistantEnabled ? 'Personalized shopping agent' : 'Standard shopping agent'}
                  </h2>
                </div>
                
                {/* Master Toggle */}
                <button
                  onClick={handlePersonalizationToggle}
                  className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none ${
                    isPersonalizedAssistantEnabled ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                >
                  <motion.div
                    animate={{ x: isPersonalizedAssistantEnabled ? 22 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>
              {isPersonalizedAssistantEnabled && (
                <div className="flex flex-wrap gap-x-2 gap-y-0.5 ml-4 items-center">
                  {selectedPersonalization.length === 0 ? (
                    <span className="text-[10px] text-slate-400 italic">No context selected</span>
                  ) : (
                    selectedPersonalization.map(id => {
                      const opt = PERSONALIZATION_OPTIONS.find(o => o.id === id);
                      return opt ? (
                        <span key={id} className={`text-[9px] font-bold uppercase ${opt.color.text} opacity-70`}>
                          • {opt.label}
                        </span>
                      ) : null;
                    })
                  )}
                </div>
              )}
            </div>
            
            {/* Personalization Dropdown & Context Button */}
            <div className="flex items-center gap-2 shrink-0">
              {isPersonalizedAssistantEnabled && (
                <div className="flex flex-col items-end gap-1.5">
                  <div className="relative">
                    <button 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-100/50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors border border-emerald-200"
                    >
                      <Settings2 size={14} />
                      <span className="max-w-[120px] truncate hidden sm:block">
                        {selectedPersonalization.length === 0 
                          ? "Personalization Data" 
                          : `${selectedPersonalization.length} Items Select...`}
                      </span>
                      <ChevronDown size={14} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isDropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setIsDropdownOpen(false)} 
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-20 p-2"
                          >
                            <div className="px-3 py-2 border-b border-slate-100 mb-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Context Data</p>
                            </div>
                            {PERSONALIZATION_OPTIONS.map((opt) => {
                              const isSelected = selectedPersonalization.includes(opt.id);
                              return (
                                <button
                                  key={opt.id}
                                  onClick={() => togglePersonalization(opt.id)}
                                  className="w-full flex items-start gap-3 p-3 rounded-lg transition-all text-left group mb-1 hover:bg-slate-50"
                                >
                                  <div className={`mt-0.5 shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                    isSelected 
                                      ? `${opt.color.dot} border-transparent` 
                                      : `border-slate-200 group-hover:${opt.color.border}`
                                  }`}>
                                    {isSelected ? (
                                      <Check size={12} className="text-white" strokeWidth={3} />
                                    ) : (
                                      <div className={`w-1.5 h-1.5 rounded-full opacity-0 group-hover:opacity-40 ${opt.color.dot}`} />
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className={`text-sm font-bold ${isSelected ? opt.color.text : 'text-slate-700'}`}>
                                        {opt.label}
                                      </p>
                                      {!isSelected && (
                                        <div className={`w-1.5 h-1.5 rounded-full ${opt.color.dot} opacity-60`} />
                                      )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{opt.description}</p>
                                  </div>
                                </button>
                              );
                            })}
                            <div className="mt-2 pt-2 border-t border-slate-100 flex gap-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowContextModal(true);
                                  setHasNewContext(false);
                                  setIsDropdownOpen(false);
                                }}
                                className="flex-1 px-2 py-2 text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-all uppercase tracking-wider relative flex items-center justify-center gap-2"
                              >
                                <Sparkles size={12} />
                                Show Context
                                {hasNewContext && (
                                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white animate-bounce" />
                                )}
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowGuardrailsModal(true);
                                  setIsDropdownOpen(false);
                                }}
                                className="flex-1 px-2 py-2 text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-all uppercase tracking-wider flex items-center justify-center gap-2"
                              >
                                <ShieldCheck size={12} />
                                Guardrails
                              </button>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div 
            ref={rightScrollRef}
            className="flex-1 overflow-y-auto px-4 pb-4 pt-12 scroll-smooth"
          >
            {rightMessages.map(msg => (
              <div key={msg.id}>
                <ChatMessage 
                  message={msg} 
                  variant={isPersonalizedAssistantEnabled ? "personalized" : "standard"}
                  onSuggestionClick={(s) => {
                    setInput(s);
                    // Trigger send automatically
                    setTimeout(() => {
                      const form = document.querySelector('form');
                      if (form) form.requestSubmit();
                    }, 0);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
          </>
        )}
      </main>

      {/* Common Chat Input */}
      {!selectedFeatures.includes(FeatureType.BACKGROUND_AGENTS) && (
        <footer className="p-6 bg-white border-t border-slate-200 shrink-0">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSend} className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask for product recommendations, gift ideas, or shopping help..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-6 pr-14 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`absolute right-2 top-2 bottom-2 px-4 rounded-xl flex items-center justify-center transition-all ${
                  !input.trim() || isLoading
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 active:scale-95'
                }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </form>
          </div>
        </footer>
      )}

      {/* Personalization Context Modal */}
      <AnimatePresence>
        {showContextModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowContextModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Personal Context</h3>
                    <p className="text-sm text-slate-500">All data currently available to the agent</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowContextModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {derivedContext && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700">
                          Derived from current conversation
                        </h4>
                      </div>
                      <button 
                        onClick={() => {
                          setDerivedContext('');
                          setHasNewContext(false);
                        }}
                        className="text-[9px] font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-wider"
                      >
                        Clear Context
                      </button>
                    </div>
                    <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50 bg-opacity-30 overflow-hidden">
                      <div className="text-[14px] text-slate-700 font-medium leading-relaxed break-words">
                        <Markdown
                          components={{
                            p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({children}) => <ul className="list-disc pl-4 space-y-1 mb-2 last:mb-0">{children}</ul>,
                            li: ({children}) => <li className="leading-relaxed">{children}</li>
                          }}
                        >
                          {derivedContext.trim()}
                        </Markdown>
                      </div>
                    </div>
                  </div>
                )}
                {PERSONALIZATION_OPTIONS.map((opt) => (
                  <div key={opt.id} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${opt.color.dot}`} />
                      <h4 className={`text-[10px] font-extrabold uppercase tracking-widest ${opt.color.text}`}>
                        {opt.label}
                      </h4>
                      {opt.id === PersonalizationType.USER_PROFILE && (
                        <span className="text-[9px] text-slate-400 font-medium ml-auto">
                          From merchant and inferred from conversation
                        </span>
                      )}
                      {opt.id === PersonalizationType.SHOPPING_HISTORY && (
                        <span className="text-[9px] text-slate-400 font-medium ml-auto">
                          From merchant
                        </span>
                      )}
                      {opt.id === PersonalizationType.CONVERSATION_CONTEXT && (
                        <span className="text-[9px] text-slate-400 font-medium ml-auto">
                          From conversation history
                        </span>
                      )}
                      {opt.id === PersonalizationType.CONSUMER_PCONTEXT && (
                        <span className="text-[9px] text-slate-400 font-medium ml-auto">
                          From Google Consumer pContext
                        </span>
                      )}
                    </div>
                    <div className={`p-4 rounded-xl border ${opt.color.border} ${opt.color.bg} bg-opacity-30 overflow-hidden`}>
                      <div className="text-[14px] text-slate-700 font-medium leading-relaxed break-words">
                        <Markdown
                          components={{
                            p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({children}) => <ul className="list-disc pl-4 space-y-1 mb-2 last:mb-0">{children}</ul>,
                            li: ({children}) => <li className="leading-relaxed">{children}</li>
                          }}
                        >
                          {opt.content.trim()}
                        </Markdown>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400 font-medium">
                  This data is used to tailor recommendations and provide context-aware assistance.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Guardrails Modal */}
      <AnimatePresence>
        {showGuardrailsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 p-2 rounded-xl">
                    <ShieldCheck className="text-slate-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Assistant Guardrails</h3>
                    <p className="text-xs text-slate-500 font-medium">Define rules and constraints for the personalized assistant</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowGuardrailsModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                      System Guardrails
                    </label>
                    <textarea
                      value={guardrails}
                      onChange={(e) => setGuardrails(e.target.value)}
                      className="w-full h-64 p-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-400 transition-all resize-none"
                      placeholder="Enter guardrails for the assistant..."
                    />
                    <p className="text-[11px] text-slate-400 italic">
                      These rules will be applied to all personalized features including starter prompts, follow-on suggestions, and conversation responses.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setShowGuardrailsModal(false)}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
                >
                  Save & Apply
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Standard Assistant Configs Modal */}
      <AnimatePresence>
        {showStandardConfigsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 p-2 rounded-xl">
                    <Settings2 className="text-slate-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Standard Assistant Configs</h3>
                    <p className="text-xs text-slate-500 font-medium">Define rules and constraints for the standard assistant</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowStandardConfigsModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                      System Configurations
                    </label>
                    <textarea
                      value={standardConfigs}
                      onChange={(e) => setStandardConfigs(e.target.value)}
                      className="w-full h-64 p-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-400 transition-all resize-none"
                      placeholder="Enter configurations for the standard assistant..."
                    />
                    <p className="text-[11px] text-slate-400 italic">
                      These rules will be applied to the standard assistant's responses in the left panel.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <button
                  onClick={resetStandardConfigs}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 transition-all flex items-center gap-1.5"
                >
                  <RotateCcw size={14} />
                  Reset to Default
                </button>
                <button
                  onClick={() => setShowStandardConfigsModal(false)}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
                >
                  Save & Apply
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
