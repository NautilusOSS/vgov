import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import ElectionStats from "@/components/ElectionStats";
import CandidateCard from "@/components/CandidateCard";
import CombinedStakingCard from "@/components/CombinedStakingCard";
import VoteConfirmationModal from "@/components/VoteConfirmationModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Search, Filter, Users } from "lucide-react";
import { useWallet, NetworkId } from "@txnlab/use-wallet-react";
import { getATokenAppId, getGovernanceAppId } from "@/constants/appIds";
import { CONTRACT, abi } from "ulujs";
import { createLocalnetAlgodClient } from "@/utils/localnet";
import { APP_SPEC as ATokenAppSpec } from "@/clients/ATokenClient";
import { APP_SPEC as PowGovernanceAppSpec } from "@/clients/PowGovernanceClient";
import algosdk from "algosdk";
import {
  lockPower,
  getVoter,
  castVote,
  endorseCandidates,
  VOTE_YES,
  decodeVoter,
} from "@/utils/command";
import { namehash } from "@/utils/namehash";
import { ElectionInfoService } from "@/services/electionInfoService";

function stripTrailingZeroBytes(input: string): string {
  return input.replace(/\0+$/, "");
}

interface PowerLock {
  power_source_id: number;
  power_source_amount: number;
  power_source_unlock_timestamp: number;
  power_source_owner: string;
  power_granted: number;
  lockup_duration: number;
  lockup_bonus_multiplier: number;
}

interface PowerLockCreatedEvent {
  txid: string;
  round: number;
  timestamp: number;
  powerLock: PowerLock;
}

interface PowerLockUnlockedEvent {
  txid: string;
  round: number;
  timestamp: number;
  powerSourceId: number;
  powerUnlockTimestamp: number;
}

const decodePowerLockCreatedEvent = (
  powerLockCreatedEvent: any
): PowerLockCreatedEvent => {
  return {
    txid: powerLockCreatedEvent[0],
    round: Number(powerLockCreatedEvent[1]),
    timestamp: Number(powerLockCreatedEvent[2]),
    powerLock: {
      power_source_id: Number(powerLockCreatedEvent[3][0]),
      power_source_amount: Number(powerLockCreatedEvent[3][1]),
      power_source_unlock_timestamp: Number(powerLockCreatedEvent[3][2]),
      power_source_owner: powerLockCreatedEvent[3][3],
      power_granted: Number(powerLockCreatedEvent[3][4]),
      lockup_duration: Number(powerLockCreatedEvent[3][5]),
      lockup_bonus_multiplier: Number(powerLockCreatedEvent[3][6]),
    },
  };
};

const decodePowerLockUnlockedEvent = (
  powerLockUnlockedEvent: any
): PowerLockUnlockedEvent => {
  return {
    txid: powerLockUnlockedEvent[0],
    round: Number(powerLockUnlockedEvent[1]),
    timestamp: Number(powerLockUnlockedEvent[2]),
    powerSourceId: Number(powerLockUnlockedEvent[3]),
    powerUnlockTimestamp: Number(powerLockUnlockedEvent[4]),
  };
};

interface ElectionProposal {
  electionIndex: number;
  electionStatus: number;
  proposer: string;
  electionTitle: string;
  electionDescription: string;
  electionNode: string;
  createdAtTimestamp: number;
  electionStartTimestamp: number;
  electionEndTimestamp: number;
  endorsementCount: number;
  endorsementVotes: number;
  endorsementTimestamp: number;
}

export const decodeElectionProposal = (
  electionProposal: any
): ElectionProposal => {
  return {
    electionIndex: Number(electionProposal[0]),
    electionStatus: Number(electionProposal[1]),
    proposer: electionProposal[2],
    electionTitle: stripTrailingZeroBytes(
      new TextDecoder("utf-8").decode(electionProposal[3].buffer)
    ),
    electionDescription: stripTrailingZeroBytes(
      new TextDecoder("utf-8").decode(electionProposal[4].buffer)
    ),
    electionNode: Array.from(electionProposal[5])
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join(""),
    createdAtTimestamp: Number(electionProposal[6]),
    electionStartTimestamp: Number(electionProposal[7]),
    electionEndTimestamp: Number(electionProposal[8]),
    endorsementCount: Number(electionProposal[9]),
    endorsementVotes: Number(electionProposal[10]),
    endorsementTimestamp: Number(electionProposal[11]),
  };
};

// Types for election data
interface ProfileMetadata {
  bio?: string;
  avatar?: string;
  banner?: string;
  location?: string;
  background?: string;
  twitter?: string;
  github?: string;
  "com.twitter"?: string;
  "com.github"?: string;
}

interface ProfileData {
  name: string;
  address: string;
  metadata: ProfileMetadata;
  cached: boolean;
}

interface Candidate {
  id: number;
  name: string;
  bio: string;
  votes: number;
  avatar: string;
  endorsements: number;
  address: string;
  campaignStatement: string;
  profile?: ProfileData;
}

