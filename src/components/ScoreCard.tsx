
import React from 'react';
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
  // Get appropriate color range based on score and type
  const getColorClass = () => {
    let index;
    
    if (type === 'bot') {
      // For bot score, high is bad
      if (score >= 70) index = 0;
      else if (score >= 30) index = 1;
      else index = 2;
    } else {
      // For human and security scores, high is good
      if (score >= 70) index = 0;
      else if (score >= 30) index = 1;
      else index = 2;
    }
    
    return scoreColors({ type })[index];
  };

  return (
    <Card className="border border-cyber-primary/30 shadow-lg bg-white/5 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            {icon}
            <h3 className="text-sm font-medium ml-2">{title}</h3>
          </div>
          <div className="text-2xl font-bold">{score}</div>
        </div>
        
        <div className="relative pt-1">
          <Progress 
            value={score} 
            max={100}
            className="h-2 rounded-full overflow-hidden" 
          />
          <div 
            className={`absolute inset-0 bg-gradient-to-r ${getColorClass()} opacity-80 h-2 rounded-full`}
            style={{ width: `${score}%` }}
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
