import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { UserSession, BotScore, UserActivity, BlockedBot, LogEntry, BotType } from '../models/BotDetectionTypes';
import { detectBotType, analyzeUserBehavior } from '../utils/botDetection';
import { toast } from '@/hooks/use-toast';

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
  humanScore: number;
  securityScore: number;
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
  humanScore: 60,
  securityScore: 70,
});

export const useBotDetection = () => useContext(BotDetectionContext);

const initialBotScore: BotScore = {
  total: 0,
  mouseMovement: 0,
  keyboardPattern: 0,
  navigationPattern: 0,
  requestPattern: 0,
  timePattern: 0,
};

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

const FIXED_IP = '192.168.1.101';
const FIXED_SESSION_ID = '92a7f632-c8f2-45bc-b10a-3f36b51c8751';

const BOT_SCORE_THRESHOLD = 60;

export const BotDetectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentSession, setCurrentSession] = useState<UserSession | null>(null);
  const [blockedBots, setBlockedBots] = useState<BlockedBot[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activityHistory, setActivityHistory] = useState<UserActivity[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [mouseMovementCount, setMouseMovementCount] = useState(0);
  const [recentApiRequests, setRecentApiRequests] = useState<number>(0);
  const [humanScore, setHumanScore] = useState(60);
  const [securityScore, setSecurityScore] = useState(70);
  const [scoreUpdateCounter, setScoreUpdateCounter] = useState(0);

  useEffect(() => {
    initSession();
    
    const handleMouseMove = (e: MouseEvent) => {
      if (currentSession && !isBlocked) {
        setMouseMovementCount(prev => {
          if (prev >= 4) {
            recordActivity({
              type: 'mouseMove',
              data: { x: e.clientX, y: e.clientY }
            });
            return 0;
          }
          return prev + 1;
        });
      }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      if (currentSession && !isBlocked) {
        recordActivity({
          type: 'keyPress',
          data: { key: e.key, timeStamp: e.timeStamp }
        });
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (currentSession && !isBlocked) {
        recordActivity({
          type: 'mouseClick',
          data: { x: e.clientX, y: e.clientY, target: (e.target as Element).tagName }
        });
      }
    };

    const handleScroll = () => {
      if (currentSession && !isBlocked) {
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
  }, [currentSession, isBlocked]);

  useEffect(() => {
    const scoreUpdateInterval = setInterval(() => {
      setScoreUpdateCounter(prev => prev + 1);
    }, 350);
    
    return () => clearInterval(scoreUpdateInterval);
  }, []);

  useEffect(() => {
    if (!currentSession || isBlocked) return;

    const updateSession = () => {
      setCurrentSession(prevSession => {
        if (!prevSession) return null;

        const updatedScore = analyzeUserBehavior(prevSession);
        
        const botType = detectBotType(updatedScore);
        const shouldBlock = updatedScore.total > BOT_SCORE_THRESHOLD;

        if (recentApiRequests > 3) {
          updatedScore.requestPattern = Math.min(100, updatedScore.requestPattern + 15);
          updatedScore.total = Math.round(
            (updatedScore.mouseMovement * 0.15) +
            (updatedScore.keyboardPattern * 0.15) +
            (updatedScore.navigationPattern * 0.15) +
            (updatedScore.requestPattern * 0.45) +
            (updatedScore.timePattern * 0.10)
          );
        }

        if (shouldBlock && !prevSession.isBlocked) {
          setTimeout(() => {
            blockBot(prevSession.id, `High bot score: ${updatedScore.total}`);
          }, 0);
        }

        setHumanScore(Math.max(0, Math.min(100, 100 - updatedScore.total)));
        
        setSecurityScore(prev => {
          if (updatedScore.total > 50) {
            return Math.max(0, prev - 5);
          } else if (updatedScore.total < 30) {
            return Math.min(100, prev + 2);
          } else {
            return prev;
          }
        });

        return {
          ...prevSession,
          botScore: updatedScore,
          lastActive: Date.now(),
          botType: botType
        };
      });

      setRecentApiRequests(0);
    };

    updateSession();
    
    const updateInterval = setInterval(() => {
      updateSession();
    }, 500);

    return () => clearInterval(updateInterval);
  }, [currentSession, recentApiRequests, isBlocked, scoreUpdateCounter]);

  const initSession = () => {
    const newSession: UserSession = {
      id: FIXED_SESSION_ID,
      ip: FIXED_IP,
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
    setHumanScore(60);
    setSecurityScore(70);
    addLog('info', `New session started: ${FIXED_SESSION_ID}`);
  };

  const recordActivity = (activity: Omit<UserActivity, 'timestamp'>) => {
    if (!currentSession || isBlocked) return;

    const newActivity: UserActivity = {
      ...activity,
      timestamp: Date.now()
    };

    setCurrentSession(prevSession => {
      if (!prevSession) return null;
      if (prevSession.isBlocked) return prevSession;

      const updatedActivities = [...prevSession.activities, newActivity];
      const limitedActivities = updatedActivities.slice(-200);

      if (activity.type === 'apiRequest') {
        const requestData = activity.data;
        
        setRecentApiRequests(prev => prev + 1);
        
        const isKitsScraping = 
          (requestData.url && typeof requestData.url === 'string' && requestData.url.includes('kitsguntur.ac.in')) ||
          (requestData.message && typeof requestData.message === 'string' && 
            (requestData.message.toLowerCase().includes('kits') || 
             requestData.message.toLowerCase().includes('kakinada')));
            
        if (isKitsScraping) {
          addLog('warning', `KITS Guntur scraping blocked: ${requestData.url || requestData.message}`, requestData);
          
          setTimeout(() => {
            blockBot(FIXED_SESSION_ID, `KITS Guntur website scraping blocked`);
          }, 0);
          
          return {
            ...prevSession,
            activities: limitedActivities,
            isBlocked: true,
            lastActive: Date.now()
          };
        }
      }

      if (activity.type === 'mouseMove') {
        setHumanScore(prev => Math.min(100, prev + 0.8));
      } else if (activity.type === 'keyPress') {
        setHumanScore(prev => Math.min(100, prev + 1.2));
      } else if (activity.type === 'mouseClick') {
        setHumanScore(prev => Math.min(100, prev + 1.5));
      } else if (activity.type === 'apiRequest') {
        const requestData = activity.data;
        const isScraping = requestData.action === 'scrape' || 
                           requestData.action === 'rapid-scrape' ||
                           requestData.action === 'repetitive-access';
        
        if (isScraping) {
          setHumanScore(prev => Math.max(0, prev - 3));
        } else {
          setHumanScore(prev => Math.max(0, prev - 1.5));
        }
      } else if (activity.type === 'scrollEvent') {
        setHumanScore(prev => Math.min(100, prev + 0.5));
      }

      if (activity.type === 'apiRequest') {
        const requestData = activity.data;
        const isScraping = requestData.action === 'scrape' || 
                           requestData.action === 'rapid-scrape' ||
                           requestData.action === 'repetitive-access';
        
        if (isScraping) {
          setSecurityScore(prev => Math.max(0, prev - 2));
        } else {
          setSecurityScore(prev => Math.max(0, prev - 1));
        }
      } else {
        if (Math.random() > 0.65) {
          setSecurityScore(prev => Math.min(100, prev + 0.7));
        }
      }

      return {
        ...prevSession,
        activities: limitedActivities,
        lastActive: Date.now()
      };
    });

    setActivityHistory(prev => [...prev, newActivity].slice(-50));

    if (activity.type === 'apiRequest') {
      const requestData = activity.data;
      
      const isKitsScraping = 
        (requestData.url && typeof requestData.url === 'string' && requestData.url.includes('kitsguntur.ac.in')) ||
        (requestData.message && typeof requestData.message === 'string' && 
          (requestData.message.toLowerCase().includes('kits') || 
           requestData.message.toLowerCase().includes('kakinada')));
           
      if (isKitsScraping) {
        addLog('warning', `KITS Guntur scraping attempt blocked: ${requestData.url || requestData.message}`, requestData);
      } else if (requestData.action === 'scrape' || requestData.action === 'rapid-scrape') {
        addLog('warning', `Web scraping detected: ${requestData.url || 'Unknown URL'}`, requestData);
      }
    }
  };

  const blockBot = (sessionId: string, reason: string) => {
    if (isBlocked) return;

    setIsBlocked(true);
    
    setCurrentSession(prevSession => {
      if (!prevSession) return null;
      
      const botType = prevSession.botType || detectBotType(prevSession.botScore);
      
      setBlockedBots(prev => {
        if (prev.some(bot => bot.sessionId === sessionId)) {
          return prev;
        }
        
        const blockedBot: BlockedBot = {
          sessionId,
          ip: prevSession.ip,
          userAgent: prevSession.userAgent,
          botScore: prevSession.botScore,
          botType: botType as BotType,
          timeBlocked: Date.now(),
          reason
        };
        
        return [...prev, blockedBot];
      });
      
      addLog('warning', `Bot blocked: ${sessionId}`, {
        reason,
        botScore: prevSession.botScore
      });
      
      setSecurityScore(prev => Math.max(0, prev - 20));
      
      return {
        ...prevSession,
        isBlocked: true,
        botType: botType
      };
    });
    
    setTimeout(() => {
      toast({
        title: "Bot Activity Detected!",
        description: `A bot has been blocked. Reason: ${reason}`,
        variant: "destructive",
        duration: 5000,
      });
    }, 10);
  };

  const resetSession = () => {
    initSession();
    setRecentApiRequests(0);
    addLog('info', 'Session reset by user');
  };

  const addLog = (level: 'info' | 'warning' | 'error', message: string, data?: any) => {
    const newLog: LogEntry = {
      id: uuidv4(),
      timestamp: Date.now(),
      level,
      message,
      data
    };
    
    setLogs(prev => [...prev, newLog].slice(-100));
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
        clearLogs,
        humanScore,
        securityScore
      }}
    >
      {children}
    </BotDetectionContext.Provider>
  );
};
