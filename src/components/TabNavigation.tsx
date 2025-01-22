import { Layout, Users, MessageSquare } from 'lucide-react';

interface TabNavigationProps {
  activeTab: 'colleges' | 'applicants' | 'chat';
  onTabChange: (tab: 'colleges' | 'applicants' | 'chat') => void;
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="bg-white border-b">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex gap-1">
          <button
            onClick={() => onTabChange('colleges')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 ${
              activeTab === 'colleges'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Layout className="w-4 h-4" />
            Colleges
          </button>
          <button
            onClick={() => onTabChange('applicants')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 ${
              activeTab === 'applicants'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Applicants
          </button>
          <button
            onClick={() => onTabChange('chat')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 ${
              activeTab === 'chat'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </button>
        </div>
      </div>
    </div>
  );
}