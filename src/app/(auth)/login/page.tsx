import { LoginForm } from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar p-4">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 p-8 shadow-2xl ring-1 ring-slate-800">
        <div className="mb-6 flex items-center gap-2">
          <span className="text-4xl font-extrabold text-logo">K</span>
          <div>
            <div className="text-xl font-semibold text-white">Kootu</div>
            <div className="text-xs text-slate-400">Admin Console</div>
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
