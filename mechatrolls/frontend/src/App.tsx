import {
    useEffect,
    useState,
    type FormEvent,
} from "react";

import type { Patient } from "./types/patient";

import {
    loadLocalPatients,
    savePatientOfflineFirst,
    syncPendingRecords,
    getPendingCount,
    getConflictCount,
} from "./offline/sync";

function App() {
    const [page, setPage] = useState("Dashboard");
    const [patients, setPatients] = useState<Patient[]>([]);
    const [online, setOnline] = useState(navigator.onLine);
    const [pendingCount, setPendingCount] = useState(0);
    const [conflictCount, setConflictCount] = useState(0);
    const [syncing, setSyncing] = useState(false);

    /* ---------------- LOAD LOCAL DATA ---------------- */

    async function refreshLocalData() {
        try {
            const localPatients = await loadLocalPatients();
            const pending = await getPendingCount();
            const conflicts = await getConflictCount();

            setPatients(localPatients);
            setPendingCount(pending);
            setConflictCount(conflicts);
        } catch (error) {
            console.error("Failed to load local data:", error);
        }
    }

    useEffect(() => {
        refreshLocalData();

        function handleOnline() {
            setOnline(true);

            syncPendingRecords()
                .then(() => {
                    refreshLocalData();
                })
                .catch((error) => {
                    console.error("Automatic sync failed:", error);
                });
        }

        function handleOffline() {
            setOnline(false);
        }

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    /* ---------------- ADD PATIENT ---------------- */

    async function addPatient(patient: Patient) {
        try {
            await savePatientOfflineFirst(patient);

            refreshLocalData();
            setPage("Patients");
        } catch (error) {
            console.error("Failed to save patient:", error);
            alert("Failed to save patient.");
        }
    }

    /* ---------------- MANUAL SYNC ---------------- */

    async function handleSync() {
        if (!online) {
            alert("You are currently offline.");
            return;
        }

        try {
            setSyncing(true);

            await syncPendingRecords();

            refreshLocalData();
        } catch (error) {
            console.error("Synchronization failed:", error);
            alert("Synchronization failed.");
        } finally {
            setSyncing(false);
        }
    }

    return (
        <div className="app">

            {/* ================= TOP BAR ================= */}

            <header className="topbar">

                <div className="logo">
                    Medi<span>Sync</span>
                </div>

                <div className="topbar-right">

                    <button
                        className="connection-button"
                        onClick={() => {
                            setOnline((current) => !current);
                        }}
                    >
                        <span
                            className={`connection-dot ${online ? "online" : "offline"
                                }`}
                        />

                        {online ? "Online" : "Offline"}
                    </button>

                    <div className="pending-text">
                        Pending sync: {pendingCount}
                    </div>

                </div>

            </header>

            {/* ================= BODY ================= */}

            <div className="app-body">

                {/* ================= SIDEBAR ================= */}

                <aside className="sidebar">

                    <div className="sidebar-title">
                        Hospital System
                    </div>

                    <button
                        className={`nav-button ${page === "Dashboard" ? "active" : ""
                            }`}
                        onClick={() => setPage("Dashboard")}
                    >
                        <span>⌂</span>
                        Dashboard
                    </button>

                    <button
                        className={`nav-button ${page === "Patients" ? "active" : ""
                            }`}
                        onClick={() => setPage("Patients")}
                    >
                        <span>♙</span>
                        Patients
                    </button>

                    <button
                        className={`nav-button ${page === "Add Patient" ? "active" : ""
                            }`}
                        onClick={() => setPage("Add Patient")}
                    >
                        <span>＋</span>
                        Add Patient
                    </button>

                    <button
                        className={`nav-button ${page === "Sync Center" ? "active" : ""
                            }`}
                        onClick={() => setPage("Sync Center")}
                    >
                        <span>↻</span>
                        Sync Center
                    </button>

                    <div className="sidebar-bottom">

                        <button className="nav-button">
                            <span>⚙</span>
                            Settings
                        </button>

                    </div>

                </aside>

                {/* ================= MAIN ================= */}

                <main className="main-content">

                    {page === "Dashboard" && (
                        <Dashboard
                            patients={patients}
                            pendingCount={pendingCount}
                            conflictCount={conflictCount}
                            onAddPatient={() =>
                                setPage("Add Patient")
                            }
                            onViewPatients={() =>
                                setPage("Patients")
                            }
                        />
                    )}

                    {page === "Patients" && (
                        <PatientsPage
                            patients={patients}
                            onAddPatient={() =>
                                setPage("Add Patient")
                            }
                        />
                    )}

                    {page === "Add Patient" && (
                        <AddPatientPage
                            online={online}
                            onAddPatient={addPatient}
                        />
                    )}

                    {page === "Sync Center" && (
                        <SyncCenter
                            patients={patients}
                            online={online}
                            syncing={syncing}
                            onSync={handleSync}
                        />
                    )}

                </main>

            </div>

        </div>
    );
}

/* ============================================================
   DASHBOARD
============================================================ */

type DashboardProps = {
    patients: Patient[];
    pendingCount: number;
    conflictCount: number;
    onAddPatient: () => void;
    onViewPatients: () => void;
};

function Dashboard({
    patients,
    pendingCount,
    conflictCount,
    onAddPatient,
    onViewPatients,
}: DashboardProps) {

    return (
        <>

            <div className="page-header">

                <div>
                    <h1>Good morning, Medical Staff</h1>

                    <p>
                        Manage patient records and monitor
                        synchronization.
                    </p>
                </div>

                <button
                    className="primary-button"
                    onClick={onAddPatient}
                >
                    + Add Patient
                </button>

            </div>

            <div className="stats-grid">

                <div className="stat-card">

                    <div className="stat-title">
                        Total Patients
                    </div>

                    <div className="stat-number">
                        {patients.length}
                    </div>

                    <div className="stat-description">
                        Patient records
                    </div>

                </div>

                <div className="stat-card">

                    <div className="stat-title">
                        Pending Sync
                    </div>

                    <div className="stat-number">
                        {pendingCount}
                    </div>

                    <div className="stat-description">
                        Waiting to synchronize
                    </div>

                </div>

                <div className="stat-card">

                    <div className="stat-title">
                        Conflicts
                    </div>

                    <div className="stat-number">
                        {conflictCount}
                    </div>

                    <div className="stat-description">
                        Require attention
                    </div>

                </div>

            </div>

            <section className="content-card">

                <div className="card-header">

                    <h2>Recent Patients</h2>

                    <button
                        className="text-button"
                        onClick={() => {
                            onViewPatients();
                            window.scrollTo({
                                top: 0,
                                behavior: "smooth",
                            });
                        }}
                    >
                        View all
                    </button>

                </div>

                <PatientTable patients={patients} />

            </section>

        </>
    );
}

/* ============================================================
   PATIENTS
============================================================ */

type PatientsPageProps = {
    patients: Patient[];
    onAddPatient: () => void;
};

function PatientsPage({
    patients,
    onAddPatient,
}: PatientsPageProps) {

    return (
        <>

            <div className="page-header">

                <div>

                    <h1>Patients</h1>

                    <p>
                        View and manage patient records.
                    </p>

                </div>

                <button
                    className="primary-button"
                    onClick={onAddPatient}
                >
                    + Add Patient
                </button>

            </div>

            <section className="content-card">

                <PatientTable patients={patients} />

            </section>

        </>
    );
}

/* ============================================================
   PATIENT TABLE
============================================================ */

function PatientTable({
    patients,
}: {
    patients: Patient[];
}) {

    return (
        <div className="table-container">

            <table>

                <thead>

                    <tr>
                        <th>ID</th>
                        <th>Patient</th>
                        <th>Age</th>
                        <th>Gender</th>
                        <th>Blood Group</th>
                        <th>Status</th>
                    </tr>

                </thead>

                <tbody>

                    {patients.length === 0 ? (

                        <tr>

                            <td
                                colSpan={6}
                                style={{
                                    textAlign: "center",
                                    padding: "30px",
                                }}
                            >
                                No patients found.
                            </td>

                        </tr>

                    ) : (

                        patients.map((patient) => (

                            <tr key={patient.id}>

                                <td className="patient-id">
                                    {patient.id}
                                </td>

                                <td className="patient-name">
                                    {patient.name}
                                </td>

                                <td>
                                    {patient.age}
                                </td>

                                <td>
                                    {patient.gender}
                                </td>

                                <td>
                                    {patient.bloodGroup}
                                </td>

                                <td>

                                    <StatusBadge
                                        status={patient.sync_status}
                                    />

                                </td>

                            </tr>

                        ))

                    )}

                </tbody>

            </table>

        </div>
    );
}

/* ============================================================
   STATUS
============================================================ */

function StatusBadge({
    status,
}: {
    status: Patient["sync_status"];
}) {

    let className = "status-badge";

    if (status === "Synced") {
        className += " status-synced";
    }

    if (status === "Pending") {
        className += " status-pending";
    }

    if (status === "Conflict") {
        className += " status-conflict";
    }

    return (
        <span className={className}>

            {status === "Synced" && "✓ "}
            {status === "Pending" && "◷ "}
            {status === "Conflict" && "⚠ "}

            {status}

        </span>
    );
}

/* ============================================================
   ADD PATIENT
============================================================ */

type AddPatientProps = {
    online: boolean;
    onAddPatient: (patient: Patient) => void | Promise<void>;
};

function AddPatientPage({
    online,
    onAddPatient,
}: AddPatientProps) {

    const [name, setName] = useState("");
    const [age, setAge] = useState("");
    const [gender, setGender] = useState("Male");
    const [bloodGroup, setBloodGroup] = useState("O+");
    const [diagnosis, setDiagnosis] = useState("");
    const [notes, setNotes] = useState("");

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {

        event.preventDefault();

        if (
            name.trim() === "" ||
            age.trim() === ""
        ) {
            alert(
                "Please enter the patient's name and age."
            );

            return;
        }

        const newPatient: Patient = {

            id: `P${String(Date.now()).slice(-6)}`,

            name: name.trim(),

            age: Number(age),

            gender,

            bloodGroup,

            date_of_admission:
                new Date().toISOString(),

            diagnosis:
                diagnosis.trim() ||
                "Not specified",

            description:
                notes.trim() ||
                "Created from the hospital portal.",

            ward: "General",

            current_status: "Admitted",

            assigned_doctor_id: null,

            updated_at:
                Date.now() / 1000,

            is_deleted: false,

            sync_status:
                online
                    ? "Synced"
                    : "Pending",
        };

        await onAddPatient(newPatient);

        setName("");
        setAge("");
        setGender("Male");
        setBloodGroup("O+");
        setDiagnosis("");
        setNotes("");
    }

    return (
        <>

            <div className="page-header">

                <div>

                    <h1>Add New Patient</h1>

                    <p>
                        Create a new patient record.
                    </p>

                </div>

            </div>

            {!online && (

                <div className="offline-banner">

                    <strong>
                        You are currently offline.
                    </strong>

                    <br />

                    This record will be saved locally
                    and synchronized when connectivity
                    returns.

                </div>

            )}

            <section className="content-card">

                <form onSubmit={handleSubmit}>

                    <div className="form-grid">

                        <div className="form-field">

                            <label>
                                Full Name
                            </label>

                            <input
                                type="text"
                                placeholder="Enter patient name"
                                value={name}
                                onChange={(event) =>
                                    setName(
                                        event.target.value
                                    )
                                }
                            />

                        </div>

                        <div className="form-field">

                            <label>
                                Age
                            </label>

                            <input
                                type="number"
                                min="0"
                                placeholder="Enter age"
                                value={age}
                                onChange={(event) =>
                                    setAge(
                                        event.target.value
                                    )
                                }
                            />

                        </div>

                        <div className="form-field">

                            <label>
                                Gender
                            </label>

                            <select
                                value={gender}
                                onChange={(event) =>
                                    setGender(
                                        event.target.value
                                    )
                                }
                            >

                                <option>
                                    Male
                                </option>

                                <option>
                                    Female
                                </option>

                                <option>
                                    Other
                                </option>

                            </select>

                        </div>

                        <div className="form-field">

                            <label>
                                Blood Group
                            </label>

                            <select
                                value={bloodGroup}
                                onChange={(event) =>
                                    setBloodGroup(
                                        event.target.value
                                    )
                                }
                            >

                                <option>O+</option>
                                <option>O-</option>
                                <option>A+</option>
                                <option>A-</option>
                                <option>B+</option>
                                <option>B-</option>
                                <option>AB+</option>
                                <option>AB-</option>

                            </select>

                        </div>

                        <div className="form-field full-width">

                            <label>
                                Diagnosis
                            </label>

                            <input
                                type="text"
                                placeholder="Enter diagnosis"
                                value={diagnosis}
                                onChange={(event) =>
                                    setDiagnosis(
                                        event.target.value
                                    )
                                }
                            />

                        </div>

                        <div className="form-field full-width">

                            <label>
                                Notes
                            </label>

                            <textarea
                                placeholder="Additional notes..."
                                value={notes}
                                onChange={(event) =>
                                    setNotes(
                                        event.target.value
                                    )
                                }
                            />

                        </div>

                    </div>

                    <div className="form-footer">

                        <button
                            type="submit"
                            className="primary-button"
                        >
                            {online
                                ? "Save Patient"
                                : "Save Patient Offline"}
                        </button>

                    </div>

                </form>

            </section>

        </>
    );
}

/* ============================================================
   SYNC CENTER
============================================================ */

type SyncCenterProps = {
    patients: Patient[];
    online: boolean;
    syncing: boolean;
    onSync: () => Promise<void>;
};

function SyncCenter({
    patients,
    online,
    syncing,
    onSync,
}: SyncCenterProps) {

    const pendingPatients =
        patients.filter(
            (patient) =>
                patient.sync_status === "Pending"
        );

    return (
        <>

            <div className="page-header">

                <div>

                    <h1>Sync Center</h1>

                    <p>
                        Monitor records waiting to
                        synchronize.
                    </p>

                </div>

            </div>

            <section className="content-card">

                <div className="sync-summary">

                    <div>

                        <div className="stat-title">
                            Pending Operations
                        </div>

                        <div className="sync-number">
                            {pendingPatients.length}
                        </div>

                    </div>

                    <button
                        className="primary-button"
                        onClick={onSync}
                        disabled={
                            !online ||
                            syncing ||
                            pendingPatients.length === 0
                        }
                    >
                        {syncing
                            ? "Syncing..."
                            : "Sync Now"}
                    </button>

                </div>

                {!online && (

                    <div className="offline-banner">

                        You are offline.
                        Synchronization will start
                        when connectivity returns.

                    </div>

                )}

                {pendingPatients.length === 0 ? (

                    <div className="empty-state">

                        <div className="empty-icon">
                            ✓
                        </div>

                        <h3>
                            Everything is synchronized
                        </h3>

                        <p>
                            No pending records.
                        </p>

                    </div>

                ) : (

                    <PatientTable
                        patients={pendingPatients}
                    />

                )}

            </section>

        </>
    );
}

export default App;