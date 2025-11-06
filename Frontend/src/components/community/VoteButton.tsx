import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { communityForumApi } from '../../api/communityForum';
import { useAuth } from '../../hooks/useAuth';

interface VoteButtonProps {
  postId: string;
  initialScore: number;
  initialUserVote?: 1 | -1 | null;
  onVoteChange?: (newScore: number, newVote: 1 | -1 | null) => void;
  disabled?: boolean;
}

export default function VoteButton({
  postId,
  initialScore,
  initialUserVote,
  onVoteChange,
  disabled = false,
}: VoteButtonProps) {
  const { user } = useAuth();
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<1 | -1 | null>(initialUserVote ?? null);
  const [isVoting, setIsVoting] = useState(false);

  // Update internal state when props change
  useEffect(() => {
    setScore(initialScore);
    setUserVote(initialUserVote ?? null);
  }, [initialScore, initialUserVote]);

  const handleVote = async (value: 1 | -1) => {
    if (!user || isVoting || disabled) return;

    setIsVoting(true);

    try {
      console.log('🗳️ Voting:', { postId, value, currentScore: score, currentUserVote: userVote });
      const response = await communityForumApi.votePost(postId, { value });
      console.log('🗳️ Vote response:', response.data);
      // Update with server values (server handles all the toggle logic)
      setScore(response.data.voteScore);
      setUserVote(response.data.userVote ?? null);
      onVoteChange?.(response.data.voteScore, response.data.userVote ?? null);
    } catch (error) {
      console.error('Failed to vote:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const isDisabled = !user || isVoting || disabled;

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={() => handleVote(1)}
        disabled={isDisabled}
        className={`p-1.5 rounded-xl transition-all duration-300 ${
          userVote === 1
            ? 'text-green-700 bg-gradient-to-br from-green-100 to-emerald-100 shadow-sm border border-green-200'
            : 'text-gray-400 hover:text-green-600 hover:bg-green-50 border border-transparent'
        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_2px_8px_hsl(120_100%_25%_/_0.12)]'}`}
        aria-label="Upvote"
        title={!user ? 'Sign in to vote' : 'Upvote'}
      >
        <ChevronUp className="w-5 h-5" />
      </button>

      <span
        className={`text-sm font-bold min-w-[2.5rem] text-center px-2 py-1 rounded-lg ${
          userVote === 1
            ? 'text-green-700 bg-green-50'
            : userVote === -1
            ? 'text-gray-700 bg-gray-100'
            : 'text-gray-600'
        }`}
      >
        {isNaN(Number(score)) ? 0 : score}
      </span>

      <button
        onClick={() => handleVote(-1)}
        disabled={isDisabled}
        className={`p-1.5 rounded-xl transition-all duration-300 ${
          userVote === -1
            ? 'text-gray-700 bg-gradient-to-br from-gray-100 to-gray-200 shadow-sm border border-gray-300'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 border border-transparent'
        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:translate-y-0.5 hover:shadow-[0_2px_8px_hsl(0_0%_0%_/_0.08)]'}`}
        aria-label="Downvote"
        title={!user ? 'Sign in to vote' : 'Downvote'}
      >
        <ChevronDown className="w-5 h-5" />
      </button>
    </div>
  );
}
