import type { Identity } from "spacetimedb";
import { panelFrameClass, panelNoiseClass } from "../components/uiClasses";
import {
  ArenaHeader,
  ArenaStatsCards,
  ArenaActionsPanel,
  ActiveRoomsList,
  ArenaRoomModal,
} from "./arena-lobby";
import { useArenaLobby } from "./arena-lobby/useArenaLobby";

type ArenaLobbyPageProps = {
  identity: Identity | undefined;
  isLoggingOut: boolean;
  onLogOut: () => void;
  shortIdentity: string;
  userSlug: string;
  username: string;
};

export function ArenaLobbyPage({
  identity,
  isLoggingOut,
  onLogOut,
  shortIdentity,
  userSlug,
  username,
}: ArenaLobbyPageProps) {
  const {
    arenaRoomRows,
    arenaMemberRows,
    arenaReady,
    activeRoomId,
    activeRoom,
    activeRoomMembers,
    isArenaAdmin,
    roomCodeInput,
    arenaStatusMessage,
    arenaStatusTone,
    setRoomCodeInput,
    openRoomByCode,
    handleCreateArena,
    handleCloseRoomCard,
    handleStartMatch,
    handleKickMember,
    handleShareRoom,
  } = useArenaLobby(identity);

  return (
    <main className="min-h-full px-6 py-6 sm:px-8 lg:px-10">
      <ArenaHeader
        shortIdentity={shortIdentity}
        isLoggingOut={isLoggingOut}
        onLogOut={onLogOut}
      />

      <div className="mx-auto grid w-full max-w-6xl gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section className={`${panelFrameClass} p-6`}>
          <div className={panelNoiseClass} />
          <div className="relative z-[1] space-y-7">
            <ArenaStatsCards
              username={username}
              userSlug={userSlug}
              activeRoomId={activeRoom?.roomId ?? null}
              arenaRoomCount={arenaRoomRows.length}
            />

            <ArenaActionsPanel
              arenaReady={arenaReady}
              roomCodeInput={roomCodeInput}
              arenaStatusMessage={arenaStatusMessage}
              arenaStatusTone={arenaStatusTone}
              onRoomCodeInputChange={setRoomCodeInput}
              onCreateArena={handleCreateArena}
              onOpenRoom={() => openRoomByCode(roomCodeInput, "input")}
            />
          </div>
        </section>

        <section className={`${panelFrameClass} p-6`}>
          <div className={panelNoiseClass} />
          <div className="relative z-[1] space-y-4">
            <p className="font-[var(--font-mono)] text-[0.72rem] tracking-[0.24em] text-[var(--primary)] uppercase">
              Active Rooms
            </p>

            <ActiveRoomsList
              arenaRoomRows={arenaRoomRows}
              arenaMemberRows={arenaMemberRows}
              onRoomClick={(roomId) => openRoomByCode(roomId, "input")}
            />
          </div>
        </section>
      </div>

      {activeRoom && (
        <ArenaRoomModal
          activeRoom={activeRoom}
          activeRoomMembers={activeRoomMembers}
          identity={identity}
          isArenaAdmin={isArenaAdmin}
          onClose={handleCloseRoomCard}
          onStartMatch={handleStartMatch}
          onKickMember={handleKickMember}
          onShareRoom={handleShareRoom}
        />
      )}
    </main>
  );
}
