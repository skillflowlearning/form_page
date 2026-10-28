import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, GraduationCap, Loader2, CheckCircle2 } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    contactNo: '',
    collegeEmail: '',
    collegeName: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        contactNo: '',
        collegeEmail: '',
        collegeName: '',
      });
    }, 200);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await fetch('https://formsubmit.co/ajax/support@skillflowlearn.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          NAME: formData.name,
          'Contact No': formData.contactNo,
          'College Email ID': formData.collegeEmail,
          'College Name': formData.collegeName,
          _subject: `New Lead: ${formData.name} - SkillFlow`,
          _template: 'table',
          _captcha: 'false',
        }),
      });
    } catch (err) {
      console.error('Error submitting form:', err);
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#0B0F19] border border-blue-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-blue-900/30 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          /* Success Screen */
          <div className="text-center py-4 space-y-5">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-emerald-400" />
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Form Submitted!</h3>
              <p className="text-slate-300 text-sm">
                Thank you, <span className="font-semibold text-white">{formData.name}</span>. We have received your details at{' '}
                <span className="text-blue-400">support@skillflowlearn.com</span>.
              </p>
            </div>

            {/* Prominent Contact Banner */}
            <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/40 space-y-2">
              <p className="text-xs font-semibold tracking-wider uppercase text-blue-300">
                Any doubt contact this no:
              </p>
              <div className="flex items-center justify-center gap-2">
                <Phone className="w-5 h-5 text-emerald-400 animate-pulse" />
                <a
                  href="tel:6364656848"
                  className="text-2xl sm:text-3xl font-extrabold text-white hover:text-blue-400 transition-colors tracking-wide"
                >
                  6364656848
                </a>
              </div>
              <p className="text-xs text-slate-400">Available on Call &amp; WhatsApp</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <a
                href="tel:6364656848"
                className="flex-1 py-2.5 rounded-xl font-medium bg-white/10 hover:bg-white/20 text-white transition-colors text-sm text-center"
              >
                Call Now
              </a>
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-xl font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors text-sm"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form Screen */
          <div>
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
                Get In Touch
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Contact Us</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Fill out the details below and our team will get in touch with you.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Contact No */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Contact No <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    name="contactNo"
                    required
                    pattern="[0-9]{10}"
                    title="Please enter a valid 10-digit mobile number"
                    value={formData.contactNo}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* College Email ID */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  College Email ID <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    name="collegeEmail"
                    required
                    value={formData.collegeEmail}
                    onChange={handleChange}
                    placeholder="e.g. yourname@college.edu"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* College Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  College Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    name="collegeName"
                    required
                    value={formData.collegeName}
                    onChange={handleChange}
                    placeholder="e.g. National Institute of Technology"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-6 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Details</span>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
