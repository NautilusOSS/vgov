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
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Coins className="h-5 w-5 text-primary" />
          {isStaked ? 'VOI Staking Complete' : 'Stake VOI to Vote'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Status & Balance Info */}
          <div className="space-y-4">
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
          </div>

          {/* Right Column - Action Section */}
          <div className="space-y-4">
            {isStaked ? (
              /* Unstaking Section */
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-green-700">Voting Enabled</span>
                  </div>
                  <span className="text-lg font-bold text-green-700">50,000 VOI</span>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Unlock Status</span>
                    <Badge 
                      variant="secondary" 
                      className={canUnstake ? "bg-blue-500/10 text-blue-700 border-blue-500/20" : "bg-amber-500/10 text-amber-700 border-amber-500/20"}
                    >
                      {canUnstake ? "✓ Can Unstake" : "🔒 Locked"}
                    </Badge>
                  </div>
                  
                  {!canUnstake && (
                    <p className="text-xs text-muted-foreground">
                      Your VOI will automatically unlock after October 15, 2024
                    </p>
                  )}

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
                        Processing Unstake...
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
                </div>
              </div>
            ) : (
              /* Staking Section */
              <div className="space-y-4">
                {/* Requirement Info */}
                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" />
                    <span className="font-medium">Required Stake</span>
                  </div>
                  <span className="text-lg font-bold text-primary">50,000 VOI</span>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span><strong>Lock Period:</strong> October 1-15, 2024</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span>Your VOI will be locked during the entire election period</span>
                  </div>
                </div>

                <Separator />

                {/* Balance Check */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Your VOI Balance</span>
                    <span className={voiBalance >= requiredStake ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                      {voiBalance.toLocaleString()} VOI
                    </span>
                  </div>
                  {voiBalance < requiredStake && (
                    <p className="text-xs text-red-500">
                      Insufficient balance. You need {(requiredStake - voiBalance).toLocaleString()} more VOI to participate.
                    </p>
                  )}
                </div>

                <Separator />

                {/* Terms */}
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      id="terms" 
                      checked={acceptedTerms}
                      onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                      className="mt-1"
                    />
                    <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                      I understand that my 50,000 VOI will be locked until October 15, 2024, and I agree to the 
                      <span className="text-primary underline ml-1">staking terms and conditions</span>
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

                {!acceptedTerms && (
                  <p className="text-xs text-muted-foreground text-center">
                    Please accept the terms to continue with staking
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