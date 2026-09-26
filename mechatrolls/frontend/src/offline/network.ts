import {
    checkBackendHealth,
} from "../services/api";

let simulatedOffline = false;

export function setSimulatedOffline(
    value: boolean
): void {
    simulatedOffline = value;
}

export function isSimulatedOffline(): boolean {
    return simulatedOffline;
}

export function isBrowserOnline(): boolean {
    if (simulatedOffline) {
        return false;
    }

    return navigator.onLine;
}

export async function canReachBackend(): Promise<boolean> {
    if (simulatedOffline) {
        return false;
    }

    if (!navigator.onLine) {
        return false;
    }

    try {
        return await checkBackendHealth();
    } catch {
        return false;
    }
}

export function listenForNetworkChanges(
    callback: (online: boolean) => void
): () => void {
    const handleOnline = () => {
        if (!simulatedOffline) {
            callback(true);
        }
    };

    const handleOffline = () => {
        callback(false);
    };

    window.addEventListener(
        "online",
        handleOnline
    );

    window.addEventListener(
        "offline",
        handleOffline
    );

    return () => {
        window.removeEventListener(
            "online",
            handleOnline
        );

        window.removeEventListener(
            "offline",
            handleOffline
        );
    };
}