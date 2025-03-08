
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBotDetection } from '@/context/BotDetectionContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ActivityType } from '@/models/BotDetectionTypes';
import { Mouse, Keyboard, Globe, MousePointerClick, ArrowDownUp, FileJson } from 'lucide-react';

const activityIcons: Record<ActivityType, React.ReactNode> = {
  mouseMove: <Mouse className="h-4 w-4 text-sky-400" />,
  keyPress: <Keyboard className="h-4 w-4 text-emerald-400" />,
  pageView: <Globe className="h-4 w-4 text-purple-400" />,
  mouseClick: <MousePointerClick className="h-4 w-4 text-amber-400" />,
  scrollEvent: <ArrowDownUp className="h-4 w-4 text-indigo-400" />,
  formSubmit: <FileJson className="h-4 w-4 text-rose-400" />,
  apiRequest: <Globe className="h-4 w-4 text-red-400" />
};

export const ActivityMonitor: React.FC = () => {
  const { activityHistory } = useBotDetection();

  // Function to format activity data for display
  const formatActivityData = (type: ActivityType, data: any): string => {
    switch (type) {
      case 'mouseMove':
        return `x: ${data.x}, y: ${data.y}`;
      case 'keyPress':
        return `key: ${data.key}`;
      case 'mouseClick':
        return `x: ${data.x}, y: ${data.y}, target: ${data.target}`;
      case 'scrollEvent':
        return `scrollY: ${data.scrollY}`;
      case 'apiRequest':
        if (data.url) return `url: ${data.url}`;
        if (data.message) return `message: ${data.message.substring(0, 20)}...`;
        return JSON.stringify(data).substring(0, 30);
      default:
        return JSON.stringify(data).substring(0, 30);
    }
  };

  return (
    <Card className="border border-cyber-primary/30 shadow-lg bg-black/40 backdrop-blur-sm">
      <CardHeader className="bg-cyber-dark border-b border-cyber-primary/30 pb-2">
        <CardTitle className="text-md font-semibold text-gray-200">Real-time Activity Monitor</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] w-full">
          <div className="p-4 space-y-2">
            {activityHistory.length === 0 ? (
              <div className="text-center text-gray-400 py-4">No activity recorded yet</div>
            ) : (
              activityHistory.slice().reverse().map((activity, index) => (
                <div 
                  key={index} 
                  className="cyber-log-entry flex items-start p-2 backdrop-blur-sm bg-white/5 rounded border border-cyber-primary/20"
                >
                  <div className="mr-3 mt-1">
                    {activityIcons[activity.type]}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-semibold text-cyber-primary">{activity.type}</span>
                      <span className="text-gray-400 text-xs">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-gray-300 text-xs mt-1">
                      {formatActivityData(activity.type, activity.data)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
