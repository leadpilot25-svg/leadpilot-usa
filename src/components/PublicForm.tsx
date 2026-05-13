import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, CheckCircle2, User, Phone, MessageCircle, Mail, MapPin, Search, DollarSign, FileText, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface PublicFormProps {
  scriptUrl: string;
}

export default function PublicForm({ scriptUrl }: PublicFormProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    whatsapp: '',
    email: '',
    location: '',
    propType: '',
    bs: 'Buy',
    budget: '',
    remarks: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.phone) {
      setError('Name and Phone are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (scriptUrl && scriptUrl.startsWith('http')) {
        console.log("Public Form: Submitting to cloud:", scriptUrl);
        // Using no-cors and removing headers that trigger preflight
        await fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          cache: 'no-cache',
          body: JSON.stringify({
            action: 'addLead',
            lead: {
              ...formData,
              status: 'New',
              source: 'Public Form',
              priority: 'Medium'
            }
          })
        });
        
        // Since no-cors doesn't allow reading response, we assume success or handle timeout
        setSubmitted(true);
      } else {
        console.warn("Public Form: Script URL missing or invalid. Check your environment variables.");
        setError('System error: Form is not connected to database. Please contact the owner.');
      }
    } catch (err) {
      console.error("Public Form Submission Error:", err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-10 shadow-xl"
        >
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Enquiry Received!</h2>
          <p className="text-slate-500 mb-8">Thank you for your interest. Our representative will contact you shortly regarding your requirement.</p>
          <button 
            onClick={() => setSubmitted(false)}
            className="w-full bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all"
          >
            Submit Another Response
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 flex items-center justify-center font-sans">
      <div className="max-w-lg w-full">
        {/* Branding */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <Send size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Property Enquiry</h1>
          <p className="text-slate-500 text-sm font-bold tracking-wide uppercase">LEADPILOT EXCLUSIVE PROPERTIES</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <FormInput 
                icon={<User size={18} />} 
                label="First Name *" 
                name="firstName" 
                value={formData.firstName} 
                onChange={handleChange} 
                placeholder="John"
              />
              <FormInput 
                icon={<User size={18} />} 
                label="Last Name" 
                name="lastName" 
                value={formData.lastName} 
                onChange={handleChange} 
                placeholder="Doe"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput 
                icon={<Phone size={18} />} 
                label="Phone *" 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange} 
                type="tel"
                placeholder="+1..."
              />
              <FormInput 
                icon={<MessageCircle size={18} />} 
                label="WhatsApp" 
                name="whatsapp" 
                value={formData.whatsapp} 
                onChange={handleChange} 
                type="tel"
                placeholder="Same as phone?"
              />
            </div>

            <FormInput 
              icon={<Mail size={18} />} 
              label="Email Address" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              type="email"
              placeholder="john@example.com"
            />

            <FormInput 
              icon={<MapPin size={18} />} 
              label="Preferred Location" 
              name="location" 
              value={formData.location} 
              onChange={handleChange} 
              placeholder="e.g. Downtown, Marina"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Search size={12} />
                  Interested In
                </label>
                <select 
                  name="bs"
                  value={formData.bs}
                  onChange={handleChange as any}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-900 focus:border-primary outline-none transition-all appearance-none"
                >
                  <option value="Buy">Buy</option>
                  <option value="Rent">Rent</option>
                  <option value="Sell">Sell</option>
                </select>
              </div>
              <FormInput 
                icon={<Search size={18} />} 
                label="Property Type" 
                name="propType" 
                value={formData.propType} 
                onChange={handleChange} 
                placeholder="e.g. 2BHK Appt"
              />
            </div>

            <FormInput 
              icon={<DollarSign size={18} />} 
              label="Budget Range" 
              name="budget" 
              value={formData.budget} 
              onChange={handleChange} 
              placeholder="e.g. $500k - $700k"
            />

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FileText size={12} />
                Additional Remarks
              </label>
              <textarea 
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Tell us more about what you are looking for..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary outline-none min-h-[100px] resize-none transition-all"
              />
            </div>

            {error && (
              <p className="text-xs font-bold text-rose-500 text-center">{error}</p>
            )}

            <button 
              disabled={loading}
              className="w-full bg-primary text-white font-bold py-5 rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Send size={20} />
                  Submit Enquiry
                </>
              )}
            </button>
          </form>
        </motion.div>

        <p className="text-center mt-10 text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
          Powered by LeadPilot CRM
        </p>
      </div>
    </div>
  );
}

function FormInput({ icon, label, name, value, onChange, placeholder, type = "text" }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
        {icon}
        {label}
      </label>
      <input 
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary outline-none transition-all"
      />
    </div>
  );
}
