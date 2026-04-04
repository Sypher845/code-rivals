import { schema } from "spacetimedb/server";
import { auth_account, auth_session, player_profile } from "./auth/tables";
import {
  arena_match_summary,
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
  playerProfile: player_profile,
  arenaRoom: arena_room,
  arenaRoomMember: arena_room_member,
  arenaPowerupLock: arena_powerup_lock,
  arenaRoundResult: arena_round_result,
  arenaMatchSummary: arena_match_summary,
  arenaRoomTimeoutJob: arena_room_timeout_job,
  arenaRoomNotice: arena_room_notice,
});

export default spacetimedb;
