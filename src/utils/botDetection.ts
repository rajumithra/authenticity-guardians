
import { BotScore, UserSession, BotType } from '../models/BotDetectionTypes';

// Analyze user behavior to determine bot likelihood
export const analyzeUserBehavior = (session: UserSession): BotScore => {
  const { activities, botScore } = session;
  
  // Deep copy of the current score
  const newScore: BotScore = { ...botScore };
  
  // Get recent activities for analysis
  const recentActivities = activities.slice(-30);
  
  // If no recent activities, return the current score
  if (recentActivities.length === 0) return botScore;
  
  // Analyze mouse movements
  const mouseMovements = recentActivities.filter(a => a.type === 'mouseMove');
  if (mouseMovements.length > 0) {
    // Natural mouse movements tend to have varied speeds and paths
    // Bots often move in straight lines or with consistent patterns
    const naturalityScore = calculateMouseNaturality(mouseMovements);
    
    // Update the score (decrease for more natural movements)
    newScore.mouseMovement = Math.max(0, botScore.mouseMovement - naturalityScore);
    
    // Random chance of slight increase to simulate learning
    if (Math.random() > 0.7) {
      newScore.mouseMovement = Math.min(100, newScore.mouseMovement + 1);
    }
  } else {
    // No mouse movements is suspicious, gradually increase score
    newScore.mouseMovement = Math.min(100, botScore.mouseMovement + 2);
  }
  
  // Analyze keyboard patterns
  const keyPresses = recentActivities.filter(a => a.type === 'keyPress');
  if (keyPresses.length > 0) {
    // Natural typing has varied timing between keypresses
    // Bots often type with very consistent timing
    const typingNaturality = calculateTypingNaturality(keyPresses);
    
    // Update the score (decrease for more natural typing)
    newScore.keyboardPattern = Math.max(0, botScore.keyboardPattern - typingNaturality);
    
    // Random chance of slight increase to simulate learning
    if (Math.random() > 0.7) {
      newScore.keyboardPattern = Math.min(100, newScore.keyboardPattern + 1);
    }
  }
  
  // Analyze navigation patterns (clicks)
  const clicks = recentActivities.filter(a => a.type === 'mouseClick');
  if (clicks.length > 0) {
    // Humans typically click on visible elements with pauses
    // Bots might click very rapidly or on invisible elements
    const clickNaturality = calculateClickNaturality(clicks);
    
    // Update the score (decrease for more natural clicking)
    newScore.navigationPattern = Math.max(0, botScore.navigationPattern - clickNaturality);
    
    // Random chance of slight increase to simulate learning
    if (Math.random() > 0.8) {
      newScore.navigationPattern = Math.min(100, newScore.navigationPattern + 2);
    }
  }
  
  // Analyze request patterns (API calls)
  const apiRequests = recentActivities.filter(a => a.type === 'apiRequest');
  if (apiRequests.length > 0) {
    // Humans make fewer API calls and with more variation
    // Bots might make many similar calls rapidly
    const requestNaturality = calculateRequestNaturality(apiRequests);
    
    // Update the score
    newScore.requestPattern = Math.max(0, botScore.requestPattern - requestNaturality);
    
    // Random increase
    if (Math.random() > 0.7) {
      newScore.requestPattern = Math.min(100, newScore.requestPattern + 3);
    }
  }
  
  // Analyze time patterns (overall session behavior)
  const timeNaturality = calculateTimeNaturality(recentActivities);
  newScore.timePattern = Math.max(0, Math.min(100, botScore.timePattern - timeNaturality + (Math.random() > 0.7 ? 2 : 0)));
  
  // Calculate overall bot score (weighted average)
  newScore.total = Math.round(
    (newScore.mouseMovement * 0.3) +
    (newScore.keyboardPattern * 0.2) +
    (newScore.navigationPattern * 0.2) +
    (newScore.requestPattern * 0.15) +
    (newScore.timePattern * 0.15)
  );
  
  return newScore;
};

// Helper functions for behavior analysis
function calculateMouseNaturality(mouseMovements: any[]): number {
  // In a real implementation, we would analyze velocity changes, curves, etc.
  // For the demo, we'll use the presence of mouse movements and some randomness
  
  // More mouse movements generally indicate human behavior
  const movementCount = Math.min(mouseMovements.length, 20);
  
  // The more movement, the more natural it seems (with some randomization)
  const naturalityBase = (movementCount / 20) * 5;
  
  // Add some randomness to simulate variability in natural movement
  return naturalityBase + (Math.random() * 3);
}

function calculateTypingNaturality(keyPresses: any[]): number {
  // For the demo, we'll use timing variations between keypresses
  if (keyPresses.length < 2) return 1;
  
  // Calculate time differences between keypresses
  const timeDiffs = [];
  for (let i = 1; i < keyPresses.length; i++) {
    timeDiffs.push(keyPresses[i].timestamp - keyPresses[i-1].timestamp);
  }
  
  // Calculate standard deviation of time differences
  // Higher standard deviation indicates more natural typing (varied timing)
  const mean = timeDiffs.reduce((sum, time) => sum + time, 0) / timeDiffs.length;
  const variance = timeDiffs.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / timeDiffs.length;
  const stdDev = Math.sqrt(variance);
  
  // Convert to a 0-5 scale (higher is more natural)
  return Math.min(5, stdDev / 100);
}

function calculateClickNaturality(clicks: any[]): number {
  // More clicks with reasonable timing indicates natural behavior
  
  if (clicks.length < 2) return 1;
  
  // Calculate time between clicks
  const timeDiffs = [];
  for (let i = 1; i < clicks.length; i++) {
    timeDiffs.push(clicks[i].timestamp - clicks[i-1].timestamp);
  }
  
  // Very fast clicks are suspicious
  const suspiciousClicks = timeDiffs.filter(diff => diff < 100).length;
  
  // Calculate naturality score
  const naturalityBase = Math.min(3, clicks.length / 10);
  const suspicionPenalty = suspiciousClicks * 0.5;
  
  return Math.max(0, naturalityBase - suspicionPenalty);
}

function calculateRequestNaturality(requests: any[]): number {
  // For the demo, we'll use the number of requests and timing
  
  // Too many requests in a short time is suspicious
  const suspiciousCount = requests.length > 5 ? 0 : 3;
  
  // Add some randomness 
  return suspiciousCount + (Math.random() * 2);
}

function calculateTimeNaturality(activities: any[]): number {
  // For the demo, we'll use the overall variety of activities
  
  // Count different types of activities
  const types = new Set(activities.map(a => a.type));
  
  // More variety indicates more natural behavior
  return Math.min(5, types.size);
}

// Determine the type of bot based on behavior patterns
export const detectBotType = (score: BotScore): BotType | null => {
  if (score.total < 30) {
    return null; // Likely human
  }
  
  // Determine bot type based on scores
  if (score.requestPattern > 70) {
    return 'scraper';
  }
  
  if (score.navigationPattern > 70 && score.timePattern > 60) {
    return 'crawler';
  }
  
  if (score.keyboardPattern > 80) {
    return 'spamBot';
  }
  
  if (score.total > 70) {
    return 'chatBot';
  }
  
  return 'unknown';
};
