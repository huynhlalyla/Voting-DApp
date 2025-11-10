'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { VOTING_CONTRACT_ADDRESS, VOTING_CONTRACT_ABI } from '@/contracts/AdvancedVoting';
import Link from 'next/link';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

export default function CreatePollPage() {
  const { address, isConnected } = useAccount();
  const [title, setTitle] = useState('');
  const [candidates, setCandidates] = useState(['', '']);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [whitelist, setWhitelist] = useState('');

  const { data: hash, writeContract, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: confirmError } = useWaitForTransactionReceipt({ hash });

  // Toast notifications
  useEffect(() => {
    if (isConfirming) {
      toast.loading('Đang xác nhận giao dịch...', { id: 'create-poll-tx' });
    }
    if (isSuccess) {
      toast.success('Tạo cuộc bỏ phiếu thành công! 🎉', { id: 'create-poll-tx' });
      // Reset form
      setTitle('');
      setCandidates(['', '']);
      setStartTime('');
      setEndTime('');
      setIsPublic(true);
      setWhitelist('');
    }
  }, [isConfirming, isSuccess]);

  // Handle errors
  useEffect(() => {
    if (writeError) {
      const errorMessage = writeError.message;
      if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
        toast.error('Bạn đã từ chối giao dịch', { id: 'create-poll-tx' });
      } else if (errorMessage.includes('Thoi gian khong hop le')) {
        toast.error('Thời gian không hợp lệ. Thời gian kết thúc phải sau thời gian bắt đầu', { id: 'create-poll-tx' });
      } else if (errorMessage.includes('Can it nhat 2 ung cu vien')) {
        toast.error('Cần ít nhất 2 ứng cử viên', { id: 'create-poll-tx' });
      } else if (errorMessage.includes('insufficient funds')) {
        toast.error('Không đủ ETH để thanh toán gas fee', { id: 'create-poll-tx' });
      } else {
        toast.error('Có lỗi xảy ra. Vui lòng thử lại!', { id: 'create-poll-tx' });
      }
    }
    if (confirmError) {
      toast.error('Giao dịch thất bại. Vui lòng thử lại!', { id: 'create-poll-tx' });
    }
  }, [writeError, confirmError]);

  const addCandidate = () => {
    setCandidates([...candidates, '']);
  };

  const removeCandidate = (index: number) => {
    if (candidates.length > 2) {
      setCandidates(candidates.filter((_, i) => i !== index));
    }
  };

  const updateCandidate = (index: number, value: string) => {
    const newCandidates = [...candidates];
    newCandidates[index] = value;
    setCandidates(newCandidates);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      toast.error('⚠️ Vui lòng kết nối ví trước');
      return;
    }

    const filteredCandidates = candidates.filter(c => c.trim() !== '');
    if (filteredCandidates.length < 2) {
      toast.error('⚠️ Cần ít nhất 2 ứng cử viên');
      return;
    }

    if (!startTime || !endTime) {
      toast.error('⚠️ Vui lòng chọn thời gian bắt đầu và kết thúc');
      return;
    }

    const startTimestamp = BigInt(dayjs(startTime).unix());
    const endTimestamp = BigInt(dayjs(endTime).unix());

    if (startTimestamp >= endTimestamp) {
      toast.error('⚠️ Thời gian kết thúc phải sau thời gian bắt đầu');
      return;
    }

    const now = BigInt(Math.floor(Date.now() / 1000));
    if (startTimestamp < now) {
      toast.error('⚠️ Thời gian bắt đầu phải trong tương lai');
      return;
    }

    const whitelistAddresses = isPublic 
      ? [] 
      : whitelist.split('\n').map(addr => addr.trim()).filter(addr => addr.length > 0);

    // Validate whitelist addresses
    if (!isPublic && whitelistAddresses.length === 0) {
      toast.error('⚠️ Cuộc bỏ phiếu riêng tư cần ít nhất 1 địa chỉ trong whitelist');
      return;
    }

    // Validate Ethereum addresses
    if (!isPublic) {
      const invalidAddresses = whitelistAddresses.filter(addr => !addr.match(/^0x[a-fA-F0-9]{40}$/));
      if (invalidAddresses.length > 0) {
        toast.error(`⚠️ Địa chỉ không hợp lệ: ${invalidAddresses[0]}`);
        return;
      }
    }

    try {
      writeContract({
        address: VOTING_CONTRACT_ADDRESS,
        abi: VOTING_CONTRACT_ABI,
        functionName: 'createPoll',
        args: [
          title,
          filteredCandidates,
          startTimestamp,
          endTimestamp,
          isPublic,
          whitelistAddresses as `0x${string}`[],
        ],
        gas: BigInt(200000), // Giảm gas xuống ~0.0004 tRBTC
      });
    } catch (error: any) {
      console.error('Error creating poll:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4 transition-colors">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Tạo Cuộc bỏ phiếu mới</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Điền thông tin để tạo cuộc bỏ phiếu của bạn</p>
        </div>

        {!isConnected ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-xl text-gray-600 dark:text-gray-400">Vui lòng kết nối ví để tạo poll</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tiêu đề cuộc bỏ phiếu *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="VD: Bầu chọn đại diện lớp"
              />
            </div>

            {/* Candidates */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ứng cử viên * (tối thiểu 2)
              </label>
              <div className="space-y-2">
                {candidates.map((candidate, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={candidate}
                      onChange={(e) => updateCandidate(index, e.target.value)}
                      required
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Ứng cử viên ${index + 1}`}
                    />
                    {candidates.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeCandidate(index)}
                        className="px-4 py-2 bg-red-500 dark:bg-red-600 text-white rounded-lg hover:bg-red-600 dark:hover:bg-red-700"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addCandidate}
                className="mt-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                + Thêm ứng cử viên
              </button>
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thời gian bắt đầu *
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thời gian kết thúc *
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Public/Private */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cuộc bỏ phiếu công khai (ai cũng có thể tham gia)
                </span>
              </label>
            </div>

            {/* Whitelist */}
            {!isPublic && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Whitelist (mỗi địa chỉ một dòng)
                </label>
                <textarea
                  value={whitelist}
                  onChange={(e) => setWhitelist(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="0x123...&#10;0x456..."
                />
              </div>
            )}

            {/* Status Messages */}
            {isSuccess && (
              <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg">
                <p className="text-green-800 dark:text-green-300 font-medium">✅ Tạo thành công!</p>
                <Link href="/voting" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Xem danh sách polls →
                </Link>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending || isConfirming}
              className="w-full px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {isPending || isConfirming ? 'Đang xử lý...' : 'Tạo cuộc bỏ phiếu'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
