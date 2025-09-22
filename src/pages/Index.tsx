import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import ElectionStats from '@/components/ElectionStats';
import CandidateCard from '@/components/CandidateCard';
import CombinedStakingCard from '@/components/CombinedStakingCard';
import VoteConfirmationModal from '@/components/VoteConfirmationModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter } from 'lucide-react';

// Mock candidates - in real app this would come from your backend
const mockCandidates = [
  {
    id: '1',
    name: '@Dotkoms',
    description: 'Experienced blockchain developer and community leader focused on decentralized governance and protocol development.',
    votes: 234,
    twitterUrl: 'https://twitter.com/Dotkoms',
    discordUrl: 'https://discord.gg/dotkoms'
  },
  {
    id: '2',
    name: '@CP85',
    description: 'Security-focused developer with expertise in smart contract auditing and blockchain infrastructure.',
    votes: 198,
    twitterUrl: 'https://twitter.com/CP85',
    discordUrl: 'https://discord.gg/cp85'
  },
  {
    id: '3',
    name: '@jzyeyo',
    description: 'Community builder and DeFi enthusiast passionate about growing the Voi Network ecosystem.',
    votes: 167,
    twitterUrl: 'https://twitter.com/jzyeyo',
    discordUrl: 'https://discord.gg/jzyeyo'
  },
  {
    id: '4',
    name: '@0xchickenjockey',
    description: 'Full-stack developer with deep knowledge of blockchain protocols and tokenomics design.',
    votes: 189,
    twitterUrl: 'https://twitter.com/0xchickenjockey',
    discordUrl: 'https://discord.gg/0xchickenjockey'
  },
  {
    id: '5',
    name: '@thorpesclothing',
    description: 'Business development expert with experience in partnerships and ecosystem growth strategies.',
    votes: 145,
    twitterUrl: 'https://twitter.com/thorpesclothing',
    discordUrl: 'https://discord.gg/thorpesclothing'
  },
  {
    id: '6',
    name: '@haroof',
    description: 'Infrastructure specialist focused on node operations and network scalability solutions.',
    votes: 156,
    twitterUrl: 'https://twitter.com/haroof',
    discordUrl: 'https://discord.gg/haroof'
  },
  {
    id: '7',
    name: '@.oh.hi.mark.',
    description: 'Product leader with extensive experience in user experience design for blockchain applications.',
    votes: 134,
    twitterUrl: 'https://twitter.com/.oh.hi.mark.',
    discordUrl: 'https://discord.gg/ohhimark'
  },
  {
    id: '8',
    name: '@Boganmeister',
    description: 'Blockchain researcher specializing in consensus mechanisms and distributed systems architecture.',
    votes: 178,
    twitterUrl: 'https://twitter.com/Boganmeister',
    discordUrl: 'https://discord.gg/boganmeister'
  },
  {
    id: '9',
    name: '@Pettytunah',
    description: 'DeFi expert with background in traditional finance and risk management for decentralized protocols.',
    votes: 123,
    twitterUrl: 'https://twitter.com/Pettytunah',
    discordUrl: 'https://discord.gg/pettytunah'
  }
];

const MAX_VOTES = 5;

