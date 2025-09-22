import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import GovernanceStats from '@/components/GovernanceStats';
import ProposalCard from '@/components/ProposalCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Plus } from 'lucide-react';

// Mock data - in real app this would come from your backend
const mockProposals = [
  {
    id: '1',
    title: 'Increase Block Rewards for Validators',
    description: 'Proposal to increase the block rewards from 100 VOI to 150 VOI per block to incentivize more validators to participate in network security.',
    status: 'active' as const,
    votesFor: 1250,
    votesAgainst: 340,
    totalVotes: 1590,
    endDate: '2024-10-15T23:59:59Z'
  },
  {
    id: '2',
    title: 'Community Treasury Allocation',
    description: 'Allocate 500,000 VOI from the community treasury to fund educational initiatives and developer programs for the next quarter.',
    status: 'active' as const,
    votesFor: 890,
    votesAgainst: 210,
    totalVotes: 1100,
    endDate: '2024-10-20T23:59:59Z'
  },
  {
    id: '3',
    title: 'Network Fee Structure Update',
    description: 'Reduce transaction fees by 25% to improve user experience and encourage more adoption of the Voi Network.',
    status: 'passed' as const,
    votesFor: 1800,
    votesAgainst: 450,
    totalVotes: 2250,
    endDate: '2024-09-30T23:59:59Z'
  },
  {
    id: '4',
    title: 'Governance Token Staking Rewards',
    description: 'Implement staking rewards for governance token holders who participate in voting, providing 5% APY for active participants.',
    status: 'pending' as const,
    votesFor: 0,
    votesAgainst: 0,
    totalVotes: 0,
    endDate: '2024-11-01T23:59:59Z'
  }
];

const Index = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress] = useState('0x742d35cc6bf5b46c1d...89a2');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [userVotes, setUserVotes] = useState<Record<string, 'for' | 'against'>>({});
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
    setUserVotes({});
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  const handleVote = (proposalId: string, vote: 'for' | 'against') => {
    if (!isConnected) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet to vote",
        variant: "destructive"
      });
      return;
    }

    setUserVotes(prev => ({ ...prev, [proposalId]: vote }));
    toast({
      title: "Vote Submitted",
      description: `Your vote "${vote}" has been recorded for this proposal.`,
    });
  };

  const filteredProposals = mockProposals.filter(proposal => {
    const matchesSearch = proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && proposal.status === activeTab;
  });

  const stats = {
    totalProposals: mockProposals.length,
    activeProposals: mockProposals.filter(p => p.status === 'active').length,
    totalVoters: 2847,
    participationRate: 73
  };

  return (
    <div className="min-h-screen bg-voi-gradient-light">
      <Header
        isConnected={isConnected}
        walletAddress={walletAddress}
        onConnectWallet={handleConnectWallet}
        onDisconnect={handleDisconnect}
      />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-12">
          <h2 className="text-4xl font-bold bg-voi-gradient bg-clip-text text-transparent">
            Voi Network Council Governance
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Participate in the decentralized governance of Voi Network. 
            Vote on proposals that shape the future of our ecosystem.
          </p>
          {!isConnected && (
            <Button 
              onClick={handleConnectWallet}
              size="lg"
              className="bg-voi-gradient hover:opacity-90 transition-opacity shadow-voi"
            >
              Get Started - Connect Wallet
            </Button>
          )}
        </div>

        {/* Stats */}
        <GovernanceStats {...stats} />

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 items-center space-x-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Search proposals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter size={16} />
            </Button>
          </div>
          
          {isConnected && (
            <Button className="bg-voi-gradient hover:opacity-90">
              <Plus size={16} className="mr-2" />
              Create Proposal
            </Button>
          )}
        </div>

        {/* Proposals Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="all">All Proposals</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="passed">Passed</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {filteredProposals.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">No proposals found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {searchTerm ? 'Try adjusting your search terms' : 'Check back later for new proposals'}
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredProposals.map((proposal) => (
                  <ProposalCard
                    key={proposal.id}
                    {...proposal}
                    onVote={handleVote}
                    hasVoted={!!userVotes[proposal.id]}
                    userVote={userVotes[proposal.id]}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="text-center pt-12 pb-6 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            Powered by Voi Network • Decentralized Governance Platform
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
