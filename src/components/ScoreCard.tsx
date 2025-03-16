
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cva } from 'class-variance-authority';

interface ScoreCardProps {
  title: string;
  score: number;
  type: 'human' | 'bot' | 'security';
  icon: React.ReactNode;
}

const scoreColors = cva('', {
  variants: {
    type: {
      human: [
        'from-green-500 to-emerald-600', // High score
        'from-yellow-400 to-amber-500',  // Medium score
        'from-red-400 to-red-600'        // Low score
      ],
      bot: [
        'from-red-500 to-red-700',       // High score
        'from-amber-400 to-amber-600',   // Medium score
        'from-green-400 to-green-600'    // Low score
      ],
      security: [
        'from-green-500 to-emerald-600', // High score
        'from-yellow-400 to-amber-500',  // Medium score
        'from-red-400 to-red-600'        // Low score
      ]
    }
  },
  defaultVariants: {
    type: 'human'
  }
});

export const ScoreCard: React.FC<ScoreCardProps> = ({ title, score, type, icon }) => {
  const [displayScore, setDisplayScore] = useState(score);
  const [previousScore, setPreviousScore] = useState(score);
  const [isChanging, setIsChanging] = useState(false);
  
  // Only animate score changes when an actual change happens
  useEffect(() => {
    if (score !== previousScore) {
      setPreviousScore(score);
      setIsChanging(true);
      
      // Gradually animate to new score with faster transitions
      const interval = setInterval(() => {
        setDisplayScore(current => {
          if (current < score) {
            // Increase by up to 3 points at a time for faster updates
            return Math.min(current + (score - current > 10 ? 3 : 2), score);
          } else if (current > score) {
            // Decrease by up to 3 points at a time for faster updates
            return Math.max(current - (current - score > 10 ? 3 : 2), score);
          } else {
            clearInterval(interval);
            setTimeout(() => setIsChanging(false), 300); // Delay before removing the highlight effect
            return current;
          }
        });
      }, 12); // Fast animation interval
      
      return () => clearInterval(interval);
    }
  }, [score, previousScore]);
  
  // Get appropriate color range based on score and type
  const getColorClass = () => {
    let index;
    
    if (type === 'bot') {
      // For bot score, high is bad
      if (displayScore >= 70) index = 0;
      else if (displayScore >= 30) index = 1;
      else index = 2;
    } else {
      // For human and security scores, high is good
      if (displayScore >= 70) index = 0;
      else if (displayScore >= 30) index = 1;
      else index = 2;
    }
    
    return scoreColors({ type })[index];
  };

  return (
    <Card className={`border border-cyber-primary/30 shadow-lg bg-white/5 backdrop-blur-sm transition-all duration-300 ${isChanging ? 'ring-2 ring-cyber-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            {icon}
            <h3 className="text-sm font-medium ml-2">{title}</h3>
          </div>
          <div className={`text-2xl font-bold transition-all duration-200 ${isChanging ? 'scale-110 text-cyber-primary' : ''}`}>
            {Math.round(displayScore)}
          </div>
        </div>
        
        <div className="relative pt-1">
          <Progress 
            value={displayScore} 
            max={100}
            className="h-2.5 rounded-full overflow-hidden" 
          />
          <div 
            className={`absolute inset-0 bg-gradient-to-r ${getColorClass()} opacity-80 h-2.5 rounded-full transition-all duration-200`}
            style={{ width: `${displayScore}%` }}
          ></div>
        </div>
        
        <div className="mt-2 text-xs text-gray-400 flex justify-between">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </CardContent>
    </Card>
  );
};
