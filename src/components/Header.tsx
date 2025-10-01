import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import VoiLogo from './VoiLogo';
import WalletConnectModal from './WalletConnectModal';
import WalletConnectedDrawer from './WalletConnectedDrawer';
import { Wallet, User, Lock } from 'lucide-react';

interface HeaderProps {
  isConnected?: boolean;
  walletAddress?: string;
  isStaked?: boolean;
  stakedAmount?: number;
  onConnectWallet?: () => void;
  onDisconnect?: () => void;
}

const Header = ({
  isConnected = false,
  walletAddress,
  isStaked = false,
  stakedAmount = 0,
  onConnectWallet,
  onDisconnect
}: HeaderProps) => {
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showConnectedDrawer, setShowConnectedDrawer] = useState(false);
  
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleConnectWallet = () => {
    setShowWalletModal(true);
  };

  const handleConnectedWalletClick = () => {
    setShowConnectedDrawer(true);
  };

  return (
    <header className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <VoiLogo size="md" />
            <div>
              <h1 className="text-xl font-bold bg-voi-gradient bg-clip-text text-transparent">
                Council Governance
              </h1>
              <p className="text-sm text-muted-foreground">
                Decentralized voting platform
              </p>
            </div>
          </div>

          {/* Navigation and Wallet */}
          <div className="flex items-center space-x-4">
            {/* Staking Status Badge */}
            {isConnected && isStaked && (
              <Badge variant="secondary" className="hidden sm:flex items-center gap-2 bg-green-500/10 text-green-700 border-green-500/20">
                <Lock size={14} />
                {stakedAmount.toLocaleString()} VOI Staked
              </Badge>
            )}
            
            {/* Voting Eligible Badge */}
            {isConnected && isStaked && (
              <Badge variant="secondary" className="hidden lg:flex items-center gap-2">
                <User size={14} />
                Voting Eligible
              </Badge>
            )}

            {/* Wallet Connection */}
            {isConnected ? (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={handleConnectedWalletClick}
              >
                <Wallet size={16} />
                {walletAddress ? truncateAddress(walletAddress) : 'Connected'}
              </Button>
            ) : (
              <Button
                onClick={handleConnectWallet}
                className="bg-voi-gradient hover:opacity-90 transition-opacity"
              >
                <Wallet size={16} className="mr-2" />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Wallet Connect Modal */}
      <WalletConnectModal 
        isOpen={showWalletModal} 
        onClose={() => setShowWalletModal(false)} 
      />
      
      {/* Wallet Connected Drawer */}
      <WalletConnectedDrawer 
        isOpen={showConnectedDrawer} 
        onClose={() => setShowConnectedDrawer(false)}
        onDisconnect={onDisconnect || (() => {})}
      />
    </header>
  );
};

export default Header;