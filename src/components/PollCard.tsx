import { useState, useEffect } from "react";
import { BarChart3, Clock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { bn } from "date-fns/locale";

const db = supabase as any;

interface PollCardProps {
  pollId: string;
}

const PollCard = ({ pollId }: PollCardProps) => {
  const { user } = useAuth();
  const [poll, setPoll] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [pollRes, optRes, voteRes] = await Promise.all([
        db.from("polls").select("*").eq("id", pollId).single(),
        db.from("poll_options").select("*").eq("poll_id", pollId),
        db.from("poll_votes").select("*").eq("poll_id", pollId),
      ]);
      setPoll(pollRes.data);
      setOptions(optRes.data || []);
      setVotes(voteRes.data || []);
      if (user) {
        const myVote = (voteRes.data || []).find((v: any) => v.user_id === user.id);
        setUserVote(myVote?.option_id || null);
      }
      setLoading(false);
    };
    fetch();
  }, [pollId, user?.id]);

  const handleVote = async (optionId: string) => {
    if (!user || userVote) return;
    await db.from("poll_votes").insert({ poll_id: pollId, option_id: optionId, user_id: user.id });
    setUserVote(optionId);
    setVotes((p) => [...p, { poll_id: pollId, option_id: optionId, user_id: user.id }]);
  };

  if (loading || !poll) return null;

  const totalVotes = votes.length;
  const isExpired = poll.expires_at && new Date(poll.expires_at) < new Date();
  const hasVoted = !!userVote;
  const showResults = hasVoted || isExpired;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-bold text-foreground flex-1">{poll.question}</h4>
      </div>

      <div className="space-y-2">
        {options.map((opt: any) => {
          const optVotes = votes.filter((v: any) => v.option_id === opt.id).length;
          const pct = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
          const isSelected = userVote === opt.id;

          return (
            <button
              key={opt.id}
              onClick={() => handleVote(opt.id)}
              disabled={showResults}
              className={`relative w-full overflow-hidden rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition-all ${
                isSelected
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-secondary/50 text-foreground hover:bg-secondary"
              } ${!showResults ? "active:scale-[0.98]" : ""}`}
            >
              {showResults && (
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                    isSelected ? "bg-primary/20" : "bg-muted"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              )}
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  <span>{opt.text}</span>
                </div>
                {showResults && (
                  <span className="text-xs font-bold text-muted-foreground">{pct}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{totalVotes} ভোট</span>
        {poll.expires_at && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {isExpired ? "শেষ হয়েছে" : `${formatDistanceToNow(new Date(poll.expires_at), { locale: bn })} বাকি`}
          </span>
        )}
      </div>
    </div>
  );
};

export default PollCard;
