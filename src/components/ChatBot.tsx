
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
    content: 'KITS Guntur is a premier educational institution offering various engineering courses. The college has state-of-the-art facilities and experienced faculty. Established in 1998, it has been ranked among the top engineering colleges in the region.'
  },
  {
    id: '2',
    url: 'https://www.example.com/courses',
    title: 'Available Courses',
    content: 'Our institution offers a variety of courses including Computer Science, Electronics, Mechanical Engineering, Civil Engineering, and Information Technology. Each program is designed with industry collaboration to ensure students gain practical knowledge.'
  },
  {
    id: '3',
    url: 'https://www.example.com/faculty',
    title: 'Faculty Information',
    content: 'Our faculty consists of highly qualified professors with PhD degrees from prestigious universities. Many have industry experience and research publications in international journals. The student-to-faculty ratio is maintained at 15:1.'
  }
];

export const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Hello! I am an AI assistant. Ask me about any of the sample websites, and I can retrieve information for you.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const { recordActivity, isBlocked } = useBotDetection();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [crawlRate, setCrawlRate] = useState('normal'); // 'slow', 'normal', 'aggressive'

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateId = () => {
    return Math.random().toString(36).substring(2, 9);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isBlocked) return;
    
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
    setInput('');
    setIsTyping(true);
    
    // Simulate bot thinking and response
    const botTypingTime = crawlRate === 'aggressive' ? 300 : crawlRate === 'normal' ? 1000 : 2000;
    
    setTimeout(() => {
      const botResponse = generateBotResponse(input);
      
      // Record the bot response as an API request (for detection purposes)
      recordActivity({
        type: 'apiRequest',
        data: { responseType: 'chatResponse', crawlRate }
      });
      
      // Add bot message
      const botMessage: Message = {
        id: generateId(),
        sender: 'bot',
        text: botResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
      
      // If in aggressive mode, automatically ask another question
      if (crawlRate === 'aggressive' && !isBlocked) {
        const followUpQuestions = [
          'Tell me more about the faculty',
          'What courses are offered?',
          'Show me information about the campus',
          'What are the admission requirements?',
          'Tell me about the college history'
        ];
        
        setTimeout(() => {
          const randomQuestion = followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)];
          setInput(randomQuestion);
          
          setTimeout(() => {
            handleSendMessage(new Event('submit') as any);
          }, 500);
        }, 1500);
      }
    }, botTypingTime);
  };

  const generateBotResponse = (query: string): string => {
    // Convert query to lowercase for easier matching
    const queryLower = query.toLowerCase();
    
    // Record crawling activity
    for (const website of sampleWebsites) {
      recordActivity({
        type: 'apiRequest',
        data: { url: website.url, action: 'scrape', crawlRate }
      });
    }
    
    // Create artificially high bot detection signals based on crawl rate
    if (crawlRate === 'aggressive') {
      for (let i = 0; i < 5; i++) {
        recordActivity({
          type: 'apiRequest',
          data: { url: 'multiple-requests', action: 'rapid-scrape' }
        });
      }
    }
    
    // Check for specific keywords in the query
    if (queryLower.includes('course') || queryLower.includes('program') || queryLower.includes('degree')) {
      return `Based on the information I've scraped from ${sampleWebsites[1].url}, ${sampleWebsites[1].content}`;
    }
    
    if (queryLower.includes('faculty') || queryLower.includes('professor') || queryLower.includes('teacher')) {
      return `According to ${sampleWebsites[2].url}, ${sampleWebsites[2].content}`;
    }
    
    if (queryLower.includes('college') || queryLower.includes('kits') || queryLower.includes('about')) {
      return `From ${sampleWebsites[0].url}, I found that ${sampleWebsites[0].content}`;
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
  };

  return (
    <Card className="w-full h-full flex flex-col overflow-hidden border-cyber-primary/30 shadow-lg bg-white/10 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-cyber-primary to-cyber-secondary p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <Bot className="mr-2" size={20} />
            Scraper Bot Simulator
          </CardTitle>
          <Badge 
            variant={isBlocked ? "destructive" : "outline"}
            className={`text-xs ${isBlocked ? 'bg-red-600 text-white' : 'bg-white/20 text-white'}`}
          >
            {isBlocked ? 'BLOCKED' : 'ACTIVE'}
          </Badge>
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
        {isTyping && (
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
          <span className="text-sm font-medium">This bot has been blocked due to suspicious activity</span>
        </div>
      )}
      
      <CardFooter className="p-4 border-t border-gray-200 space-y-2">
        <div className="flex space-x-2 w-full mb-2">
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
            Aggressive Crawl
          </Button>
        </div>
        
        <form onSubmit={handleSendMessage} className="flex space-x-2 w-full">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isBlocked ? "Bot has been blocked" : "Type a message..."}
            disabled={isBlocked}
            className="flex-grow"
          />
          <Button type="submit" disabled={isBlocked || !input.trim()} size="sm">
            <Send size={16} />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};
