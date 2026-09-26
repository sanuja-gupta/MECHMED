import type {
    Patient,
    PendingOperation,
} from "../types/patient";

import {
    getAllLocalPatients,
    savePatientLocal,
    queuePatientOperation,
    getPendingOperations,
    removePendingOperation,
    getMetadata,
    setMetadata,
} from "./db";

import {
    syncWithBackend,
} from "../services/api";

import {
    canReachBackend,
} from "./network";

function createOperationId(): string {
    return crypto.randomUUID();
}

/* =========================================
   SAVE PATIENT
========================================= */

export async function savePatientOfflineFirst(
    patientData: Omit<
        Patient,
        "id" | "updated_at" | "is_deleted" | "sync_status"
    >
): Promise<Patient> {
    const online = await canReachBackend();

    const now = Date.now() / 1000;

    const patient: Patient = {
        ...patientData,

        id: crypto.randomUUID(),

        updated_at: now,

        is_deleted: false,

        sync_status: online
            ? "Pending"
            : "Pending",
    };

    // ALWAYS save locally first.
    await savePatientLocal(patient);

    const operation: PendingOperation = {
        id: createOperationId(),

        entity_type: "patient",

        entity_id: patient.id,

        operation: "CREATE",

        payload: patient,

        created_at: now,

        attempts: 0,
    };

    await queuePatientOperation(operation);

    // If we're online, try immediately.
    if (online) {
        try {
            await syncPendingRecords();
        } catch {
            // Keep it pending.
            // It will retry later.
        }
    }

    return patient;
}

/* =========================================
   LOAD PATIENTS
========================================= */

export async function loadLocalPatients(): Promise<
    Patient[]
> {
    return getAllLocalPatients();
}

/* =========================================
   SYNC
========================================= */

export async function syncPendingRecords(): Promise<{
    synced: number;
    conflicts: number;
}> {
    const reachable = await canReachBackend();

    if (!reachable) {
        throw new Error("Backend is offline.");
    }

    const pendingOperations =
        await getPendingOperations();

    if (pendingOperations.length === 0) {
        await pullLatestChanges();

        return {
            synced: 0,
            conflicts: 0,
        };
    }

    const patients = pendingOperations
        .filter(
            (operation) =>
                operation.entity_type === "patient"
        )
        .map(
            (operation) =>
                operation.payload
        );

    const lastPulledAt =
        await getMetadata<number>(
            "last_pulled_at",
            0
        );

    const result = await syncWithBackend(
        patients,
        lastPulledAt
    );

    let synced = 0;
    let conflicts = 0;

    for (const operation of pendingOperations) {
        const matchingServerRecord =
            result.deltas.patients.find(
                (patient) =>
                    patient.id === operation.entity_id
            );

        /*
         * Backend uses updated_at to determine
         * whether an incoming record wins.
         *
         * If the server has a newer version than
         * our local version, treat this as a conflict.
         */
        if (
            matchingServerRecord &&
            matchingServerRecord.updated_at >
            operation.payload.updated_at
        ) {
            const conflictPatient: Patient = {
                ...operation.payload,
                sync_status: "Conflict",
            };

            await savePatientLocal(
                conflictPatient
            );

            conflicts++;

            continue;
        }

        if (
            result.synced_ids.patients.includes(
                operation.entity_id
            )
        ) {
            const syncedPatient: Patient = {
                ...operation.payload,
                sync_status: "Synced",
            };

            await savePatientLocal(
                syncedPatient
            );

            await removePendingOperation(
                operation.id
            );

            synced++;
        }
    }

    /*
     * Pull any server-side changes.
     */
    await applyServerDeltas(
        result.deltas.patients
    );

    /*
     * Save checkpoint.
     */
    await setMetadata(
        "last_pulled_at",
        result.checkpoint
    );

    return {
        synced,
        conflicts,
    };
}

/* =========================================
   PULL SERVER CHANGES
========================================= */

async function pullLatestChanges(): Promise<void> {
    const lastPulledAt =
        await getMetadata<number>(
            "last_pulled_at",
            0
        );

    const result = await syncWithBackend(
        [],
        lastPulledAt
    );

    await applyServerDeltas(
        result.deltas.patients
    );

    await setMetadata(
        "last_pulled_at",
        result.checkpoint
    );
}

/* =========================================
   APPLY DELTAS
========================================= */

async function applyServerDeltas(
    serverPatients: Patient[]
): Promise<void> {
    const localPatients =
        await getAllLocalPatients();

    for (const serverPatient of serverPatients) {
        const localPatient =
            localPatients.find(
                (patient) =>
                    patient.id === serverPatient.id
            );

        /*
         * Don't overwrite a locally pending record
         * with an older server record.
         */
        if (
            localPatient &&
            localPatient.sync_status === "Pending" &&
            localPatient.updated_at >
            serverPatient.updated_at
        ) {
            continue;
        }

        const patient: Patient = {
            ...serverPatient,
            sync_status: "Synced",
        };

        await savePatientLocal(patient);
    }
}

/* =========================================
   RETRY FAILED SYNC
========================================= */

export async function retrySync(): Promise<{
    synced: number;
    conflicts: number;
}> {
    return syncPendingRecords();
}

/* =========================================
   PENDING COUNT
========================================= */

export async function getPendingCount(): Promise<number> {
    const operations =
        await getPendingOperations();

    return operations.length;
}

/* =========================================
   CONFLICT COUNT
========================================= */

export async function getConflictCount(): Promise<number> {
    const patients =
        await getAllLocalPatients();

    return patients.filter(
        (patient) =>
            patient.sync_status === "Conflict"
    ).length;
}