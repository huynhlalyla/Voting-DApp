'use client';

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain } from 'wagmi';
import { getContractAddress, VOTING_CONTRACT_ABI, CONTRACT_ADDRESSES } from '@/contracts/AdvancedVoting';
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

type Poll = {
  id: bigint;
  title: string;
  startTime: bigint;
  endTime: bigint;
  isPublic: boolean;
  exists: boolean;
  creator: string;
};

type Candidate = {
  name: string;
  voteCount: bigint;
};

type StatusFilter = 'all' | 'active' | 'upcoming' | 'ended';

export default function VotingPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  // Chain switching
  const { switchChain } = useSwitchChain();
  const ROOTSTOCK_CHAIN_ID = 31; // Rootstock Testnet
  
  // Always read from Rootstock contract regardless of current network
  const contractAddress = CONTRACT_ADDRESSES[ROOTSTOCK_CHAIN_ID];
  
  const [selectedPoll, setSelectedPoll] = useState<number | null>(null);
  const [pollsList, setPollsList] = useState<Poll[]>([]);
  
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showMyPolls, setShowMyPolls] = useState(false);

  // Đọc tất cả polls (always from Rootstock)
  const { data: polls, refetch: refetchPolls, error: pollsError, isLoading: pollsLoading } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: VOTING_CONTRACT_ABI,
    functionName: 'getAllPolls',
    chainId: ROOTSTOCK_CHAIN_ID, // Force read from Rootstock
  });

  // Track total votes for each poll
  const [pollVoteCounts, setPollVoteCounts] = useState<Record<string, bigint>>({});

  // Cập nhật pollsList khi data thay đổi
  useEffect(() => {
    if (polls) {
      console.log('Processing polls data:', polls);
      // Check if polls is already an array
      if (Array.isArray(polls)) {
        setPollsList(polls as Poll[]);
        console.log('Set pollsList from array:', polls);
      } else {
        // If polls is an object, try to extract array
        console.log('Polls is object, extracting...', polls);
        const pollsArray = Object.values(polls).filter(item => 
          item && typeof item === 'object' && 'id' in item
        ) as Poll[];
        setPollsList(pollsArray);
        console.log('Set pollsList from object:', pollsArray);
      }
    }
  }, [polls]);

  // Fetch vote counts for all polls (to show in poll cards) - always from Rootstock
  useEffect(() => {
    const fetchVoteCounts = async () => {
      if (pollsList.length === 0 || typeof window === 'undefined') return;
      
      const counts: Record<string, bigint> = {};
      
      // Sử dụng wagmi's publicClient thay vì ethers
      const { createPublicClient, http } = await import('viem');
      const { getChain } = await import('@/wagmi');
      
      const chain = getChain(ROOTSTOCK_CHAIN_ID);
      if (!chain) return;
      
      const publicClient = createPublicClient({
        chain,
        transport: http(),
      });
      
      for (const poll of pollsList) {
        try {
          const totalVotes = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: VOTING_CONTRACT_ABI,
            functionName: 'getTotalVotes',
            args: [poll.id],
          });
          counts[poll.id.toString()] = totalVotes as bigint;
        } catch (error) {
          console.error(`Error fetching votes for poll ${poll.id}:`, error);
          counts[poll.id.toString()] = BigInt(0);
        }
      }
      
      setPollVoteCounts(counts);
    };

    fetchVoteCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollsList]);

  // Refetch khi mount (đã TẮT auto-refetch on focus)
  useEffect(() => {
    refetchPolls();
  }, [refetchPolls]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('filter-dropdown');
      const button = event.target as HTMLElement;
      
      if (dropdown && !dropdown.contains(button) && !button.closest('button')?.textContent?.includes('Bộ lọc')) {
        dropdown.classList.add('hidden');
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Debug log
  useEffect(() => {
    console.log('=== VOTING PAGE DEBUG ===');
    console.log('Contract Address:', contractAddress);
    console.log('Polls data (raw):', polls);
    console.log('Polls data type:', typeof polls);
    console.log('Polls is array?:', Array.isArray(polls));
    console.log('PollsList state:', pollsList);
    console.log('PollsList length:', pollsList.length);
    console.log('Polls error:', pollsError);
    console.log('Polls loading:', pollsLoading);
    console.log('========================');
  }, [polls, pollsError, pollsLoading, pollsList]);

  // Đọc candidates của poll được chọn (from Rootstock)
  const { data: candidates, refetch: refetchCandidates } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: VOTING_CONTRACT_ABI,
    functionName: 'getCandidates',
    args: selectedPoll !== null ? [BigInt(selectedPoll)] : undefined,
    chainId: ROOTSTOCK_CHAIN_ID,
  });

  // Check xem user đã vote chưa (from Rootstock)
  const { data: hasVoted, refetch: refetchHasVoted } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: VOTING_CONTRACT_ABI,
    functionName: 'checkIfVoted',
    args: selectedPoll !== null && address ? [BigInt(selectedPoll), address] : undefined,
    chainId: ROOTSTOCK_CHAIN_ID,
  });

  // Get voters list (from Rootstock)
  const { data: voters, refetch: refetchVoters } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: VOTING_CONTRACT_ABI,
    functionName: 'getVoters',
    args: selectedPoll !== null ? [BigInt(selectedPoll)] : undefined,
    chainId: ROOTSTOCK_CHAIN_ID,
  });

  // Get total votes (from Rootstock)
  const { data: totalVotes, refetch: refetchTotalVotes } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: VOTING_CONTRACT_ABI,
    functionName: 'getTotalVotes',
    args: selectedPoll !== null ? [BigInt(selectedPoll)] : undefined,
    chainId: ROOTSTOCK_CHAIN_ID,
  });

  // Type-safe voter addresses
  const voterAddresses = voters as readonly `0x${string}`[] | undefined;

  // Hook để vote
  const { data: hash, writeContract, isPending: isVoting, error: writeError } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt({
    hash,
  });

  // Refetch sau khi vote thành công
  useEffect(() => {
    if (isConfirming) {
      toast.loading('Đang xác nhận giao dịch...', { id: 'vote-tx' });
    }
    if (isConfirmed) {
      toast.success('Bỏ phiếu thành công! 🎉', { id: 'vote-tx' });
      refetchCandidates();
      refetchHasVoted();
      refetchPolls();
      refetchVoters();
      refetchTotalVotes();
    }
  }, [isConfirming, isConfirmed, refetchCandidates, refetchHasVoted, refetchPolls, refetchVoters, refetchTotalVotes]);

  // Handle errors
  useEffect(() => {
    if (writeError) {
      console.error('=== VOTE ERROR DEBUG ===');
      console.error('Full error:', writeError);
      console.error('Error message:', writeError.message);
      console.error('Error cause:', writeError.cause);
      console.error('=======================');
      
      const errorMessage = writeError.message;
      const errorString = JSON.stringify(writeError);
      
      if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
        toast.error('Bạn đã từ chối giao dịch', { id: 'vote-tx' });
      } else if (errorMessage.includes('AlreadyVoted') || errorString.includes('AlreadyVoted')) {
        toast.error('Bạn đã bỏ phiếu rồi!', { id: 'vote-tx' });
      } else if (errorMessage.includes('NotWhitelisted') || errorString.includes('NotWhitelisted')) {
        toast.error('Bạn không có quyền bỏ phiếu trong cuộc bỏ phiếu này', { id: 'vote-tx' });
      } else if (errorMessage.includes('VotingNotStarted') || errorString.includes('VotingNotStarted')) {
        toast.error('Chưa đến giờ bỏ phiếu', { id: 'vote-tx' });
      } else if (errorMessage.includes('VotingEnded') || errorString.includes('VotingEnded')) {
        toast.error('Đã hết giờ bỏ phiếu', { id: 'vote-tx' });
      } else if (errorMessage.includes('InvalidCandidateId') || errorString.includes('InvalidCandidateId')) {
        toast.error('ID ứng cử viên không hợp lệ', { id: 'vote-tx' });
      } else if (errorMessage.includes('insufficient funds')) {
        toast.error('Không đủ tRBTC để thanh toán gas fee', { id: 'vote-tx' });
      } else {
        toast.error(`Lỗi: ${errorMessage.slice(0, 100)}`, { id: 'vote-tx', duration: 5000 });
      }
    }
    if (confirmError) {
      console.error('Transaction confirmation error:', confirmError);
      toast.error('Giao dịch thất bại. Vui lòng thử lại!', { id: 'vote-tx' });
    }
  }, [writeError, confirmError]);

  const handleVote = async (candidateId: number) => {
    if (selectedPoll === null) return;
    
    const poll = pollsList.find((p) => Number(p.id) === selectedPoll);
    
    // Client-side validation
    if (poll) {
      const now = BigInt(Math.floor(Date.now() / 1000));
      if (now < poll.startTime) {
        toast.error('⏰ Chưa đến giờ bỏ phiếu');
        return;
      }
      if (now > poll.endTime) {
        toast.error('⏰ Đã hết giờ bỏ phiếu');
        return;
      }
    }

    if (hasVoted) {
      toast.error('✅ Bạn đã bỏ phiếu rồi');
      return;
    }

    // Check if user is on Rootstock, if not, request switch
    if (chainId !== ROOTSTOCK_CHAIN_ID) {
      toast.loading('Đang chuyển sang mạng Rootstock...', { id: 'switch-network' });
      try {
        await switchChain({ chainId: ROOTSTOCK_CHAIN_ID });
        toast.success('Đã chuyển sang Rootstock! Vui lòng bỏ phiếu lại.', { id: 'switch-network' });
        return; // User needs to click vote button again after switching
      } catch (error: any) {
        console.error('Error switching chain:', error);
        if (error.message?.includes('User rejected')) {
          toast.error('Bạn đã từ chối chuyển mạng', { id: 'switch-network' });
        } else {
          toast.error('Không thể chuyển mạng. Vui lòng chuyển thủ công sang Rootstock.', { id: 'switch-network' });
        }
        return;
      }
    }

    try {
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: VOTING_CONTRACT_ABI,
        functionName: 'vote',
        args: [BigInt(selectedPoll), BigInt(candidateId)],
        chainId: ROOTSTOCK_CHAIN_ID, // Ensure transaction goes to Rootstock
      });
    } catch (error: any) {
      console.error('Error voting:', error);
    }
  };

  const isPollActive = (poll: Poll) => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    return now >= poll.startTime && now <= poll.endTime;
  };

  const getPollStatus = (poll: Poll): StatusFilter => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    if (now < poll.startTime) return 'upcoming';
    if (now > poll.endTime) return 'ended';
    return 'active';
  };

  const getPollStatusText = (poll: Poll) => {
    const status = getPollStatus(poll);
    if (status === 'upcoming') return 'Sắp diễn ra';
    if (status === 'ended') return 'Đã kết thúc';
    return 'Đang diễn ra';
  };

  const getTimeRemaining = (poll: Poll) => {
    const now = Math.floor(Date.now() / 1000);
    const status = getPollStatus(poll);
    
    let targetTime: number;
    let prefix: string;
    
    if (status === 'upcoming') {
      targetTime = Number(poll.startTime);
      prefix = 'Bắt đầu sau';
    } else if (status === 'active') {
      targetTime = Number(poll.endTime);
      prefix = 'Kết thúc sau';
    } else {
      return 'Đã kết thúc';
    }
    
    const diff = targetTime - now;
    if (diff <= 0) return 'Đã kết thúc';
    
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    
    if (days > 0) return `${prefix} ${days} ngày ${hours} giờ`;
    if (hours > 0) return `${prefix} ${hours} giờ ${minutes} phút`;
    return `${prefix} ${minutes} phút`;
  };

  // Filter polls based on search, status, and "my polls"
  const filteredPolls = pollsList.filter((poll) => {
    // Search filter
    const matchesSearch = 
      poll.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      poll.id.toString().includes(searchQuery);
    
    // Status filter
    const pollStatus = getPollStatus(poll);
    const matchesStatus = statusFilter === 'all' || pollStatus === statusFilter;
    
    // My polls filter (created by me OR I voted in it) - chỉ khi đã kết nối
    const matchesMyPolls = !showMyPolls || 
      (address && poll.creator.toLowerCase() === address.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesMyPolls;
  });

  // Reset selectedPoll if it's not in filteredPolls
  useEffect(() => {
    if (selectedPoll !== null && filteredPolls.length > 0) {
      const isPollInFiltered = filteredPolls.some(poll => Number(poll.id) === selectedPoll);
      if (!isPollInFiltered) {
        setSelectedPoll(null);
      }
    }
  }, [filteredPolls, selectedPoll]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Danh sách Bỏ phiếu</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Chọn một cuộc bỏ phiếu để xem chi tiết và tham gia</p>
        </div>

        {/* Hiển thị polls ngay cả khi chưa kết nối ví */}
        <>
            {/* HEADER: Search & Filter */}
            <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                {/* Search Bar */}
                <div className="flex-1 w-full">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      🔍
                    </span>
                    <input
                      type="text"
                      placeholder="Tìm kiếm theo tên hoặc ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-10 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 dark:bg-gray-700 dark:text-white transition-colors"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      const dropdown = document.getElementById('filter-dropdown');
                      if (dropdown) {
                        dropdown.classList.toggle('hidden');
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium shadow-md"
                  >
                    <span className="text-xl">⚙️</span>
                    <span>Bộ lọc</span>
                    {(statusFilter !== 'all' || showMyPolls) && (
                      <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                        {(statusFilter !== 'all' ? 1 : 0) + (showMyPolls ? 1 : 0)}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  <div
                    id="filter-dropdown"
                    className="hidden absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 border-gray-200 dark:border-gray-700 z-50"
                  >
                    <div className="p-4 space-y-4">
                      {/* Status Filter Section */}
                      <div>
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                          📊 Trạng thái
                        </h3>
                        <div className="space-y-2">
                          <button
                            onClick={() => {
                              setStatusFilter('all');
                              document.getElementById('filter-dropdown')?.classList.add('hidden');
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                              statusFilter === 'all'
                                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            Tất cả
                          </button>
                          <button
                            onClick={() => {
                              setStatusFilter('active');
                              document.getElementById('filter-dropdown')?.classList.add('hidden');
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                              statusFilter === 'active'
                                ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 font-semibold'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            🟢 Đang diễn ra
                          </button>
                          <button
                            onClick={() => {
                              setStatusFilter('upcoming');
                              document.getElementById('filter-dropdown')?.classList.add('hidden');
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                              statusFilter === 'upcoming'
                                ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 font-semibold'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            🟡 Sắp diễn ra
                          </button>
                          <button
                            onClick={() => {
                              setStatusFilter('ended');
                              document.getElementById('filter-dropdown')?.classList.add('hidden');
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                              statusFilter === 'ended'
                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            ⚫ Đã kết thúc
                          </button>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-200 dark:border-gray-700"></div>

                      {/* My Polls Toggle */}
                      <div>
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                          👤 Người tạo
                        </h3>
                        <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showMyPolls}
                            onChange={(e) => setShowMyPolls(e.target.checked)}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Chỉ Poll của tôi
                          </span>
                        </label>
                      </div>

                      {/* Clear All Button */}
                      {(statusFilter !== 'all' || showMyPolls) && (
                        <>
                          <div className="border-t border-gray-200 dark:border-gray-700"></div>
                          <button
                            onClick={() => {
                              setStatusFilter('all');
                              setShowMyPolls(false);
                              document.getElementById('filter-dropdown')?.classList.add('hidden');
                            }}
                            className="w-full px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 font-medium transition-colors"
                          >
                            🗑️ Xóa tất cả bộ lọc
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Results Summary */}
              {!pollsLoading && pollsList.length > 0 && (
                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="flex-1">
                    {(searchQuery || statusFilter !== 'all' || showMyPolls) && (
                      <div className="flex flex-wrap gap-2">
                        {searchQuery && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                            🔍 &quot;{searchQuery}&quot;
                          </span>
                        )}
                        {statusFilter !== 'all' && (
                          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                            {statusFilter === 'active' && '🟢 Đang diễn ra'}
                            {statusFilter === 'upcoming' && '🟡 Sắp diễn ra'}
                            {statusFilter === 'ended' && '⚫ Đã kết thúc'}
                          </span>
                        )}
                        {showMyPolls && (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
                            👤 Poll của tôi
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Danh sách Polls */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6 dark:text-white">Danh sách Cuộc bỏ phiếu</h2>

              {/* Polls List */}
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {pollsLoading ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">⏳ Đang tải...</p>
                ) : pollsError ? (
                  <div className="text-center py-8">
                    <p className="text-red-500 mb-2">❌ Lỗi khi tải dữ liệu</p>
                    <p className="text-red-400 text-sm">{pollsError.message}</p>
                  </div>
                ) : !pollsList || pollsList.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400 mb-2">📭 Chưa có cuộc bỏ phiếu nào</p>
                    <p className="text-sm text-gray-400">Hãy tạo cuộc bỏ phiếu đầu tiên!</p>
                  </div>
                ) : filteredPolls.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400 mb-2">🔍 Không tìm thấy kết quả</p>
                    <p className="text-sm text-gray-400 mb-3">
                      {showMyPolls 
                        ? 'Bạn chưa tạo Poll nào. Hãy tạo Poll đầu tiên!'
                        : searchQuery 
                          ? `Không có Poll nào khớp với "${searchQuery}"`
                          : 'Thử thay đổi bộ lọc trạng thái'}
                    </p>
                    {(searchQuery || statusFilter !== 'all' || showMyPolls) && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('all');
                          setShowMyPolls(false);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        🔄 Xóa tất cả bộ lọc
                      </button>
                    )}
                  </div>
                ) : (
                  filteredPolls.map((poll) => {
                    const status = getPollStatus(poll);
                    const isCreator = poll.creator.toLowerCase() === address?.toLowerCase();
                    
                    return (
                      <div
                        key={poll.id.toString()}
                        onClick={() => setSelectedPoll(Number(poll.id))}
                        className={`p-5 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                          selectedPoll === Number(poll.id)
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400 shadow-md'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                        }`}
                      >
                        {/* Header: Title + Status Badge */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold dark:text-white mb-1">{poll.title}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">ID: {poll.id.toString()}</p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                              status === 'active'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                : status === 'upcoming'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {getPollStatusText(poll)}
                          </span>
                        </div>

                        {/* Countdown Timer */}
                        <div className="mb-3 p-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                          <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                            ⏰ {getTimeRemaining(poll)}
                          </p>
                        </div>

                        {/* Poll Info */}
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                          <div className="flex items-center gap-2">
                            <span>🗳️</span>
                            <span>{poll.isPublic ? 'Công khai' : 'Riêng tư'}</span>
                            {isCreator && (
                              <span className="ml-auto px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium">
                                Của bạn
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span>📅</span>
                            <span>
                              {dayjs.unix(Number(poll.startTime)).format('DD/MM/YY HH:mm')} → {dayjs.unix(Number(poll.endTime)).format('DD/MM/YY HH:mm')}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar with Total Votes */}
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                            <span className="font-medium">👥 Mức độ tham gia</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                              {pollVoteCounts[poll.id.toString()]?.toString() || '0'} phiếu
                            </span>
                          </div>
                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(Number(pollVoteCounts[poll.id.toString()] || BigInt(0)) * 10, 100)}%`
                              }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                            {Number(pollVoteCounts[poll.id.toString()] || BigInt(0)) === 0 
                              ? 'Chưa có ai bỏ phiếu' 
                              : `${pollVoteCounts[poll.id.toString()]?.toString()} người đã tham gia`}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Chi tiết Poll và Voting */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                {selectedPoll !== null && filteredPolls.some(poll => Number(poll.id) === selectedPoll) ? (
                  <>
                    {hasVoted && (
                      <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                        <p className="text-yellow-800 dark:text-yellow-300 font-medium">✅ Bạn đã bỏ phiếu rồi</p>
                      </div>
                    )}

                    {/* 2 CỘT: Thống kê và Ứng cử viên */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* CỘT 1: THỐNG KÊ */}
                      <div>
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <h3 className="text-lg font-semibold mb-4 dark:text-white">📊 Thống kê</h3>
                          
                          {/* Tổng số liệu */}
                          <div className="text-center mb-4">
                            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                              {totalVotes ? totalVotes.toString() : '0'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Tổng số phiếu</p>
                          </div>

                          {/* Danh sách người đã bỏ phiếu */}
                          {voterAddresses && voterAddresses.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                              <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                                👥 Danh sách người đã bỏ phiếu:
                              </h4>
                              <div className="max-h-80 overflow-y-auto space-y-2">
                                {voterAddresses.map((voter, index) => (
                                  <div
                                    key={index}
                                    className="p-2 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-between text-sm"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-500 dark:text-gray-400 font-mono text-xs">
                                        #{index + 1}
                                      </span>
                                      <div className="flex flex-col">
                                        <span className="font-mono text-xs text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                                          {voter}
                                        </span>
                                      </div>
                                    </div>
                                    {voter.toLowerCase() === address?.toLowerCase() && (
                                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium">
                                        Bạn
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* CỘT 2: ỨNG CỬ VIÊN */}
                      <div>
                        <div className="space-y-3">
                          {candidates && (candidates as Candidate[]).length > 0 ? (
                            (candidates as Candidate[]).map((candidate, index) => {
                              const poll = pollsList.find((p) => Number(p.id) === selectedPoll);
                              const canVote = poll && isPollActive(poll) && !hasVoted;

                              return (
                                <div
                                  key={index}
                                  className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all"
                                >
                                  <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-lg font-semibold dark:text-white">{candidate.name}</h3>
                                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                      {candidate.voteCount.toString()} phiếu
                                    </span>
                                  </div>
                                  
                                  {canVote && (
                                    <>
                                      {!isConnected ? (
                                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                                          <p className="text-sm text-blue-800 dark:text-blue-300 text-center font-medium">
                                            🔗 Vui lòng kết nối ví để bỏ phiếu
                                          </p>
                                        </div>
                                      ) : (
                                        <>
                                          {chainId !== ROOTSTOCK_CHAIN_ID && (
                                            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                                              <p className="text-xs text-yellow-800 dark:text-yellow-300 text-center">
                                                ⚠️ Cần chuyển sang Rootstock để bỏ phiếu
                                              </p>
                                            </div>
                                          )}
                                          <button
                                            onClick={() => handleVote(index)}
                                            disabled={isVoting || isConfirming}
                                            className={`w-full mt-2 px-4 py-2 text-white rounded-lg font-medium disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors ${
                                              chainId !== ROOTSTOCK_CHAIN_ID
                                                ? 'bg-yellow-600 dark:bg-yellow-700 hover:bg-yellow-700 dark:hover:bg-yellow-600'
                                                : 'bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600'
                                            }`}
                                          >
                                            {isVoting || isConfirming 
                                              ? 'Đang xử lý...' 
                                              : chainId !== ROOTSTOCK_CHAIN_ID
                                                ? '🔄 Chuyển sang Rootstock & Bỏ phiếu'
                                                : 'Bỏ phiếu'
                                            }
                                          </button>
                                        </>
                                      )}
                                    </>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-8">Không có ứng cử viên</p>
                          )}
                        </div>
                      </div>
                    
                    </div>
                  </>
                ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p className="text-xl mb-2">
                    {filteredPolls.length === 0 
                      ? '📭 Không có cuộc bỏ phiếu nào'
                      : '👈 Chọn một cuộc bỏ phiếu để xem chi tiết'
                    }
                  </p>
                  {filteredPolls.length === 0 && (searchQuery || statusFilter !== 'all' || showMyPolls) && (
                    <p className="text-sm text-gray-400 mb-4">
                      {showMyPolls 
                        ? 'Bạn chưa tạo Poll nào'
                        : statusFilter !== 'all'
                          ? `Không có Poll nào ${statusFilter === 'active' ? 'đang diễn ra' : statusFilter === 'upcoming' ? 'sắp diễn ra' : 'đã kết thúc'}`
                          : 'Thử thay đổi bộ lọc'}
                    </p>
                  )}
                </div>
              )}
              </div>
            </div>
          </div>
          </>
      </div>
    </div>
  );
}
