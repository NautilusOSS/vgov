import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Coins, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Lock, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Unlock 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CombinedStakingCardProps {
  voiBalance: number;
  stakedAmount: number;
  isStaked: boolean;
  isStaking: boolean;
  isUnstaking: boolean;
  lockEndDate: Date;
  votesRemaining: number;
  onStake: () => void;
  onUnstake: () => void;
}

const CombinedStakingCard = ({ 
  voiBalance, 
  stakedAmount, 
  isStaked, 
  isStaking, 
  isUnstaking, 
  lockEndDate,
  votesRemaining,
  onStake, 
  onUnstake 
}: CombinedStakingCardProps) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { toast } = useToast();
  const requiredStake = 50000;
  const canStake = voiBalance >= requiredStake && acceptedTerms && !isStaked;
  const now = new Date();
  const canUnstake = now > lockEndDate;

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

  const handleStake = () => {
    if (!acceptedTerms) {
      toast({
        title: "Terms Required",
        description: "Please accept the staking terms to continue",
        variant: "destructive"
      });
      return;
    }
    
    if (voiBalance < requiredStake) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${requiredStake.toLocaleString()} VOI to participate in voting`,
        variant: "destructive"
      });
      return;
    }

    onStake();
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 rounded-lg bg-primary/10">
            <Coins className="h-5 w-5 text-primary" />
          </div>
          {isStaked ? 'VOI Staking Complete' : 'Stake VOI to Vote'}
          {isStaked && (
            <Badge className="bg-green-500/10 text-green-700 border-green-500/20 ml-auto">
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Balance Overview */}
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="p-4 rounded-lg border border-border/50 bg-background/50">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Available Balance</p>
                <p className="text-2xl font-bold">{voiBalance.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">VOI</span></p>
              </div>
              
              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Staked Amount</p>
                <p className="text-2xl font-bold text-primary">{stakedAmount.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">VOI</span></p>
                {stakedAmount > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress</span>
                      <span>{stakingProgress.toFixed(0)}%</span>
                    </div>
                    <Progress value={stakingProgress} className="h-1.5" />
                  </div>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border border-border/50">
              {isStaked ? (
                <>
                  <div className="p-1 rounded-full bg-green-500/10">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-700">Voting Enabled</p>
                    <p className="text-xs text-muted-foreground">You can select candidates</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-1 rounded-full bg-amber-500/10">
                    <AlertCircle className="h-3 w-3 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-700">Staking Required</p>
                    <p className="text-xs text-muted-foreground">Complete staking to vote</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Middle Column - Requirements/Info */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="h-4 w-4 text-primary" />
                <span className="font-semibold text-primary">Required Stake</span>
              </div>
              <p className="text-3xl font-bold text-primary mb-4">50,000 <span className="text-lg">VOI</span></p>
              
              {isStaked && (
                <div className="mb-4 p-3 rounded-lg bg-background/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium">Votes Remaining</span>
                  </div>
                  <p className="text-lg font-bold">{votesRemaining} <span className="text-sm font-normal text-muted-foreground">/ 5 candidates</span></p>
                </div>
              )}
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>Lock Period: Oct 1-15, 2024</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3 w-3 mt-0.5 text-amber-500" />
                  <span className="text-xs leading-relaxed">Tokens locked during election period</span>
                </div>
              </div>
            </div>

            {isStaked && (
              <div className="p-4 rounded-lg border border-border/50 bg-background/50">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Time Remaining</span>
                </div>
                <p className="text-lg font-bold text-foreground">{timeRemaining}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Until automatic unlock
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Action Section */}
          <div className="space-y-4">
            {isStaked ? (
              /* Unstaking Section */
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-green-500/20 bg-green-500/5">
                  <div className="text-center space-y-2">
                    <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
                    <p className="font-semibold text-green-700">Staking Complete</p>
                    <p className="text-sm text-muted-foreground">You can now participate in voting</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
                    <span className="text-sm font-medium">Unlock Status</span>
                    <Badge 
                      variant="secondary" 
                      className={canUnstake ? "bg-blue-500/10 text-blue-700 border-blue-500/20" : "bg-amber-500/10 text-amber-700 border-amber-500/20"}
                    >
                      {canUnstake ? "✓ Available" : "🔒 Locked"}
                    </Badge>
                  </div>

                  <Button 
                    onClick={onUnstake}
                    disabled={!canUnstake || isUnstaking}
                    variant={canUnstake ? "default" : "secondary"}
                    className="w-full"
                    size="lg"
                  >
                    {isUnstaking ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Processing...
                      </>
                    ) : canUnstake ? (
                      <>
                        <Unlock className="mr-2 h-4 w-4" />
                        Unstake VOI
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Locked Until Oct 15
                      </>
                    )}
                  </Button>

                  {!canUnstake && (
                    <p className="text-xs text-muted-foreground text-center px-2">
                      Your VOI will unlock automatically after the election period ends
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* Staking Section */
              <div className="space-y-4">
                {/* Balance Check */}
                <div className="p-4 rounded-lg border border-border/50 bg-background/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Your Balance</span>
                    <span className={`font-bold ${voiBalance >= requiredStake ? "text-green-600" : "text-red-500"}`}>
                      {voiBalance.toLocaleString()} VOI
                    </span>
                  </div>
                  {voiBalance < requiredStake ? (
                    <p className="text-xs text-red-500">
                      Need {(requiredStake - voiBalance).toLocaleString()} more VOI to participate
                    </p>
                  ) : (
                    <p className="text-xs text-green-600">
                      ✓ Sufficient balance for staking
                    </p>
                  )}
                </div>

                {/* Terms */}
                <div className="p-4 rounded-lg border border-border/50 bg-background/50">
                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      id="terms" 
                      checked={acceptedTerms}
                      onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                      className="mt-1"
                    />
                    <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                      I understand my 50,000 VOI will be locked until October 15, 2024, and I agree to the{' '}
                      <span className="text-primary underline font-medium">staking terms</span>
                    </label>
                  </div>
                </div>

                {/* Stake Button */}
                <Button 
                  onClick={handleStake}
                  disabled={!canStake || isStaking}
                  className="w-full bg-voi-gradient hover:opacity-90 transition-opacity"
                  size="lg"
                >
                  {isStaking ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Processing Stake...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Stake 50,000 VOI
                    </>
                  )}
                </Button>

                {!acceptedTerms && voiBalance >= requiredStake && (
                  <p className="text-xs text-muted-foreground text-center">
                    Please accept the terms to continue
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CombinedStakingCard;