import { schema } from "spacetimedb/server";
import { auth_account, auth_session } from "./auth/tables";

const spacetimedb = schema({
  authAccount: auth_account,
  authSession: auth_session,
});

export default spacetimedb;
