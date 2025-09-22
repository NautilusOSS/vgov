import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import ElectionStats from '@/components/ElectionStats';
import CandidateCard from '@/components/CandidateCard';
import CombinedStakingCard from '@/components/CombinedStakingCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter } from 'lucide-react';

// Mock candidates - in real app this would come from your backend
const mockCandidates = [
  {
    id: '1',
    name: 'Sarah Chen',
    description: 'Former core developer at major DeFi protocols with 8+ years experience in blockchain technology. Focused on technical excellence and community-driven development.',
    votes: 234,
    twitterUrl: 'https://twitter.com/sarahchen_dev',
    discordUrl: 'https://discord.gg/sarahchen'
  },
  {
    id: '2',
    name: 'Marcus Rodriguez',
    description: 'Leading security expert specializing in smart contract auditing and protocol security. Has secured over $2B in DeFi protocols.',
    votes: 198,
    twitterUrl: 'https://twitter.com/marcus_security',
    discordUrl: 'https://discord.gg/marcusrodriguez'
  },
  {
    id: '3',
    name: 'Aisha Patel',
    description: 'Passionate about blockchain education and community building. Has grown multiple Web3 communities from zero to thousands of active members.',
    votes: 167,
    twitterUrl: 'https://twitter.com/aisha_web3',
    discordUrl: 'https://discord.gg/aishapatel'
  },
  {
    id: '4',
    name: 'David Kim',
    description: 'PhD in Economics with focus on cryptocurrency markets and tokenomics design. Previously advised multiple successful DeFi protocols.',
    votes: 189,
    twitterUrl: 'https://twitter.com/david_tokenomics',
    discordUrl: 'https://discord.gg/davidkim'
  },
  {
    id: '5',
    name: 'Elena Kowalski',
    description: 'Blockchain lawyer specializing in DeFi regulations and compliance. Helps navigate the evolving regulatory landscape.',
    votes: 145,
    twitterUrl: 'https://twitter.com/elena_defilaw',
    discordUrl: 'https://discord.gg/elenakowalski'
  },
  {
    id: '6',
    name: 'James Thompson',
    description: 'Expert in blockchain infrastructure and node operations. Built scalable systems for major Layer 1 and Layer 2 protocols.',
    votes: 156,
    twitterUrl: 'https://twitter.com/james_infra',
    discordUrl: 'https://discord.gg/jamesthompson'
  },
  {
    id: '7',
    name: 'Maria Santos',
    description: 'Product leader focused on user experience in DeFi. Led product development for consumer-facing blockchain applications.',
    votes: 134,
    twitterUrl: 'https://twitter.com/maria_ux',
    discordUrl: 'https://discord.gg/mariasantos'
  },
  {
    id: '8',
    name: 'Ahmed Hassan',
    description: 'Blockchain researcher working on consensus mechanisms and scalability solutions. Published numerous papers on distributed systems.',
    votes: 178,
    twitterUrl: 'https://twitter.com/ahmed_research',
    discordUrl: 'https://discord.gg/ahmedhassan'
  },
  {
    id: '9',
    name: 'Lisa Wang',
    description: 'Business development expert with track record of growing blockchain startups. Specialized in partnerships and ecosystem development.',
    votes: 123,
    twitterUrl: 'https://twitter.com/lisa_bizdev',
    discordUrl: 'https://discord.gg/lisawang'
  },
  {
    id: '10',
    name: 'Robert Johnson',
    description: 'Former traditional finance executive turned DeFi expert. Specialized in treasury management and risk assessment for DAOs.',
    votes: 142,
    twitterUrl: 'https://twitter.com/robert_defi',
    discordUrl: 'https://discord.gg/robertjohnson'
  }
];

const MAX_VOTES = 5;

const Index = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress] = useState('0x742d35cc6bf5b46c1d...89a2');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  
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
    setSelectedCandidates(new Set()); // Clear votes when unstaking
    
    toast({
      title: "Unstaking Successful!",
      description: "50,000 VOI has been returned to your wallet.",
    });
  };

  const handleCandidateVote = (candidateId: string) => {
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

    const newSelected = new Set(selectedCandidates);
    
    if (newSelected.has(candidateId)) {
      newSelected.delete(candidateId);
      toast({
        title: "Candidate Deselected",
        description: `You have ${MAX_VOTES - newSelected.size} votes remaining.`,
      });
    } else if (newSelected.size < MAX_VOTES) {
      newSelected.add(candidateId);
      toast({
        title: "Candidate Selected",
        description: `You have ${MAX_VOTES - newSelected.size} votes remaining.`,
      });
    } else {
      toast({
        title: "Maximum Votes Reached",
        description: `You can only vote for ${MAX_VOTES} candidates. Deselect a candidate first.`,
        variant: "destructive"
      });
      return;
    }
    
    setSelectedCandidates(newSelected);
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
    votesRemaining: MAX_VOTES - selectedCandidates.size
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
          
          {isConnected && isStaked && selectedCandidates.size > 0 && (
            <Button className="bg-voi-gradient hover:opacity-90">
              Submit Votes ({selectedCandidates.size}/{MAX_VOTES})
            </Button>
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
                  onVote={handleCandidateVote}
                  canVote={isStaked && (selectedCandidates.has(candidate.id) || selectedCandidates.size < MAX_VOTES)}
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
    </div>
  );
};

export default Index;