interface Election {
  id: number;
  title: string;
  description: string;
  status: string;
  timeRemaining: string;
  positions: number;
  chains: string[];
  proposalHash: string;
  electionNode: string;
  createdAtTimestamp: number;
  electionStartTimestamp: number;
  electionEndTimestamp: number;
  candidates: Candidate[];
  totalVotes: number;
  quorumThreshold: number;
  minVotingPower: number;
  votingPowerMultiplier: number;
}

interface ElectionData {
  elections: Election[];
  metadata: {
    version: string;
    lastUpdated: string;
    description: string;
    network: string;
    governanceContract: string;
  };
}

interface Election {
  electionIndex: number;
  electionStatus: number;
  proposer: string;
  electionTitle: string;
  electionDescription: string;
  electionNode: string;
  createdAtTimestamp: number;
  electionStartTimestamp: number;
  electionEndTimestamp: number;
  endorsementCount: number;
  endorsementVotes: number;
  endorsementTimestamp: number;
}

// Blockchain-related interfaces
interface VoterInfo {
  voterAddress: string;
  votePower: bigint;
  voteTimestamp: bigint;
  proposalsParticipated: bigint;
  lastParticipationTimestamp: bigint;
  lastProposalNode: string;
}

interface GlobalState {
  proposalCount: { asNumber: () => number };
  activeProposalCount: { asNumber: () => number };
  totalVoterCount: { asNumber: () => number };
  totalParticipatingVoters: { asNumber: () => number };
}

interface ProposalCreatedEvent {
  txid: string;
  round: number;
  timestamp: number;
  proposalNode: Uint8Array;
}

interface UIProposal {
  id: string;
  title: string;
  description: string;
  status: string;
  votes: {
    yes: number;
    no: number;
    total: number;
  };
  userVote?: "yes" | "no";
  createdAt: number;
  endTime: number;
}

