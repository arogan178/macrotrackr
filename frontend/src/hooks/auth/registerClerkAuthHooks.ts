import { registerClerkAuthHooks } from "./clerkAuthRegistry";
import * as queries from "./useAuthQueries.clerk";
import * as state from "./useAuthState.clerk";

registerClerkAuthHooks({ state, queries });
