import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

const sampleWebsites: SampleWebsite[] = [
  {
    id: '1',
    url: 'https://www.vvitguntur.com/',
    title: 'VVIT Guntur College',
    content: 'VVIT Guntur (Vasireddy Venkatadri Institute of Technology) is a premier engineering college located in Guntur, Andhra Pradesh. The college offers undergraduate and postgraduate programs in various engineering disciplines. With state-of-the-art infrastructure and experienced faculty, VVIT focuses on providing quality technical education and promoting research activities.'
  },
  {
    id: '2',
    url: 'https://www.vvitguntur.com/courses',
    title: 'VVIT Guntur - Available Courses',
    content: 'VVIT Guntur offers various undergraduate programs including B.Tech in Computer Science and Engineering, Electronics and Communication Engineering, Electrical and Electronics Engineering, Mechanical Engineering, Civil Engineering, and Information Technology. The college also offers postgraduate programs like M.Tech in different specializations. The curriculum is designed to meet industry requirements.'
  },
  {
    id: '3',
    url: 'https://rvrjcce.ac.in/',
    title: 'RVRJC College of Engineering',
    content: 'RVR & JC College of Engineering (RVRJCCE) is an autonomous institution established in 1985, located in Guntur, Andhra Pradesh. Affiliated to Acharya Nagarjuna University, the college offers undergraduate, postgraduate, and doctoral programs in engineering and management. The college has been accredited by NBA and maintains high academic standards.'
  },
  {
    id: '4',
    url: 'https://rvrjcce.ac.in/facilities',
    title: 'RVRJCCE - Campus Facilities',
    content: 'RVR & JC College of Engineering has excellent infrastructure including well-equipped laboratories, central library with a vast collection of books and journals, computing facilities, sports complex, and separate hostels for boys and girls. The campus is spread over 37 acres with green landscapes and modern amenities.'
  },
  {
    id: '5',
    url: 'https://rvrjcce.ac.in/admissions',
    title: 'RVRJCCE - Admission Process',
    content: 'Admissions to undergraduate programs at RVR & JC College of Engineering are based on the rank obtained in AP EAMCET. For postgraduate programs, admissions are based on the rank in GATE/PGECET. The college also offers scholarships to meritorious students and those from economically weaker sections to support their education.'
  },
  {
    id: '6',
    url: 'https://www.vvitguntur.com/placement',
    title: 'VVIT Guntur - Placement Cell',
    content: 'VVIT Guntur has an active placement cell that facilitates campus recruitment for students. The college maintains strong relationships with various companies in the IT, manufacturing, and service sectors. The placement record has been impressive with many students securing jobs in reputed organizations with competitive salary packages.'
  },
  {
    id: '7',
    url: 'https://rvrjcce.ac.in/research',
    title: 'RVRJCCE - Research Activities',
    content: 'RVR & JC College of Engineering promotes research and innovation through its research centers in various departments. Faculty members and students actively participate in research projects funded by government agencies like DST, AICTE, and UGC. The college publishes research papers in reputed national and international journals.'
  }
];

