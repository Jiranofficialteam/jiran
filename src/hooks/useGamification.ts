import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const db = supabase as any;

export interface UserPoints {
  xp: number;
  level: number;
  coins: number;
  daily_streak: number;
  last_login_date: string | null;
  referral_code: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
}

export interface UserBadge {
  badge_id: string;
  earned_at: string;
}

export interface Referral {
  id: string;
  referred_id: string;
  reward_claimed: boolean;
  created_at: string;
}

const XP_PER_LEVEL = 100;

export function getLevel(xp: number) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function getLevelProgress(xp: number) {
  return (xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100;
}

export function getDailyReward(streak: number) {
  // 5 coins base + 2 per streak day, max 50
  return Math.min(5 + streak * 2, 50);
}

export const useGamification = () => {
  const { user } = useAuth();
  const [points, setPoints] = useState<UserPoints | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyRewardClaimed, setDailyRewardClaimed] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];

      const [
        { data: pts },
        { data: bdg },
        { data: ub },
        { data: refs },
        { data: todayLogin },
      ] = await Promise.all([
        db.from("user_points").select("*").eq("user_id", user.id).single(),
        db.from("badges").select("*").order("requirement_value"),
        db.from("user_badges").select("*").eq("user_id", user.id),
        db.from("referrals").select("*").eq("referrer_id", user.id),
        db.from("daily_logins").select("*").eq("user_id", user.id).eq("login_date", today).maybeSingle(),
      ]);

      if (!pts) {
        // Create initial points record
        const { data: newPts } = await db.from("user_points").insert({ user_id: user.id }).select().single();
        setPoints(newPts);
      } else {
        setPoints(pts);
      }

      setBadges(bdg || []);
      setUserBadges(ub || []);
      setReferrals(refs || []);
      setDailyRewardClaimed(!!todayLogin);
    } catch (e) {
      console.error("Gamification fetch error:", e);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const claimDailyReward = async () => {
    if (!user || !points || dailyRewardClaimed) return false;
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    const newStreak = points.last_login_date === yesterday ? points.daily_streak + 1 : 1;
    const reward = getDailyReward(newStreak);
    const newXp = points.xp + 10;
    const newLevel = getLevel(newXp);

    // Insert daily login
    await db.from("daily_logins").insert({
      user_id: user.id,
      login_date: today,
      reward_coins: reward,
    });

    // Update points
    await db.from("user_points").update({
      xp: newXp,
      level: newLevel,
      coins: points.coins + reward,
      daily_streak: newStreak,
      last_login_date: today,
      updated_at: new Date().toISOString(),
    }).eq("user_id", user.id);

    setDailyRewardClaimed(true);
    await fetchAll();
    return true;
  };

  const addXp = async (amount: number) => {
    if (!user || !points) return;
    const newXp = points.xp + amount;
    const newLevel = getLevel(newXp);
    await db.from("user_points").update({
      xp: newXp,
      level: newLevel,
      updated_at: new Date().toISOString(),
    }).eq("user_id", user.id);
    await fetchAll();
  };

  return {
    points,
    badges,
    userBadges,
    referrals,
    loading,
    dailyRewardClaimed,
    claimDailyReward,
    addXp,
    refresh: fetchAll,
  };
};
