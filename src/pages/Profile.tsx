import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Camera, 
  Lock, 
  Save, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [formData, setFormData] = useState({
    nome_completo: '',
    email: '',
    password: '',
    confirmPassword: '',
    profile_picture: ''
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('vacina_ja_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      fetchProfile(parsed.id);
    }
  }, []);

  const fetchProfile = async (id: number) => {
    try {
      const res = await fetch(`/api/users/profile/${id}`);
      const data = await res.json();
      setUser(data);
      setFormData({
        ...formData,
        nome_completo: data.nome_completo,
        email: data.email || '',
        profile_picture: data.profile_picture || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profile_picture: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'As palavras-passe não coincidem' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/users/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_completo: formData.nome_completo,
          email: formData.email,
          profile_picture: formData.profile_picture,
          password: formData.password || undefined
        })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
        // Update local storage
        const updatedUser = { ...user, nome_completo: formData.nome_completo, profile_picture: formData.profile_picture };
        localStorage.setItem('vacina_ja_user', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('storage')); // Notify other components
      } else {
        setMessage({ type: 'error', text: 'Erro ao atualizar perfil' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro de conexão' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Carregando perfil...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">O Meu Perfil</h2>
        <p className="text-slate-500 font-medium">Gerencie suas informações pessoais e segurança.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Avatar */}
        <div className="lg:col-span-1">
          <div className="card p-8 flex flex-col items-center text-center space-y-6">
            <div className="relative group">
              <div className="w-40 h-40 bg-blue-50 rounded-[40px] overflow-hidden flex items-center justify-center border-4 border-white shadow-xl">
                {formData.profile_picture ? (
                  <img src={formData.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={80} className="text-blue-600" strokeWidth={1.5} />
                )}
              </div>
              <label className="absolute bottom-2 right-2 w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white cursor-pointer shadow-lg hover:scale-110 transition-transform">
                <Camera size={20} />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">{user.nome_completo}</h3>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">@{user.username}</p>
              <div className="mt-4 px-4 py-1 bg-blue-100 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest inline-block">
                {user.role}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="card p-10 space-y-8">
            {message && (
              <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-sm ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}>
                {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                {message.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    className="input-field pl-12" 
                    value={formData.nome_completo}
                    onChange={e => setFormData({ ...formData, nome_completo: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="email"
                    className="input-field pl-12" 
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50">
              <h4 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-tight flex items-center gap-2">
                <Lock size={20} className="text-blue-600" /> Alterar Palavra-passe
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Nova Senha</label>
                  <input 
                    type="password"
                    className="input-field" 
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">Confirmar Senha</label>
                  <input 
                    type="password"
                    className="input-field" 
                    value={formData.confirmPassword}
                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-400 font-medium italic">Deixe em branco se não desejar alterar a senha.</p>
            </div>

            <div className="flex justify-end pt-6">
              <button 
                type="submit" 
                disabled={saving}
                className="btn-primary px-12 flex items-center gap-2"
              >
                {saving ? 'Salvando...' : <><Save size={20} /> Salvar Alterações</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
