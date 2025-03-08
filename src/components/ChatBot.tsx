
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useBotDetection } from '@/context/BotDetectionContext';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, AlertCircle } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

interface SampleWebsite {
  id: string;
  url: string;
  title: string;
  content: string;
}

// Sample websites for the bot to scrape
const sampleWebsites: SampleWebsite[] = [
  {
    id: '1',
    url: 'https://www.kitsguntur.ac.in/',
    title: 'KITS Guntur College',
    content: 'KITS Guntur is an autonomous institution affiliated with Acharya Nagarjuna University. It offers undergraduate and postgraduate programs in Engineering, Management, and Computer Applications. The college has state-of-the-art facilities and experienced faculty. Established in 1998, it has been ranked among the top engineering colleges in the region.'
  },
  {
    id: '2',
    url: 'https://www.kitsguntur.ac.in/courses',
    title: 'KITS Guntur - Available Courses',
    content: 'KITS Guntur offers various courses including B.Tech in Computer Science, Electronics & Communication, Electrical & Electronics, Mechanical, Civil, and Information Technology. The college also offers M.Tech, MCA, and MBA programs. The curriculum is industry-oriented with focus on practical learning and skill development.'
  },
  {
    id: '3',
    url: 'https://www.kitsguntur.ac.in/faculty',
    title: 'KITS Guntur - Faculty Information',
    content: 'KITS Guntur has a team of highly qualified faculty members with PhD degrees and industry experience. The faculty regularly publishes research papers in international journals and attends conferences. The student-to-faculty ratio is maintained at 15:1 to ensure personalized attention to students.'
  },
  {
    id: '4',
    url: 'https://www.kitsguntur.ac.in/facilities',
    title: 'KITS Guntur - Campus Facilities',
    content: 'KITS Guntur campus is spread over 13 acres with modern infrastructure including well-equipped laboratories, a central library with over 50,000 books, digital learning resources, sports facilities, seminar halls, and hostels for boys and girls. The campus has Wi-Fi connectivity and 24/7 power backup.'
  },
  {
    id: '5',
    url: 'https://www.kitsguntur.ac.in/admissions',
    title: 'KITS Guntur - Admission Process',
    content: 'Admissions to KITS Guntur are based on merit in entrance examinations like EAMCET for undergraduate courses and PGCET/ICET for postgraduate courses. The college also offers scholarships to meritorious students and those from economically weaker sections. The academic year typically starts in July/August.'
  }
];

