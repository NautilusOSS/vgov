import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import VoiLogo from './VoiLogo';
import { Wallet, User, Settings } from 'lucide-react';

interface HeaderProps {
  isConnected?: boolean;
  walletAddress?: string;
  onConnectWallet?: () => void;
  onDisconnect?: () => void;
}

const Header = ({
  isConnected = false,
  walletAddress,
  onConnectWallet,
  onDisconnect
}: HeaderProps) => {
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
            {/* Council Member Badge */}
            {isConnected && (
              <Badge variant="secondary" className="hidden sm:flex items-center gap-2">
                <User size={14} />
                Council Member
              </Badge>
            )}

            {/* Wallet Connection */}
            {isConnected ? (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex items-center gap-2"
                >
                  <Wallet size={16} />
                  {walletAddress ? truncateAddress(walletAddress) : 'Connected'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDisconnect}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Settings size={16} />
                </Button>
              </div>
            ) : (
              <Button
                onClick={onConnectWallet}
                className="bg-voi-gradient hover:opacity-90 transition-opacity"
              >
                <Wallet size={16} className="mr-2" />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;