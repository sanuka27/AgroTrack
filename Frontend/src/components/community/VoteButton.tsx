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
        className={`p-1 rounded transition-colors ${
          userVote === 1
            ? 'text-orange-500 bg-orange-100 dark:bg-orange-900/30'
            : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20'
        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        aria-label="Upvote"
        title={!user ? 'Sign in to vote' : 'Upvote'}
      >
        <ChevronUp className="w-6 h-6" />
      </button>

      <span
        className={`text-sm font-semibold min-w-[2rem] text-center ${
          userVote === 1
            ? 'text-orange-500'
            : userVote === -1
            ? 'text-blue-500'
            : 'text-gray-700 dark:text-gray-300'
        }`}
      >
        {score}
      </span>

      <button
        onClick={() => handleVote(-1)}
        disabled={isDisabled}
        className={`p-1 rounded transition-colors ${
          userVote === -1
            ? 'text-blue-500 bg-blue-100 dark:bg-blue-900/30'
            : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        aria-label="Downvote"
        title={!user ? 'Sign in to vote' : 'Downvote'}
      >
        <ChevronDown className="w-6 h-6" />
      </button>
    </div>
  );
}