const Index = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress] = useState('0x742d35cc6bf5b46c1d...89a2');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [votedCandidates, setVotedCandidates] = useState<Set<string>>(new Set());
  const [votingCandidates, setVotingCandidates] = useState<Set<string>>(new Set());
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [lastVotedCandidate, setLastVotedCandidate] = useState<any>(null);
  const [lastTransactionHash, setLastTransactionHash] = useState('');
  const [isVoteChange, setIsVoteChange] = useState(false);
  
  // Voting period state - ends 24 hours before election
  const [isVotingPeriodOpen, setIsVotingPeriodOpen] = useState(true);
  const votingDeadline = new Date('2024-10-14T23:59:59'); // 24 hours before election ends
  
  // Staking state
  const [voiBalance] = useState(75000); // Mock balance - user has enough
  const [stakedAmount, setStakedAmount] = useState(0);
  const [isStaked, setIsStaked] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const lockEndDate = new Date('2024-10-15T23:59:59');
  
  const { toast } = useToast();

  const handleConnectWallet = () => {
    setIsConnected(true);
    toast({
      title: "Wallet Connected",
      description: "Successfully connected to Voi Network",
    });
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setSelectedCandidates(new Set());
    setVotedCandidates(new Set());
    setVotingCandidates(new Set());
    setIsStaked(false);
    setStakedAmount(0);
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  const handleStake = async () => {
    setIsStaking(true);
    
    // Simulate staking transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setStakedAmount(50000);
    setIsStaked(true);
    setIsStaking(false);
    
    toast({
      title: "Staking Successful!",
      description: "50,000 VOI has been staked. You can now vote for candidates.",
    });
  };

  const handleUnstake = async () => {
    const now = new Date();
    const canUnstake = now > lockEndDate;
    
    if (!canUnstake) {
      toast({
        title: "Cannot Unstake Yet",
        description: "You can only unstake after the election period ends (Oct 15, 2024)",
        variant: "destructive"
      });
      return;
    }

    setIsUnstaking(true);
    
    // Simulate unstaking transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setStakedAmount(0);
    setIsStaked(false);
    setIsUnstaking(false);
    setSelectedCandidates(new Set()); // Clear selections when unstaking
    setVotedCandidates(new Set()); // Clear votes when unstaking
    
    toast({
      title: "Unstaking Successful!",
      description: "50,000 VOI has been returned to your wallet.",
    });
  };

  const handleCandidateSelect = (candidateId: string) => {
    if (!isConnected) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet to vote",
        variant: "destructive"
      });
      return;
    }

    if (!isStaked) {
      toast({
        title: "Staking Required",
        description: "Please stake 50,000 VOI to participate in voting",
        variant: "destructive"
      });
      return;
    }

    if (!isVotingPeriodOpen) {
      toast({
        title: "Voting Period Closed",
        description: "Vote changes are no longer allowed.",
        variant: "destructive"
      });
      return;
    }

    // Toggle selection
    setSelectedCandidates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(candidateId)) {
        newSet.delete(candidateId);
      } else {
        if (newSet.size >= MAX_VOTES) {
          toast({
            title: "Maximum Selections Reached",
            description: `You can only select ${MAX_VOTES} candidates.`,
            variant: "destructive"
          });
          return prev;
        }
        newSet.add(candidateId);
      }
      return newSet;
    });
  };

  const handleSubmitVotes = async () => {
    if (selectedCandidates.size === 0) {
      toast({
        title: "No Candidates Selected",
        description: "Please select at least one candidate to vote for.",
        variant: "destructive"
      });
      return;
    }

    const hasVoted = votedCandidates.size > 0;
    const isChangingVotes = hasVoted && Array.from(selectedCandidates).some(id => !votedCandidates.has(id)) || 
                            Array.from(votedCandidates).some(id => !selectedCandidates.has(id));

    setIsVoteChange(isChangingVotes);
    setVotingCandidates(new Set(selectedCandidates));
    
    try {
      // Simulate voting for all selected candidates
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate mock transaction hash
      const transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      // Update voted candidates (replace previous votes with new selection)
      setVotedCandidates(new Set(selectedCandidates));
      setVotingCandidates(new Set());
      setSelectedCandidates(new Set());
      
      // Show confirmation modal
      setLastVotedCandidate(Array.from(selectedCandidates));
      setLastTransactionHash(transactionHash);
      setShowConfirmationModal(true);
      
      if (isChangingVotes) {
        toast({
          title: "Votes Updated Successfully",
          description: "Your vote selection has been updated.",
        });
      }
      
    } catch (error) {
      setVotingCandidates(new Set());
      
      toast({
        title: "Vote Failed",
        description: "Transaction failed. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleVoteMore = () => {
    setShowConfirmationModal(false);
  };

  const totalVotes = mockCandidates.reduce((sum, candidate) => sum + candidate.votes, 0);
  
  const filteredCandidates = mockCandidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    totalCandidates: mockCandidates.length,
    totalVoters: 2847,
    participationRate: 73,
    votesRemaining: MAX_VOTES - votedCandidates.size
  };

  return (
    <div className="min-h-screen bg-voi-gradient-light">
      <Header
        isConnected={isConnected}
        walletAddress={walletAddress}
        isStaked={isStaked}
        stakedAmount={stakedAmount}
        onConnectWallet={handleConnectWallet}
        onDisconnect={handleDisconnect}
      />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-12">
          <h2 className="text-4xl font-bold bg-voi-gradient bg-clip-text text-transparent">
            Voi Network Council Elections
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Vote for up to 5 candidates to represent you on the Voi Network Council. 
            Shape the future of our decentralized ecosystem.
          </p>
          {!isConnected && (
            <Button 
              onClick={handleConnectWallet}
              size="lg"
              className="bg-voi-gradient hover:opacity-90 transition-opacity shadow-voi"
            >
              Connect Wallet to Vote
            </Button>
          )}
        </div>

        {/* Stats */}
        <ElectionStats {...stats} />

        {/* Staking Section */}
        {isConnected && (
          <CombinedStakingCard
            voiBalance={voiBalance}
            stakedAmount={stakedAmount}
            isStaked={isStaked}
            isStaking={isStaking}
            isUnstaking={isUnstaking}
            lockEndDate={lockEndDate}
            votesRemaining={stats.votesRemaining}
            onStake={handleStake}
            onUnstake={handleUnstake}
          />
        )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 items-center space-x-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter size={16} />
            </Button>
          </div>
          
          {isConnected && isStaked && (
            <div className="flex items-center gap-6">
              {selectedCandidates.size > 0 && (
                <Button 
                  onClick={handleSubmitVotes}
                  disabled={votingCandidates.size > 0 || !isVotingPeriodOpen}
                  size="lg"
                  className="bg-voi-gradient hover:opacity-90 px-10 py-4 text-lg font-semibold"
                >
                  {votingCandidates.size > 0 ? 'Processing...' : 
                   votedCandidates.size > 0 ? `Update ${selectedCandidates.size} Vote${selectedCandidates.size === 1 ? '' : 's'}` :
                   `Submit ${selectedCandidates.size} Vote${selectedCandidates.size === 1 ? '' : 's'}`}
                </Button>
              )}
              {votedCandidates.size > 0 && selectedCandidates.size === 0 && isVotingPeriodOpen && (
                <div className="text-base text-blue-600 dark:text-blue-400 font-medium">
                  Select candidates to change your votes
                </div>
              )}
              <div className="text-base text-muted-foreground font-medium">
                Selected: {selectedCandidates.size}/{MAX_VOTES} • Voted: {votedCandidates.size}/{MAX_VOTES}
                {!isVotingPeriodOpen && (
                  <span className="text-red-500 ml-2">• Voting Closed</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Candidates Section */}
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-semibold mb-2">Council Candidates</h3>
            <p className="text-muted-foreground">
              Select up to {MAX_VOTES} candidates to represent your interests on the Voi Network Council
            </p>
          </div>

          {filteredCandidates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">No candidates found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your search terms
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredCandidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  {...candidate}
                  totalVotes={totalVotes}
                  isSelected={selectedCandidates.has(candidate.id)}
                  isVoted={votedCandidates.has(candidate.id)}
                  isVoting={votingCandidates.has(candidate.id)}
                  onSelect={handleCandidateSelect}
                  canSelect={isStaked && isVotingPeriodOpen}
                  isVotingPeriodOpen={isVotingPeriodOpen}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center pt-12 pb-6 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            Powered by Voi Network • Council Elections Platform
          </p>
        </footer>
      </main>

      {/* Vote Confirmation Modal */}
      {showConfirmationModal && lastVotedCandidate && (
        <VoteConfirmationModal
          isOpen={showConfirmationModal}
          onClose={() => setShowConfirmationModal(false)}
          candidate={lastVotedCandidate}
          transactionHash={lastTransactionHash}
          onVoteMore={handleVoteMore}
          isVoteChange={isVoteChange}
        />
      )}
    </div>
  );
};

export default Index;
