import { SUPABASE_URL, SUPABASE_KEY } from "../config.js";
import { getPendingQueue } from "./queue.js";

export async function syncPendingChanges() {
    const pendingItems = await getPendingQueue();

    if (pendingItems.length === 0) {
        console.log("No pending changes.");
        return;
    }

    for (const item of pendingItems) {
        try {
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/${item.table}`,
                {
                    method: getHttpMethod(item.action),
                    headers: {
                        "apikey": SUPABASE_KEY,
                        "Authorization": `Bearer ${SUPABASE_KEY}`,
                        "Content-Type": "application/json",
                        "Prefer": "return=representation"
                    },
                    body: item.action === "DELETE"
                        ? undefined
                        : JSON.stringify(item.data)
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Supabase error: ${response.status}`
                );
            }

            console.log(
                `Synced: ${item.table} / ${item.record_id}`
            );

        } catch (error) {
            console.error(
                `Sync failed for ${item.record_id}:`,
                error
            );
        }
    }
}

function getHttpMethod(action) {
    switch (action) {
        case "CREATE":
            return "POST";

        case "UPDATE":
            return "PATCH";

        case "DELETE":
            return "DELETE";

        default:
            throw new Error(`Unknown action: ${action}`);
    }
}
