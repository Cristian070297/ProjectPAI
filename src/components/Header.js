import React from 'react';

const Header = ({ onSettingsClick }) => {
  return (
    <div className="p-4">
      <div className="flex items-center justify-end">
        <button
          onClick={onSettingsClick}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-lg transition-colors duration-200"
          title="API Key Settings"
        >
          ⚙️
        </button>
      </div>
    </div>
  );
};

export default Header;
