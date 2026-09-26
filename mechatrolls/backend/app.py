import os
import uuid
from datetime import datetime, timezone

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt


# Load environment variables from the .env file
load_dotenv()


app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)


# Read the Supabase URI loaded from .env
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("SUPABASE_DB_URI")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False


if not app.config["SQLALCHEMY_DATABASE_URI"]:
    raise ValueError(
        "SUPABASE_DB_URI not found! Please check your .env file."
    )


db = SQLAlchemy(app)


# ============================================================
# DATABASE MODELS
# ============================================================

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(
        db.String(30),
        nullable=False,
        default="Doctor"
    )
    full_name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(
        db.Float,
        default=lambda: datetime.now(timezone.utc).timestamp()
    )
    updated_at = db.Column(
        db.Float,
        default=lambda: datetime.now(timezone.utc).timestamp()
    )
    is_deleted = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "role": self.role,
            "full_name": self.full_name,
            "updated_at": self.updated_at
        }


class Doctor(db.Model):
    __tablename__ = "doctors"

    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    specialization = db.Column(db.String(100), nullable=False)
    assignment_time = db.Column(db.String(50), nullable=True)
    updated_at = db.Column(
        db.Float,
        default=lambda: datetime.now(timezone.utc).timestamp()
    )
    is_deleted = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "specialization": self.specialization,
            "assignment_time": self.assignment_time,
            "updated_at": self.updated_at,
            "is_deleted": self.is_deleted
        }


class Patient(db.Model):
    __tablename__ = "patients"

    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    gender = db.Column(db.String(20), nullable=False)
    date_of_admission = db.Column(db.String(50), nullable=False)
    diagnosis = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    ward = db.Column(db.String(50), nullable=False)
    current_status = db.Column(
        db.String(30),
        default="Admitted"
    )
    assigned_doctor_id = db.Column(
        db.String(36),
        nullable=True
    )
    updated_at = db.Column(
        db.Float,
        default=lambda: datetime.now(timezone.utc).timestamp()
    )
    is_deleted = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "age": self.age,
            "gender": self.gender,
            "date_of_admission": self.date_of_admission,
            "diagnosis": self.diagnosis,
            "description": self.description,
            "ward": self.ward,
            "current_status": self.current_status,
            "assigned_doctor_id": self.assigned_doctor_id,
            "updated_at": self.updated_at,
            "is_deleted": self.is_deleted
        }


class Prescription(db.Model):
    __tablename__ = "prescriptions"

    id = db.Column(db.String(36), primary_key=True)
    patient_id = db.Column(db.String(36), nullable=False)
    medicine_name = db.Column(db.String(120), nullable=False)
    dosage = db.Column(db.String(50), nullable=False)
    status = db.Column(
        db.String(30),
        default="Prescribed"
    )
    time = db.Column(db.String(50), nullable=False)
    updated_at = db.Column(
        db.Float,
        default=lambda: datetime.now(timezone.utc).timestamp()
    )
    is_deleted = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "medicine_name": self.medicine_name,
            "dosage": self.dosage,
            "status": self.status,
            "time": self.time,
            "updated_at": self.updated_at,
            "is_deleted": self.is_deleted
        }


# ============================================================
# DATABASE INITIALIZATION
# ============================================================

with app.app_context():
    print("[SUPABASE] Connecting and checking/creating tables...")
    db.create_all()
    print("[SUPABASE] All tables ready!")


# ============================================================
# AUTH ENDPOINTS
# ============================================================

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json() or {}

    username = data.get("username", "").strip()
    password = data.get("password", "")
    full_name = data.get("full_name", "").strip()
    role = data.get("role", "Doctor")

    if not username or not password or not full_name:
        return jsonify({
            "status": "error",
            "message": "Missing username, password, or full name"
        }), 400

    existing_user = User.query.filter_by(
        username=username
    ).first()

    if existing_user:
        return jsonify({
            "status": "error",
            "message": "Username already exists"
        }), 409

    hashed_pw = bcrypt.generate_password_hash(
        password
    ).decode("utf-8")

    new_user = User()

    new_user.id = str(uuid.uuid4())
    new_user.username = username
    new_user.password_hash = hashed_pw
    new_user.full_name = full_name
    new_user.role = role
    new_user.updated_at = datetime.now(timezone.utc).timestamp()

    db.session.add(new_user)
    db.session.commit()

    return jsonify({
        "status": "success",
        "user": new_user.to_dict()
    }), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}

    username = data.get("username", "").strip()
    password = data.get("password", "")

    user = User.query.filter_by(
        username=username,
        is_deleted=False
    ).first()

    if not user or not bcrypt.check_password_hash(
        user.password_hash,
        password
    ):
        return jsonify({
            "status": "error",
            "message": "Invalid username or password"
        }), 401

    return jsonify({
        "status": "success",
        "message": "Login successful",
        "user": user.to_dict()
    }), 200


