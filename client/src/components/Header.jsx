import React from 'react';
import { useTranslation } from 'react-i18next';
import { logout } from '../utils/api';
import './Header.css';

const Header = ({ title, subtitle, user }) => {
  const { t } = useTranslation();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="header">
      <h1>🔊 {title}</h1>
      {subtitle && <p>{subtitle}</p>}
      <div className="user-section">
        {user ? (
          <>
            <span className="user-greeting" dangerouslySetInnerHTML={{ 
              __html: t('user.greeting', { 
                interpolation: { escapeValue: false },
                callsign: `<a href="/profile" class="user-callsign" style="text-decoration: none;">${user.callsign}</a>` 
              })
            }} />
            <a href="/advanced" className="auth-link">{t('user.advancedFunctions')}</a>
            <button onClick={handleLogout} className="auth-link logout">{t('user.logoutButton')}</button>
          </>
        ) : (
          <>
            <a href="/login" className="auth-link">{t('user.loginButton')}</a>
            <a href="/register" className="auth-link secondary">{t('user.registerButton')}</a>
            <div className="promo-box">
              <p>✨ {t('user.advancedFunctionsPromo')}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Header;
