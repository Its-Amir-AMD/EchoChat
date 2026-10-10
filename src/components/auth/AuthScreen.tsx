import React, { useState } from 'react';
import { Compass, Phone, ShieldCheck, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

interface AuthScreenProps {
  onSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const { updateUser, language } = useChat();
  const isFa = language === 'fa';

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phoneNumber, setPhoneNumber] = useState('912 345 6789');
  const [otpCode, setOtpCode] = useState(['5', '8', '2', '4', '9', '1']);
  const [name, setName] = useState('امیرمحمد');
  const [username, setUsername] = useState('amir_echo');
  const [timer, setTimer] = useState(59);

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name: name.trim(),
      username: username.trim().replace(/^@/, ''),
      phoneNumber: `+98 ${phoneNumber}`,
    });
    onSuccess();
  };

  const handleQuickLogin = () => {
    updateUser({
      name: 'امیرمحمد',
      username: 'amir_echo',
      phoneNumber: '+98 912 345 6789',
    });
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-4 selection:bg-cyan-500/30 selection:text-cyan-200 select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Auth Card */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl z-10">
        {/* Brand Lockup */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-xl shadow-cyan-500/20 mb-3">
            <Compass className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h1 className="text-xl font-black text-slate-100 tracking-tight">EchoChat</h1>
          <p className="text-xs text-slate-400 mt-1">
            {isFa ? 'پیام‌رسان هوشمند، امن و بلادرنگ نسل نو' : 'Next-Gen Intelligent Messaging Ecosystem'}
          </p>
        </div>

        {/* Step 1: Phone Number Entry */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="space-y-4 text-xs">
            <div className="text-center mb-2">
              <h3 className="font-bold text-sm text-slate-200">
                {isFa ? 'شماره موبایل خود را وارد کنید' : 'Enter your phone number'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isFa ? 'کد تأیید پیامکی برای این شماره ارسال خواهد شد.' : 'A verification code will be sent to this number.'}
              </p>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                {isFa ? 'شماره تلفن همراه:' : 'Mobile Number:'}
              </label>
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 focus-within:border-cyan-500 transition-colors">
                <div className="flex items-center gap-1.5 border-r rtl:border-r-0 rtl:border-l border-slate-800 pr-2 rtl:pr-0 rtl:pl-2 shrink-0 font-mono text-slate-400 text-xs">
                  <span>🇮🇷</span>
                  <span>+98</span>
                </div>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="912 345 6789"
                  className="flex-1 bg-transparent border-0 text-slate-100 font-mono focus:outline-none focus:ring-0 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
            >
              {isFa ? 'دریافت کد تأیید' : 'Get Verification Code'}
            </button>
          </form>
        )}

        {/* Step 2: SMS Verification OTP */}
        {step === 2 && (
          <form onSubmit={handleNextStep2} className="space-y-4 text-xs">
            <div className="text-center mb-2">
              <h3 className="font-bold text-sm text-slate-200">
                {isFa ? 'کد تأیید پیامک‌شده' : 'Enter Verification Code'}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5" dir="ltr">
                +98 {phoneNumber}
              </p>
            </div>

            {/* OTP Boxes */}
            <div className="flex items-center justify-center gap-2" dir="ltr">
              {otpCode.map((digit, i) => (
                <input
                  key={i}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={e => {
                    const newOtp = [...otpCode];
                    newOtp[i] = e.target.value;
                    setOtpCode(newOtp);
                  }}
                  className="w-10 h-11 text-center bg-slate-950 border border-slate-800 rounded-xl text-base font-bold text-cyan-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
                />
              ))}
            </div>

            <p className="text-center text-[11px] text-slate-500">
              {isFa ? `ارسال مجدد کد پس از ۰۰:${timer}` : `Resend code in 00:${timer}`}
            </p>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
            >
              {isFa ? 'تأیید و ادامه' : 'Verify & Continue'}
            </button>
          </form>
        )}

        {/* Step 3: Profile Setup */}
        {step === 3 && (
          <form onSubmit={handleFinish} className="space-y-4 text-xs">
            <div className="text-center mb-2">
              <h3 className="font-bold text-sm text-slate-200">
                {isFa ? 'تنظیم اطلاعات حساب کاربری' : 'Complete Profile'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isFa ? 'نام و نام کاربری اختصاصی خود را برگزینید.' : 'Choose your display name and handle.'}
              </p>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isFa ? 'نام کامل شما:' : 'Full Name:'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isFa ? 'نام کاربری (@username):' : 'Username (@handle):'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3 text-slate-500">
                  @
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-8 pr-3.5 rtl:pl-3.5 rtl:pr-8 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold transition-all shadow-lg shadow-cyan-600/20 active:scale-95"
            >
              {isFa ? 'ورود به اکوچت' : 'Enter EchoChat'}
            </button>
          </form>
        )}

        {/* Quick Demo Bypass */}
        <div className="mt-5 pt-4 border-t border-slate-800 text-center">
          <button
            onClick={handleQuickLogin}
            type="button"
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1.5 hover:underline"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isFa ? 'ورود سریع به نسخه آزمایشی کامل' : 'Quick Demo Access'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
