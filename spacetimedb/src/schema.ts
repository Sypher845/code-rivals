import { schema } from "spacetimedb/server";
import { auth_account, auth_session } from "./auth/tables";
import {
  arena_room,
  arena_room_member,
  arena_room_notice,
  arena_powerup_lock,
  arena_round_result,
  arena_room_timeout_job,
} from "./arena/tables";

const spacetimedb = schema({
  authAccount: auth_account,
  authSession: auth_session,
  arenaRoom: arena_room,
  arenaRoomMember: arena_room_member,
  arenaPowerupLock: arena_powerup_lock,
  arenaRoundResult: arena_round_result,
  arenaRoomTimeoutJob: arena_room_timeout_job,
  arenaRoomNotice: arena_room_notice,
});

export default spacetimedb;
