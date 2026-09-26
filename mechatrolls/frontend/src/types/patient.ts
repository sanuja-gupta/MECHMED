export type SyncStatus =
    | "Synced"
    | "Pending"
    | "Conflict"
    | "Failed";

/**
 * Mirrors the Patient model in the Flask backend.
 * Only sync_status is frontend-only.
 */
export type Patient = {
    id: string;
    name: string;
    age: number;
    gender: string;
    bloodGroup?: string;
    date_of_admission: string;
    diagnosis: string;
    description: string;
    ward: string;
    current_status: string;
    assigned_doctor_id: string | null;
    updated_at: number; // Unix timestamp in SECONDS, matching Flask
    is_deleted: boolean;

    sync_status: SyncStatus;
};

export type NewPatient = Omit<
    Patient,
    "id" | "updated_at" | "is_deleted" | "sync_status"
>;

export type PendingOperation = {
    id: string;
    entity_type: "patient";
    entity_id: string;
    operation: "CREATE" | "UPDATE" | "DELETE";
    payload: Patient;
    created_at: number;
    attempts: number;
    last_error?: string;
};
