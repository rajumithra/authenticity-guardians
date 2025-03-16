
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBotDetection } from '@/context/BotDetectionContext';
import { ActivityMonitor } from './ActivityMonitor';
import { LogViewer } from './LogViewer';
import { ScoreCard } from './ScoreCard';
import { BotList } from './BotList';
import { ChatBot } from './ChatBot';
import { Button } from '@/components/ui/button';
import { RefreshCw, ShieldAlert, Activity, Bot, List, Settings } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { currentSession, resetSession, humanScore, securityScore } = useBotDetection();
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Force UI updates more frequently
  useEffect(() => {
    const updateInterval = setInterval(() => {
      setUpdateTrigger(prev => prev + 1);
    }, 150);
    
    return () => clearInterval(updateInterval);
  }, []);

  return (
    <div className="min-h-screen bg-cyber-dark text-white p-6 cyber-grid">
      <header className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold cyber-glow text-cyber-primary">Authenticity Guardian</h1>
            <p className="text-sm md:text-base text-gray-300">AI-Powered Bot Detection & Prevention System</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetSession}
              className="border-cyber-primary/40 text-cyber-primary hover:bg-cyber-primary/10"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset Session
            </Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ScoreCard 
              title="Human Score" 
              score={humanScore} 
              type="human"
              icon={<Activity className="h-5 w-5 text-emerald-500" />}
              key={`human-${updateTrigger}`}
            />
            
            <ScoreCard 
              title="Bot Score" 
              score={currentSession ? currentSession.botScore.total : 0} 
              type="bot"
              icon={<Bot className="h-5 w-5 text-amber-500" />}
              key={`bot-${updateTrigger}`}
            />
            
            <ScoreCard 
              title="Security Status" 
              score={securityScore} 
              type="security"
              icon={<ShieldAlert className="h-5 w-5 text-sky-500" />}
              key={`security-${updateTrigger}`}
            />
          </div>

          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-cyber-dark border border-cyber-primary/30">
              <TabsTrigger value="activity" className="data-[state=active]:bg-cyber-primary/20 data-[state=active]:shadow-none">
                <Activity className="mr-2 h-4 w-4" />
                Activity
              </TabsTrigger>
              <TabsTrigger value="logs" className="data-[state=active]:bg-cyber-primary/20 data-[state=active]:shadow-none">
                <List className="mr-2 h-4 w-4" />
                Logs
              </TabsTrigger>
              <TabsTrigger value="bots" className="data-[state=active]:bg-cyber-primary/20 data-[state=active]:shadow-none">
                <Bot className="mr-2 h-4 w-4" />
                Blocked Bots
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="activity" className="mt-4">
              <ActivityMonitor />
            </TabsContent>
            
            <TabsContent value="logs" className="mt-4">
              <LogViewer />
            </TabsContent>
            
            <TabsContent value="bots" className="mt-4">
              <BotList />
            </TabsContent>
          </Tabs>

          <Card className="cyber-card">
            <CardHeader className="bg-cyber-dark border-b border-cyber-primary/30 pb-2">
              <CardTitle className="text-md font-semibold text-gray-200 flex items-center">
                <Settings className="mr-2 h-4 w-4 text-cyber-primary" />
                Current Session Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-sm space-y-2">
              {currentSession ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p><span className="text-gray-400">Session ID:</span> {currentSession.id.substring(0, 8)}...</p>
                    <p><span className="text-gray-400">IP Address:</span> {currentSession.ip}</p>
                    <p><span className="text-gray-400">Start Time:</span> {new Date(currentSession.startTime).toLocaleString()}</p>
                    <p><span className="text-gray-400">Status:</span> {currentSession.isBlocked ? 
                      <span className="text-cyber-danger font-semibold">Blocked</span> : 
                      <span className="text-emerald-500 font-semibold">Active</span>
                    }</p>
                  </div>
                  <div>
                    <p><span className="text-gray-400">Browser:</span> {currentSession.device.browser}</p>
                    <p><span className="text-gray-400">OS:</span> {currentSession.device.os}</p>
                    <p><span className="text-gray-400">Device:</span> {currentSession.device.device}</p>
                    <p><span className="text-gray-400">Bot Type:</span> {currentSession.botType ? 
                      <span className="text-cyber-danger font-semibold capitalize">{currentSession.botType}</span> : 
                      <span className="text-gray-400">Not detected</span>
                    }</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">No active session</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <ChatBot />
        </div>
      </div>
    </div>
  );
};
