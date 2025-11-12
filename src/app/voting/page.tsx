'use client';

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { VOTING_CONTRACT_ADDRESS, VOTING_CONTRACT_ABI } from '@/contracts/AdvancedVoting';
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

export default function VotingPage() {
  const { address, isConnected } = useAccount();
  const [selectedPoll, setSelectedPoll] = useState<number | null>(null);
  const [pollsList, setPollsList] = useState<Poll[]>([]);

  // Đọc tất cả polls
  const { data: polls, refetch: refetchPolls, error: pollsError, isLoading: pollsLoading } = useReadContract({
    address: VOTING_CONTRACT_ADDRESS,
    abi: VOTING_CONTRACT_ABI,
    functionName: 'getAllPolls',
  });

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

  // Refetch khi mount (đã TẮT auto-refetch on focus)
  useEffect(() => {
    refetchPolls();
  }, [refetchPolls]);

  // Debug log
  useEffect(() => {
    console.log('=== VOTING PAGE DEBUG ===');
    console.log('Contract Address:', VOTING_CONTRACT_ADDRESS);
    console.log('Polls data (raw):', polls);
    console.log('Polls data type:', typeof polls);
    console.log('Polls is array?:', Array.isArray(polls));
    console.log('PollsList state:', pollsList);
    console.log('PollsList length:', pollsList.length);
    console.log('Polls error:', pollsError);
    console.log('Polls loading:', pollsLoading);
    console.log('========================');
  }, [polls, pollsError, pollsLoading, pollsList]);

  // Đọc candidates của poll được chọn
  const { data: candidates, refetch: refetchCandidates } = useReadContract({
    address: VOTING_CONTRACT_ADDRESS,
    abi: VOTING_CONTRACT_ABI,
    functionName: 'getCandidates',
    args: selectedPoll !== null ? [BigInt(selectedPoll)] : undefined,
  });

  // Check xem user đã vote chưa
  const { data: hasVoted, refetch: refetchHasVoted } = useReadContract({
    address: VOTING_CONTRACT_ADDRESS,
    abi: VOTING_CONTRACT_ABI,
    functionName: 'checkIfVoted',
    args: selectedPoll !== null && address ? [BigInt(selectedPoll), address] : undefined,
  });

  // Get voters list
  const { data: voters, refetch: refetchVoters } = useReadContract({
    address: VOTING_CONTRACT_ADDRESS,
    abi: VOTING_CONTRACT_ABI,
    functionName: 'getVoters',
    args: selectedPoll !== null ? [BigInt(selectedPoll)] : undefined,
  });

  // Get total votes
  const { data: totalVotes, refetch: refetchTotalVotes } = useReadContract({
    address: VOTING_CONTRACT_ADDRESS,
    abi: VOTING_CONTRACT_ABI,
    functionName: 'getTotalVotes',
    args: selectedPoll !== null ? [BigInt(selectedPoll)] : undefined,
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
      const errorMessage = writeError.message;
      if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
        toast.error('Bạn đã từ chối giao dịch', { id: 'vote-tx' });
      } else if (errorMessage.includes('Ban da bo phieu roi')) {
        toast.error('Bạn đã bỏ phiếu rồi!', { id: 'vote-tx' });
      } else if (errorMessage.includes('Khong co quyen bo phieu')) {
        toast.error('Bạn không có quyền bỏ phiếu trong cuộc bỏ phiếu này', { id: 'vote-tx' });
      } else if (errorMessage.includes('Chua den gio bo phieu')) {
        toast.error('Chưa đến giờ bỏ phiếu', { id: 'vote-tx' });
      } else if (errorMessage.includes('Da het gio bo phieu')) {
        toast.error('Đã hết giờ bỏ phiếu', { id: 'vote-tx' });
      } else if (errorMessage.includes('insufficient funds')) {
        toast.error('Không đủ ETH để thanh toán gas fee', { id: 'vote-tx' });
      } else {
        toast.error('Có lỗi xảy ra. Vui lòng thử lại!', { id: 'vote-tx' });
      }
    }
    if (confirmError) {
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

    try {
      writeContract({
        address: VOTING_CONTRACT_ADDRESS,
        abi: VOTING_CONTRACT_ABI,
        functionName: 'vote',
        args: [BigInt(selectedPoll), BigInt(candidateId)],
        gas: BigInt(100000), // Giới hạn gas để tránh hết tiền
      });
    } catch (error: any) {
      console.error('Error voting:', error);
    }
  };

  const isPollActive = (poll: Poll) => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    return now >= poll.startTime && now <= poll.endTime;
  };

  const getPollStatus = (poll: Poll) => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    if (now < poll.startTime) return 'Chưa bắt đầu';
    if (now > poll.endTime) return 'Đã kết thúc';
    return 'Đang diễn ra';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Danh sách Bỏ phiếu</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Chọn một cuộc bỏ phiếu để xem chi tiết và tham gia</p>
        </div>

        {!isConnected ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-xl text-gray-600 dark:text-gray-400">Vui lòng kết nối ví để sử dụng</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Danh sách Polls */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4 dark:text-white">Danh sách Cuộc bỏ phiếu</h2>
              <div className="space-y-4">
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
                ) : (
                  pollsList.map((poll) => (
                    <div
                      key={poll.id.toString()}
                      onClick={() => setSelectedPoll(Number(poll.id))}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPoll === Number(poll.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold dark:text-white">{poll.title}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            isPollActive(poll)
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {getPollStatus(poll)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <p>🗳️ {poll.isPublic ? 'Công khai' : 'Riêng tư'}</p>
                        <p>
                          ⏰ {dayjs.unix(Number(poll.startTime)).format('DD/MM/YYYY HH:mm')} -{' '}
                          {dayjs.unix(Number(poll.endTime)).format('DD/MM/YYYY HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chi tiết Poll và Voting */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                {selectedPoll !== null ? (
                  <>
                    {/* Thống kê */}
                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
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
                          <div className="max-h-48 overflow-y-auto space-y-2">
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
                                    <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
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

                    <h2 className="text-2xl font-bold mb-4 dark:text-white">Ứng cử viên</h2>
                    
                    {hasVoted && (
                      <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                        <p className="text-yellow-800 dark:text-yellow-300 font-medium">✅ Bạn đã bỏ phiếu rồi</p>
                      </div>
                    )}

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
                              <button
                                onClick={() => handleVote(index)}
                                disabled={isVoting || isConfirming}
                                className="w-full mt-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                              >
                                {isVoting || isConfirming ? 'Đang xử lý...' : 'Bỏ phiếu'}
                              </button>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-8">Không có ứng cử viên</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p className="text-xl">Chọn một cuộc bỏ phiếu để xem chi tiết</p>
                </div>
              )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
