import { openDatabase } from "../db/indexedDB.js";
import { STORES } from "../db/schema.js";

export function addToQueue(operation) {
    return openDatabase().then(
        (db) =>
            new Promise((resolve, reject) => {
                const transaction = db.transaction(
                    STORES.SYNC_QUEUE,
                    "readwrite"
                );

                const store = transaction.objectStore(
                    STORES.SYNC_QUEUE
                );

                const request = store.add({
                    table: operation.table,
                    action: operation.action,
                    record_id: operation.record_id,
                    data: operation.data,
                    status: "pending",
                    created_at: Date.now(),
                });

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            })
    );
}

export function getPendingQueue() {
    return openDatabase().then(
        (db) =>
            new Promise((resolve, reject) => {
                const transaction = db.transaction(
                    STORES.SYNC_QUEUE,
                    "readonly"
                );

                const store = transaction.objectStore(
                    STORES.SYNC_QUEUE
                );

                const request = store.getAll();

                request.onsuccess = () => {
                    resolve(
                        request.result.filter(
                            (item) => item.status === "pending"
                        )
                    );
                };

                request.onerror = () => reject(request.error);
            })
    );
}

export function markAsSynced(queueId) {
    return openDatabase().then(
        (db) =>
            new Promise((resolve, reject) => {
                const transaction = db.transaction(
                    STORES.SYNC_QUEUE,
                    "readwrite"
                );

                const store = transaction.objectStore(
                    STORES.SYNC_QUEUE
                );

                const request = store.get(queueId);

                request.onsuccess = () => {
                    const item = request.result;

                    if (!item) {
                        reject(new Error("Queue item not found"));
                        return;
                    }

                    item.status = "synced";

                    const updateRequest = store.put(item);

                    updateRequest.onsuccess = () => resolve(item);
                    updateRequest.onerror = () =>
                        reject(updateRequest.error);
                };

                request.onerror = () => reject(request.error);
            })
    );
}
