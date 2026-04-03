import { useMemo, useState } from "react";
import { Search, Swords, TrendingDown, TrendingUp, UserPlus } from "lucide-react";
import { mockFriends } from "./arena-data";

type FriendStatus = "online" | "offline";
type FriendsTabKey = "online" | "all" | "pending" | "blocked";

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function getAvatarTone(name: string) {
  const tones = [
    "bg-[rgba(0,229,204,0.12)] text-(--arena-accent)",
    "bg-[rgba(77,143,255,0.12)] text-(--tertiary)",
    "bg-[rgba(224,141,255,0.12)] text-(--primary)",
    "bg-[rgba(124,216,124,0.12)] text-(--signal-success)",
  ];
  const seed = name.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return tones[seed % tones.length];
}

function FriendCard({
  username,
  elo,
  league,
  status,
}: {
  username: string;
  elo: number;
  league: string;
  status: FriendStatus;
}) {
  const isOnline = status === "online";
  const trend = isOnline ? 12 : -4;

  return (
    <article
      className={`group relative rounded-xl border bg-[rgba(6,11,18,0.72)] p-5 transition-all duration-300 hover:border-[rgba(0,229,204,0.3)] ${
        isOnline ? "border-[rgba(255,255,255,0.08)]" : "border-[rgba(255,255,255,0.06)] opacity-70"
      }`}
    >
      <div
        className={`absolute left-0 top-0 h-1 w-full rounded-t-xl ${
          isOnline ? "bg-(--signal-success)" : "bg-[rgba(241,243,252,0.28)]"
        }`}
      />

      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={`grid h-12 w-12 place-items-center rounded-xl text-sm font-bold ${getAvatarTone(username)}`}
            >
              {getInitials(username)}
            </div>
            <div
              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[rgba(6,11,18,0.95)] ${
                isOnline ? "bg-(--signal-success)" : "bg-[rgba(241,243,252,0.42)]"
              }`}
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-(--on-background)">{username}</h3>
            <p className="text-xs text-[rgba(241,243,252,0.52)]">
              {isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center rounded-full border border-[rgba(224,141,255,0.28)] bg-[rgba(224,141,255,0.08)] px-2.5 py-1 text-[0.65rem] font-semibold tracking-[0.08em] text-(--primary) uppercase">
            {league}
          </span>
          <span className="font-(--font-mono) text-xs text-(--on-background)">
            {elo.toLocaleString()} ELO
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs">
          {trend >= 0 ? (
            <TrendingUp className="h-3 w-3 text-(--signal-success)" />
          ) : (
            <TrendingDown className="h-3 w-3 text-(--signal-danger)" />
          )}
          <span className={trend >= 0 ? "text-(--signal-success)" : "text-(--signal-danger)"}>
            {trend > 0 ? "+" : ""}
            {trend}
          </span>
          <span className="text-[rgba(241,243,252,0.52)]">this week</span>
        </div>
      </div>

      <button
        type="button"
        disabled={!isOnline}
        className={`inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border text-xs font-semibold tracking-[0.1em] uppercase transition ${
          isOnline
            ? "border-[rgba(0,229,204,0.35)] bg-[rgba(0,229,204,0.12)] text-(--on-background) hover:bg-[rgba(0,229,204,0.2)]"
            : "border-[rgba(241,243,252,0.18)] text-[rgba(241,243,252,0.42)]"
        }`}
      >
        {isOnline ? <Swords className="h-3.5 w-3.5" /> : null}
        {isOnline ? "Challenge" : "Offline"}
      </button>
    </article>
  );
}

export function FriendsTab() {
  const [activeTab, setActiveTab] = useState<FriendsTabKey>("online");
  const [searchQuery, setSearchQuery] = useState("");

  const friends = mockFriends;
  const onlineFriends = useMemo(() => friends.filter((friend) => friend.isOnline), [friends]);
  const offlineFriends = useMemo(() => friends.filter((friend) => !friend.isOnline), [friends]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const matchesQuery = (username: string) =>
    normalizedQuery.length === 0 || username.toLowerCase().includes(normalizedQuery);

  const filteredOnline = onlineFriends.filter((friend) => matchesQuery(friend.username));
  const filteredOffline = offlineFriends.filter((friend) => matchesQuery(friend.username));
  const filteredAll = friends.filter((friend) => matchesQuery(friend.username));

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-(--on-background) sm:text-4xl">
            Rivals <span className="text-(--arena-accent)">&</span> Allies
          </h2>
          <p className="mt-1 text-sm text-[rgba(241,243,252,0.58)]">
            Manage your friends and challenge them to arena duels.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(241,243,252,0.45)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search friends..."
              className="h-10 w-52 rounded-lg border border-[rgba(241,243,252,0.12)] bg-[rgba(241,243,252,0.06)] pl-9 pr-3 text-sm text-(--on-background) outline-none transition placeholder:text-[rgba(241,243,252,0.45)] focus:border-[rgba(0,229,204,0.45)]"
            />
          </label>

          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[rgba(0,229,204,0.38)] bg-[rgba(0,229,204,0.12)] px-3.5 text-sm font-semibold text-(--on-background) transition hover:bg-[rgba(0,229,204,0.2)]"
          >
            <UserPlus className="h-4 w-4" />
            Add Friend
          </button>
        </div>
      </div>

      <div className="inline-flex flex-wrap gap-2 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(241,243,252,0.05)] p-1">
        {[
          { key: "online" as const, label: `Online (${onlineFriends.length})` },
          { key: "all" as const, label: `All (${friends.length})` },
          { key: "pending" as const, label: "Pending (0)" },
          { key: "blocked" as const, label: "Blocked" },
        ].map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold tracking-[0.08em] uppercase transition ${
                active
                  ? "bg-[rgba(0,229,204,0.15)] text-(--on-background)"
                  : "text-[rgba(241,243,252,0.6)] hover:text-(--on-background)"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "online" ? (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredOnline.map((friend) => (
              <FriendCard
                key={friend.id}
                username={friend.username}
                elo={friend.elo}
                league={friend.league}
                status="online"
              />
            ))}
          </div>

          {filteredOffline.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-xs font-bold tracking-[0.14em] text-[rgba(241,243,252,0.62)] uppercase">
                Offline ({filteredOffline.length})
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredOffline.map((friend) => (
                  <FriendCard
                    key={friend.id}
                    username={friend.username}
                    elo={friend.elo}
                    league={friend.league}
                    status="offline"
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {activeTab === "all" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAll.map((friend) => (
            <FriendCard
              key={friend.id}
              username={friend.username}
              elo={friend.elo}
              league={friend.league}
              status={friend.isOnline ? "online" : "offline"}
            />
          ))}
        </div>
      ) : null}

      {activeTab === "pending" ? (
        <div className="rounded-xl border border-dashed border-[rgba(0,229,204,0.3)] bg-[rgba(0,229,204,0.06)] py-14 text-center">
          <p className="text-sm text-[rgba(241,243,252,0.68)]">No pending friend requests.</p>
        </div>
      ) : null}

      {activeTab === "blocked" ? (
        <div className="rounded-xl border border-dashed border-[rgba(241,243,252,0.14)] bg-[rgba(241,243,252,0.04)] py-14 text-center">
          <p className="text-sm text-[rgba(241,243,252,0.58)]">No blocked users.</p>
        </div>
      ) : null}
    </section>
  );
}
