import {
    savePatient,
    getPatient,
    getAllPatients,
    saveDoctor,
    getAllDoctors,
    savePrescription,
    getAllPrescriptions
} from "./db/indexedDB.js";

import { addToQueue } from "./sync/queue.js";
import { syncPendingChanges } from "./sync/sync_manager.js";
import {
    isOnline,
    onOnline,
    onOffline
} from "./network/connection.js";

export async function savePatientOffline(patient) {
    await savePatient(patient);

    if (isOnline()) {
        await addToQueue({
            table: "patients",
            action: "CREATE",
            record_id: patient.id,
            data: patient
        });

        await syncPendingChanges();
    } else {
        await addToQueue({
            table: "patients",
            action: "CREATE",
            record_id: patient.id,
            data: patient
        });

        console.log("Patient saved offline.");
    }
}

export async function saveDoctorOffline(doctor) {
    await saveDoctor(doctor);

    await addToQueue({
        table: "doctors",
        action: "CREATE",
        record_id: doctor.id,
        data: doctor
    });

    if (isOnline()) {
        await syncPendingChanges();
    } else {
        console.log("Doctor saved offline.");
    }
}

export async function savePrescriptionOffline(prescription) {
    await savePrescription(prescription);

    await addToQueue({
        table: "prescriptions",
        action: "CREATE",
        record_id: prescription.id,
        data: prescription
    });

    if (isOnline()) {
        await syncPendingChanges();
    } else {
        console.log("Prescription saved offline.");
    }
}

export {
    getPatient,
    getAllPatients,
    getAllDoctors,
    getAllPrescriptions
};

onOnline(() => {
    console.log("Internet restored. Starting sync...");
    syncPendingChanges();
});

