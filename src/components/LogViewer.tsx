
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useBotDetection } from '@/context/BotDetectionContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Info, AlertTriangle, AlertCircle, Trash2 } from 'lucide-react';

export const LogViewer: React.FC = () => {
  const { logs, clearLogs } = useBotDetection();

  // Get appropriate icon and color based on log level
  const getLogLevelStyles = (level: 'info' | 'warning' | 'error') => {
    switch (level) {
      case 'info':
        return {
          icon: <Info className="h-4 w-4" />,
          color: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          color: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: 'bg-red-500/20 text-red-400 border-red-500/30'
        };
      default:
        return {
          icon: <Info className="h-4 w-4" />,
          color: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
        };
    }
  };

  return (
    <Card className="border border-cyber-primary/30 shadow-lg bg-black/40 backdrop-blur-sm">
      <CardHeader className="bg-cyber-dark border-b border-cyber-primary/30 pb-2 flex flex-row justify-between items-center">
        <CardTitle className="text-md font-semibold text-gray-200">System Logs</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={clearLogs}
          className="h-8 px-2 text-xs border-cyber-primary/40 text-cyber-primary hover:bg-cyber-primary/10"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Clear
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] w-full">
          <div className="p-4 space-y-2">
            {logs.length === 0 ? (
              <div className="text-center text-gray-400 py-4">No logs recorded yet</div>
            ) : (
              logs.slice().reverse().map((log) => {
                const { icon, color } = getLogLevelStyles(log.level);
                return (
                  <div 
                    key={log.id} 
                    className="p-3 rounded-md border backdrop-blur-sm bg-white/5 border-cyber-primary/20"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <Badge 
                          variant="outline" 
                          className={`mr-2 ${color} text-xs capitalize px-2 py-0.5 h-5`}
                        >
                          {icon}
                          <span className="ml-1">{log.level}</span>
                        </Badge>
                        <span className="text-sm font-medium text-gray-200">{log.message}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    {log.data && (
                      <div className="mt-2 text-xs text-gray-400 bg-black/20 p-2 rounded font-mono">
                        {JSON.stringify(log.data, null, 2)}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
