import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Lock, Calendar, Coins, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StakingCardProps {
  voiBalance: number;
  isStaked: boolean;
  isStaking: boolean;
  onStake: () => void;
}

const StakingCard = ({ voiBalance, isStaked, isStaking, onStake }: StakingCardProps) => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { toast } = useToast();
  const requiredStake = 50000;
  const canStake = voiBalance >= requiredStake && acceptedTerms && !isStaked;

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

  if (isStaked) {
    return (
      <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            Staking Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Staked Amount</span>
              <span className="font-semibold text-green-700">50,000 VOI</span>
            </div>
            <Badge variant="secondary" className="w-full justify-center bg-green-500/10 text-green-700 border-green-500/20">
              ✓ Voting Enabled - You can now select candidates
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          Stake VOI to Vote
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Requirement Info */}
        <div className="space-y-4">
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
      </CardContent>
    </Card>
  );
};

export default StakingCard;