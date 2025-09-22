import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle, User, ExternalLink } from 'lucide-react';

interface VoteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: {
    id: string;
    name: string;
    description: string;
  };
  transactionHash: string;
  onVoteMore: () => void;
}

const VoteConfirmationModal = ({
  isOpen,
  onClose,
  candidate,
  transactionHash,
  onVoteMore
}: VoteConfirmationModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <DialogTitle className="text-xl font-semibold">
            Vote Cast Successfully!
          </DialogTitle>
          
          <DialogDescription className="text-center">
            Your vote has been recorded on the blockchain
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Candidate Info */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Avatar className="h-12 w-12 bg-primary/10 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary">
                <User size={20} />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{candidate.name}</p>
              <Badge variant="secondary" className="mt-1 text-xs">
                ✓ Voted
              </Badge>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
            <p className="text-sm font-medium">Transaction Details</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Transaction Hash:</span>
              <div className="flex items-center gap-1">
                <span className="text-xs font-mono">{transactionHash.slice(0, 8)}...{transactionHash.slice(-6)}</span>
                <ExternalLink className="w-3 h-3 text-muted-foreground" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Status:</span>
              <Badge variant="default" className="text-xs">
                Confirmed
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
          <Button onClick={onVoteMore} className="flex-1 bg-voi-gradient hover:opacity-90">
            Vote for More
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoteConfirmationModal;