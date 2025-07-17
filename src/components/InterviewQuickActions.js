import React from 'react';

const InterviewQuickActions = ({ onQuickAction, isLoading }) => {
  const quickActions = [
    {
      category: "Problem Solving",
      icon: "🧠",
      color: "bg-blue-100 border-blue-300 hover:bg-blue-200",
      actions: [
        { label: "Code Challenge (Screenshot)", mode: "code_challenge_screenshot", prompt: "I'll take a screenshot of a coding problem. Please analyze it, provide multiple solution approaches, explain the logic step-by-step, and give me interview tips for presenting the solution." },
        { label: "Algorithm Challenge (Text)", mode: "algorithm_challenge_text", prompt: "I'll paste a coding interview question. Please provide multiple solution approaches with time/space complexity analysis, edge cases, and optimization strategies." },
        { label: "Debug My Code", mode: "debug_code", prompt: "I'll share code that has issues (screenshot or text). Please help me debug it, explain what's wrong, and suggest improvements with interview-quality explanations." }
      ]
    },
    {
      category: "Technical Explanation",
      icon: "📚",
      color: "bg-green-100 border-green-300 hover:bg-green-200",
      actions: [
        { label: "System Design Analysis", mode: "system_design_analysis", prompt: "I'll share a system design diagram or architecture. Please explain it in detail, discuss trade-offs, and relate it to common interview scenarios." },
        { label: "Technical Concept Deep Dive", mode: "technical_concept_deep_dive", prompt: "I'll ask about a specific technical concept (APIs, databases, security, etc.). Please explain it clearly with examples and interview relevance." },
        { label: "Code Review & Optimization", mode: "code_review_optimization", prompt: "I'll share my code solution. Please review it for best practices, suggest optimizations, and help me explain it like in a technical interview." }
      ]
    },
    {
      category: "Mock Interview Practice",
      icon: "🎙️",
      color: "bg-purple-100 border-purple-300 hover:bg-purple-200",
      actions: [
        { label: "Technical Interview Simulation", mode: "technical_interview_simulation", prompt: "Let's start a mock technical interview. Ask me coding questions, system design problems, or technical concepts. I'll respond and you provide feedback." },
        { label: "Behavioral Interview Practice", mode: "behavioral_interview_practice", prompt: "Let's practice behavioral questions using the STAR method. Ask me common questions and help me structure better answers." },
        { label: "Live Problem Solving", mode: "live_problem_solving", prompt: "Walk me through solving a coding problem step-by-step. I'll explain my thinking process and you help me communicate more effectively." }
      ]
    },
    {
      category: "Career Development",
      icon: "🚀",
      color: "bg-yellow-100 border-yellow-300 hover:bg-yellow-200",
      actions: [
        { label: "Resume & Portfolio Review", mode: "resume_portfolio_review", prompt: "I'll share my resume or portfolio content. Please review it for technical roles and suggest improvements to highlight relevant experience." },
        { label: "Job Posting Analysis", mode: "job_posting_analysis", prompt: "I'll share a job posting. Please analyze the requirements, identify key skills needed, and suggest how to prepare for this specific role." },
        { label: "Interview Answer Optimization", mode: "interview_answer_optimization", prompt: "I'll share my prepared answers to common interview questions. Please review and suggest improvements for better impact and clarity." }
      ]
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        🤖 Multi-Modal AI Assistant
        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Problem Solving & Interview Prep</span>
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
        💡 <strong>How it works:</strong> Choose any input method (screenshot, text, or voice) → I'll analyze your content and provide real-time problem solving, technical explanations, and interview coaching!
      </div>
    </div>
  );
};

export default InterviewQuickActions;