# ============================================================
# HEALTH & SYNC ENDPOINTS
# ============================================================

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "online",
        "backend": "supabase-postgres",
        "server_time": datetime.now(
            timezone.utc
        ).timestamp()
    }), 200


@app.route("/api/sync", methods=["POST"])
def sync_records():
    payload = request.get_json() or {}

    pending = payload.get("pending", {})

    last_pulled_at = float(
        payload.get("last_pulled_at", 0.0)
    )

    current_server_time = datetime.now(
        timezone.utc
    ).timestamp()

    synced_ids = {
        "doctors": [],
        "patients": [],
        "prescriptions": []
    }

    # ========================================================
    # 1. INGEST DOCTORS
    # ========================================================

    for item in pending.get("doctors", []):
        doc = db.session.get(
            Doctor,
            item["id"]
        )

        incoming_ts = item.get(
            "updated_at",
            0.0
        )

        if not doc or incoming_ts >= doc.updated_at:

            if not doc:
                doc = Doctor()
                doc.id = item["id"]
                db.session.add(doc)

            doc.name = item.get(
                "name",
                doc.name
            )

            doc.specialization = item.get(
                "specialization",
                doc.specialization
            )

            doc.assignment_time = item.get(
                "assignment_time",
                doc.assignment_time
            )

            doc.updated_at = incoming_ts

            doc.is_deleted = item.get(
                "is_deleted",
                False
            )

        synced_ids["doctors"].append(
            item["id"]
        )


    # ========================================================
    # 2. INGEST PATIENTS
    # ========================================================

    for item in pending.get("patients", []):

        patient = db.session.get(
            Patient,
            item["id"]
        )

        incoming_ts = item.get(
            "updated_at",
            0.0
        )

        if not patient or incoming_ts >= patient.updated_at:

            if not patient:
                patient = Patient()
                patient.id = item["id"]
                db.session.add(patient)

            patient.name = item.get(
                "name",
                patient.name
            )

            patient.age = int(
                item.get(
                    "age",
                    patient.age or 0
                )
            )

            patient.gender = item.get(
                "gender",
                patient.gender
            )

            patient.date_of_admission = item.get(
                "date_of_admission",
                patient.date_of_admission
            )

            patient.diagnosis = item.get(
                "diagnosis",
                patient.diagnosis
            )

            patient.description = item.get(
                "description",
                patient.description
            )

            patient.ward = item.get(
                "ward",
                patient.ward
            )

            patient.current_status = item.get(
                "current_status",
                patient.current_status
            )

            patient.assigned_doctor_id = item.get(
                "assigned_doctor_id",
                patient.assigned_doctor_id
            )

            patient.updated_at = incoming_ts

            patient.is_deleted = item.get(
                "is_deleted",
                False
            )

        synced_ids["patients"].append(
            item["id"]
        )


    # ========================================================
    # 3. INGEST PRESCRIPTIONS
    # ========================================================

    for item in pending.get(
        "prescriptions",
        []
    ):

        rx = db.session.get(
            Prescription,
            item["id"]
        )

        incoming_ts = item.get(
            "updated_at",
            0.0
        )

        if not rx or incoming_ts >= rx.updated_at:

            if not rx:
                rx = Prescription()
                rx.id = item["id"]
                db.session.add(rx)

            rx.patient_id = item.get(
                "patient_id",
                rx.patient_id
            )

            rx.medicine_name = item.get(
                "medicine_name",
                rx.medicine_name
            )

            rx.dosage = item.get(
                "dosage",
                rx.dosage
            )

            rx.status = item.get(
                "status",
                rx.status
            )

            rx.time = item.get(
                "time",
                rx.time
            )

            rx.updated_at = incoming_ts

            rx.is_deleted = item.get(
                "is_deleted",
                False
            )

        synced_ids["prescriptions"].append(
            item["id"]
        )


    db.session.commit()


    # ========================================================
    # PULL FRESH DELTAS
    # ========================================================

    docs_delta = Doctor.query.filter(
        Doctor.updated_at > last_pulled_at
    ).all()

    patients_delta = Patient.query.filter(
        Patient.updated_at > last_pulled_at
    ).all()

    rx_delta = Prescription.query.filter(
        Prescription.updated_at > last_pulled_at
    ).all()


    return jsonify({
        "status": "success",

        "synced_ids": synced_ids,

        "deltas": {
            "doctors": [
                d.to_dict()
                for d in docs_delta
            ],

            "patients": [
                p.to_dict()
                for p in patients_delta
            ],

            "prescriptions": [
                rx.to_dict()
                for rx in rx_delta
            ]
        },

        "checkpoint": current_server_time
    }), 200


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":
    port = int(
        os.getenv(
            "PORT",
            5000
        )
    )

    app.run(
        host="0.0.0.0",
        port=port,
        debug=True
    )
