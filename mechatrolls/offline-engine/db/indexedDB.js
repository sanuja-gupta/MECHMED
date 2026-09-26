import { DB_NAME, DB_VERSION, STORES } from "./schema.js";

export function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains(STORES.PATIENTS)) {
                db.createObjectStore(STORES.PATIENTS, { keyPath: "id" });
            }

            if (!db.objectStoreNames.contains(STORES.DOCTORS)) {
                db.createObjectStore(STORES.DOCTORS, { keyPath: "id" });
            }

            if (!db.objectStoreNames.contains(STORES.PRESCRIPTIONS)) {
                db.createObjectStore(STORES.PRESCRIPTIONS, { keyPath: "id" });
            }

            if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
                db.createObjectStore(STORES.SYNC_QUEUE, {
                    keyPath: "queue_id",
                    autoIncrement: true
                });
            }
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}
export function savePatient(patient) {
    return openDatabase().then((db) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORES.PATIENTS, "readwrite");
            const store = transaction.objectStore(STORES.PATIENTS);

            const request = store.put(patient);

            request.onsuccess = () => resolve(patient);
            request.onerror = () => reject(request.error);
        });
    });
}

export function getPatient(id) {
    return openDatabase().then((db) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORES.PATIENTS, "readonly");
            const store = transaction.objectStore(STORES.PATIENTS);

            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    });
}

export function getAllPatients() {
    return openDatabase().then((db) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORES.PATIENTS, "readonly");
            const store = transaction.objectStore(STORES.PATIENTS);

            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    });
}
export function saveDoctor(doctor) {
    return openDatabase().then((db) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORES.DOCTORS, "readwrite");
            const store = transaction.objectStore(STORES.DOCTORS);

            const request = store.put(doctor);

            request.onsuccess = () => resolve(doctor);
            request.onerror = () => reject(request.error);
        });
    });
}

export function getAllDoctors() {
    return openDatabase().then((db) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORES.DOCTORS, "readonly");
            const store = transaction.objectStore(STORES.DOCTORS);

            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    });
}
export function savePrescription(prescription) {
    return openDatabase().then((db) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(
                STORES.PRESCRIPTIONS,
                "readwrite"
            );

            const store = transaction.objectStore(STORES.PRESCRIPTIONS);

            const request = store.put(prescription);

            request.onsuccess = () => resolve(prescription);
            request.onerror = () => reject(request.error);
        });
    });
}

export function getAllPrescriptions() {
    return openDatabase().then((db) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(
                STORES.PRESCRIPTIONS,
                "readonly"
            );

            const store = transaction.objectStore(STORES.PRESCRIPTIONS);

            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    });
}
