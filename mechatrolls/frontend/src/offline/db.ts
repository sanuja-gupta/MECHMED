import type {
    Patient,
    PendingOperation,
} from "../types/patient";

const DB_NAME = "medisync-offline-db";
const DB_VERSION = 1;

const PATIENT_STORE = "patients";
const QUEUE_STORE = "sync_queue";
const META_STORE = "metadata";

function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;

            if (!db.objectStoreNames.contains(PATIENT_STORE)) {
                db.createObjectStore(PATIENT_STORE, {
                    keyPath: "id",
                });
            }

            if (!db.objectStoreNames.contains(QUEUE_STORE)) {
                const queueStore = db.createObjectStore(QUEUE_STORE, {
                    keyPath: "id",
                });

                queueStore.createIndex(
                    "entity_id",
                    "entity_id",
                    { unique: false }
                );
            }

            if (!db.objectStoreNames.contains(META_STORE)) {
                db.createObjectStore(META_STORE, {
                    keyPath: "key",
                });
            }
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(
                request.error ??
                new Error("Unable to open IndexedDB.")
            );
        };
    });
}

/* =========================================
   PATIENTS
========================================= */

export async function savePatientLocal(
    patient: Patient
): Promise<void> {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            PATIENT_STORE,
            "readwrite"
        );

        const store = transaction.objectStore(
            PATIENT_STORE
        );

        store.put(patient);

        transaction.oncomplete = () => {
            db.close();
            resolve();
        };

        transaction.onerror = () => {
            db.close();

            reject(
                transaction.error ??
                new Error("Failed to save patient locally.")
            );
        };
    });
}

export async function getAllLocalPatients(): Promise<
    Patient[]
> {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            PATIENT_STORE,
            "readonly"
        );

        const store = transaction.objectStore(
            PATIENT_STORE
        );

        const request = store.getAll();

        request.onsuccess = () => {
            db.close();

            resolve(
                (request.result as Patient[]) ?? []
            );
        };

        request.onerror = () => {
            db.close();

            reject(
                request.error ??
                new Error("Failed to load local patients.")
            );
        };
    });
}

export async function getLocalPatient(
    patientId: string
): Promise<Patient | undefined> {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            PATIENT_STORE,
            "readonly"
        );

        const store = transaction.objectStore(
            PATIENT_STORE
        );

        const request = store.get(patientId);

        request.onsuccess = () => {
            db.close();

            resolve(
                request.result as Patient | undefined
            );
        };

        request.onerror = () => {
            db.close();

            reject(
                request.error ??
                new Error("Failed to load patient.")
            );
        };
    });
}

/* =========================================
   SYNC QUEUE
========================================= */

export async function queuePatientOperation(
    operation: PendingOperation
): Promise<void> {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            QUEUE_STORE,
            "readwrite"
        );

        const store = transaction.objectStore(
            QUEUE_STORE
        );

        store.put(operation);

        transaction.oncomplete = () => {
            db.close();
            resolve();
        };

        transaction.onerror = () => {
            db.close();

            reject(
                transaction.error ??
                new Error("Failed to queue operation.")
            );
        };
    });
}

export async function getPendingOperations(): Promise<
    PendingOperation[]
> {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            QUEUE_STORE,
            "readonly"
        );

        const store = transaction.objectStore(
            QUEUE_STORE
        );

        const request = store.getAll();

        request.onsuccess = () => {
            db.close();

            resolve(
                (request.result as PendingOperation[]) ?? []
            );
        };

        request.onerror = () => {
            db.close();

            reject(
                request.error ??
                new Error(
                    "Failed to read sync queue."
                )
            );
        };
    });
}

export async function removePendingOperation(
    operationId: string
): Promise<void> {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            QUEUE_STORE,
            "readwrite"
        );

        const store = transaction.objectStore(
            QUEUE_STORE
        );

        store.delete(operationId);

        transaction.oncomplete = () => {
            db.close();
            resolve();
        };

        transaction.onerror = () => {
            db.close();

            reject(
                transaction.error ??
                new Error(
                    "Failed to remove sync operation."
                )
            );
        };
    });
}

/* =========================================
   META DATA
========================================= */

export async function setMetadata(
    key: string,
    value: unknown
): Promise<void> {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            META_STORE,
            "readwrite"
        );

        const store = transaction.objectStore(
            META_STORE
        );

        store.put({
            key,
            value,
        });

        transaction.oncomplete = () => {
            db.close();
            resolve();
        };

        transaction.onerror = () => {
            db.close();

            reject(
                transaction.error ??
                new Error("Failed to save metadata.")
            );
        };
    });
}

export async function getMetadata<T>(
    key: string,
    fallback: T
): Promise<T> {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(
            META_STORE,
            "readonly"
        );

        const store = transaction.objectStore(
            META_STORE
        );

        const request = store.get(key);

        request.onsuccess = () => {
            db.close();

            if (!request.result) {
                resolve(fallback);
                return;
            }

            resolve(request.result.value as T);
        };

        request.onerror = () => {
            db.close();

            reject(
                request.error ??
                new Error(
                    "Failed to read metadata."
                )
            );
        };
    });
}
