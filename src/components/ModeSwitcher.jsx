import React from "react";
import { MessageSquare, Image, PenTool } from "lucide-react";

const ModeSwitcher = ({ currentMode, setMode }) => {
  const modes = [
    { id: "chat", label: "Chat", shortLabel: "Chat", icon: MessageSquare },
    { id: "image", label: "Image Generator", shortLabel: "Image", icon: Image },
    {
      id: "creative",
      label: "Creative",
      shortLabel: "Creative",
      icon: PenTool,
    },
  ];

  return (
    <div className="flex justify-center px-2 sm:px-4 pb-2 sm:pb-3 bg-transparent overflow-x-auto">
      <div className="flex bg-white/60 backdrop-blur-sm p-1 sm:p-1.5 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200/50 min-w-max">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = currentMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => setMode(mode.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                isActive
                  ? "bg-linear-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 scale-105"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
              }`}
            >
              <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">{mode.label}</span>
              <span className="sm:hidden">{mode.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ModeSwitcher;
