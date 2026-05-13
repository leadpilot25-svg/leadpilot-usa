import React, { useState } from 'react';
import { Lead } from '../types';
import { getAvatarColors, getInitials, formatDate, cn } from '../lib/utils';
import { Phone, MessageCircle, Mail, Trash2, MessageSquare, Calendar } from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  onClick: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
}

export default function LeadCard({ lead, onClick, onDelete }: LeadCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const name = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown';
  const { bg, text } = getAvatarColors(name);
  const initials = getInitials(lead.firstName, lead.lastName);

  const statusStyles: Record<string, string> = {
    'New': 'bg-blue-50 text-blue-600 border-blue-100',
    'Contacted': 'bg-amber-50 text-amber-600 border-amber-100',
    'Qualified': 'bg-purple-50 text-purple-600 border-purple-100',
    'Negotiating': 'bg-rose-50 text-rose-600 border-rose-100',
    'Closed': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Lost': 'bg-slate-50 text-slate-600 border-slate-100',
  };

  const priorityColors = {
    'Hot': 'bg-rose-500',
    'Medium': 'bg-amber-500',
    'Low': 'bg-blue-500',
    '': 'bg-slate-400'
  };

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lead.phone) window.location.href = `tel:${lead.phone}`;
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const targetPhone = lead.whatsapp || lead.phone;
    if (targetPhone) {
      const message = encodeURIComponent(`Hi ${lead.firstName}, this is LeadPilot...`);
      window.open(`https://wa.me/${targetPhone.replace(/\D/g, '')}?text=${message}`, '_blank');
    }
  };

  const handleSMS = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lead.phone) window.location.href = `sms:${lead.phone}`;
  };

  const handleEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lead.email) window.location.href = `mailto:${lead.email}`;
  };

  return (
    <div 
      onClick={() => onClick(lead)}
      className="white-card white-card-hover rounded-2xl p-4 cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-300 relative overflow-hidden"
    >
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
          <p className="text-xs font-bold text-slate-900 mb-3">Delete this lead permanently?</p>
          <div className="flex gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(lead); setShowDeleteConfirm(false); }}
              className="px-4 py-1.5 rounded-lg bg-rose-500 text-white text-[10px] font-bold uppercase tracking-widest"
            >
              Delete
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
              className="px-4 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-4 items-start mb-3">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0", bg, text)}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className={cn("w-2 h-2 rounded-full", priorityColors[lead.priority || 'Medium'])} />
            <h3 className="font-bold text-slate-900 truncate">{name}</h3>
          </div>
          <p className="text-xs text-slate-500 truncate">
            {lead.phone || 'No phone'} • {lead.location || 'No location'}
          </p>
          
          <div className="flex flex-wrap gap-2 mt-2">
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", statusStyles[lead.status] || statusStyles['New'])}>
              {lead.status || 'New'}
            </span>
            {lead.requirement && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 border border-slate-100 text-slate-500">
                {lead.requirement}
              </span>
            )}
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
          className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {lead.followUp && (
        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-3 px-1 bg-slate-50 rounded-lg p-1.5 border border-slate-100 inline-flex">
          <Calendar size={12} className="text-slate-400" />
          <span className="opacity-70">Follow-up:</span>
          <span className="font-semibold text-slate-700">{formatDate(lead.followUp)}</span>
        </div>
      )}

      <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100">
        <ActionButton icon={<Phone size={14} />} label="Call" color="text-blue-500" onClick={handleCall} />
        <ActionButton icon={<MessageCircle size={14} />} label="WA" color="text-emerald-500" onClick={handleWhatsApp} />
        <ActionButton icon={<MessageSquare size={14} />} label="SMS" color="text-orange-500" onClick={handleSMS} />
        <ActionButton icon={<Mail size={14} />} label="Email" color="text-purple-500" onClick={handleEmail} />
      </div>
    </div>
  );
}

function ActionButton({ icon, label, color, onClick }: { icon: React.ReactNode, label: string, color: string, onClick?: (e: React.MouseEvent) => void }) {
  return (
    <button 
      onClick={(e) => { 
        e.stopPropagation();
        onClick?.(e);
      }}
      className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg hover:bg-slate-50 transition-colors group"
    >
      <div className={cn("p-1.5 rounded-md bg-slate-50 border border-slate-100 group-hover:border-slate-200", color)}>
        {icon}
      </div>
      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
    </button>
  );
}
