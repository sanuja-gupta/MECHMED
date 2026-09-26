# MECHMED
# Offline-First Hospital Management System

> **Web-A-Thon 2.0 | Problem Statement P27 – Offline-First Digital Services Platform**

An offline-first hospital management system designed to keep essential healthcare records accessible even when internet connectivity is unavailable.

The system allows hospital staff to manage patients, doctors, and prescriptions locally using **IndexedDB**, while automatically synchronizing changes with a **Flask backend and Supabase PostgreSQL database** whenever connectivity is restored.

---

## Features

### Offline-First Operation
The application continues working even when the internet connection is unavailable.

- Patient records can be created and accessed offline
- Doctor records can be stored locally
- Prescription records can be managed locally
- Data is stored in the browser using IndexedDB
- Network availability is detected automatically

### Automatic Synchronization
When internet connectivity is restored, pending local changes are automatically synchronized with the backend.

```text
Offline Change
      ↓
IndexedDB
      ↓
Sync Queue
      ↓
Flask API
      ↓
Supabase PostgreSQL
