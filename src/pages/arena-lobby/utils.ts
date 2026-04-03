export function normalizeRoomCode(roomCode: string) {
  return roomCode.trim().toUpperCase();
}

export function getRoomFromQueryParam() {
  if (typeof window === "undefined") {
    return "";
  }

  const currentUrl = new URL(window.location.href);
  return normalizeRoomCode(currentUrl.searchParams.get("room") ?? "");
}

export function setRoomQueryParam(roomId: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  const currentUrl = new URL(window.location.href);
  if (roomId) {
    currentUrl.searchParams.set("room", roomId);
  } else {
    currentUrl.searchParams.delete("room");
  }

  window.history.replaceState(
    null,
    "",
    `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`,
  );
}

export function buildShareUrl(roomId: string) {
  if (typeof window === "undefined") {
    return roomId;
  }

  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.set("room", roomId);
  return currentUrl.toString();
}

export function generateRoomId(existingRoomIds: Set<string>) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let attempts = 0;

  while (attempts < 50) {
    const roomId = Array.from({ length: 6 }, () => {
      return alphabet[Math.floor(Math.random() * alphabet.length)];
    }).join("");

    if (!existingRoomIds.has(roomId)) {
      return roomId;
    }

    attempts += 1;
  }

  return `${Date.now().toString(36).slice(-6).toUpperCase()}`;
}
