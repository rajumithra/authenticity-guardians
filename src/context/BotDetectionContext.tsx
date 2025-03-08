
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { UserSession, BotScore, UserActivity, BlockedBot, LogEntry, BotType } from '../models/BotDetectionTypes';
import { detectBotType, analyzeUserBehavior } from '../utils/botDetection';
import { toast } from '@/components/ui/use-toast';

interface BotDetectionContextType {
  currentSession: UserSession | null;
  blockedBots: BlockedBot[];
  logs: LogEntry[];
  activityHistory: UserActivity[];
  recordActivity: (activity: Omit<UserActivity, 'timestamp'>) => void;
  blockBot: (sessionId: string, reason: string) => void;
  isBlocked: boolean;
  resetSession: () => void;
  clearLogs: () => void;
}

const BotDetectionContext = createContext<BotDetectionContextType>({
  currentSession: null,
  blockedBots: [],
  logs: [],
  activityHistory: [],
  recordActivity: () => {},
  blockBot: () => {},
  isBlocked: false,
  resetSession: () => {},
  clearLogs: () => {},
});

export const useBotDetection = () => useContext(BotDetectionContext);

// Initial bot score
const initialBotScore: BotScore = {
  total: 0,
  mouseMovement: 0,
  keyboardPattern: 0,
  navigationPattern: 0,
  requestPattern: 0,
  timePattern: 0,
};

// Get device info
const getDeviceInfo = () => {
  return {
    browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Other',
    os: navigator.platform,
    device: /mobile|android|iphone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
    screenSize: {
      width: window.screen.width,
      height: window.screen.height,
    },
  };
};

// Create a fixed fake IP to prevent changing
const FIXED_IP = '192.168.1.101';
// Create a fixed session ID to prevent changing
const FIXED_SESSION_ID = '92a7f632-c8f2-45bc-b10a-3f36b51c8751';

export const BotDetectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentSession, setCurrentSession] = useState<UserSession | null>(null);
  const [blockedBots, setBlockedBots] = useState<BlockedBot[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activityHistory, setActivityHistory] = useState<UserActivity[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);

  // Initialize session
  useEffect(() => {
    initSession();
    
    // Listen for mouse movements
    const handleMouseMove = (e: MouseEvent) => {
      if (currentSession && !currentSession.isBlocked) {
        recordActivity({
          type: 'mouseMove',
          data: { x: e.clientX, y: e.clientY }
        });
      }
    };

    // Listen for key presses
    const handleKeyPress = (e: KeyboardEvent) => {
      if (currentSession && !currentSession.isBlocked) {
        recordActivity({
          type: 'keyPress',
          data: { key: e.key, timeStamp: e.timeStamp }
        });
      }
    };

    // Listen for clicks
    const handleClick = (e: MouseEvent) => {
      if (currentSession && !currentSession.isBlocked) {
        recordActivity({
          type: 'mouseClick',
          data: { x: e.clientX, y: e.clientY, target: (e.target as Element).tagName }
        });
      }
    };

    // Listen for scroll events
    const handleScroll = () => {
      if (currentSession && !currentSession.isBlocked) {
        recordActivity({
          type: 'scrollEvent',
          data: { 
            scrollY: window.scrollY,
            scrollX: window.scrollX,
            maxScroll: document.body.scrollHeight - window.innerHeight
          }
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [currentSession]);

  // Update bot score every second based on activity
  useEffect(() => {
    if (!currentSession || currentSession.isBlocked) return;

    const updateInterval = setInterval(() => {
      setCurrentSession(prevSession => {
        if (!prevSession) return null;

        // Analyze behavior based on recent activities
        const updatedScore = analyzeUserBehavior(prevSession);
        
        // Detect if this is a bot
        const botType = detectBotType(updatedScore);
        const shouldBlock = updatedScore.total > 75;

        if (shouldBlock && !prevSession.isBlocked) {
          blockBot(prevSession.id, `High bot score: ${updatedScore.total}`);
        }

        return {
          ...prevSession,
          botScore: updatedScore,
          lastActive: Date.now(),
          botType: botType
        };
      });
    }, 1000);

    return () => clearInterval(updateInterval);
  }, [currentSession]);

  const initSession = () => {
    // Use fixed session ID instead of generating a new one
    const newSession: UserSession = {
      id: FIXED_SESSION_ID,
      ip: FIXED_IP, // Use fixed IP
      userAgent: navigator.userAgent,
      startTime: Date.now(),
      lastActive: Date.now(),
      activities: [],
      botScore: initialBotScore,
      isBlocked: false,
      botType: null,
      device: getDeviceInfo()
    };

    setCurrentSession(newSession);
    setIsBlocked(false);
    addLog('info', `New session started: ${FIXED_SESSION_ID}`);
  };

  const recordActivity = (activity: Omit<UserActivity, 'timestamp'>) => {
    if (!currentSession || isBlocked) return;

    const newActivity: UserActivity = {
      ...activity,
      timestamp: Date.now()
    };

    // Update current session with new activity
    setCurrentSession(prevSession => {
      if (!prevSession) return null;
      
      const updatedActivities = [...prevSession.activities, newActivity].slice(-100); // Keep last 100 activities
      
      return {
        ...prevSession,
        activities: updatedActivities,
        lastActive: Date.now()
      };
    });

    // Add to activity history
    setActivityHistory(prev => [...prev, newActivity].slice(-50)); // Keep last 50 for display
  };

  const blockBot = (sessionId: string, reason: string) => {
    if (!currentSession) return;

    setIsBlocked(true);
    setCurrentSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        isBlocked: true
      };
    });

    // Add to blocked bots list
    if (currentSession) {
      const blockedBot: BlockedBot = {
        sessionId,
        ip: currentSession.ip,
        userAgent: currentSession.userAgent,
        botScore: currentSession.botScore,
        botType: (currentSession.botType || 'unknown') as BotType,
        timeBlocked: Date.now(),
        reason
      };
      
      setBlockedBots(prev => [...prev, blockedBot]);
      
      addLog('warning', `Bot blocked: ${sessionId}`, {
        reason,
        botScore: currentSession.botScore
      });

      toast({
        title: "Bot Activity Detected!",
        description: `A bot has been blocked. Reason: ${reason}`,
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const resetSession = () => {
    initSession();
  };

  const addLog = (level: 'info' | 'warning' | 'error', message: string, data?: any) => {
    const newLog: LogEntry = {
      id: uuidv4(),
      timestamp: Date.now(),
      level,
      message,
      data
    };
    
    setLogs(prev => [...prev, newLog].slice(-100)); // Keep last 100 logs
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('info', 'Logs cleared');
  };

  return (
    <BotDetectionContext.Provider
      value={{
        currentSession,
        blockedBots,
        logs,
        activityHistory,
        recordActivity,
        blockBot,
        isBlocked,
        resetSession,
        clearLogs
      }}
    >
      {children}
    </BotDetectionContext.Provider>
  );
};
