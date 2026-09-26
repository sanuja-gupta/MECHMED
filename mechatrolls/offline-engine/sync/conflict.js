export function detectConflict(localRecord, serverRecord) {
    if (!localRecord || !serverRecord) {
        return false;
    }

    return localRecord.updated_at < serverRecord.updated_at;
}

export function resolveConflict(localRecord, serverRecord) {
    if (!localRecord || !serverRecord) {
        return null;
    }

    // Last-Write-Wins
    if (localRecord.updated_at >= serverRecord.updated_at) {
        return {
            winner: "local",
            record: localRecord
        };
    }

    return {
        winner: "server",
        record: serverRecord
    };
}
