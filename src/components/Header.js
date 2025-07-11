import React from 'react';

const Header = ({ onSettingsClick }) => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center">
            🔍 Career Coach AI
            <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full">Content Analysis Expert</span>
          </h1>
          <p className="text-sm opacity-90">Analyze screenshots • Review text • Practice with voice • Get IT interview help</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-xs opacity-75">Multi-Input Analysis</div>
            <div className="text-sm font-medium">📸 Screenshots • 📝 Text • 🎤 Voice</div>
          </div>
          <button
            onClick={onSettingsClick}
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors duration-200"
            title="API Key Settings"
          >
            ⚙️
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
