import { useEffect, useMemo, useState, useCallback } from "react";
import type { Identity } from "spacetimedb";
import { useReducer, useTable } from "spacetimedb/react";
import { reducers, tables } from "../../module_bindings";
import {
  normalizeRoomCode,
  getRoomFromQueryParam,
  setRoomQueryParam,
  buildShareUrl,
  generateRoomId,
} from "./utils";

type StatusTone = "neutral" | "error";

export function useArenaLobby(identity: Identity | undefined) {
  const [arenaStatusMessage, setArenaStatusMessage] = useState<string | null>(
    null,
  );
  const [arenaStatusTone, setArenaStatusTone] = useState<StatusTone>("neutral");
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [processedRoomCode, setProcessedRoomCode] = useState<string | null>(
    null,
  );

  const createArenaRoom = useReducer(reducers.createArenaRoom);
  const joinArenaRoom = useReducer(reducers.joinArenaRoom);
  const startArenaMatch = useReducer(reducers.startArenaMatch);
  const kickArenaMember = useReducer(reducers.kickArenaMember);

  const [arenaRoomRows, arenaRoomsReady] = useTable(tables.arenaRoom);
  const [arenaMemberRows, arenaMembersReady] = useTable(tables.arenaRoomMember);

  const arenaReady = arenaRoomsReady && arenaMembersReady;

  const activeRoom = useMemo(() => {
    if (!activeRoomId) return null;
    return arenaRoomRows.find((room) => room.roomId === activeRoomId) ?? null;
  }, [activeRoomId, arenaRoomRows]);

  const activeRoomMembers = useMemo(() => {
    if (!activeRoom) return [];
    return arenaMemberRows
      .filter((member) => member.roomId === activeRoom.roomId)
      .sort((left, right) => {
        if (
          left.joinedAt.microsSinceUnixEpoch <
          right.joinedAt.microsSinceUnixEpoch
        )
          return -1;
        if (
          left.joinedAt.microsSinceUnixEpoch >
          right.joinedAt.microsSinceUnixEpoch
        )
          return 1;
        return 0;
      });
  }, [activeRoom, arenaMemberRows]);

  const isArenaAdmin = Boolean(
    activeRoom && identity && activeRoom.creatorIdentity.isEqual(identity),
  );

  const pushArenaStatus = useCallback(
    (message: string, tone: StatusTone = "neutral") => {
      setArenaStatusTone(tone);
      setArenaStatusMessage(message);
    },
    [],
  );

  const openRoomByCode = useCallback(
    async (incomingRoomCode: string, source: "input" | "url") => {
      if (!identity) {
        pushArenaStatus("Session identity is not ready yet.", "error");
        return;
      }
      if (!arenaReady) {
        pushArenaStatus("Syncing arena tables...", "error");
        return;
      }

      const normalizedRoomCode = normalizeRoomCode(incomingRoomCode);
      if (!normalizedRoomCode) {
        if (source === "input")
          pushArenaStatus("Enter a room code to open an arena.", "error");
        return;
      }

      const existingRoom = arenaRoomRows.find(
        (room) => room.roomId === normalizedRoomCode,
      );
      if (!existingRoom) {
        pushArenaStatus(`Room ${normalizedRoomCode} was not found.`, "error");
        return;
      }

      try {
        await joinArenaRoom({ roomId: normalizedRoomCode });
        setActiveRoomId(normalizedRoomCode);
        setRoomCodeInput(normalizedRoomCode);
        pushArenaStatus(`Connected to arena ${normalizedRoomCode}.`);
        setRoomQueryParam(normalizedRoomCode);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to join this room.";
        pushArenaStatus(message, "error");
      }
    },
    [identity, arenaReady, arenaRoomRows, joinArenaRoom, pushArenaStatus],
  );

  const handleCreateArena = useCallback(async () => {
    if (!identity) {
      pushArenaStatus("Session identity is not ready yet.", "error");
      return;
    }
    if (!arenaReady) {
      pushArenaStatus("Syncing arena tables...", "error");
      return;
    }

    const existingRoomIds = new Set(arenaRoomRows.map((room) => room.roomId));
    const roomId = generateRoomId(existingRoomIds);

    try {
      await createArenaRoom({ roomId });
      setActiveRoomId(roomId);
      setRoomCodeInput(roomId);
      pushArenaStatus(`Arena ${roomId} created. Share it with your rival.`);
      setRoomQueryParam(roomId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create room.";
      pushArenaStatus(message, "error");
    }
  }, [identity, arenaReady, arenaRoomRows, createArenaRoom, pushArenaStatus]);

  const handleCloseRoomCard = useCallback(() => {
    if (!activeRoomId) return;
    setActiveRoomId(null);
    setRoomQueryParam(null);
  }, [activeRoomId]);

  const handleStartMatch = useCallback(async () => {
    if (!activeRoom) return;
    try {
      await startArenaMatch({ roomId: activeRoom.roomId });
      pushArenaStatus(`Match started in room ${activeRoom.roomId}.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to start this match.";
      pushArenaStatus(message, "error");
    }
  }, [activeRoom, startArenaMatch, pushArenaStatus]);

  const handleKickMember = useCallback(
    async (memberId: bigint) => {
      if (!activeRoom) return;
      try {
        await kickArenaMember({ roomId: activeRoom.roomId, memberId });
        pushArenaStatus("User removed from room.");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to kick this user.";
        pushArenaStatus(message, "error");
      }
    },
    [activeRoom, kickArenaMember, pushArenaStatus],
  );

  const handleShareRoom = useCallback(async () => {
    if (!activeRoom) return;
    const shareUrl = buildShareUrl(activeRoom.roomId);
    try {
      if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(shareUrl);
      pushArenaStatus("Room URL copied to clipboard.");
    } catch (error) {
      pushArenaStatus(
        `Clipboard unavailable. Share manually: ${shareUrl}`,
        "error",
      );
    }
  }, [activeRoom, pushArenaStatus]);

  useEffect(() => {
    if (!identity || !arenaReady) return;
    const roomFromUrl = getRoomFromQueryParam();
    if (!roomFromUrl || roomFromUrl === processedRoomCode) return;
    setProcessedRoomCode(roomFromUrl);
    setRoomCodeInput(roomFromUrl);
    void openRoomByCode(roomFromUrl, "url");
  }, [arenaReady, arenaRoomRows, identity, processedRoomCode, openRoomByCode]);

  useEffect(() => {
    if (
      activeRoomId &&
      !arenaRoomRows.some((room) => room.roomId === activeRoomId)
    ) {
      setActiveRoomId(null);
      setRoomQueryParam(null);
    }
  }, [activeRoomId, arenaRoomRows]);

  return {
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
  };
}