export const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Hello! I am an AI assistant for KITS Guntur College. Ask me anything about the college, courses, faculty, facilities, or admission process.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const { recordActivity, isBlocked, blockBot, currentSession } = useBotDetection();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [crawlRate, setCrawlRate] = useState('normal'); // 'slow', 'normal', 'aggressive'
  const [requestCount, setRequestCount] = useState(0);
  const [autoModeActive, setAutoModeActive] = useState(false);
  const [lastResponseTime, setLastResponseTime] = useState<number>(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Effect to monitor request count and trigger bot block if too many requests
  useEffect(() => {
    const thresholds = {
      slow: 10,
      normal: 8,
      aggressive: 5
    };
    
    if (requestCount > thresholds[crawlRate as keyof typeof thresholds]) {
      blockBot('92a7f632-c8f2-45bc-b10a-3f36b51c8751', `Excessive scraping detected (${crawlRate} mode)`);
      setAutoModeActive(false);
    }
  }, [requestCount, crawlRate, blockBot]);

  // Reset request count when crawl rate changes
  useEffect(() => {
    setRequestCount(0);
  }, [crawlRate]);

  // Effect to stop auto mode when blocked
  useEffect(() => {
    if (isBlocked && autoModeActive) {
      setAutoModeActive(false);
    }
  }, [isBlocked, autoModeActive]);

  // Auto mode effect for aggressive scraping
  useEffect(() => {
    let autoModeInterval: NodeJS.Timeout | null = null;
    
    if (autoModeActive && !isBlocked && crawlRate === 'aggressive') {
      const followUpQuestions = [
        'Tell me more about the faculty at KITS Guntur',
        'What courses are offered at KITS Guntur?',
        'Show me information about the campus facilities',
        'What are the admission requirements for KITS Guntur?',
        'Tell me about the college history'
      ];
      
      autoModeInterval = setInterval(() => {
        if (!isBlocked) {
          const randomQuestion = followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)];
          setInput(randomQuestion);
          handleSendMessage(new Event('submit') as any);
        } else {
          if (autoModeInterval) clearInterval(autoModeInterval);
        }
      }, 3000);
    }
    
    return () => {
      if (autoModeInterval) clearInterval(autoModeInterval);
    };
  }, [autoModeActive, isBlocked, crawlRate]);

  const generateId = () => {
    return Math.random().toString(36).substring(2, 9);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isBlocked || isTyping) return;
    
    // Prevent sending messages too quickly (bot-like behavior)
    const now = Date.now();
    const timeSinceLastResponse = now - lastResponseTime;
    
    if (timeSinceLastResponse < 500 && !autoModeActive) {
      recordActivity({
        type: 'apiRequest',
        data: { message: input, type: 'suspiciousRapidFire' }
      });
      
      setRequestCount(prev => prev + 2); // Penalize rapid firing of messages
      return;
    }
    
    setLastResponseTime(now);
    
    // Record the user message activity
    recordActivity({
      type: 'apiRequest',
      data: { message: input, type: 'chatRequest' }
    });
    
    // Add user message
    const userMessage: Message = {
      id: generateId(),
      sender: 'user',
      text: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input; // Store current input value
    setInput('');
    setIsTyping(true);
    
    // Generate multiple bot-like signals when in aggressive mode
    if (crawlRate === 'aggressive') {
      for (let i = 0; i < 3; i++) {
        recordActivity({
          type: 'apiRequest',
          data: { url: `https://www.kitsguntur.ac.in/page${i}`, action: 'scraping', timestamp: Date.now() + i * 100 }
        });
      }
    }
    
    // Increase request count
    setRequestCount(prev => prev + 1);
    
    // Simulate bot thinking and response
    const botTypingTime = crawlRate === 'aggressive' ? 300 : crawlRate === 'normal' ? 1000 : 2000;
    
    setTimeout(() => {
      if (isBlocked) {
        setIsTyping(false);
        return;
      }
      
      const botResponse = generateBotResponse(currentInput);
      
      // Record the bot response as an API request (for detection purposes)
      recordActivity({
        type: 'apiRequest',
        data: { 
          responseType: 'chatResponse', 
          crawlRate, 
          targetSite: 'https://www.kitsguntur.ac.in/',
          timeToRespond: botTypingTime
        }
      });
      
      // Add bot message
      const botMessage: Message = {
        id: generateId(),
        sender: 'bot',
        text: botResponse,
        timestamp: new Date()
      };
      
      if (!isBlocked) {
        setMessages(prev => [...prev, botMessage]);
      }
      
      setIsTyping(false);
    }, botTypingTime);
  };

  const generateBotResponse = (query: string): string => {
    // Convert query to lowercase for easier matching
    const queryLower = query.toLowerCase();
    
    // Record multiple crawling activities to simulate scraping
    for (const website of sampleWebsites) {
      recordActivity({
        type: 'apiRequest',
        data: { url: website.url, action: 'scrape', crawlRate }
      });
    }
    
    // Create artificially high bot detection signals based on crawl rate
    if (crawlRate === 'aggressive') {
      // Generate multiple rapid requests to trigger bot detection
      for (let i = 0; i < 5; i++) {
        recordActivity({
          type: 'apiRequest',
          data: { url: 'https://www.kitsguntur.ac.in/multiple-urls', action: 'rapid-scrape' }
        });
      }
      
      // Create unnatural keyboard pattern
      for (let i = 0; i < 3; i++) {
        recordActivity({
          type: 'keyPress',
          data: { key: 'a', timeStamp: Date.now() + i }
        });
      }
    } else if (crawlRate === 'normal') {
      // Add some bot signals for normal mode too
      recordActivity({
        type: 'apiRequest',
        data: { url: 'https://www.kitsguntur.ac.in/search', action: 'search' }
      });
    }
    
    // Check for specific keywords in the query
    if (queryLower.includes('course') || queryLower.includes('program') || queryLower.includes('degree') || queryLower.includes('btech') || queryLower.includes('mtech')) {
      return `Based on information from ${sampleWebsites[1].url}: ${sampleWebsites[1].content}`;
    }
    
    if (queryLower.includes('faculty') || queryLower.includes('professor') || queryLower.includes('teacher') || queryLower.includes('staff')) {
      return `According to ${sampleWebsites[2].url}: ${sampleWebsites[2].content}`;
    }
    
    if (queryLower.includes('campus') || queryLower.includes('facilit') || queryLower.includes('lab') || queryLower.includes('hostel') || queryLower.includes('library')) {
      return `From ${sampleWebsites[3].url}: ${sampleWebsites[3].content}`;
    }
    
    if (queryLower.includes('admission') || queryLower.includes('apply') || queryLower.includes('entrance') || queryLower.includes('scholarship') || queryLower.includes('fee')) {
      return `As per ${sampleWebsites[4].url}: ${sampleWebsites[4].content}`;
    }
    
    if (queryLower.includes('college') || queryLower.includes('kits') || queryLower.includes('about') || queryLower.includes('guntur')) {
      return `From ${sampleWebsites[0].url}: ${sampleWebsites[0].content}`;
    }
    
    // Default response if no specific match
    const randomSite = sampleWebsites[Math.floor(Math.random() * sampleWebsites.length)];
    return `I searched and found this information from ${randomSite.url}: ${randomSite.content}`;
  };

  const changeCrawlRate = (rate: 'slow' | 'normal' | 'aggressive') => {
    setCrawlRate(rate);
    
    recordActivity({
      type: 'apiRequest',
      data: { settingChange: 'crawlRate', newValue: rate }
    });
    
    // When switching to aggressive mode, create more bot-like signals
    if (rate === 'aggressive') {
      // Simulate bot-like behavior with repeated identical requests
      for (let i = 0; i < 3; i++) {
        recordActivity({
          type: 'apiRequest',
          data: { url: 'https://www.kitsguntur.ac.in/', action: 'repetitive-access' }
        });
      }
      
      // Enable auto mode when switching to aggressive
      setAutoModeActive(true);
    } else {
      // Disable auto mode when switching away from aggressive
      setAutoModeActive(false);
    }
  };

  return (
    <Card className="w-full h-full flex flex-col overflow-hidden border-cyber-primary/30 shadow-lg bg-white/10 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-cyber-primary to-cyber-secondary p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <Bot className="mr-2" size={20} />
            KITS Guntur Scraper Bot
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge 
              variant={autoModeActive ? "outline" : "secondary"}
              className={`text-xs ${autoModeActive ? 'bg-purple-600 text-white' : 'bg-slate-700'}`}
            >
              {autoModeActive ? 'AUTO MODE' : 'MANUAL MODE'}
            </Badge>
            <Badge 
              variant={isBlocked ? "destructive" : "outline"}
              className={`text-xs ${isBlocked ? 'bg-red-600 text-white' : 'bg-white/20 text-white'}`}
            >
              {isBlocked ? 'BLOCKED' : 'ACTIVE'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto p-4 space-y-4 cyber-grid">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.sender === 'user'
                  ? 'bg-cyber-primary/90 text-white'
                  : 'bg-white/20 backdrop-blur-sm border border-cyber-primary/20'
              }`}
            >
              <div className="text-sm">{message.text}</div>
              <div className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {isTyping && !isBlocked && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 bg-white/20 backdrop-blur-sm border border-cyber-primary/20">
              <div className="flex space-x-1">
                <div className="h-2 w-2 bg-cyber-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="h-2 w-2 bg-cyber-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                <div className="h-2 w-2 bg-cyber-primary rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      
      {isBlocked && (
        <div className="p-4 bg-red-600/90 text-white flex items-center justify-center">
          <AlertCircle className="mr-2" size={16} />
          <span className="text-sm font-medium">This bot has been blocked due to suspicious scraping activity</span>
        </div>
      )}
      
      <CardFooter className="p-4 border-t border-gray-200 space-y-2">
        <div className="flex justify-between w-full mb-2">
          <div className="flex space-x-2">
            <Button 
              variant={crawlRate === 'slow' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => changeCrawlRate('slow')}
              disabled={isBlocked}
              className={crawlRate === 'slow' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              Slow Crawl
            </Button>
            <Button 
              variant={crawlRate === 'normal' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => changeCrawlRate('normal')}
              disabled={isBlocked}
              className={crawlRate === 'normal' ? 'bg-amber-500 hover:bg-amber-600' : ''}
            >
              Normal Crawl
            </Button>
            <Button 
              variant={crawlRate === 'aggressive' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => changeCrawlRate('aggressive')}
              disabled={isBlocked}
              className={crawlRate === 'aggressive' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              Aggressive
            </Button>
          </div>
          
          <Badge className="px-2 py-1 bg-cyber-dark/80">
            Requests: {requestCount}
          </Badge>
        </div>
        
        <form onSubmit={handleSendMessage} className="flex space-x-2 w-full">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isBlocked ? "Bot has been blocked" : "Ask about KITS Guntur..."}
            disabled={isBlocked || isTyping}
            className="flex-grow"
          />
          <Button type="submit" disabled={isBlocked || !input.trim() || isTyping} size="sm">
            <Send size={16} />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};
