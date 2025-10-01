import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  Twitter,
  MessageCircle,
  ExternalLink,
  User,
  Github,
  MapPin,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileMetadata {
  bio?: string;
  avatar?: string;
  banner?: string;
  location?: string;
  background?: string;
  twitter?: string;
  github?: string;
  url?: string;
  "com.twitter"?: string;
  "com.github"?: string;
}

interface ProfileData {
  name: string;
  address: string;
  metadata: ProfileMetadata;
  cached: boolean;
}

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
  profile?: ProfileData;
  showButtons?: boolean;
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
  isVotingPeriodOpen = true,
  profile,
  showButtons = false,
}: CandidateCardProps) => {
  const votePercentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;

  const handleCardClick = () => {
    if (canSelect && !isVoting && !isVoted) {
      onSelect?.(id);
    }
  };

  console.log({ profile });

  const getTwitterUrl = () => {
    // Check profile metadata first

    const mTwitterUrl =
      profile?.metadata?.twitter || profile?.metadata?.["com.twitter"];

    if (String(mTwitterUrl).match(/^@?[a-zA-Z0-9_]+$/)) {
      return mTwitterUrl;
    }

    // If no handle in metadata, try to extract from twitterUrl
    if (mTwitterUrl) {
      // Handle different URL formats
      if (mTwitterUrl.includes("twitter.com/")) {
        // Extract handle from full URL
        const match = mTwitterUrl.match(/twitter\.com\/([^/?]+)/);
        return match ? match[1] : null;
      } else if (mTwitterUrl.includes("x.com/")) {
        // Extract handle from X.com URL
        const match = mTwitterUrl.match(/x\.com\/([^/?]+)/);
        return match ? match[1] : null;
      } else if (mTwitterUrl.includes("@")) {
        // Extract handle after @ symbol
        const match = mTwitterUrl.match(/@([^/\s]+)/);
        return match ? match[1] : null;
      } else {
        // Assume it's already a handle
        return mTwitterUrl;
      }
    }

    return null;
  };

  return (
    <Card
      className={cn(
        "transition-all duration-300 hover:shadow-voi border-border/50",
        isSelected && !isVoted && "ring-2 ring-primary bg-primary/5",
        isVoted && "ring-2 ring-green-500 bg-green-500/5",
        isVoting && "ring-2 ring-blue-500 bg-blue-500/5",
        canSelect &&
          !isVoting &&
          !isVoted &&
          "cursor-pointer hover:scale-[1.02] hover:shadow-lg",
        (!canSelect || isVoting || isVoted) && "cursor-default"
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            {/* Profile Picture */}
            <Avatar className="h-16 w-16 bg-primary/10 border-2 border-primary/20">
              {profile?.metadata?.avatar ? (
                <AvatarImage src={profile.metadata.avatar} alt={name} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary">
                <User size={24} />
              </AvatarFallback>
            </Avatar>

            {/* Name and Social Links */}
            <div className="space-y-2 flex-1">
              <CardTitle className="text-xl font-semibold">{name}</CardTitle>
              {profile?.metadata?.location && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin size={14} />
                  {profile.metadata.location}
                </div>
              )}
              <div className="flex items-center gap-3">
                {getTwitterUrl() && (
                  <a
                    href={`https://x.com/${getTwitterUrl()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Twitter size={16} />
                  </a>
                )}
                {(profile?.metadata?.github ||
                  profile?.metadata?.["com.github"]) && (
                  <a
                    href={`https://github.com/${
                      profile?.metadata?.github ||
                      profile?.metadata?.["com.github"]
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Github size={16} />
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
                  </a>
                )}
                {profile?.metadata?.url && (
                  <a
                    href={profile.metadata.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`https://app.envoi.sh/#/${name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => e.stopPropagation()}
              title="View on Envoi"
            >
              <Globe size={16} />
            </a>
            {isVoted && (
              <Badge className="bg-green-500 text-white">✓ Vote Cast</Badge>
            )}
            {isVoting && (
              <Badge className="bg-blue-500 text-white">Voting...</Badge>
            )}
            {isSelected && !isVoted && !isVoting && (
              <Badge className="bg-primary text-primary-foreground">
                ✓ Selected
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Bio:</p>
          <CardDescription className="text-sm leading-relaxed">
            {profile?.metadata?.bio || description}
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

        {/* Selection Status */}
        {showButtons && (
          <div
            className={cn(
              "text-center py-2 px-4 rounded-lg font-medium text-sm transition-colors",
              isVoting && "bg-blue-500/10 text-blue-600",
              isVoted && "bg-green-500/10 text-green-600",
              isSelected && !isVoted && "bg-primary/10 text-primary",
              !isSelected &&
                !isVoted &&
                !isVoting &&
                canSelect &&
                "text-muted-foreground",
              !canSelect && "text-muted-foreground/50"
            )}
          >
            {isVoting
              ? "Processing Vote..."
              : isVoted
              ? "✓ Vote Cast"
              : isSelected
              ? "✓ Selected"
              : canSelect
              ? "Click to select"
              : "Cannot select"}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CandidateCard;