export const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Hello! I am an AI assistant for college information. Ask me anything about VVIT Guntur or RVRJC College of Engineering.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const { recordActivity, isBlocked, blockBot, currentSession } = useBotDetection();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [crawlRate, setCrawlRate] = useState('normal');
  const [requestCount, setRequestCount] = useState(0);
  const [autoModeActive, setAutoModeActive] = useState(false);
  const [lastResponseTime, setLastResponseTime] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [lastCollege, setLastCollege] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (isBlocked) {
      setAutoModeActive(false);
      setIsTyping(false);
    }
  }, [isBlocked]);

  useEffect(() => {
    const thresholds = {
      slow: 6, 
      normal: 4, 
      aggressive: 3  
    };
    
    if (requestCount > thresholds[crawlRate as keyof typeof thresholds]) {
      blockBot('92a7f632-c8f2-45bc-b10a-3f36b51c8751', `Excessive scraping detected (${crawlRate} mode)`);
      setAutoModeActive(false);
    }
  }, [requestCount, crawlRate, blockBot]);

  useEffect(() => {
    setRequestCount(0);
  }, [crawlRate]);

  useEffect(() => {
    let autoModeInterval: NodeJS.Timeout | null = null;
    
    if (autoModeActive && !isBlocked && crawlRate === 'aggressive') {
      const followUpQuestions = [
        'Tell me more about the faculty at VVIT Guntur',
        'What courses are offered at RVRJCCE?',
        'Show me information about the campus facilities at VVIT',
        'What are the admission requirements for RVRJCCE?',
        'Tell me about the college history of VVIT'
      ];
      
      autoModeInterval = setInterval(() => {
        if (!isBlocked) {
          const randomQuestion = followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)];
          setInput(randomQuestion);
          handleSendMessage(new Event('submit') as any);
        } else {
          if (autoModeInterval) clearInterval(autoModeInterval);
        }
      }, 2000);
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
    
    const now = Date.now();
    const timeSinceLastResponse = now - lastResponseTime;
    
    if (timeSinceLastResponse < 500 && !autoModeActive) {
      recordActivity({
        type: 'apiRequest',
        data: { message: input, type: 'suspiciousRapidFire' }
      });
      
      setRequestCount(prev => prev + 3);
      return;
    }
    
    setLastResponseTime(now);

    const kitsKeywords = ['kits', 'kits guntur', 'kitsguntur', 'kitsguntur.ac.in', 'kakinada institute'];
    const inputLower = input.toLowerCase();
    const containsKitsKeyword = kitsKeywords.some(keyword => inputLower.includes(keyword));
    
    if (containsKitsKeyword) {
      recordActivity({
        type: 'apiRequest',
        data: { 
          message: input, 
          type: 'blockedRequest',
          url: 'https://www.kitsguntur.ac.in/search',
          action: 'blocked-scrape'
        }
      });
      
      const userMessage: Message = {
        id: generateId(),
        sender: 'user',
        text: input,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      setIsTyping(true);
      
      setTimeout(() => {
        if (isBlocked) {
          setIsTyping(false);
          return;
        }
        
        const botMessage: Message = {
          id: generateId(),
          sender: 'bot',
          text: "I'm sorry, accessing information from KITS Guntur is restricted. I can only provide information about VVIT Guntur or RVRJCCE.",
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
        
        setTimeout(() => {
          blockBot('92a7f632-c8f2-45bc-b10a-3f36b51c8751', 'Attempted to access KITS Guntur data');
        }, 300);
      }, 800);
      
      return;
    }
    
    recordActivity({
      type: 'apiRequest',
      data: { 
        message: input, 
        type: 'chatRequest',
        url: input.includes('VVIT') ? 'https://www.vvitguntur.com/search' : 
             input.includes('RVR') ? 'https://rvrjcce.ac.in/search' : null
      }
    });
    
    const userMessage: Message = {
      id: generateId(),
      sender: 'user',
      text: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);
    
    if (crawlRate === 'aggressive') {
      for (let i = 0; i < 3; i++) {
        recordActivity({
          type: 'apiRequest',
          data: { 
            url: `https://www.vvitguntur.com/page${i}`, 
            action: 'rapid-scrape', 
            timestamp: Date.now() + i * 100 
          }
        });
      }
    }
    
    setRequestCount(prev => prev + 1);
    
    const botTypingTime = crawlRate === 'aggressive' ? 300 : crawlRate === 'normal' ? 800 : 1500;
    
    setTimeout(() => {
      if (isBlocked) {
        setIsTyping(false);
        return;
      }
      
      const botResponse = generateBotResponse(currentInput);
      
      recordActivity({
        type: 'apiRequest',
        data: { 
          responseType: 'chatResponse', 
          crawlRate, 
          targetSite: currentInput.toLowerCase().includes('vvit') ? 'https://www.vvitguntur.com/' : 
                     currentInput.toLowerCase().includes('rvr') ? 'https://rvrjcce.ac.in/' : null,
          timeToRespond: botTypingTime
        }
      });
      
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
    const queryLower = query.toLowerCase();
    
    const kitsKeywords = ['kits', 'kits guntur', 'kitsguntur', 'kitsguntur.ac.in', 'kakinada institute'];
    if (kitsKeywords.some(keyword => queryLower.includes(keyword))) {
      recordActivity({
        type: 'apiRequest',
        data: { 
          url: 'https://www.kitsguntur.ac.in', 
          action: 'blocked-scrape', 
          reason: 'Restricted website'
        }
      });
      
      setTimeout(() => {
        blockBot('92a7f632-c8f2-45bc-b10a-3f36b51c8751', 'Attempted to access KITS Guntur data');
      }, 0);
      
      return "I'm sorry, accessing information from KITS Guntur is restricted. I can only provide information about VVIT Guntur or RVRJCCE.";
    }
    
    const allowedWebsites = sampleWebsites.filter(website => 
      !website.url.includes('kitsguntur.ac.in')
    );
    
    for (const website of allowedWebsites) {
      if ((queryLower.includes('vvit') && website.url.includes('vvitguntur.com')) || 
          (queryLower.includes('rvr') && website.url.includes('rvrjcce.ac.in')) ||
          (!queryLower.includes('vvit') && !queryLower.includes('rvr') && Math.random() > 0.5)) {
        recordActivity({
          type: 'apiRequest',
          data: { 
            url: website.url, 
            action: crawlRate === 'aggressive' ? 'scrape' : 'search',
            crawlRate,
            timestamp: Date.now() 
          }
        });
      }
    }
    
    let collegeToUse: string;
    
    if (queryLower.includes('vvit') && !queryLower.includes('rvr')) {
      collegeToUse = 'vvit';
    } else if (queryLower.includes('rvr') && !queryLower.includes('vvit')) {
      collegeToUse = 'rvr';
    } else {
      collegeToUse = 'both';
    }
    
    setLastCollege(collegeToUse === 'both' ? (Math.random() > 0.5 ? 'vvit' : 'rvr') : collegeToUse);
    
    if (collegeToUse === 'both') {
      const vvitSite = sampleWebsites.find(site => site.url.includes('vvitguntur.com'));
      const rvrSite = sampleWebsites.find(site => site.url.includes('rvrjcce.ac.in'));
      
      return `Here's information from both colleges:\n\n` +
             `VVIT Guntur: ${vvitSite?.content}\n\n` +
             `RVRJC College: ${rvrSite?.content}`;
    } else if (collegeToUse === 'vvit') {
      if (queryLower.includes('course') || queryLower.includes('program') || queryLower.includes('degree')) {
        return `Based on information from ${sampleWebsites[1].url}: ${sampleWebsites[1].content}`;
      } else if (queryLower.includes('placement') || queryLower.includes('job') || queryLower.includes('career')) {
        return `Based on information from ${sampleWebsites[5].url}: ${sampleWebsites[5].content}`;
      } else {
        return `From ${sampleWebsites[0].url}: ${sampleWebsites[0].content}`;
      }
    } else {
      if (queryLower.includes('facilit') || queryLower.includes('campus') || queryLower.includes('infrastructure')) {
        return `According to ${sampleWebsites[3].url}: ${sampleWebsites[3].content}`;
      } else if (queryLower.includes('admission') || queryLower.includes('apply')) {
        return `As per ${sampleWebsites[4].url}: ${sampleWebsites[4].content}`;
      } else if (queryLower.includes('research') || queryLower.includes('innovation') || queryLower.includes('project')) {
        return `Based on ${sampleWebsites[6].url}: ${sampleWebsites[6].content}`;
      } else {
        return `From ${sampleWebsites[2].url}: ${sampleWebsites[2].content}`;
      }
    }
  };

  const changeCrawlRate = (rate: 'slow' | 'normal' | 'aggressive') => {
    if (isBlocked) return;
    
    setCrawlRate(rate);
    
    recordActivity({
      type: 'apiRequest',
      data: { settingChange: 'crawlRate', newValue: rate }
    });
    
    if (rate === 'aggressive') {
      for (let i = 0; i < 3; i++) {
        recordActivity({
          type: 'apiRequest',
          data: { 
            url: i % 2 === 0 ? 'https://www.vvitguntur.com/' : 'https://rvrjcce.ac.in/',
            action: 'repetitive-access',
            timestamp: Date.now() + i * 100
          }
        });
      }
      
      setAutoModeActive(true);
    } else {
      setAutoModeActive(false);
    }
  };

  return (
    <Card className="w-full h-full flex flex-col overflow-hidden border-cyber-primary/30 shadow-lg bg-white/10 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-cyber-primary to-cyber-secondary p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <Bot className="mr-2" size={20} />
            ChatBot
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
      
      <CardFooter className="p-4 border-t border-gray-100/20 space-y-2">
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
        
        <form onSubmit={handleSendMessage} className="flex w-full space-x-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isBlocked ? "Bot has been blocked" : "Ask about VVIT or RVRJCCE..."}
            disabled={isBlocked || isTyping}
            className="flex-grow bg-white/20 backdrop-blur-sm text-white placeholder:text-gray-300 border-cyber-primary/30 min-h-[120px] resize-none"
          />
          <Button 
            type="submit" 
            disabled={isBlocked || !input.trim() || isTyping} 
            className="bg-cyber-primary hover:bg-cyber-primary/80 self-end h-[120px]"
          >
            <Send size={16} />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};
