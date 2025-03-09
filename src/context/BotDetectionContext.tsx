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

// Bot detection thresholds - LOWERED
const BOT_SCORE_THRESHOLD = 60; // Lowered from 70 to 60

export const BotDetectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentSession, setCurrentSession] = useState<UserSession | null>(null);
  const [blockedBots, setBlockedBots] = useState<BlockedBot[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activityHistory, setActivityHistory] = useState<UserActivity[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [mouseMovementCount, setMouseMovementCount] = useState(0);
  const [recentApiRequests, setRecentApiRequests] = useState<number>(0);

  // Initialize session
  useEffect(() => {
    initSession();
    
    // Listen for mouse movements
    const handleMouseMove = (e: MouseEvent) => {
      if (currentSession && !currentSession.isBlocked) {
        // Only record every 5th mouse movement to avoid flooding
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

  // Update bot score more frequently for faster detection
  useEffect(() => {
    if (!currentSession || currentSession.isBlocked) return;

    const updateInterval = setInterval(() => {
      setCurrentSession(prevSession => {
        if (!prevSession) return null;

        // Analyze behavior based on recent activities
        const updatedScore = analyzeUserBehavior(prevSession);
        
        // Detect if this is a bot
        const botType = detectBotType(updatedScore);
        const shouldBlock = updatedScore.total > BOT_SCORE_THRESHOLD;

        // If rapid API requests detected in a short time, increase the score even more
        if (recentApiRequests > 3) { // Reduced threshold from 5 to 3
          updatedScore.requestPattern = Math.min(100, updatedScore.requestPattern + 15); // Increased from 10 to 15
          updatedScore.total = Math.round(
            (updatedScore.mouseMovement * 0.15) + // Decreased from 0.20 to 0.15
            (updatedScore.keyboardPattern * 0.15) + // Decreased from 0.20 to 0.15
            (updatedScore.navigationPattern * 0.15) + // Kept the same
            (updatedScore.requestPattern * 0.45) + // Increased weight from 0.35 to 0.45
            (updatedScore.timePattern * 0.10)
          );
        }

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

      // Reset recent API requests counter
      setRecentApiRequests(0);
    }, 800); // Reduced from 1000ms to 800ms for more frequent updates

    return () => clearInterval(updateInterval);
  }, [currentSession, recentApiRequests]);

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
      
      // Keep a limited number of activities to avoid memory issues
      const updatedActivities = [...prevSession.activities, newActivity];
      const limitedActivities = updatedActivities.slice(-200); // Keep last 200 activities
      
      // Special handling for API requests - they increase bot score more rapidly
      let rapidUpdatedScore = {...prevSession.botScore};
      if (activity.type === 'apiRequest') {
        const requestData = activity.data;
        
        // Track API requests for short-term burst detection
        setRecentApiRequests(prev => prev + 1);
        
        // Enhanced detection for website scraping
        const isScraping = 
          requestData.action === 'scrape' || 
          requestData.action === 'rapid-scrape' || 
          requestData.action === 'repetitive-access' ||
          (requestData.url && typeof requestData.url === 'string' && 
           (requestData.url.includes('kitsguntur.ac.in') || 
            requestData.url.includes('www.') || 
            requestData.url.startsWith('http')));
            
        if (isScraping) {
          // Much more aggressive scoring for detected scraping
          rapidUpdatedScore.requestPattern = Math.min(100, rapidUpdatedScore.requestPattern + 15); // Increased from 8 to 15
          
          // If aggressive scraping detected, immediately elevate the score 
          if (requestData.action === 'rapid-scrape' || 
              requestData.type === 'suspiciousRapidFire' ||
              (Array.isArray(limitedActivities) && 
               limitedActivities.filter(a => 
                 a.type === 'apiRequest' && 
                 a.timestamp > Date.now() - 5000
               ).length > 5)) {
            rapidUpdatedScore.requestPattern = Math.min(100, rapidUpdatedScore.requestPattern + 25); // Increased from 15 to 25
          }
          
          // Recalculate the total score with more weight on the request pattern
          rapidUpdatedScore.total = Math.round(
            (rapidUpdatedScore.mouseMovement * 0.15) + 
            (rapidUpdatedScore.keyboardPattern * 0.15) + 
            (rapidUpdatedScore.navigationPattern * 0.15) + 
            (rapidUpdatedScore.requestPattern * 0.45) + 
            (rapidUpdatedScore.timePattern * 0.10)
          );
          
          // Log the scraping activity
          addLog('warning', `Potential scraping detected: ${requestData.url || 'API request'}`, requestData);
          
          // If the score is high enough, block immediately for aggressive scraping
          if (rapidUpdatedScore.total > BOT_SCORE_THRESHOLD - 10 || rapidUpdatedScore.requestPattern > 70) { // Lowered from 80 to 70
            setTimeout(() => {
              blockBot(FIXED_SESSION_ID, `Aggressive scraping detected`);
            }, 200); // Reduced from 500 to 200ms for faster blocking
          }
        }
      }
      
      return {
        ...prevSession,
        activities: limitedActivities,
        lastActive: Date.now(),
        botScore: rapidUpdatedScore
      };
    });

    // Add to activity history for display
    setActivityHistory(prev => [...prev, newActivity].slice(-50)); // Keep last 50 for display

    // Enhanced logging for better debugging
    if (activity.type === 'apiRequest') {
      if (activity.data.action === 'scrape' || activity.data.action === 'rapid-scrape') {
        addLog('warning', `Scraping detected: ${activity.data.url || 'Unknown URL'}`, activity.data);
      } else if (activity.data.url && typeof activity.data.url === 'string' && 
                (activity.data.url.includes('kitsguntur.ac.in') || 
                 activity.data.url.includes('www.') || 
                 activity.data.url.startsWith('http'))) {
        addLog('warning', `Website scraping attempted: ${activity.data.url}`, activity.data);
      }
    }
  };

  const blockBot = (sessionId: string, reason: string) => {
    if (!currentSession) return;

    if (isBlocked) return; // Prevent multiple blocks

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
      
      setBlockedBots(prev => {
        // Check if already blocked to prevent duplicates
        if (prev.some(bot => bot.sessionId === sessionId)) {
          return prev;
        }
        return [...prev, blockedBot];
      });
      
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
