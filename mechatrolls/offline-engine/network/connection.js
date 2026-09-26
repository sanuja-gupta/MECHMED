export function isOnline() {
    return navigator.onLine;
}

export function onOnline(callback) {
    window.addEventListener("online", callback);
}

export function onOffline(callback) {
    window.addEventListener("offline", callback);
}
