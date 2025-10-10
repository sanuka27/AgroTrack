import { useState } from 'react';
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

  const handleVote = async (value: 1 | -1) => {
    if (!user || isVoting || disabled) return;

    // Optimistic update
    const previousScore = score;
    const previousVote = userVote;

    let newScore = score;
    let newVote: 1 | -1 | null = value;

    // Toggle logic
    if (userVote === value) {
      // Remove vote
      newScore -= value;
      newVote = null;
    } else if (userVote === null) {
      // Add vote
      newScore += value;
    } else {
      // Change vote (remove old, add new)
      newScore -= userVote;
      newScore += value;
    }

    setScore(newScore);
    setUserVote(newVote);
    onVoteChange?.(newScore, newVote);

    setIsVoting(true);

    try {
      const response = await communityForumApi.votePost(postId, { value });
      // Update with server values
      setScore(response.data.voteScore);
      setUserVote(response.data.userVote ?? null);
      onVoteChange?.(response.data.voteScore, response.data.userVote ?? null);
    } catch (error) {
      // Revert on error
      setScore(previousScore);
      setUserVote(previousVote);
      onVoteChange?.(previousScore, previousVote);
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
        {score}
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
