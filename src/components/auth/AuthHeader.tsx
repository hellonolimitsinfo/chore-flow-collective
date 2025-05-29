
import { Home } from "lucide-react";

const AuthHeader = ({ isLogin }: { isLogin: boolean }) => {
  return (
    <div className="text-center mb-8">
      <div className="w-16 h-16 rounded-lg flatmate-gradient flex items-center justify-center mx-auto mb-4">
        <Home className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-2">Flatmate Flow</h1>
      <p className="text-slate-400">
        {isLogin ? "Welcome back!" : "Create your account"}
      </p>
    </div>
  );
};

export default AuthHeader;
