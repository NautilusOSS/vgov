import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Users, Vote, TrendingUp, Clock } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  tooltip?: string | React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatsCard = ({
  title,
  value,
  icon,
  description,
  tooltip,
  trend,
}: StatsCardProps) => {
  const cardContent = (
    <Card className="transition-all duration-300 hover:shadow-voi">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div
            className={`flex items-center text-xs mt-2 ${
              trend.isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            <TrendingUp size={12} className="mr-1" />
            {trend.isPositive ? "+" : ""}
            {trend.value}% from last month
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{cardContent}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
};

interface ElectionStatsProps {
  totalCandidates: number;
  totalVoters: number;
  participationRate: number;
  votesRemaining: number;
}

const ElectionStats = ({
  totalCandidates,
  totalVoters,
  participationRate,
  votesRemaining,
}: ElectionStatsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Candidates"
        value={totalCandidates}
        icon={<Vote size={20} />}
        description="Running for council"
      />
      <StatsCard
        title="Votes Remaining"
        value={votesRemaining}
        icon={<Clock size={20} />}
        description={`You can vote for ${votesRemaining} more candidates`}
      />
      <StatsCard
        title="Total Voters"
        value={totalVoters.toLocaleString()}
        icon={<Users size={20} />}
        description="Registered voters"
      />
      <StatsCard
        title="Participation Rate"
        value={`${participationRate}%`}
        icon={<TrendingUp size={20} />}
        description="Election participation"
        tooltip={
          <div>
            The percentage of voters who have cast their <br />
            votes based on 2000 voters
          </div>
        }
      />
    </div>
  );
};

export default ElectionStats;
