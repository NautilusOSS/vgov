import { useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Wallet, CheckCircle, Copy, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AccountSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccountSelectModal = ({ isOpen, onClose }: AccountSelectModalProps) => {
  const { activeAccount, activeWalletAccounts, activeWallet } = useWallet();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyAddress = async (address: string) => {
    console.log('Attempting to copy address:', address);
    
    try {
      // Clear clipboard first (if possible)
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(''); // Clear clipboard
          console.log('Clipboard cleared');
        } catch (e) {
          console.log('Could not clear clipboard');
        }
      }
      
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        console.log('Using modern clipboard API');
        await navigator.clipboard.writeText(address);
        console.log('Clipboard API success');
      } else {
        console.log('Using fallback method');
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = address;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        textArea.style.opacity = '0';
        textArea.style.pointerEvents = 'none';
        document.body.appendChild(textArea);
        
        // Clear any existing selection
        if (window.getSelection) {
          window.getSelection()?.removeAllRanges();
        }
        
        textArea.focus();
        textArea.select();
        textArea.setSelectionRange(0, 99999); // For mobile devices
        
        const successful = document.execCommand('copy');
        console.log('execCommand result:', successful);
        
        // Clean up
        if (window.getSelection) {
          window.getSelection()?.removeAllRanges();
        }
        document.body.removeChild(textArea);
        
        if (!successful) {
          throw new Error('execCommand failed');
        }
      }
      
      console.log('Copy successful, showing toast');
      
      // Verify the copy worked by reading from clipboard (if possible)
      if (navigator.clipboard && window.isSecureContext) {
        try {
          const clipboardText = await navigator.clipboard.readText();
          console.log('Clipboard contains:', clipboardText);
          console.log('Copy verification:', clipboardText === address ? 'SUCCESS' : 'FAILED');
        } catch (e) {
          console.log('Could not verify clipboard content');
        }
      }
      
      // Small delay to ensure copy operation is complete
      setTimeout(() => {
        toast({
          title: "Address Copied",
          description: "Wallet address copied to clipboard",
        });
      }, 100);
    } catch (error) {
      console.error('Failed to copy address:', error);
      toast({
        title: "Copy Failed",
        description: "Failed to copy address to clipboard",
        variant: "destructive",
      });
    }
  };

  const selectAccount = (account: any) => {
    activeWallet?.setActiveAccount(account.address);
    toast({
      title: "Account Selected",
      description: `Switched to ${truncateAddress(account.address)}`,
    });
    onClose();
  };

  // Filter accounts based on search term
  const filteredAccounts = activeWalletAccounts?.filter((account) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      account.address.toLowerCase().includes(searchLower) ||
      truncateAddress(account.address).toLowerCase().includes(searchLower)
    );
  }) || [];

  if (!activeWalletAccounts || activeWalletAccounts.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md h-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Select Account
          </DialogTitle>
          <DialogDescription>
            Choose which account to use for transactions and voting.
          </DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="px-1 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Scrollable Account List */}
        <div className="flex-1 overflow-y-auto space-y-3 px-1">
          {filteredAccounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No accounts found
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Try adjusting your search terms
              </p>
            </div>
          ) : (
            filteredAccounts.map((account, index) => {
              const isActive = account.address === activeAccount?.address;

            return (
              <div
                key={account.address}
                className={`border rounded-lg p-4 transition-all ${
                  isActive
                    ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      <Wallet className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">
                          Account {index + 1}
                        </h3>
                        {isActive && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-green-500/10 text-green-700 border-green-500/20"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">
                        {truncateAddress(account.address)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {truncateAddress(account.address)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyAddress(account.address)}
                      title="Copy Address"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>

                    {isActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="text-xs"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Button>
                    ) : (
                      <Button
                        onClick={() => selectAccount(account)}
                        size="sm"
                        className="text-xs bg-voi-gradient hover:opacity-90"
                      >
                        <Wallet className="h-3 w-3 mr-1" />
                        Select
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
            })
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            {searchTerm ? (
              <>
                {filteredAccounts.length} of {activeWalletAccounts.length} account{activeWalletAccounts.length !== 1 ? 's' : ''}
              </>
            ) : (
              <>
                Total: {activeWalletAccounts.length} account{activeWalletAccounts.length !== 1 ? 's' : ''}
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={async () => {
                try {
                  if (navigator.clipboard && window.isSecureContext) {
                    const text = await navigator.clipboard.readText();
                    console.log('Current clipboard content:', text);
                    alert(`Current clipboard: ${text}`);
                  } else {
                    alert('Clipboard API not available');
                  }
                } catch (e) {
                  console.error('Failed to read clipboard:', e);
                  alert('Failed to read clipboard');
                }
              }} 
              size="sm"
            >
              Test Clipboard
            </Button>
            <Button variant="ghost" onClick={onClose} size="sm">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccountSelectModal;
