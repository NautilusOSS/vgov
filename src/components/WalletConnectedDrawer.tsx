import { useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Power,
  Copy,
  ExternalLink,
  CheckCircle,
  ArrowRightLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AccountSelectModal from "./AccountSelectModal";

interface WalletConnectedDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onDisconnect: () => void;
}

const WalletConnectedDrawer = ({
  isOpen,
  onClose,
  onDisconnect,
}: WalletConnectedDrawerProps) => {
  const { activeWallet, activeAccount, activeNetwork, activeWalletAccounts } =
    useWallet();
  const { toast } = useToast();
  const [showAccountModal, setShowAccountModal] = useState(false);

  // Debug logging
  console.log("WalletConnectedDrawer - accounts:", activeWalletAccounts);
  console.log(
    "WalletConnectedDrawer - accounts length:",
    activeWalletAccounts?.length
  );

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyAddress = async () => {
    if (activeAccount?.address) {
      console.log('Attempting to copy address:', activeAccount.address);
      console.log('navigator.clipboard available:', !!navigator.clipboard);
      console.log('isSecureContext:', window.isSecureContext);
      
      try {
        // Try modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
          console.log('Using modern clipboard API');
          await navigator.clipboard.writeText(activeAccount.address);
          console.log('Clipboard API success');
        } else {
          console.log('Using fallback method');
          // Fallback for older browsers or non-secure contexts
          const textArea = document.createElement('textarea');
          textArea.value = activeAccount.address;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          textArea.setSelectionRange(0, 99999); // For mobile devices
          
          const successful = document.execCommand('copy');
          console.log('execCommand result:', successful);
          textArea.remove();
          
          if (!successful) {
            throw new Error('execCommand failed');
          }
        }
        
        console.log('Copy successful, showing toast');
        // Small delay to ensure copy operation is complete
        setTimeout(() => {
          toast({
            title: "Address Copied",
            description: "Wallet address copied to clipboard",
          });
        }, 100);
      } catch (error) {
        console.error('Failed to copy address:', error);
        
        // Last resort: show the address in a prompt for manual copying
        const shouldShowPrompt = window.confirm(
          `Copy failed. Would you like to see the address to copy manually?\n\nAddress: ${activeAccount.address}`
        );
        
        if (shouldShowPrompt) {
          // Create a temporary input to help with manual copying
          const tempInput = document.createElement('input');
          tempInput.value = activeAccount.address;
          tempInput.style.position = 'fixed';
          tempInput.style.top = '50%';
          tempInput.style.left = '50%';
          tempInput.style.transform = 'translate(-50%, -50%)';
          tempInput.style.zIndex = '9999';
          tempInput.style.padding = '10px';
          tempInput.style.border = '2px solid #ccc';
          tempInput.style.borderRadius = '4px';
          tempInput.style.fontSize = '14px';
          tempInput.style.width = '300px';
          document.body.appendChild(tempInput);
          tempInput.focus();
          tempInput.select();
          
          setTimeout(() => {
            document.body.removeChild(tempInput);
          }, 5000);
        }
        
        toast({
          title: "Copy Failed",
          description: "Failed to copy address to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  const openAccountModal = () => {
    setShowAccountModal(true);
  };

  const getWalletName = (walletId: string) => {
    switch (walletId) {
      case "pera":
        return "Pera Wallet";
      case "defly":
        return "Defly Wallet";
      case "kibisis":
        return "Kibisis Wallet";
      case "lute":
        return "Lute Wallet";
      case "biatec":
        return "Biatec Wallet";
      case "walletconnect":
        return "WalletConnect";
      case "mnemonic":
        return "Embedded Wallet";
      default:
        return walletId;
    }
  };

  const handleDisconnect = () => {
    onDisconnect();
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Connected
          </DrawerTitle>
          <DrawerDescription>
            Manage your wallet connection and view account details.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 px-4 space-y-6">
          {/* Wallet Info */}
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Connected Wallet</h3>
                <Badge
                  variant="secondary"
                  className="text-xs bg-green-500/10 text-green-700 border-green-500/20"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Wallet</span>
                  <span className="text-sm font-medium">
                    {getWalletName(activeWallet?.id || "")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Network</span>
                  <span className="text-sm font-medium">
                    Voi Mainnet
                  </span>
                </div>
              </div>
            </div>

            {/* Address Info */}
            {activeAccount && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Account Address</h3>
                  <Badge variant="outline" className="text-xs">
                    {activeWalletAccounts
                      ? `${activeWalletAccounts.length} account${
                          activeWalletAccounts.length !== 1 ? "s" : ""
                        }`
                      : "No accounts data"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-mono break-all">
                      {activeAccount.address}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {truncateAddress(activeAccount.address)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openAccountModal}
                      title={`Switch Account (${
                        activeWalletAccounts?.length || 0
                      } accounts)`}
                    >
                      <ArrowRightLeft className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyAddress}
                      title="Copy Address"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Network Info */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-3">
                Network Information
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Network</span>
                  <span className="text-sm font-medium">
                    Voi Mainnet
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Chain ID
                  </span>
                  <span className="text-sm font-medium">
                    voi-mainnet
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                if (activeAccount?.address) {
                  const explorerUrl = `https://block.voi.network/explorer/account/${activeAccount.address}/transactions`;
                  window.open(explorerUrl, "_blank");
                }
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Voi Explorer
            </Button>

            <Button
              variant="destructive"
              className="w-full"
              onClick={handleDisconnect}
            >
              <Power className="h-4 w-4 mr-2" />
              Disconnect Wallet
            </Button>
          </div>
        </div>

        <div className="px-4 pb-4">
          <Button variant="ghost" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </DrawerContent>

      {/* Account Select Modal */}
      <AccountSelectModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
      />
    </Drawer>
  );
};

export default WalletConnectedDrawer;
