import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Coins,
  Clock,
  CheckCircle,
  AlertCircle,
  Lock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Unlock,
  Vote,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PowerLockCreatedEvent {
  txid: string;
  round: number;
  timestamp: number;
  powerLock: {
    power_source_id: number;
    power_source_unlock_timestamp: number;
  };
}

interface CombinedStakingCardProps {
  voiBalance: number;
  stakedAmount: number;
  isStaked: boolean;
  isStaking: boolean;
  isUnstaking: boolean;
  endorsement: boolean;
  lockEndDate: Date;
  votesRemaining: number;
  onStake: () => void;
  onUnstake: () => void;
  onStakeSuccess?: () => void;
  powerLockCreatedEvents?: PowerLockCreatedEvent[];
}

const CombinedStakingCard = ({
  voiBalance,
  stakedAmount,
  isStaked,
  isStaking,
  isUnstaking,
  endorsement,
  lockEndDate,
  votesRemaining,
  onStake,
  onUnstake,
  onStakeSuccess,
  powerLockCreatedEvents = [],
}: CombinedStakingCardProps) => {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [nextUnlockTime, setNextUnlockTime] = useState<string>("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { toast } = useToast();
  const requiredStake = 50000;
  const canStake = voiBalance >= requiredStake && !isStaked;
  const now = new Date();
  const canUnstake = now > lockEndDate;

  // Calculate next unlock time from power lock events
  const nextUnlockTimestamp = useMemo(() => {
    if (powerLockCreatedEvents.length === 0) return null;

    const currentTime = Math.floor(Date.now() / 1000);
    const futureUnlocks = powerLockCreatedEvents
      .map((event) => event.powerLock.power_source_unlock_timestamp)
      .filter((timestamp) => timestamp > currentTime)
      .sort((a, b) => a - b);

    return futureUnlocks.length > 0 ? futureUnlocks[0] : null;
  }, [powerLockCreatedEvents]);

  console.log("nextUnlockTimestamp", nextUnlockTimestamp);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const end = lockEndDate.getTime();
      const difference = end - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );

        setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      } else {
        setTimeRemaining("Election ended");
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lockEndDate]);

  // Update next unlock time display
  useEffect(() => {
    const updateNextUnlockTimer = () => {
      if (!nextUnlockTimestamp) {
        setNextUnlockTime("");
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      const difference = nextUnlockTimestamp - now;

      if (difference > 0) {
        const days = Math.floor(difference / (24 * 60 * 60));
        const hours = Math.floor((difference % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((difference % (60 * 60)) / 60);

        setNextUnlockTime(`${days}d ${hours}h ${minutes}m`);
      } else {
        setNextUnlockTime("Available now");
      }
    };

    updateNextUnlockTimer();
    const interval = setInterval(updateNextUnlockTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [nextUnlockTimestamp]);

  const stakingProgress = (stakedAmount / 5) * 100;

  const handleStake = () => {
    if (voiBalance < requiredStake) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${requiredStake.toLocaleString()} VOI to participate in voting`,
        variant: "destructive",
      });
      return;
    }

    onStake();
  };

  // Show success modal when staking completes
  useEffect(() => {
    if (isStaked && !isStaking && onStakeSuccess) {
      setShowSuccessModal(true);
      onStakeSuccess();
    }
  }, [isStaked, isStaking, onStakeSuccess]);

  return (
    <>
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <DialogTitle className="text-xl font-semibold">
              Staking Successful!
            </DialogTitle>
            <DialogDescription className="mt-2">
              You have successfully staked 50,000 VOI and are now eligible to
              participate in voting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
              <div className="flex items-center gap-3">
                <Vote className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-700">Ready to Vote</p>
                  <p className="text-sm text-green-600">
                    You can now vote for up to 5 candidates
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-primary">Tokens Locked</p>
                  <p className="text-sm text-muted-foreground">
                    Your VOI is secured until October 15, 2025
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowSuccessModal(false)}
              className="w-full"
            >
              Continue to Voting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Coins className="h-5 w-5 text-primary" />
            </div>
            {isStaked ? "VOI Staking Complete" : "Stake VOI to Vote"}
            {isStaked && (
              <Badge className="bg-green-500/10 text-green-700 border-green-500/20 ml-auto">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Left Column - Required Stake */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-primary">
                    Required Stake
                  </span>
                </div>
                <p className="text-3xl font-bold text-primary mb-4">
                  50,000 <span className="text-lg">VOI</span>
                </p>

                <div className="space-y-2 text-sm text-muted-foreground flex-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>Lock Period: 4 weeks</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-3 w-3 mt-0.5 text-amber-500" />
                    <span className="text-xs leading-relaxed">
                      Tokens locked during election period
                    </span>
                  </div>
                  {!endorsement && isStaked && (
                    <div className="pt-2">
                      <Badge className="bg-green-500/10 text-green-700 border-green-500/20 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Eligible to Vote
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Middle Column - Balance Info */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <Coins className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-primary">
                    Stake Power
                  </span>
                </div>
                <p className="text-3xl font-bold text-primary mb-4">
                  {stakedAmount.toLocaleString()}{" "}
                  <span className="text-lg">Power</span>
                </p>

                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-medium">Votes Remaining</span>
                </div>
                <p className="text-lg font-bold">
                  {isStaked ? votesRemaining : 0}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    / 5 candidates
                  </span>
                </p>

                {stakedAmount > 0 && (
                  <div className="space-y-2 text-sm text-muted-foreground mt-4 flex-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{stakingProgress.toFixed(0)}%</span>
                    </div>
                    <Progress value={stakingProgress} className="h-1.5" />
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Action Section */}
            <div className="space-y-4">
              {isStaked ? (
                /* Unstaking Section */
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-border/50 bg-background/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">
                        Time Remaining
                      </span>
                    </div>
                    <p className="text-lg font-bold text-foreground">
                      {timeRemaining}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Until automatic unlock
                    </p>
                  </div>

                  {/* Next Unlock Section - Show when power lock events exist */}
                  {powerLockCreatedEvents.length > 0 && nextUnlockTime && (
                    <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-500/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Unlock className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-sm text-blue-700">
                          Next Unlock
                        </span>
                      </div>
                      <p className="text-lg font-bold text-blue-600">
                        {nextUnlockTime}
                      </p>
                      <p className="text-xs text-blue-600/70 mt-1">
                        From power lock events
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
                      <span className="text-sm font-medium">Unlock Status</span>
                      <Badge
                        variant="secondary"
                        className={
                          canUnstake
                            ? "bg-blue-500/10 text-blue-700 border-blue-500/20"
                            : "bg-amber-500/10 text-amber-700 border-amber-500/20"
                        }
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
                          Locked For 4 Weeks After Staking
                        </>
                      )}
                    </Button>

                    {!canUnstake && (
                      <p className="text-xs text-muted-foreground text-center px-2">
                        Your VOI will unlock automatically after the election
                        period ends
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
                      <span
                        className={`font-bold ${
                          voiBalance >= requiredStake
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {voiBalance.toLocaleString()} VOI
                      </span>
                    </div>
                    {voiBalance < requiredStake ? (
                      <p className="text-xs text-red-500">
                        Need {(requiredStake - voiBalance).toLocaleString()}{" "}
                        more VOI to participate
                      </p>
                    ) : (
                      <p className="text-xs text-green-600">
                        ✓ Sufficient balance for staking
                      </p>
                    )}
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

                  <p className="text-xs text-muted-foreground text-center">
                    50,000 VOI will be locked for 4 weeks after staking
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default CombinedStakingCard;
