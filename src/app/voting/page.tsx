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

  // Đọc tất cả polls
  const { data: polls, refetch: refetchPolls } = useReadContract({
    address: VOTING_CONTRACT_ADDRESS,
    abi: VOTING_CONTRACT_ABI,
    functionName: 'getAllPolls',
  });

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
    }
  }, [isConfirming, isConfirmed, refetchCandidates, refetchHasVoted, refetchPolls]);

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
    
    const poll = (polls as Poll[]).find((p) => Number(p.id) === selectedPoll);
    
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Danh sách Bỏ phiếu</h1>
          <p className="text-gray-600 mt-2">Chọn một cuộc bỏ phiếu để xem chi tiết và tham gia</p>
        </div>

        {!isConnected ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-xl text-gray-600">Vui lòng kết nối ví để sử dụng</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Danh sách Polls */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Danh sách Cuộc bỏ phiếu</h2>
              <div className="space-y-4">
                {polls && (polls as Poll[]).length > 0 ? (
                  (polls as Poll[]).map((poll) => (
                    <div
                      key={poll.id.toString()}
                      onClick={() => setSelectedPoll(Number(poll.id))}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPoll === Number(poll.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold">{poll.title}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            isPollActive(poll)
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {getPollStatus(poll)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>🗳️ {poll.isPublic ? 'Công khai' : 'Riêng tư'}</p>
                        <p>
                          ⏰ {dayjs.unix(Number(poll.startTime)).format('DD/MM/YYYY HH:mm')} -{' '}
                          {dayjs.unix(Number(poll.endTime)).format('DD/MM/YYYY HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">Chưa có cuộc bỏ phiếu nào</p>
                )}
              </div>
            </div>

            {/* Chi tiết Poll và Voting */}
            <div className="bg-white rounded-lg shadow p-6">
              {selectedPoll !== null ? (
                <>
                  <h2 className="text-2xl font-bold mb-4">Ứng cử viên</h2>
                  
                  {hasVoted && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 font-medium">✅ Bạn đã bỏ phiếu rồi</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {candidates && (candidates as Candidate[]).length > 0 ? (
                      (candidates as Candidate[]).map((candidate, index) => {
                        const poll = (polls as Poll[]).find((p) => Number(p.id) === selectedPoll);
                        const canVote = poll && isPollActive(poll) && !hasVoted;

                        return (
                          <div
                            key={index}
                            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-all"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="text-lg font-semibold">{candidate.name}</h3>
                              <span className="text-2xl font-bold text-blue-600">
                                {candidate.voteCount.toString()} phiếu
                              </span>
                            </div>
                            
                            {canVote && (
                              <button
                                onClick={() => handleVote(index)}
                                disabled={isVoting || isConfirming}
                                className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                              >
                                {isVoting || isConfirming ? 'Đang xử lý...' : 'Bỏ phiếu'}
                              </button>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-500 text-center py-8">Không có ứng cử viên</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-xl">Chọn một cuộc bỏ phiếu để xem chi tiết</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
