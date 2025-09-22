import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Twitter, MessageCircle, ExternalLink, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CandidateCardProps {
  id: string;
  name: string;
  description: string;
  votes: number;
  totalVotes: number;
  isSelected?: boolean;
  isVoted?: boolean;
  isVoting?: boolean;
  onSelect?: (candidateId: string) => void;
  canSelect?: boolean;
  twitterUrl?: string;
  discordUrl?: string;
  isVotingPeriodOpen?: boolean;
}

const CandidateCard = ({
  id,
  name,
  description,
  votes,
  totalVotes,
  isSelected = false,
  isVoted = false,
  isVoting = false,
  onSelect,
  canSelect = true,
  twitterUrl,
  discordUrl,
  isVotingPeriodOpen = true
}: CandidateCardProps) => {
  const votePercentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;

  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-voi border-border/50",
      isSelected && !isVoted && "ring-2 ring-primary bg-primary/5",
      isVoted && "ring-2 ring-green-500 bg-green-500/5",
      isVoting && "ring-2 ring-blue-500 bg-blue-500/5"
    )}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            {/* Profile Picture Placeholder */}
            <Avatar className="h-16 w-16 bg-primary/10 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary">
                <User size={24} />
              </AvatarFallback>
            </Avatar>
            
            {/* Name and Social Links */}
            <div className="space-y-2 flex-1">
              <CardTitle className="text-xl font-semibold">{name}</CardTitle>
              <div className="flex items-center gap-3">
                {twitterUrl && (
                  <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Twitter size={16} />
                    <ExternalLink size={12} />
                  </a>
                )}
                {discordUrl && (
                  <a
                    href={discordUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MessageCircle size={16} />
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          </div>
          {isVoted && (
            <Badge className={cn(
              isVotingPeriodOpen ? "bg-green-500 text-white" : "bg-gray-500 text-white"
            )}>
              ✓ Voted {!isVotingPeriodOpen && "• Locked"}
            </Badge>
          )}
          {isVoting && (
            <Badge className="bg-blue-500 text-white">
              Voting...
            </Badge>
          )}
          {isSelected && !isVoted && !isVoting && (
            <Badge className="bg-primary text-primary-foreground">
              ✓ Selected
            </Badge>
          )}
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Bio:</p>
          <CardDescription className="text-sm leading-relaxed">
            {description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Vote Count */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Users size={16} />
              Votes: {votes} ({votePercentage.toFixed(1)}%)
            </span>
          </div>
          <Progress value={votePercentage} className="h-2" />
        </div>

        {/* Select Button */}
        <Button
          onClick={() => onSelect?.(id)}
          disabled={!canSelect || isVoting || (isVoted && !isVotingPeriodOpen)}
          variant={isSelected && !isVoted ? "default" : isVoted && !isVotingPeriodOpen ? "default" : isVoted ? "outline" : "outline"}
          className={cn(
            "w-full",
            isSelected && !isVoted && "bg-primary hover:bg-primary/90",
            isVoted && !isVotingPeriodOpen && "bg-gray-500 hover:bg-gray-500/90",
            isVoted && isVotingPeriodOpen && "bg-green-500/20 border-green-500 text-green-700 dark:text-green-300 hover:bg-green-500/30",
            isVoting && "bg-blue-500 hover:bg-blue-500/90"
          )}
        >
          {isVoting ? 'Processing Vote...' : 
           isVoted && !isVotingPeriodOpen ? '✓ Vote Locked' :
           isVoted && isVotingPeriodOpen ? 'Change Vote' :
           isSelected ? '✓ Selected' : 'Select Candidate'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CandidateCard;