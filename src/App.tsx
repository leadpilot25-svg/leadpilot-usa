import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Calendar, BarChart3, LayoutGrid, Search, 
  Plus, RefreshCcw, Bell, Filter, TrendingUp, AlertCircle,
  Download, LogOut, Lock, CheckCircle2, XCircle, Info
} from 'lucide-react';
import { Lead, DashboardStats, View, Toast } from './types';
import { formatDate, cn } from './lib/utils';
import LeadCard from './components/LeadCard';
import LeadForm from './components/LeadForm';
import PublicForm from './components/PublicForm';
import { Send } from 'lucide-react';

// @ts-ignore
const SCRIPT_URL = import.meta.env.VITE_GAS_SCRIPT_URL;
const CRM_PIN = "1234"; // Default PIN for access

export default function App() {
  const [isFormMode, setIsFormMode] = useState(false);
  const [view, setView] = useState<View>('dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | undefined>(undefined);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const syncData = async () => {
    setLoading(true);
    
    // Load from local cache immediately
    const savedLeads = localStorage.getItem('leadpilot_leads');
    if (savedLeads) {
      setLeads(JSON.parse(savedLeads));
    }

    // Then attempt to sync with cloud
    if (SCRIPT_URL && !SCRIPT_URL.includes('...')) {
      try {
        const response = await fetch(`${SCRIPT_URL}?action=getLeads`);
        const data = await response.json();
        if (data.success) {
          setLeads(data.leads);
          localStorage.setItem('leadpilot_leads', JSON.stringify(data.leads));
          addToast('Cloud Sync Active', 'success');
        }
      } catch (error) {
        console.error('Cloud fetch failed:', error);
        addToast('Cloud Sync Offline', 'info');
      }
    } else {
      addToast('Local Mode: Set Script URL for Cloud Sync', 'info');
    }
    
    setLoading(false);
  };

  useEffect(() => {
    syncData();
    if (window.location.search.includes('form=true')) {
      setIsFormMode(true);
    }
  }, []);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const overdueLeads = leads.filter(l => {
      if (!l.followUp || l.status === 'Closed') return false;
      const fDate = new Date(l.followUp);
      fDate.setHours(0,0,0,0);
      return fDate.getTime() < today.getTime();
    });

    const todayLeads = leads.filter(l => {
      if (!l.followUp || l.status === 'Closed') return false;
      const fDate = new Date(l.followUp);
      fDate.setHours(0,0,0,0);
      return fDate.getTime() === today.getTime();
    });

    const hotLeads = leads.filter(l => l.priority === 'Hot' || l.status === 'Negotiating');

    const byStatus = leads.reduce((acc: Record<string, number>, curr) => {
      acc[curr.status || 'New'] = (acc[curr.status || 'New'] || 0) + 1;
      return acc;
    }, {});

    return {
      total: leads.length,
      hot: hotLeads.length,
      today: todayLeads.length,
      overdue: overdueLeads.length,
      byStatus
    };
  }, [leads]);

  const handleSaveLead = async (data: Partial<Lead>) => {
    try {
      const isNew = !selectedLead;
      const newLeads = [...leads];
      let updatedLead: Lead;

      if (selectedLead) {
        const index = newLeads.findIndex(l => l.rowIndex === selectedLead.rowIndex);
        updatedLead = { ...selectedLead, ...data };
        if (index !== -1) {
          newLeads[index] = updatedLead;
        }
      } else {
        updatedLead = {
          ...data as Lead,
          rowIndex: Date.now(), // Temporary ID if not synced yet
          timestamp: new Date().toISOString(),
          status: data.status || 'New',
          priority: data.priority || 'Medium',
          source: data.source || 'Manual'
        };
        newLeads.unshift(updatedLead);
      }
      
      // Update local state and cache immediately
      setLeads(newLeads);
      localStorage.setItem('leadpilot_leads', JSON.stringify(newLeads));
      addToast(selectedLead ? 'Saving Changes...' : 'Adding Lead...', 'info');

      // Sync to cloud
      if (SCRIPT_URL && !SCRIPT_URL.includes('...')) {
        await fetch(SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: isNew ? 'addLead' : 'updateLead',
            rowIndex: selectedLead?.rowIndex,
            lead: data
          })
        });
        addToast('Synced to Cloud', 'success');
        // Refresh after short delay to get correct rowIndex from GS if it was a new lead
        if (isNew) {
           setTimeout(() => syncData(), 2000);
        }
      } else {
        addToast(selectedLead ? 'Updated Locally' : 'Added Locally', 'success');
      }
    } catch (error) {
      addToast('Sync Failed', 'error');
    }
  };

  const handleDeleteLead = async (lead: Lead) => {
    try {
      const newLeads = leads.filter(l => l.rowIndex !== lead.rowIndex);
      setLeads(newLeads);
      localStorage.setItem('leadpilot_leads', JSON.stringify(newLeads));
      addToast('Deleting...', 'info');

      if (SCRIPT_URL && !SCRIPT_URL.includes('...')) {
        await fetch(SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({
            action: 'deleteLead',
            rowIndex: lead.rowIndex
          })
        });
        addToast('Deleted from Cloud', 'success');
      } else {
        addToast('Removed Locally', 'success');
      }
    } catch (error) {
      addToast('Deletion Failed', 'error');
    }
  };

  const exportToCSV = () => {
    if (leads.length === 0) return;
    const headers = ['Timestamp', 'First Name', 'Last Name', 'Phone', 'WhatsApp', 'Email', 'Location', 'Requirement', 'Budget', 'Notes', 'Status', 'Follow-up', 'Priority', 'Source'];
    const rows = leads.map(l => [
      l.timestamp, l.firstName, l.lastName, l.phone, l.whatsapp, l.email, 
      l.location, l.requirement, l.budget, l.notes, l.status, l.followUp, 
      l.priority, l.source
    ].map(v => `"${v || ''}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    addToast('CSV Exported', 'success');
  };

  const shareFormLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?form=true`;
    navigator.clipboard.writeText(url);
    addToast('Form Link Copied!', 'success');
  };

  const filteredLeads = useMemo(() => {
    let list = leads;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(l => 
        `${l.firstName} ${l.lastName}`.toLowerCase().includes(q) ||
        (l.phone && l.phone.includes(q)) ||
        (l.location && l.location.toLowerCase().includes(q))
      );
    }
    
    if (view === 'followups') {
      const today = new Date();
      today.setHours(0,0,0,0);
      return list.filter(l => {
        if (!l.followUp || l.status === 'Closed') return false;
        const fDate = new Date(l.followUp);
        fDate.setHours(0,0,0,0);
        return fDate.getTime() <= today.getTime();
      });
    }

    return list;
  }, [leads, searchQuery, view]);

  if (isFormMode) {
    return <PublicForm scriptUrl={SCRIPT_URL} />;
  }

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-bg-light overflow-hidden shadow-2xl border-x border-slate-200">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-40">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-10 object-contain" />
            <div className="hidden sm:block">
              <h1 className="font-bold text-lg text-slate-900 leading-none">
                LeadPilot
              </h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Real Estate OS</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <HeaderAction 
              icon={<Search size={20} />} 
              active={isSearchOpen}
              onClick={() => setIsSearchOpen(!isSearchOpen)} 
            />
            <HeaderAction 
              icon={<RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />} 
              onClick={syncData} 
            />
          </div>
        </div>

        <AnimatePresence>
          {isSearchOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4">
                <input 
                  type="text"
                  placeholder="Search name, phone, or location..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-colors text-slate-900"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-24 scroll-smooth">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard 
                  label="Tasks Today" 
                  value={stats.today} 
                  color="text-orange-600" 
                  bg="bg-orange-50"
                  icon={<Calendar size={18} />} 
                  onClick={() => setView('followups')}
                />
                <StatCard 
                  label="Overdue" 
                  value={stats.overdue} 
                  color="text-rose-600" 
                  bg="bg-rose-50"
                  icon={<AlertCircle size={18} />} 
                  onClick={() => setView('followups')}
                />
                <StatCard 
                  label="Total Leads" 
                  value={stats.total} 
                  color="text-blue-600" 
                  bg="bg-blue-50"
                  icon={<Users size={18} />} 
                  onClick={() => setView('leads')}
                />
                <StatCard 
                  label="Hot Pipeline" 
                  value={stats.hot} 
                  color="text-emerald-600" 
                  bg="bg-emerald-50"
                  icon={<TrendingUp size={18} />} 
                  onClick={() => setView('leads')}
                />
              </div>

              {/* Utility Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div 
                  onClick={exportToCSV}
                  className="white-card rounded-2xl p-4 relative overflow-hidden group cursor-pointer"
                >
                  <div className="absolute -top-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Download size={48} />
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Export Data</p>
                  <h3 className="text-sm font-bold text-slate-900">Leads.csv</h3>
                </div>

                <div 
                  onClick={shareFormLink}
                  className="white-card rounded-2xl p-4 relative overflow-hidden group cursor-pointer"
                >
                  <div className="absolute -top-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Send size={48} />
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Lead Capture</p>
                  <h3 className="text-sm font-bold text-slate-900">Share Form</h3>
                </div>
              </div>

              {/* Recent Activity */}
              <section>
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="font-bold text-slate-900">Recent Activity</h3>
                  <button onClick={() => setView('leads')} className="text-xs font-bold text-primary uppercase tracking-wider">View All</button>
                </div>
                <div className="space-y-3">
                  {leads.slice(0, 5).map((lead: Lead) => (
                    <div key={lead.rowIndex}>
                      <LeadCard 
                        lead={lead} 
                        onClick={(l) => { setSelectedLead(l as Lead); setIsLeadFormOpen(true); }} 
                        onDelete={handleDeleteLead}
                      />
                    </div>
                  ))}
                  {leads.length === 0 && (
                    <div className="text-center py-10 white-card rounded-2xl border-dashed">
                       <p className="text-sm text-slate-400">No leads yet</p>
                    </div>
                  )}
                </div>
              </section>
            </motion.div>
          )}

          {(view === 'leads' || view === 'followups') && (
            <motion.div 
              key={view}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-slate-900">
                  {view === 'leads' ? 'Lead Pipeline' : 'Today\'s Agenda'}
                </h2>
                <div className="flex gap-2">
                   <button className="white-card p-2 rounded-lg text-slate-400">
                    <Filter size={16} />
                   </button>
                </div>
              </div>

              <div className="space-y-3">
                {filteredLeads.length > 0 ? (
                  filteredLeads.map((lead: Lead) => (
                    <div key={lead.rowIndex}>
                      <LeadCard 
                        lead={lead} 
                        onClick={(l) => { setSelectedLead(l as Lead); setIsLeadFormOpen(true); }} 
                        onDelete={handleDeleteLead}
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-400 white-card rounded-3xl border-dashed">
                    <Users className="mx-auto mb-2 opacity-20" size={48} />
                    <p className="text-sm font-medium">No records found</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === 'analytics' && (
            <motion.div 
              key="analytics"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-bold text-slate-900">CRM Analytics</h2>
              
              <div className="white-card rounded-2xl p-6 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Leads by Status</h3>
                <div className="space-y-3">
                   {Object.entries(stats.byStatus).map(([status, count]) => (
                     <div key={status} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold px-1">
                          <span className="text-slate-500">{status}</span>
                          <span className="text-slate-900">{count}</span>
                        </div>
                         <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ width: `${(Number(count) / (stats.total || 1)) * 100}%` }}
                          />
                        </div>
                     </div>
                   ))}
                </div>
              </div>

              <div className="white-card rounded-2xl p-6">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Pipeline Hotness</h3>
                 <div className="flex items-center gap-4">
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-rose-500" 
                         style={{ width: `${Math.round(((stats.hot || 0) / (stats.total || 1)) * 100)}%` }}
                       />
                    </div>
                    <span className="text-lg font-bold text-slate-900">
                       {Math.round(((stats.hot || 0) / (stats.total || 1)) * 100)}%
                    </span>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FAB */}
      <button 
        onClick={() => { setSelectedLead(undefined); setIsLeadFormOpen(true); }}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all z-50 hover:shadow-xl"
      >
        <Plus size={32} />
      </button>

      {/* Bottom Nav */}
      <nav className="bg-white/80 backdrop-blur-lg border-t border-slate-200 pb-8 pt-3 px-6 fixed bottom-0 left-0 right-0 max-w-lg mx-auto z-40">
        <div className="flex items-center justify-between">
          <NavItem 
            icon={<LayoutGrid size={22} />} 
            label="Home" 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')} 
          />
          <NavItem 
            icon={<Users size={22} />} 
            label="Leads" 
            active={view === 'leads'} 
            onClick={() => setView('leads')} 
            badge={stats.overdue ? '!' : undefined}
          />
          <NavItem 
            icon={<Calendar size={22} />} 
            label="Agenda" 
            active={view === 'followups'} 
            onClick={() => setView('followups')} 
          />
          <NavItem 
            icon={<BarChart3 size={22} />} 
            label="Stats" 
            active={view === 'analytics'} 
            onClick={() => setView('analytics')} 
          />
        </div>
      </nav>

      <div className="fixed bottom-0 p-4 space-y-2 pointer-events-none w-full max-w-lg z-[200]">
        <AnimatePresence>
          {toasts.map((toast: Toast) => (
            <div key={toast.id}>
              <ToastItem toast={toast} />
            </div>
          ))}
        </AnimatePresence>
      </div>

      <LeadForm 
        isOpen={isLeadFormOpen}
        onClose={() => setIsLeadFormOpen(false)}
        onSubmit={handleSaveLead}
        initialData={selectedLead}
      />
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const icons = {
    success: <CheckCircle2 size={16} className="text-emerald-500" />,
    error: <XCircle size={16} className="text-rose-500" />,
    info: <Info size={16} className="text-blue-500" />
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="bg-white border border-slate-200 shadow-xl rounded-xl p-3 flex items-center gap-3 pointer-events-auto"
    >
      {icons[toast.type]}
      <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">{toast.message}</span>
    </motion.div>
  );
}

function HeaderAction({ icon, onClick, active }: { icon: React.ReactNode, onClick: () => void, active?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center border transition-all",
        active 
          ? "bg-primary/10 border-primary/30 text-primary" 
          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
      )}
    >
      {icon}
    </button>
  );
}

function StatCard({ label, value, color, bg, icon, onClick }: { label: string, value: number, color: string, bg: string, icon: React.ReactNode, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="white-card rounded-2xl p-4 white-card-hover group cursor-pointer text-left"
    >
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3 font-bold", bg, color)}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{label}</div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, badge }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, badge?: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 transition-all text-center relative pointer-events-auto",
        active ? "text-primary scale-110" : "text-slate-400 hover:text-slate-600"
      )}
    >
      {badge && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">
          {badge}
        </span>
      )}
      {icon}
      <span className="text-[9px] font-bold uppercase tracking-tighter">{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-pill"
          className="absolute -bottom-3 w-1.5 h-1.5 rounded-full bg-primary"
        />
      )}
    </button>
  );
}
