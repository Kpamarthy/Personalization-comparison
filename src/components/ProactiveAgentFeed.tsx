import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  ShieldCheck, 
  Zap, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingDown,
  Layout,
  ArrowRight,
  ShoppingBag,
  Sparkles,
  Bot,
  X,
  Package,
  Bell,
  RefreshCw,
  Target,
  Info
} from 'lucide-react';

interface AgentActivity {
  id: string;
  agentName: string;
  status: 'working' | 'completed' | 'alert';
  message: string;
  timestamp: Date;
  icon: React.ReactNode;
  color: string;
}

interface InsightCard {
  id: string;
  type: 'deal' | 'next-step' | 'style' | 'alert' | 'threshold' | 'urgency' | 'replenishment';
  title: string;
  description: string;
  actionLabel: string;
  imageUrl?: string;
  agent: string;
}

interface AgentMetadata {
  id: string;
  name: string;
  description: string;
  valueProposition: string;
  metrics: string[];
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const AGENT_METADATA: AgentMetadata[] = [
  {
    id: 'project-completer',
    name: 'Project Completer',
    description: 'Analyzes your project mission to identify missing technical dependencies and required accessories.',
    valueProposition: 'Ensures all necessary components are purchased together, preventing churn to competitors for forgotten items.',
    metrics: ['AOV', 'Cart Size'],
    icon: <Package size={18} />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    id: 'value-advocate',
    name: 'Value Advocate',
    description: 'Scans for hidden savings, bulk discounts, and member-exclusive rebates.',
    valueProposition: 'Removes price friction and incentivizes bulk purchases through volume-based savings.',
    metrics: ['Conversion', 'AOV'],
    icon: <TrendingDown size={18} />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50'
  },
  {
    id: 'style-guardian',
    name: 'Style Guardian',
    description: 'Maintains a visual mood board and suggests premium matches that fit your project\'s aesthetic.',
    valueProposition: 'Shifts customers from commodity items to higher-margin lifestyle products.',
    metrics: ['AOV', 'Premium Conversion'],
    icon: <Eye size={18} />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  {
    id: 'threshold-optimizer',
    name: 'Threshold Optimizer',
    description: 'Monitors cart totals against shipping or promotion thresholds to suggest high-utility bridge items.',
    valueProposition: 'Captures "near-miss" revenue for promotional tiers and shipping minimums.',
    metrics: ['Incremental Cart Size'],
    icon: <Target size={18} />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50'
  },
  {
    id: 'urgency-watchdog',
    name: 'Urgency Watchdog',
    description: 'Tracks real-time inventory and localized demand to alert you of low-stock situations.',
    valueProposition: 'Increases conversion velocity by creating authentic, data-driven urgency.',
    metrics: ['Conversion Velocity'],
    icon: <Bell size={18} />,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50'
  },
  {
    id: 'replenishment-scout',
    name: 'Replenishment Scout',
    description: 'Tracks the lifecycle of previous purchases to proactively surface replenishment needs.',
    valueProposition: 'Maximizes lifetime value and ensures the merchant remains the default choice for consumables.',
    metrics: ['LTV', 'Recurring Revenue'],
    icon: <RefreshCw size={18} />,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50'
  }
];

export const ProactiveAgentFeed: React.FC = () => {
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [insights, setInsights] = useState<InsightCard[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    // Simulate initial agent startup
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
      
      // Initial activities
      setActivities([
        {
          id: '1',
          agentName: 'Project Completer',
          status: 'working',
          message: 'Identifying required drain kits for your sink purchase...',
          timestamp: new Date(),
          icon: <Package size={14} />,
          color: 'text-blue-500'
        },
        {
          id: '2',
          agentName: 'Value Advocate',
          status: 'working',
          message: 'Scanning for Gold Member rebates on appliances...',
          timestamp: new Date(),
          icon: <TrendingDown size={14} />,
          color: 'text-emerald-500'
        },
        {
          id: '3',
          agentName: 'Style Guardian',
          status: 'completed',
          message: 'Style profile updated based on recent espresso machine purchase.',
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          icon: <Eye size={14} />,
          color: 'text-purple-500'
        }
      ]);

      // Initial insights
      setInsights([
        {
          id: 'i1',
          type: 'deal',
          agent: 'Value Advocate',
          title: 'Gold Member Rebate Found',
          description: 'The bamboo tiles you viewed are eligible for a $50 instant rebate if purchased in bulk (5+ boxes).',
          actionLabel: 'Apply Discount',
          imageUrl: 'https://picsum.photos/seed/tiles/400/200'
        },
        {
          id: 'i2',
          type: 'next-step',
          agent: 'Project Completer',
          title: 'Missing Component: P-Trap Kit',
          description: 'You have a sink in your cart, but you\'ll need a P-trap kit and plumber\'s putty to complete the install. I\'ve found the exact match.',
          actionLabel: 'Add to Project'
        },
        {
          id: 'i3',
          type: 'threshold',
          agent: 'Threshold Optimizer',
          title: 'Free Shipping Threshold Near',
          description: 'You are $12.50 away from free shipping. Adding this matching grout sealer would bridge the gap and save you $15 in shipping.',
          actionLabel: 'Add Grout Sealer'
        }
      ]);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Simulate periodic background updates
  useEffect(() => {
    if (isInitialLoading) return;

    const interval = setInterval(() => {
      const agents = AGENT_METADATA;
      const randomAgent = agents[Math.floor(Math.random() * agents.length)];
      
      const newActivity: AgentActivity = {
        id: Date.now().toString(),
        agentName: randomAgent.name,
        status: 'working',
        message: `Running background scan for ${randomAgent.name.toLowerCase()} opportunities...`,
        timestamp: new Date(),
        icon: React.cloneElement(randomAgent.icon as React.ReactElement<any>, { size: 14 }),
        color: randomAgent.color
      };

      setActivities(prev => [newActivity, ...prev.slice(0, 4)]);
    }, 8000);

    return () => clearInterval(interval);
  }, [isInitialLoading]);

  if (isInitialLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="text-indigo-600"
        >
          <Sparkles size={48} />
        </motion.div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800">Initializing Background Agents</h2>
          <p className="text-slate-500 text-sm">Mapping your project context and scanning for opportunities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-50 p-4 gap-4 relative">
      {/* Left Column: Agent Activity Feed */}
      <div className="w-80 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-indigo-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Agent Activity</h2>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">Live</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence initial={false}>
            {activities.map((activity) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="relative pl-6 border-l border-slate-100 pb-2"
              >
                <div className={`absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-white border-2 border-current ${activity.color}`} />
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${activity.color} flex items-center gap-1`}>
                      {activity.icon}
                      {activity.agentName}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {activity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {activity.message}
                  </p>
                  {activity.status === 'working' && (
                    <div className="flex gap-1 mt-1">
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 bg-slate-300 rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-slate-300 rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-slate-300 rounded-full" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Column: Proactive Insight Feed */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex items-center justify-between px-2">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Concierge Hub</h1>
            <p className="text-sm text-slate-500">Proactive insights for your <span className="font-semibold text-indigo-600 underline decoration-indigo-200 underline-offset-4">Kitchen Remodel</span> project</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {AGENT_METADATA.map(agent => (
                <div 
                  key={agent.id}
                  className={`w-8 h-8 rounded-full ${agent.bgColor} border-2 border-white flex items-center justify-center ${agent.color} shadow-sm`} 
                  title={agent.name}
                >
                  {React.cloneElement(agent.icon as React.ReactElement<any>, { size: 14 })}
                </div>
              ))}
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider flex items-center gap-1.5"
            >
              <Info size={14} />
              Agent Settings
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-8">
          <AnimatePresence>
            {insights.map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex"
              >
                {insight.imageUrl && (
                  <div className="w-48 shrink-0 relative">
                    <img 
                      src={insight.imageUrl} 
                      alt={insight.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10" />
                  </div>
                )}
                <div className="flex-1 p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {insight.agent}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">Just Now</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{insight.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6 max-w-2xl">
                    {insight.description}
                  </p>
                  <div className="mt-auto flex items-center gap-4">
                    <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 group">
                      {insight.actionLabel}
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button className="text-slate-400 hover:text-slate-600 text-sm font-bold transition-colors">
                      Dismiss
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Simulated "Next Logical Step" Section */}
          <div className="pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Layout size={18} className="text-slate-400" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Project Roadmap</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Phase 1: Demolition', status: 'completed', date: 'Feb 12' },
                { label: 'Phase 2: Painting', status: 'completed', date: 'Feb 28' },
                { label: 'Phase 3: Hardware', status: 'active', date: 'In Progress' },
              ].map((phase, i) => (
                <div key={i} className={`p-4 rounded-2xl border ${phase.status === 'active' ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-100 bg-white opacity-60'} flex flex-col gap-2`}>
                  <div className="flex items-center justify-between">
                    {phase.status === 'completed' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Clock size={16} className="text-indigo-500 animate-pulse" />}
                    <span className="text-[10px] font-mono text-slate-400">{phase.date}</span>
                  </div>
                  <span className={`text-xs font-bold ${phase.status === 'active' ? 'text-indigo-900' : 'text-slate-700'}`}>{phase.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Agent Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-20 bottom-20 max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl z-[101] overflow-hidden flex flex-col"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-600 p-2 rounded-xl text-white">
                    <Bot size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Background Agent Intelligence</h2>
                    <p className="text-sm text-slate-500">Autonomous agents working to maximize shopper value and merchant growth.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {AGENT_METADATA.map((agent) => (
                    <div key={agent.id} className="p-6 rounded-2xl border border-slate-100 bg-slate-50/30 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className={`p-3 rounded-xl ${agent.bgColor} ${agent.color}`}>
                          {agent.icon}
                        </div>
                        <div className="flex gap-1">
                          {agent.metrics.map(metric => (
                            <span key={metric} className="text-[10px] font-bold bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                              {metric}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">{agent.name}</h3>
                        <p className="text-sm text-slate-600 leading-relaxed mb-4">
                          {agent.description}
                        </p>
                        <div className="bg-white/60 rounded-xl p-3 border border-slate-100">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Merchant Value Proposition</h4>
                          <p className="text-xs text-slate-700 font-medium leading-relaxed italic">
                            "{agent.valueProposition}"
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <ShieldCheck size={14} />
                  <span>All agents operate within your privacy guardrails.</span>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all"
                >
                  Close Settings
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
