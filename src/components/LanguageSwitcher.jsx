import React from 'react';
import { languages, useLanguage } from '../lib/i18n';

function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center space-x-2">
      {Object.values(languages).map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-colors ${
            language === lang.code
              ? 'bg-blue-100 text-blue-700'
              : 'hover:bg-gray-100'
          }`}
          title={lang.name}
        >
          <span className="text-lg">{lang.flag}</span>
          <span className="text-sm font-medium">{lang.code.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}

export default LanguageSwitcher;