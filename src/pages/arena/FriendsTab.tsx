import { mockFriends } from "./arena-data";
import { panelFrameClass, panelNoiseClass, glassCardClass, onlineDotClass, offlineDotClass, challengeButtonClass } from "../../components/uiClasses";

function getInitials(name: string) {
  return name
    .split("_")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getAvatarTone(name: string) {
  const tones = [
    "bg-[rgba(0,229,204,0.18)] text-[var(--arena-accent)]",
    "bg-[rgba(77,143,255,0.18)] text-[var(--tertiary)]",
    "bg-[rgba(224,141,255,0.18)] text-[var(--primary)]",
    "bg-[rgba(124,216,124,0.18)] text-[var(--signal-success)]",
  ];
  const seed = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return tones[seed % tones.length];
}

export function FriendsTab() {
  const onlineCount = mockFriends.filter((f) => f.isOnline).length;

  return (
    <div className="space-y-4">
      <div className={`${panelFrameClass} arena-stagger p-5`}>
        <div className={panelNoiseClass} />
        <div className="relative z-1">
          <div className="flex items-center justify-between mb-4">
            <p className="font-(--font-mono) text-[0.72rem] tracking-[0.24em] text-(--primary) uppercase">
              Friends ({mockFriends.length})
            </p>
            <span className="text-xs text-[rgba(241,243,252,0.5)]">
              {onlineCount} online
            </span>
          </div>

          <div className="space-y-3">
            {mockFriends.map((friend) => (
              <article
                key={friend.id}
                className={`${glassCardClass} group flex flex-wrap items-center justify-between gap-4 p-4`}
              >
                <div className="flex items-center gap-3">
                  {/* Online/Offline Status Dot */}
                  <div className="relative">
                    <div className={`mb-2 grid h-8 w-8 place-items-center rounded-full text-xs font-semibold ${getAvatarTone(friend.username)}`}>
                      {getInitials(friend.username)}
                    </div>
                    <div className={friend.isOnline ? onlineDotClass : offlineDotClass} />
                    {friend.isOnline && (
                      <div className="absolute inset-0 h-2.5 w-2.5 animate-ping rounded-full bg-green-400 opacity-40" />
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-(--on-background)">
                      {friend.username}
                    </p>
                    <p className="text-xs text-[rgba(241,243,252,0.5)]">
                      {friend.elo} ELO · {friend.league}
                    </p>
                    <p className="mt-1 text-[0.7rem] text-[rgba(241,243,252,0.62)]">
                      {friend.isOnline ? "↑ +12 this week" : "↓ -4 this week"}
                    </p>
                  </div>
                </div>

                <button
                  className={`${challengeButtonClass} ${friend.isOnline ? "group-hover:animate-pulse" : ""}`}
                  type="button"
                  disabled={!friend.isOnline}
                >
                  {friend.isOnline ? "Challenge" : "Offline"}
                </button>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
