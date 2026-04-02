import { QueryClient } from "@tanstack/react-query";

const qc = new QueryClient();

qc.setQueryData(["macros", "history-infinite", 20], "data20");

const matched = qc.getQueriesData({ queryKey: ["macros", "history-infinite", undefined] });
console.log("Matched with undefined:", matched);

const matched2 = qc.getQueriesData({ queryKey: ["macros", "history-infinite"] });
console.log("Matched without undefined:", matched2);