const Index = () => {
  const {
    activeAccount,
    activeWallet,
    activeNetwork,
    wallets,
    setActiveNetwork,
    signTransactions,
    algodClient,
  } = useWallet();

  // Election data state
  const [electionData, setElectionData] = useState<ElectionData | null>(null);
  const [electionProposal, setElectionProposal] =
    useState<ElectionProposal | null>(null);
  const [currentElection, setCurrentElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState(true);

  // Blockchain state
  const [proposals, setProposals] = useState<UIProposal[]>([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);
  const [isLoadingVoterData, setIsLoadingVoterData] = useState(false);
  const [globalState, setGlobalState] = useState<GlobalState | null>(null);
  const [voterInfo, setVoterInfo] = useState<VoterInfo | null>(null);
  const [userVotesMap, setUserVotesMap] = useState<
    Record<string, "yes" | "no">
  >({});
  const [candidateEndorsements, setCandidateEndorsements] = useState<
    Map<number, bigint>
  >(new Map());
  const [isLoadingEndorsements, setIsLoadingEndorsements] = useState(false);
  const [endorsementError, setEndorsementError] = useState<string | null>(null);
  const [powerLockCreatedEvents, setPowerLockCreatedEvents] = useState<
    PowerLockCreatedEvent[]
  >([]);
  const [powerLockUnlockedEvents, setPowerLockUnlockedEvents] = useState<
    PowerLockUnlockedEvent[]
  >([]);
  const [endorsement, setEndorsement] = useState<boolean>(false);

  // Helper functions for blockchain operations
  const makeContract = (
    appId: number,
    appSpec: any,
    account: any,
    algod?: algosdk.Algodv2
  ) => {
    const client = algod || createLocalnetAlgodClient();
    // Ensure events is an array if it exists
    const contractSpec = {
      ...appSpec.contract,
      events: appSpec.contract?.events || [],
    };
    return new CONTRACT(appId, client, undefined, contractSpec, account);
  };

  const uint8ArrayToBase64 = (bytes: Uint8Array): string => {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const hexStringToUint8Array = (hexString: string): Uint8Array => {
    const bytes = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
      bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
    }
    return bytes;
  };

  // Function to fetch candidate profiles from Envoi API
  const fetchCandidateProfiles = async (
    candidates: Candidate[]
  ): Promise<Candidate[]> => {
    try {
      // Extract candidate names for API call
      const candidateNames = candidates
        .map((candidate) => candidate.name)
        .join(",");

      const response = await fetch(
        `https://api.envoi.sh/api/address/${candidateNames}`
      );
      const profileData: { results: ProfileData[] } = await response.json();

      // Map profile data to candidates
      return candidates.map((candidate) => {
        const profile = profileData.results.find(
          (p) => p.name === candidate.name
        );
        return {
          ...candidate,
          profile: profile,
        };
      });
    } catch (error) {
      console.error("Failed to fetch candidate profiles:", error);
      return candidates; // Return original candidates if profile fetch fails
    }
  };

  const algod = useMemo(() => {
    if (activeNetwork === NetworkId.LOCALNET) {
      return new algosdk.Algodv2(
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "http://10.0.0.31",
        4001
      );
    }
    return algodClient;
  }, [algodClient, activeNetwork]);

  const indexer = useMemo(() => {
    if (activeNetwork === NetworkId.LOCALNET) {
      return new algosdk.Indexer(
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "http://10.0.0.31",
        8980
      );
    } else if (activeNetwork === NetworkId.VOIMAIN) {
      return new algosdk.Indexer("", "https://mainnet-idx.voi.nodely.dev", 443);
    }
    return null as algosdk.Indexer | null;
  }, [activeNetwork]);

  const electionInfoService = useMemo(() => {
    if (!algod) return null;
    return new ElectionInfoService(
      algod,
      activeAccount?.address ||
        algosdk.getApplicationAddress(getGovernanceAppId(activeNetwork))
    );
  }, [algod, activeAccount?.address, activeNetwork]);

  // Fetch candidate endorsements for the selected election
  const fetchCandidateEndorsements = async () => {
    if (!currentElection || !activeNetwork || !electionInfoService) {
      return;
    }

    setIsLoadingEndorsements(true);
    setEndorsementError(null);

    try {
      const endorsementsMap = new Map<number, bigint>();

      // Use proposal hash for fetching endorsements
      const electionNode = currentElection.proposalHash;

      console.log("Election node:", electionNode);

      // Fetch endorsements for each candidate
      const endorsementPromises = currentElection.candidates.map(
        async (candidate) => {
          try {
            // Convert candidate name to node hash
            console.log("Candidate name:", candidate.name);
            const candidateNodeBytes = await namehash(candidate.name);
            // Convert Uint8Array to hex string
            const candidateNode = Array.from(candidateNodeBytes)
              .map((byte) => byte.toString(16).padStart(2, "0"))
              .join("");
            const endorsementData =
              await electionInfoService.getCandidateEndorsement(
                electionNode,
                candidateNode,
                activeNetwork
              );
            console.log("Endorsement data:", endorsementData);
            const endorsementCount =
              endorsementData?.endorsementCount || BigInt(0);
            endorsementsMap.set(candidate.id, endorsementCount);
          } catch (error) {
            console.error(
              `Error fetching endorsement for candidate ${candidate.name}:`,
              error
            );
            endorsementsMap.set(candidate.id, BigInt(0));
          }
        }
      );

      await Promise.all(endorsementPromises);
      setCandidateEndorsements(endorsementsMap);
    } catch (error) {
      console.error("Error fetching candidate endorsements:", error);
      setEndorsementError(
        error instanceof Error
          ? error.message
          : "Failed to fetch candidate endorsements"
      );
    } finally {
      setIsLoadingEndorsements(false);
    }
  };

  useEffect(() => {
    if (currentElection && activeNetwork && electionInfoService) {
      fetchCandidateEndorsements();
    }
  }, [currentElection, activeNetwork, electionInfoService]);

  console.log("Candidate endorsements:", candidateEndorsements);

  // Function to fetch voter data from blockchain
  const fetchVoterData = async () => {
    if (!activeAccount || !activeNetwork) {
      return;
    }

    try {
      setIsLoadingVoterData(true);
      const governanceAppId = getGovernanceAppId(activeNetwork);

      if (governanceAppId === 0) {
        console.log(`No governance app ID for network ${activeNetwork}`);
        return;
      }

      const voter = await getVoter({
        appId: governanceAppId,
        addr: activeAccount.address,
        algod,
        debug: true,
      });

      setVoterInfo(voter);
    } catch (error) {
      console.error("Error fetching voter data:", error);
      setVoterInfo(null);
    } finally {
      setIsLoadingVoterData(false);
    }
  };

  // Function to fetch proposals and votes from blockchain
  const fetchProposals = async () => {
    if (!activeNetwork) {
      return;
    }

    setIsLoadingProposals(true);

    try {
      const governanceAppId = getGovernanceAppId(activeNetwork);

      if (governanceAppId === 0) {
        console.log(`No governance app ID for network ${activeNetwork}`);
        setIsLoadingProposals(false);
        return;
      }

      // Create contract instance for blockchain operations
      const ci = makeContract(
        governanceAppId,
        PowGovernanceAppSpec,
        {
          addr: algosdk.getApplicationAddress(governanceAppId),
          sk: new Uint8Array(),
        },
        algod
      );

      // Fetch global state
      let state;
      try {
        const globalStateR = await ci.get_global_state();
        if (globalStateR.success) {
          state = globalStateR.returnValue;
          setGlobalState(state);
        }
      } catch (error) {
        console.error("Error fetching global state:", error);
      }

      // For now, we'll create mock proposals based on candidates
      // In a real implementation, you'd fetch actual proposals from the blockchain
      const mockProposals: UIProposal[] =
        currentElection?.candidates.map((candidate, index) => ({
          id: `proposal_${candidate.id}`,
          title: `Vote for ${candidate.name}`,
          description: candidate.bio,
          status: "active",
          votes: {
            yes: candidate.votes,
            no: Math.floor(candidate.votes * 0.3),
            total: candidate.votes + Math.floor(candidate.votes * 0.3),
          },
          createdAt: Date.now() - index * 24 * 60 * 60 * 1000,
          endTime: Date.now() + 7 * 24 * 60 * 60 * 1000,
        })) || [];

      setProposals(mockProposals);

      // Fetch user votes if connected
      if (activeAccount && currentElection?.proposalHash) {
        const userVotes: Record<string, "yes" | "no"> = {};

        try {
          // Use the actual proposal hash from the election
          const proposalBytes = hexStringToUint8Array(
            currentElection.proposalHash
          );

          const getVoteR = await ci.get_vote(
            proposalBytes,
            activeAccount.address
          );

          if (getVoteR.success && getVoteR.returnValue !== undefined) {
            const voteValue = Number(getVoteR.returnValue);
            if (voteValue === 0) {
              userVotes[currentElection.proposalHash] = "no";
            } else if (voteValue === 1) {
              userVotes[currentElection.proposalHash] = "yes";
            }
          }
        } catch (error) {
          console.error(
            `Error fetching vote for proposal ${currentElection.proposalHash}:`,
            error
          );
        }

        setUserVotesMap(userVotes);
      }
    } catch (error) {
      console.error("Error fetching proposals:", error);
    } finally {
      setIsLoadingProposals(false);
    }
  };

  const fetchEndorsement = async () => {
    if (!activeAccount || !activeNetwork) {
      return;
    }
    const ci = makeContract(
      getGovernanceAppId(activeNetwork),
      PowGovernanceAppSpec,
      {
        addr: activeAccount.address,
        sk: new Uint8Array(),
      },
      algod
    );
    const endorsementR = await ci.get_endorsement(
      hexStringToUint8Array(currentElection.proposalHash),
      activeAccount.address
    );
    setEndorsement(endorsementR.returnValue);
  };
  useEffect(() => {
    if (activeAccount && activeNetwork && currentElection) {
      fetchEndorsement();
    }
  }, [activeAccount, activeNetwork, currentElection]);

  const loadAccountPowerLock = useCallback(async () => {
    if (!activeAccount || !activeNetwork) {
      return;
    }
    const ci = new CONTRACT(
      getGovernanceAppId(activeNetwork),
      algod,
      indexer,
      {
        ...PowGovernanceAppSpec.contract,
        events: [
          {
            name: "PowerLockCreated",
            args: [
              {
                type: "(uint64,uint256,uint64,address,uint256,uint64,uint64)",
                name: "power_lock",
              },
            ],
          },
          {
            name: "PowerLockUnlocked",
            args: [
              {
                type: "uint64",
                name: "power_source_id",
              },
              {
                type: "uint64",
                name: "power_unlock_timestamp",
              },
            ],
          },
        ],
      },
      { addr: activeAccount.address, sk: new Uint8Array() }
    );
    const events = await ci.getEvents({
      sender: activeAccount.address,
    });
    console.log("Events:", events);
    const powerLockUnlockedEvents = (
      events.find((event) => event.name === "PowerLockUnlocked")?.events || []
    ).map((event) => decodePowerLockUnlockedEvent(event));
    setPowerLockUnlockedEvents(powerLockUnlockedEvents);
    const powerLockCreatedEvents = (
      events.find((event) => event.name === "PowerLockCreated")?.events || []
    )
      .map((event) => decodePowerLockCreatedEvent(event))
      .filter(
        (event) => event.powerLock.power_source_owner === activeAccount.address
      );
    setPowerLockCreatedEvents(powerLockCreatedEvents);
  }, [activeAccount, activeNetwork, algod, indexer]);
  console.log("powerLockCreatedEvents", powerLockCreatedEvents);
  console.log("powerLockUnlockedEvents", powerLockUnlockedEvents);

  const handleTouchAToken = useCallback(async () => {
    if (!activeAccount || !activeNetwork || !activeWallet) {
      return;
    }

    try {
      const aTokenAppId = getATokenAppId(activeNetwork);
      const ci = makeContract(
        aTokenAppId,
        ATokenAppSpec,
        {
          addr: activeAccount.address,
          sk: new Uint8Array(),
        },
        algod
      );

      // Call the nop method
      const nopResult = await ci.nop();

      if (nopResult.success) {
        const stxns = await signTransactions(
          nopResult.txns.map(
            (txn: string) =>
              new Uint8Array(
                atob(txn)
                  .split("")
                  .map((char: string) => char.charCodeAt(0))
              )
          )
        );
        const { txId } = await algod.sendRawTransaction(stxns).do();
        await algosdk.waitForConfirmation(algod, txId, 4);
        console.log("AToken nop method called successfully");
        toast({
          title: "AToken nop method called successfully",
          description: "AToken nop method called successfully",
        });
      } else {
        throw new Error(nopResult.error || "Failed to call AToken nop method");
      }
    } catch (error) {
      console.error("Touch AToken error:", error);
    }
  }, [activeAccount, activeNetwork, activeWallet, algod]);

  useEffect(() => {
    if (activeAccount && activeNetwork) {
      loadAccountPowerLock();
    }
  }, [activeAccount, activeNetwork]);

  // Load election data
  const loadElectionData = async () => {
    try {
      const response = await fetch("/config/elections.json");
      const data: ElectionData = await response.json();

      const proposalNode = data.elections.map(
        (election) => election.proposalHash
      )[0];
      const ci = makeContract(
        getGovernanceAppId(activeNetwork),
        PowGovernanceAppSpec,
        {
          addr: algosdk.getApplicationAddress(
            getGovernanceAppId(activeNetwork)
          ),
          sk: new Uint8Array(),
        },
        algod
      );
      const electionR = await ci.get_election(
        hexStringToUint8Array(proposalNode)
      );
      setElectionProposal(decodeElectionProposal(electionR.returnValue));
      setElectionData(data);

      // Get the first active election
      const activeElection = data.elections.find(
        (election) => election.status === "Active"
      );
      let election = activeElection || data.elections[0];

      if (election) {
        // Fetch profiles for candidates
        const candidatesWithProfiles = await fetchCandidateProfiles(
          election.candidates
        );
        election = {
          ...election,
          candidates: candidatesWithProfiles,
        };
        setCurrentElection(election);
      }
    } catch (error) {
      console.error("Failed to load election data:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadElectionData();
  }, []);

  console.log("electionProposal", electionProposal);

  // Get candidates from current election
  const candidates = currentElection?.candidates || [];
  const MAX_VOTES = currentElection?.positions || 5;

  // Fetch blockchain data when network or account changes
  useEffect(() => {
    if (activeNetwork) {
      fetchProposals();
    }
  }, [activeNetwork, currentElection]);

  useEffect(() => {
    if (activeAccount && activeNetwork) {
      fetchVoterData();
    }
  }, [activeAccount, activeNetwork]);

  // Use actual wallet connection state
  const isConnected = !!activeAccount && !!activeWallet;
  const walletAddress = activeAccount?.address || "";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCandidates, setSelectedCandidates] = useState<Set<number>>(
    new Set()
  );
  const [votedCandidates, setVotedCandidates] = useState<Set<number>>(
    new Set()
  );
  const [votingCandidates, setVotingCandidates] = useState<Set<number>>(
    new Set()
  );
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [lastVotedCandidate, setLastVotedCandidate] = useState<any>(null);
  const [lastTransactionHash, setLastTransactionHash] = useState("");
  const [isVoteChange, setIsVoteChange] = useState(false);

  // Voting period state - based on election data
  const [isVotingPeriodOpen, setIsVotingPeriodOpen] = useState(true);
  const endDate = new Date("2025-10-16T00:00:00");
  const votingDeadline = currentElection
    ? new Date(currentElection.electionEndTimestamp * 1000)
    : endDate;

  // Staking state
  const [stakedAmount, setStakedAmount] = useState(0);
  const [isStaked, setIsStaked] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const lockEndDate = endDate;

  const [voiBalance] = useState(75000); // Mock balance - user has enough
  const [balance, setBalance] = useState(0);

  // fetch user balance
  const fetchUserBalance = async () => {
    if (!activeAccount || !activeNetwork) {
      return;
    }
    // Using network token
    const accInfo = await algod.accountInformation(activeAccount.address).do();
    const balance = Number(accInfo.amount);
    const minBalance = Number(accInfo["min-balance"]);
    const availableBalance = Math.max(0, (balance - minBalance - 1e5) / 1e6);
    setBalance(availableBalance);
    // Using arc200 token
    // const contractId = getATokenAppId(activeNetwork);
    // const ci = new CONTRACT(
    //   contractId,
    //   algod,
    //   undefined,
    //   {
    //     ...ATokenAppSpec.contract,
    //     events: [],
    //   },
    //   {
    //     addr: activeAccount.address,
    //     sk: new Uint8Array(),
    //   }
    // );
    // const balanceR = await ci.arc200_balanceOf(activeAccount.address);
    // const balance = Number(balanceR.returnValue) / 1e6;
  };
  useEffect(() => {
    if (activeAccount) {
      fetchUserBalance();
    }
  }, [activeAccount]);

  const { toast } = useToast();

  const handleDisconnect = () => {
    activeWallet?.disconnect();
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
    if (!activeAccount || !activeNetwork || !activeWallet) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to stake.",
        variant: "destructive",
      });
      return;
    }

    setIsStaking(true);

    try {
      const governanceAppId = getGovernanceAppId(activeNetwork);
      const powerSourceId = getATokenAppId(activeNetwork);

      if (governanceAppId === 0) {
        throw new Error(`No governance app ID for network ${activeNetwork}`);
      }

      // Lock power (staking) using command utility
      const lockAmount = 50000; // 50,000 VOI
      const lockDuration = 4 * 7 * 24 * 60 * 60; // 4 weeks in seconds
      const unlockTimestamp = Math.floor(Date.now() / 1000) + lockDuration; // Current time + lock duration

      console.log("Attempting to lock power with:", {
        powerSourceId,
        powerSourceAmount: lockAmount * 1e6, // Convert to micro-VOI
        powerUnlockTimestamp: unlockTimestamp,
      });

      const lockPowerR = await lockPower({
        appId: governanceAppId,
        powerSourceId: powerSourceId,
        powerSourceAmount: lockAmount * 1e6,
        powerUnlockTimestamp: unlockTimestamp,
        beaconId: 0,
        addr: activeAccount.address,
        algod,
        debug: true,
        simulate: false,
        isWNT: true,
      });

      console.log("Lock power response:", lockPowerR);

      if (lockPowerR.success) {
        const stxn = await signTransactions(
          lockPowerR.txns.map(
            (txn: string) =>
              new Uint8Array(
                atob(txn)
                  .split("")
                  .map((char) => char.charCodeAt(0))
              )
          )
        );

        const { txId } = await algod.sendRawTransaction(stxn).do();

        await algosdk.waitForConfirmation(algod, txId, 4);

        setStakedAmount(lockAmount);
        setIsStaked(true);

        // Refresh voter data
        await fetchVoterData();
        toast({
          title: "Staking Successful!",
          description: `${lockAmount.toLocaleString()} VOI has been staked. You can now vote for candidates.`,
        });
        await new Promise((resolve) => setTimeout(resolve, 5000));
        await loadAccountPowerLock();
      } else {
        throw new Error(lockPowerR.error || "Failed to lock power");
      }
    } catch (error) {
      console.error("Staking error:", error);
      toast({
        title: "Staking Failed",
        description:
          error instanceof Error
            ? error.message
            : "Transaction failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsStaking(false);
    }
  };

  const handleUnstake = async () => {
    setIsUnstaking(true);

    const ci = makeContract(
      getGovernanceAppId(activeNetwork),
      PowGovernanceAppSpec,
      {
        addr: activeAccount.address,
        sk: new Uint8Array(),
      },
      algod
    );

    try {
      if (powerLockCreatedEvents.length === 0) {
        toast({
          title: "No Available Unlocks",
          description:
            "No power locks are available for unlocking at this time.",
          variant: "destructive",
        });
        return;
      }
      if (powerLockCreatedEvents.length !== 1) {
        toast({
          title: "Multiple Power Locks Found",
          description:
            "Multiple power locks found for this account. Please contact support.",
          variant: "destructive",
        });
        return;
      }
      // Find power locks that are available for unlocking
      const availableUnlocks = powerLockCreatedEvents;
      const unlock = availableUnlocks[0];

      console.log({
        powerSourceId: unlock.powerLock.power_source_id,
        powerUnlockTimestamp: unlock.powerLock.power_source_unlock_timestamp,
      });

      // Unlock all available power lock
      ci.setFee(2000);
      const unlockResult = await ci.unlock_power(
        unlock.powerLock.power_source_id,
        unlock.powerLock.power_source_unlock_timestamp
      );

      console.log("Unlock power response:", unlockResult);

      if (unlockResult.success) {
        const stxn = await signTransactions(
          unlockResult.txns.map(
            (txn: string) =>
              new Uint8Array(
                atob(txn)
                  .split("")
                  .map((char) => char.charCodeAt(0))
              )
          )
        );
        const { txId } = await algod.sendRawTransaction(stxn).do();
        await algosdk.waitForConfirmation(algod, txId, 4);
        console.log("Unlock power transaction ID:", txId);
        console.log(
          `Successfully unlocked power source ${unlock.powerLock.power_source_id}`
        );
      } else {
        console.error(
          `Failed to unlock power source ${unlock.powerLock.power_source_id}:`,
          unlockResult.error
        );
      }

      // Refresh voter data after unlocking
      //await fetchVoterData();
      //await loadAccountPowerLock();
    } catch (error) {
      console.error("Unlock power error:", error);
      toast({
        title: "Unlock Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to unlock power. Please try again.",
        variant: "destructive",
      });
      return;
    } finally {
      setIsUnstaking(false);
    }

    // Simulate unstaking transaction
    await new Promise((resolve) => setTimeout(resolve, 2000));

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

  const handleCandidateSelect = (candidateId: number) => {
    if (!isConnected) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet to vote",
        variant: "destructive",
      });
      return;
    }

    if (!isStaked) {
      toast({
        title: "Staking Required",
        description: "Please stake 50,000 VOI to participate in voting",
        variant: "destructive",
      });
      return;
    }

    if (!isVotingPeriodOpen) {
      toast({
        title: "Voting Period Closed",
        description: "Vote changes are no longer allowed.",
        variant: "destructive",
      });
      return;
    }

    // Prevent selection if user has already voted
    if (votedCandidates.size > 0) {
      toast({
        title: "Voting Complete",
        description: "Your votes have been submitted and cannot be modified.",
        variant: "destructive",
      });
      return;
    }

    // Toggle selection
    setSelectedCandidates((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(candidateId)) {
        newSet.delete(candidateId);
      } else {
        if (newSet.size >= MAX_VOTES) {
          toast({
            title: "Maximum Selections Reached",
            description: `You can only select ${MAX_VOTES} candidates.`,
            variant: "destructive",
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
        variant: "destructive",
      });
      return;
    }

    if (!activeAccount || !activeNetwork || !activeWallet) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to vote.",
        variant: "destructive",
      });
      return;
    }

    const hasVoted = votedCandidates.size > 0;
    const isChangingVotes =
      (hasVoted &&
        Array.from(selectedCandidates).some(
          (id) => !votedCandidates.has(id)
        )) ||
      Array.from(votedCandidates).some((id) => !selectedCandidates.has(id));

    setIsVoteChange(isChangingVotes);
    setVotingCandidates(new Set(selectedCandidates));

    try {
      const governanceAppId = getGovernanceAppId(activeNetwork);

      if (governanceAppId === 0) {
        throw new Error(`No governance app ID for network ${activeNetwork}`);
      }

      // Endorse selected candidates using command utility
      const voteResults = [];

      // Use the electionNode from the current election
      const electionNode = currentElection?.proposalHash || "";

      if (!electionNode) {
        throw new Error("No election node found in election data");
      }

      // Get candidate names from selected candidate IDs
      const candidateNames = Array.from(selectedCandidates)
        .map((candidateId) => {
          const candidate = candidates.find((c) => c.id === candidateId);
          return candidate?.name || "";
        })
        .filter((name) => name !== "");

      console.log("candidateNames", candidateNames);
      console.log({
        appId: governanceAppId,
        electionNode: electionNode,
        candidateNames: candidateNames,
        addr: activeAccount.address,
        debug: true,
        algod,
      });

      const ci = new CONTRACT(
        governanceAppId,
        algod,
        undefined,
        { ...PowGovernanceAppSpec.contract, events: [] },
        {
          addr: activeAccount.address,
          sk: new Uint8Array(),
        }
      );
      // Endorse candidates using command utility
      ci.setFee(15000);
      const endorseResult = await ci.endorse_candidates(
        new Uint8Array(Buffer.from(electionNode, "hex")),
        await namehash(candidateNames[0]),
        await namehash(candidateNames[1]),
        await namehash(candidateNames[2]),
        await namehash(candidateNames[3]),
        await namehash(candidateNames[4])
      );

      console.log("endorseResult", endorseResult);

      //voteResults.push(endorseResult);

      if (!endorseResult.success) {
        throw new Error(`Failed to endorse candidates: ${endorseResult.error}`);
      }

      const stxns = await signTransactions(
        endorseResult.txns.map(
          (txn: string) =>
            new Uint8Array(
              atob(txn)
                .split("")
                .map((char) => char.charCodeAt(0))
            )
        )
      );

      const { txId } = await algod.sendRawTransaction(stxns).do();

      await algosdk.waitForConfirmation(algod, txId, 4);

      // All votes were successful
      console.log("All vote results:", voteResults);

      // Generate transaction hash (using first vote result)
      const transactionHash =
        txId || `0x${Math.random().toString(16).substr(2, 64)}`;

      console.log("Transaction ID:", txId);

      // Update voted candidates (replace previous votes with new selection)
      setVotedCandidates(new Set(selectedCandidates));
      setVotingCandidates(new Set());
      setSelectedCandidates(new Set());

      // Show confirmation modal
      setLastVotedCandidate(Array.from(selectedCandidates));
      setLastTransactionHash(transactionHash);
      setShowConfirmationModal(true);

      // Refresh blockchain data
      await fetchProposals();
      await fetchVoterData();
      await fetchCandidateEndorsements();
      await loadElectionData();
      await loadAccountPowerLock();

      if (isChangingVotes) {
        toast({
          title: "Votes Updated Successfully",
          description: "Your vote selection has been updated.",
        });
      } else {
        toast({
          title: "Votes Cast Successfully",
          description: "Your votes have been submitted to the blockchain.",
        });
      }
    } catch (error) {
      setVotingCandidates(new Set());
      console.error("Vote submission error:", error);

      toast({
        title: "Vote Failed",
        description:
          error instanceof Error
            ? error.message
            : "Transaction failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleVoteMore = () => {
    setShowConfirmationModal(false);
  };

  // Calculate total votes from blockchain data or fallback to static data
  const totalVotes =
    proposals.length > 0
      ? proposals.reduce((sum, proposal) => sum + proposal.votes.total, 0)
      : candidates.reduce((sum, candidate) => sum + candidate.votes, 0);

  const stats = {
    totalCandidates: candidates.length,
    totalVoters: electionProposal?.endorsementCount || 0,
    participationRate: electionProposal?.endorsementCount / 2000, // TODO here
    votesRemaining: MAX_VOTES - votedCandidates.size,
  };

  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch =
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.bio.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading || isLoadingProposals) {
    return (
      <div className="min-h-screen bg-voi-gradient-light flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-lg text-muted-foreground">
            {loading
              ? "Loading election data..."
              : "Loading blockchain data..."}
          </p>
        </div>
      </div>
    );
  }

  console.log({ balance });

  return (
    <div className="min-h-screen bg-voi-gradient-light">
      <Header
        isConnected={isConnected}
        walletAddress={walletAddress}
        isStaked={isStaked}
        stakedAmount={stakedAmount}
        onDisconnect={handleDisconnect}
      />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-12">
          <h2 className="text-4xl font-bold bg-voi-gradient bg-clip-text text-transparent">
            {currentElection?.title || "VOI Council Election"}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {currentElection?.description ||
              "Vote for candidates to represent you on the VOI Council. Shape the future of our decentralized ecosystem."}
          </p>
          {/*currentElection?.timeRemaining && (
            <div className="text-lg text-primary font-semibold">
              Time Remaining: {currentElection.timeRemaining}
            </div>
          )*/}
        </div>

        {/* Stats */}
        <ElectionStats {...stats} />

        {/* Staking Section */}
        {isConnected &&
          powerLockCreatedEvents.length + powerLockUnlockedEvents.length <
            2 && (
            <CombinedStakingCard
              voiBalance={balance}
              stakedAmount={
                voterInfo ? Number(voterInfo.votePower) / 1e6 : stakedAmount
              }
              isStaked={
                isStaked ||
                (voterInfo ? Number(voterInfo.votePower) > 0 : false)
              }
              isStaking={isStaking}
              isUnstaking={isUnstaking}
              lockEndDate={lockEndDate}
              votesRemaining={stats.votesRemaining}
              onStake={handleStake}
              onUnstake={handleUnstake}
              powerLockCreatedEvents={powerLockCreatedEvents}
            />
          )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 items-center space-x-2">
            <div className="relative flex-1 max-w-md">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                size={16}
              />
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
            {/* REM dev only */}
            {/*<Button
              variant="outline"
              onClick={loadAccountPowerLock}
              disabled={!activeAccount || !activeNetwork}
              className="text-xs"
            >
              Test Power Locks
            </Button>
            <Button
              variant="outline"
              onClick={handleTouchAToken}
              disabled={!activeAccount || !activeNetwork}
              className="text-xs"
            >
              Touch
            </Button>
            */}
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
                  {votingCandidates.size > 0 ? "Processing..." : "Cast Vote"}
                </Button>
              )}
              <div className="text-base text-muted-foreground font-medium">
                Selected: {selectedCandidates.size}/{MAX_VOTES} • Voted:{" "}
                {votedCandidates.size}/{MAX_VOTES}
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
              Select up to {MAX_VOTES} candidates to represent your interests on
              the VOI Council
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Candidates Grid - Takes 2/3 of the space */}
            <div className="lg:col-span-2">
              {filteredCandidates.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground">
                    No candidates found
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try adjusting your search terms
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {filteredCandidates.map((candidate) => {
                    const candidateVotes = Number(
                      candidateEndorsements.get(candidate.id) || BigInt(0)
                    );
                    const totalVotes = Array.from(
                      candidateEndorsements.values()
                    )
                      .map((value) => Number(value))
                      .reduce((sum, value) => sum + value, 0);
                    return (
                      <CandidateCard
                        key={candidate.id}
                        id={candidate.id.toString()}
                        name={candidate.name}
                        description={candidate.bio}
                        votes={candidateVotes}
                        totalVotes={totalVotes}
                        isSelected={selectedCandidates.has(candidate.id)}
                        isVoted={votedCandidates.has(candidate.id)}
                        isVoting={votingCandidates.has(candidate.id)}
                        onSelect={(id) => handleCandidateSelect(parseInt(id))}
                        canSelect={isStaked && isVotingPeriodOpen}
                        isVotingPeriodOpen={isVotingPeriodOpen}
                        profile={candidate.profile}
                        showButtons={
                          !endorsement &&
                          isConnected &&
                          powerLockCreatedEvents.length +
                            powerLockUnlockedEvents.length <
                            2
                        }
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Leaderboard - Takes 1/3 of the space */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      Live Leaderboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {candidates
                      .map((candidate) => {
                        const candidateVotes =
                          candidateEndorsements.get(candidate.id) || BigInt(0);
                        return { ...candidate, votes: Number(candidateVotes) };
                      })
                      .sort((a, b) => b.votes - a.votes)
                      .slice(0, 10)
                      .map((candidate, index) => {
                        const votePercentage =
                          candidateEndorsements.size > 0
                            ? (candidate.votes /
                                Array.from(candidateEndorsements.values())
                                  .map((value) => Number(value))
                                  .reduce((sum, value) => sum + value, 0)) *
                              100
                            : 0;
                        return (
                          <div
                            key={candidate.id}
                            className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-background/80 transition-colors"
                          >
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {candidate.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Progress
                                  value={votePercentage}
                                  className="h-1.5 flex-1"
                                />
                                <span className="text-xs text-muted-foreground">
                                  {candidate.votes.toLocaleString()} (
                                  {votePercentage
                                    ? votePercentage.toFixed(1)
                                    : 0}
                                  %)
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
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
