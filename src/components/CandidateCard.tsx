import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, MapPin, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CandidateCardProps {
  id: string;
  name: string;
  title: string;
  description: string;
  location: string;
  experience: string;
  votes: number;
  totalVotes: number;
  isSelected?: boolean;
  onVote?: (candidateId: string) => void;
  canVote?: boolean;
}

const CandidateCard = ({
  id,
  name,
  title,
  description,
  location,
  experience,
  votes,
  totalVotes,
  isSelected = false,
  onVote,
  canVote = true
}: CandidateCardProps) => {
  const votePercentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;

  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-voi border-border/50",
      isSelected && "ring-2 ring-primary bg-primary/5"
    )}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <CardTitle className="text-xl font-semibold">{name}</CardTitle>
            <CardDescription className="text-sm font-medium text-primary">
              {title}
            </CardDescription>
          </div>
          {isSelected && (
            <Badge className="bg-primary text-primary-foreground">
              ✓ Selected
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin size={14} />
            {location}
          </span>
          <span className="flex items-center gap-1">
            <Briefcase size={14} />
            {experience}
          </span>
        </div>
        
        <CardDescription className="text-sm leading-relaxed">
          {description}
        </CardDescription>
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

        {/* Vote Button */}
        <Button
          onClick={() => onVote?.(id)}
          disabled={!canVote}
          variant={isSelected ? "default" : "outline"}
          className={cn(
            "w-full",
            isSelected && "bg-primary hover:bg-primary/90"
          )}
        >
          {isSelected ? '✓ Selected' : 'Select Candidate'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CandidateCard;