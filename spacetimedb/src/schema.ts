import { schema } from "spacetimedb/server";
import { auth_account, auth_session } from "./auth/tables";
import { arena_room, arena_room_member } from "./arena/tables";

const spacetimedb = schema({
  authAccount: auth_account,
  authSession: auth_session,
  arenaRoom: arena_room,
  arenaRoomMember: arena_room_member,
});

export default spacetimedb;
