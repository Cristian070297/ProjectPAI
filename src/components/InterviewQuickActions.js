import React from 'react';

const InterviewQuickActions = ({ onQuickAction, isLoading }) => {
  const quickActions = [
    {
      category: "Screenshot Analysis",
      icon: "�",
      color: "bg-blue-100 border-blue-300 hover:bg-blue-200",
      actions: [
        { label: "Analyze Coding Problem", prompt: "I'll take a screenshot of a coding problem. Please analyze it and provide a step-by-step solution with explanation of the approach, complexity, and interview tips." },
        { label: "Review Job Posting", prompt: "I'll share a screenshot of a job posting. Please analyze the requirements, highlight key skills needed, and suggest how to prepare for this specific role." },
        { label: "Explain Technical Diagram", prompt: "I'll show you a technical diagram or system architecture. Please explain what it represents and how it might come up in system design interviews." }
      ]
    },
    {
      category: "Text Analysis",
      icon: "�",
      color: "bg-green-100 border-green-300 hover:bg-green-200",
      actions: [
        { label: "Solve Code Challenge", prompt: "I'll paste a coding interview question. Please provide multiple solution approaches with time/space complexity analysis and interview tips." },
        { label: "Review My Answer", prompt: "I'll share my answer to an interview question. Please review it and provide feedback on how to improve it for actual interviews." },
        { label: "Explain Technical Concept", prompt: "I'll ask about a specific technical concept. Please explain it clearly with examples and how it relates to interview questions." }
      ]
    },
    {
      category: "Voice Practice",
      icon: "�",
      color: "bg-purple-100 border-purple-300 hover:bg-purple-200",
      actions: [
        { label: "Technical Question Practice", prompt: "I'll ask technical questions using voice. Please provide clear, structured answers that I can practice speaking aloud." },
        { label: "Code Explanation Practice", prompt: "I'll describe a coding problem verbally. Please help me practice explaining my solution approach clearly and concisely." },
        { label: "Mock Interview Mode", prompt: "Let's start a voice-based mock interview. Ask me questions and I'll respond verbally, then provide feedback on my answers." }
      ]
    },
    {
      category: "Content Review",
      icon: "🔍",
      color: "bg-yellow-100 border-yellow-300 hover:bg-yellow-200",
      actions: [
        { label: "Resume Analysis", prompt: "I'll share my resume content (text or screenshot). Please review it for IT roles and suggest improvements to highlight relevant skills and experience." },
        { label: "Portfolio Review", prompt: "I'll describe or show my portfolio projects. Please provide feedback on how to present them effectively in interviews." },
        { label: "Interview Answer Review", prompt: "I'll share my prepared answers to common interview questions. Please review and suggest improvements for better impact." }
      ]
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        � Content Analysis & Interview Help
        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Choose input method</span>
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quickActions.map((category, categoryIndex) => (
          <div key={categoryIndex} className={`rounded-lg border-2 p-4 ${category.color}`}>
            <h4 className="font-medium text-gray-800 mb-3 flex items-center">
              <span className="mr-2">{category.icon}</span>
              {category.category}
            </h4>
            <div className="space-y-2">
              {category.actions.map((action, actionIndex) => (
                <button
                  key={actionIndex}
                  onClick={() => onQuickAction(action.prompt)}
                  disabled={isLoading}
                  className="w-full text-left px-3 py-2 text-sm bg-white rounded border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-xs text-gray-600 text-center">
        💡 <strong>How it works:</strong> Choose your input method (screenshot, text, or voice), then I'll analyze your content and provide detailed IT interview guidance!
      </div>
    </div>
  );
};

export default InterviewQuickActions;
