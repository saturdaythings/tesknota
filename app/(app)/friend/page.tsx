"use client";

import { Topbar } from "@/components/layout/Topbar";
import { useUser, getFriend } from "@/lib/user-context";

export default function FriendPage() {
  const { user } = useUser();
  const friendName = user ? getFriend(user).name : "Friend";

  return (
    <>
      <Topbar category="Social" title={`${friendName}'s Profile`} />
      <main className="flex-1 overflow-y-auto p-[26px]">
        {/* Phase 5f */}
      </main>
    </>
  );
}
