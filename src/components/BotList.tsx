
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBotDetection } from '@/context/BotDetectionContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { BotType } from '@/models/BotDetectionTypes';
import { Bot, Search, MessageSquare, Shield, Zap, HelpCircle } from 'lucide-react';

// Bot type icons
const botTypeIcons: Record<BotType, React.ReactNode> = {
  scraper: <Search className="h-4 w-4" />,
  crawler: <Bot className="h-4 w-4" />,
  spamBot: <MessageSquare className="h-4 w-4" />,
  chatBot: <MessageSquare className="h-4 w-4" />,
  ddosBot: <Zap className="h-4 w-4" />,
  unknown: <HelpCircle className="h-4 w-4" />
};

// Bot type colors
const botTypeColors: Record<BotType, string> = {
  scraper: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  crawler: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  spamBot: 'bg-red-500/20 text-red-400 border-red-500/30',
  chatBot: 'bg-green-500/20 text-green-400 border-green-500/30',
  ddosBot: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  unknown: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
};

export const BotList: React.FC = () => {
  const { blockedBots } = useBotDetection();

  return (
    <Card className="border border-cyber-primary/30 shadow-lg bg-black/40 backdrop-blur-sm">
      <CardHeader className="bg-cyber-dark border-b border-cyber-primary/30 pb-2">
        <CardTitle className="text-md font-semibold text-gray-200 flex items-center">
          <Shield className="h-4 w-4 mr-2 text-cyber-primary" />
          Blocked Bots
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] w-full">
          <div className="p-4 space-y-4">
            {blockedBots.length === 0 ? (
              <div className="text-center text-gray-400 py-4">No bots have been blocked yet</div>
            ) : (
              blockedBots.slice().reverse().map((bot) => (
                <Card key={bot.sessionId} className="bg-white/5 backdrop-blur-sm border border-cyber-primary/20">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <Badge 
                          variant="outline" 
                          className={`${botTypeColors[bot.botType]} mb-2`}
                        >
                          {botTypeIcons[bot.botType]}
                          <span className="ml-1 capitalize">{bot.botType}</span>
                        </Badge>
                        <h3 className="text-sm font-semibold text-white">Session ID: {bot.sessionId.substring(0, 8)}...</h3>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(bot.timeBlocked).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-300">
                      <div>
                        <p><span className="text-gray-400">IP:</span> {bot.ip}</p>
                        <p><span className="text-gray-400">User Agent:</span> {bot.userAgent.substring(0, 40)}...</p>
                        <p><span className="text-gray-400">Reason:</span> {bot.reason}</p>
                      </div>
                      <div>
                        <p><span className="text-gray-400">Bot Score:</span> {bot.botScore.total}</p>
                        <p><span className="text-gray-400">Mouse Pattern:</span> {bot.botScore.mouseMovement}</p>
                        <p><span className="text-gray-400">Keyboard Pattern:</span> {bot.botScore.keyboardPattern}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
