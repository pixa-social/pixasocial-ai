import { AuthViewType } from '../../types';
import { HomePageView } from './HomePageView';
import { LoginPageView } from './LoginPageView';
import { RegisterPageView } from './RegisterPageView';
import Header from './Header';
import { Footer } from './Footer';

interface AuthLayoutProps {
  authView: AuthViewType;
  setAuthView: (view: AuthViewType) => void;
  onLoginSuccess: (email: string, password: string) => Promise<void>;
  onRegisterSuccess: (email: string, password: string, name: string) => Promise<void>;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ authView, setAuthView, onLoginSuccess, onRegisterSuccess }) => {

  const renderAuthView = () => {
    switch (authView) {
      case 'login':
        return <LoginPageView setAuthView={setAuthView} onLoginSuccess={onLoginSuccess} />;
      case 'register':
        return <RegisterPageView setAuthView={setAuthView} onRegisterSuccess={onRegisterSuccess} />;
      case 'home':
      default:
        return <HomePageView setAuthView={setAuthView} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-primary to-gray-900 text-white">
      <Header authView={authView} setAuthView={setAuthView} />
      <main>{renderAuthView()}</main>
      <Footer />
    </div>
  );
};
