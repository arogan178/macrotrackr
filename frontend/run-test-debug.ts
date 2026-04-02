import { QueryClient } from "@tanstack/react-query";
import { adjustDailyTotals } from "./src/hooks/queries/useMacroQueries";

// can't run this directly because it's not exported. Let me just add a console.log inside the test to see what totalsDuringMutation is.
