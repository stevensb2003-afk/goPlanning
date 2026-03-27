import { useState } from 'react';
import { X, Link, Copy, Check, Share2, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  specialties?: string[];
}

export default function InviteModal({ isOpen, onClose }: InviteModalProps) {
  const [copied, setCopied] = useState(false);
  
  // Hardcoded fixed invitation link as requested
  const inviteLink = "https://goplanning--goplanning-audiovisual-church.us-central1.hosted.app/";

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Invitar a GoPlanning',
          text: '¡Únete a mi equipo creativo en GoPlanning!',
          url: inviteLink,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative glass-card bg-slate-900 w-full max-w-md rounded-[3rem] overflow-hidden animate-in fade-in zoom-in duration-300 border border-white/10 shadow-2xl">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight">Expandir Equipo</h3>
            <p className="text-slate-400 text-xs mt-1">Comparte el acceso a tu espacio creativo.</p>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl hover:bg-white/5 text-slate-400 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* QR Code Section */}
          <div className="flex justify-center">
            <div className="relative group">
              <div className="p-4 rounded-[2.5rem] bg-white flex items-center justify-center border-4 border-purple-500/20 shadow-2xl transition-all duration-500 hover:scale-105 active:scale-95 group-hover:border-purple-500/40">
                <QRCodeSVG 
                  value={inviteLink}
                  size={160}
                  level="H"
                  includeMargin={false}
                  imageSettings={{
                    src: "/favicon.svg",
                    x: undefined,
                    y: undefined,
                    height: 24,
                    width: 24,
                    excavate: true,
                  }}
                />
              </div>
              <div className="absolute -top-3 -right-3 w-10 h-10 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform">
                <Sparkles size={18} className="text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="text-center space-y-2">
            <h4 className="text-lg font-bold text-white">¡Listo para compartir!</h4>
            <p className="text-slate-400 text-sm px-4">Escanea el código o comparte el enlace fijo para invitar colaboradores.</p>
          </div>

          <div className="space-y-4">
            {/* Share Button (Primary) */}
            <button 
              onClick={handleShare}
              className="w-full h-16 premium-gradient rounded-3xl font-bold text-white shadow-xl shadow-purple-500/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all group"
            >
              <Share2 size={22} className="group-hover:rotate-12 transition-transform" />
              <span>Compartir Invitación</span>
            </button>

            {/* Link Section */}
            <div className="space-y-3 pt-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block text-center">
                O copia el enlace directo
              </label>
              <div 
                onClick={handleCopyLink}
                className="group relative flex items-center gap-4 bg-white/5 border border-white/10 hover:border-purple-500/30 hover:bg-white/10 rounded-2xl p-4 transition-all cursor-pointer overflow-hidden"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-slate-400 group-hover:text-purple-400 transition-colors">
                  <Link size={18} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mb-0.5">Enlace de acceso</p>
                  <p className="text-sm font-medium text-slate-300 truncate tracking-tight">
                    {inviteLink.replace(/^https?:\/\//, '')}
                  </p>
                </div>

                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tighter transition-all ${copied ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-slate-400 group-hover:text-white'}`}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </div>

                {/* Subtle Glow Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white/5 text-center">
          <p className="text-[10px] text-slate-500 font-medium">
            Al unirse mediante este enlace, el nuevo miembro tendrá permisos básicos de <span className="text-slate-300">Colaborador</span> por defecto.
          </p>
        </div>
      </div>
    </div>
  );
}
