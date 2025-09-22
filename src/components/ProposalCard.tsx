import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProposalCardProps {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'passed' | 'rejected' | 'pending';
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  endDate: string;
  onVote?: (proposalId: string, vote: 'for' | 'against') => void;
  hasVoted?: boolean;
  userVote?: 'for' | 'against';
}

const ProposalCard = ({
  id,
  title,
  description,
  status,
  votesFor,
  votesAgainst,
  totalVotes,
  endDate,
  onVote,
  hasVoted = false,
  userVote
}: ProposalCardProps) => {
  const forPercentage = totalVotes > 0 ? (votesFor / totalVotes) * 100 : 0;
  const againstPercentage = totalVotes > 0 ? (votesAgainst / totalVotes) * 100 : 0;

  const statusColors = {
    active: 'bg-primary text-primary-foreground',
    passed: 'bg-green-500 text-white',
    rejected: 'bg-destructive text-destructive-foreground',
    pending: 'bg-muted text-muted-foreground'
  };

  const isActive = status === 'active';

  return (
    <Card className="transition-all duration-300 hover:shadow-voi border-border/50">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <CardTitle className="text-xl font-semibold">{title}</CardTitle>
            <Badge className={cn(statusColors[status], "text-xs")}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>
        </div>
        <CardDescription className="text-sm leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Voting Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Users size={16} />
              Total Votes: {totalVotes}
            </span>
            <span className="flex items-center gap-2">
              <Clock size={16} />
              Ends: {new Date(endDate).toLocaleDateString()}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-green-600 font-medium">For: {votesFor} ({forPercentage.toFixed(1)}%)</span>
              <span className="text-red-600 font-medium">Against: {votesAgainst} ({againstPercentage.toFixed(1)}%)</span>
            </div>
            
            <div className="relative">
              <Progress value={forPercentage} className="h-3" />
              <div 
                className="absolute top-0 right-0 h-3 bg-red-500 rounded-r-full"
                style={{ width: `${againstPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Voting Buttons */}
        {isActive && (
          <div className="flex gap-3">
            <Button
              onClick={() => onVote?.(id, 'for')}
              disabled={hasVoted}
              variant={hasVoted && userVote === 'for' ? 'default' : 'outline'}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700"
            >
              {hasVoted && userVote === 'for' ? '✓ Voted For' : 'Vote For'}
            </Button>
            <Button
              onClick={() => onVote?.(id, 'against')}
              disabled={hasVoted}
              variant={hasVoted && userVote === 'against' ? 'destructive' : 'outline'}
              className="flex-1"
            >
              {hasVoted && userVote === 'against' ? '✓ Voted Against' : 'Vote Against'}
            </Button>
          </div>
        )}

        {hasVoted && (
          <div className="text-center text-sm text-muted-foreground bg-muted/50 py-2 px-4 rounded-lg">
            You voted <strong>{userVote === 'for' ? 'For' : 'Against'}</strong> this proposal
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProposalCard;