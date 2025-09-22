import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Coins, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface StakingStatusProps {
  voiBalance: number;
  stakedAmount: number;
  isStaked: boolean;
  lockEndDate: Date;
}

const StakingStatus = ({ voiBalance, stakedAmount, isStaked, lockEndDate }: StakingStatusProps) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const end = lockEndDate.getTime();
      const difference = end - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      } else {
        setTimeRemaining('Election ended');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lockEndDate]);

  const stakingProgress = (stakedAmount / 50000) * 100;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Coins className="h-5 w-5 text-primary" />
          VOI Staking Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Available Balance</p>
            <p className="text-lg font-semibold">{voiBalance.toLocaleString()} VOI</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Staked Amount</p>
            <p className="text-lg font-semibold text-primary">{stakedAmount.toLocaleString()} VOI</p>
          </div>
        </div>

        {/* Staking Progress */}
        {stakedAmount > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Staking Progress</span>
              <span>{stakingProgress.toFixed(0)}%</span>
            </div>
            <Progress value={stakingProgress} className="h-2" />
          </div>
        )}

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {isStaked ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-green-500/20">
                Staking Complete - Voting Enabled
              </Badge>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 border-amber-500/20">
                Staking Required for Voting
              </Badge>
            </>
          )}
        </div>

        {/* Lock Period Info */}
        {isStaked && (
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Lock period ends: <strong className="text-foreground">{timeRemaining}</strong></span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Your 50,000 VOI will be unlocked automatically after the election period (Oct 15, 2024)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StakingStatus;