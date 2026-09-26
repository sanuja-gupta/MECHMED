import type { Patient } from "../types/patient";

const API_URL = "http://localhost:5000";

export type SyncResponse = {
    status: string;

    synced_ids: {
        doctors: string[];
        patients: string[];
        prescriptions: string[];
    };

    deltas: {
        doctors: unknown[];
        patients: Patient[];
        prescriptions: unknown[];
    };

    checkpoint: number;
};

export async function checkBackendHealth(): Promise<boolean> {
    try {
        const response = await fetch(
            `${API_URL}/api/health`,
            {
                method: "GET",
            }
        );

        return response.ok;
    } catch {
        return false;
    }
}

export async function syncWithBackend(
    patients: Patient[],
    lastPulledAt: number
): Promise<SyncResponse> {
    const backendPatients = patients.map(
        ({
            sync_status: _syncStatus,
            ...patient
        }) => patient
    );

    const response = await fetch(
        `${API_URL}/api/sync`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
            },

            body: JSON.stringify({
                pending: {
                    doctors: [],
                    patients: backendPatients,
                    prescriptions: [],
                },

                last_pulled_at: lastPulledAt,
            }),
        }
    );

    if (!response.ok) {
        throw new Error(
            `Sync failed with status ${response.status}`
        );
    }

    return response.json();
}
