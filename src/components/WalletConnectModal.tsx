import { useState } from "react";
import { useWallet, NetworkId } from "@txnlab/use-wallet-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  createFundedAccount,
  createLocalnetAlgodClient,
  isLocalnetAvailable,
} from "@/utils/localnet";
import { CONTRACT } from "ulujs";
import { getATokenAppId, getGovernanceAppId } from "@/constants/appIds";
import { APP_SPEC as ATokenAppSpec } from "@/clients/ATokenClient";
import algosdk from "algosdk";

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WalletConnectModal = ({ isOpen, onClose }: WalletConnectModalProps) => {
  const {
    wallets,
    activeWallet,
    activeAccount,
    activeNetwork,
    setActiveNetwork,
    signTransactions,
  } = useWallet();
  console.log({ wallets, activeWallet, activeAccount });
  const { toast } = useToast();
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [creatingDevAccount, setCreatingDevAccount] = useState(false);

  const handleWalletConnect = async (walletId: string) => {
    try {
      setConnectingWallet(walletId);

      // Special handling for mnemonic wallet (Developer Mode)
      if (walletId === "mnemonic") {
        await handleMnemonicConnection();
        return;
      }

      const wallet = wallets.find((w) => w.id === walletId);
      if (wallet) {
        await wallet.connect();
      }

      toast({
        title: "Wallet Connected",
        description: "Successfully connected to Voi Network",
      });

      onClose();
    } catch (error) {
      console.error("Wallet connection failed:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConnectingWallet(null);
    }
  };

  const handleMnemonicConnection = async () => {
    try {
      setCreatingDevAccount(true);

      // Show progress toast
      toast({
        title: "Creating Dev Account",
        description: "Generating new account and funding it...",
      });

      // Check if localnet is available
      const isAvailable = await isLocalnetAvailable();
      if (!isAvailable) {
        throw new Error(
          "Localnet is not available. Please make sure your local Algorand node is running on localhost:4001"
        );
      }

      const algod = createLocalnetAlgodClient();

      // Create and fund account
      const { account, funding } = await createFundedAccount(50_001e6); // 50,000 VOI

      const acc = algosdk.mnemonicToSecretKey(account.mnemonic);

      const ci = new CONTRACT(
        getATokenAppId(NetworkId.LOCALNET),
        algod,
        undefined,
        { ...ATokenAppSpec.contract, events: [] },
        { addr: account.address, sk: account.secretKey }
      );

      const mintR = await ci.mint(50_000e6);

      console.log("mintR", mintR);

      const stxns = await mintR.txns
        .map(
          (txn: string) =>
            new Uint8Array(
              atob(txn)
                .split("")
                .map((char) => char.charCodeAt(0))
            )
        )
        .map(algosdk.decodeUnsignedTransaction)
        .map((txn: any) => algosdk.signTransaction(txn, acc.sk));

      await algod.sendRawTransaction(stxns.map((txn: any) => txn.blob)).do();

      const arc200_balanceOfR = await ci.arc200_balanceOf(account.address);
      console.log("arc200_balanceOfR", arc200_balanceOfR);

      // Store the mnemonic in localStorage for wallet connection
      localStorage.setItem("@txnlab/use-wallet:v3_mnemonic", account.mnemonic);

      // Switch to localnet network
      setActiveNetwork(NetworkId.LOCALNET);

      // Find and connect the mnemonic wallet
      const mnemonicWallet = wallets.find((w) => w.id === "mnemonic");
      if (!mnemonicWallet) {
        throw new Error("Mnemonic wallet not found");
      }

      await mnemonicWallet.connect();

      console.log("Created localnet account:", account.address);
      console.log("Mnemonic:", account.mnemonic);
      console.log("Funding result:", funding);

      // Show success message
      if (funding.success) {
        toast({
          title: "Dev Account Created",
          description: `Account created and funded with 1 ALGO! Address: ${account.address.slice(
            0,
            6
          )}...${account.address.slice(-4)}`,
        });
      } else {
        toast({
          title: "Dev Account Created",
          description: `Account created! Note: Funding failed: ${funding.error}`,
          variant: "destructive",
        });
      }

      onClose();
    } catch (error) {
      console.error("Failed to create dev account:", error);
      toast({
        title: "Account Creation Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create dev account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingDevAccount(false);
    }
  };

  const getWalletIcon = (walletId: string) => {
    const wallet = wallets.find((w) => w.id === walletId);
    switch (walletId) {
      case "mnemonic":
        return "🎮";
      default:
        return (
          <img
            src={wallet?.metadata.icon}
            alt={wallet?.metadata.name}
            className="w-10 h-10 border-2 border-white/20 rounded-full"
          />
        );
    }
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
        return "Developer Mode";
      default:
        return walletId;
    }
  };

  const getWalletDescription = (walletId: string) => {
    switch (walletId) {
      case "pera":
        return "Popular Algorand wallet with mobile and web support";
      case "defly":
        return "Multi-chain wallet with DeFi features";
      case "kibisis":
        return "Lightweight wallet for Algorand ecosystem";
      case "lute":
        return "Secure wallet with advanced features";
      case "biatec":
        return "Enterprise-grade wallet solution";
      case "walletconnect":
        return "Connect any WalletConnect compatible wallet";
      case "mnemonic":
        return "Connect in Developer Mode";
      default:
        return "Connect your wallet to participate in voting";
    }
  };

  const isWalletConnected = (walletId: string) => {
    return activeWallet?.id === walletId && activeAccount;
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect Wallet
          </DialogTitle>
          <DialogDescription>
            Choose a wallet to connect to the Voi Network and participate in
            governance voting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {wallets.map((wallet) => {
            const isConnected = isWalletConnected(wallet.id);
            const isConnecting = connectingWallet === wallet.id;

            return (
              <div
                key={wallet.id}
                className={`relative border rounded-lg p-4 transition-all ${
                  isConnected
                    ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getWalletIcon(wallet.id)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">
                          {getWalletName(wallet.id)}
                        </h3>
                        {isConnected && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-green-500/10 text-green-700 border-green-500/20"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getWalletDescription(wallet.id)}
                      </p>
                      {isConnected && activeAccount && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-mono">
                          {truncateAddress(activeAccount.address)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isConnected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="text-xs"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleWalletConnect(wallet.id)}
                        disabled={isConnecting || creatingDevAccount}
                        size="sm"
                        className="text-xs bg-voi-gradient hover:opacity-90"
                      >
                        {isConnecting || creatingDevAccount ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            {wallet.id === "mnemonic"
                              ? "Creating Account..."
                              : "Connecting..."}
                          </>
                        ) : (
                          <>
                            <Wallet className="h-3 w-3 mr-1" />
                            Connect
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Your wallet will be used to sign transactions
            </div>
          </div>
          <Button variant="ghost" onClick={onClose} size="sm">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletConnectModal;
