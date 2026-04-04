import { schema } from "spacetimedb/server";
import { auth_account, auth_session, player_profile } from "./auth/tables";
import {
  arena_match_continue,
  arena_match_summary,
  arena_room,
  arena_room_member,
  arena_room_notice,
  arena_powerup_lock,
  arena_sabotage_event,
  arena_round_result,
  arena_room_timeout_job,
} from "./arena/tables";
import {
  friend_request,
  friendship,
  game_invite,
  player_presence,
  rival_entry,
  user_notification,
} from "./social/tables";

const spacetimedb = schema({
  authAccount: auth_account,
  authSession: auth_session,
  playerProfile: player_profile,
  arenaRoom: arena_room,
  arenaRoomMember: arena_room_member,
  arenaPowerupLock: arena_powerup_lock,
  arenaSabotageEvent: arena_sabotage_event,
  arenaRoundResult: arena_round_result,
  arenaMatchSummary: arena_match_summary,
  arenaMatchContinue: arena_match_continue,
  arenaRoomTimeoutJob: arena_room_timeout_job,
  arenaRoomNotice: arena_room_notice,
  friendRequest: friend_request,
  friendship,
  rivalEntry: rival_entry,
  playerPresence: player_presence,
  gameInvite: game_invite,
  userNotification: user_notification,
});

export default spacetimedb;
