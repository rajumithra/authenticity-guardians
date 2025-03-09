
// Bot detection types
export interface UserActivity {
  timestamp: number;
  type: ActivityType;
  data: any;
}

export type ActivityType = 
  | 'pageView' 
  | 'mouseMove' 
  | 'mouseClick' 
  | 'keyPress' 
  | 'formSubmit'
  | 'apiRequest'
  | 'scrollEvent';

export interface BotScore {
  total: number;
  mouseMovement: number;
  keyboardPattern: number;
  navigationPattern: number;
  requestPattern: number;
  timePattern: number;
}

export interface UserSession {
  id: string;
  ip: string;
  userAgent: string;
  startTime: number;
  lastActive: number;
  activities: UserActivity[];
  botScore: BotScore;
  isBlocked: boolean;
  botType: BotType | null;
  device: DeviceInfo;
}

export interface DeviceInfo {
  browser: string;
  os: string;
  device: string;
  screenSize: {
    width: number;
    height: number;
  };
}

export type BotType = 
  | 'scraper'
  | 'crawler'
  | 'spamBot'
  | 'ddosBot'
  | 'chatBot'
  | 'unknown';

export interface BlockedBot {
  sessionId: string;
  ip: string;
  userAgent: string;
  botScore: BotScore;
  botType: BotType;
  timeBlocked: number;
  reason: string;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warning' | 'error';
  message: string;
  data?: any;
}

export interface SecurityStatus {
  level: 'low' | 'medium' | 'high';
  score: number;
  lastUpdated: number;
  activeThreats: number;
}

export interface HumanScore {
  value: number;
  confidence: number;
  lastUpdated: number;
}
