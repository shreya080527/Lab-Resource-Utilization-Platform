// ---------------------------------------------------------------------------
// Development backend for the Lab Equipment Booking System.
//
// Implements the documented endpoint contract on port 8080, so the React
// frontend can make REAL HTTP calls to the real base URL (http://localhost:8080)
// with zero interception/mock data.
//
// This is a development stand-in for the real Spring Boot backend. Drop the
// real backend in at :8080 and the frontend needs no changes.
//
// CORS: allows the frontend origin (http://localhost:5173 + the :81 gateway)
// so browser-based requests succeed during development.
// ---------------------------------------------------------------------------

import { jwtDecode } from "jwt-decode";

const PORT = 8080;

// --- in-memory data store ---------------------------------------------------

interface MockUser {
  id: number;
  username: string;
  email: string;
  password: string;
  role: Role;
  emailVerified: boolean;
  department: string;
  institution: string;
  otp: string;
}

type Role =
  | "RESEARCHER"
  | "LAB_TECHNICIAN"
  | "LAB_MANAGER"
  | "DEPARTMENT_HEAD"
  | "INSTITUTION_ADMIN"
  | "SYSTEM_ADMIN";

// EquipmentStatus now includes BOOKED + OUT_OF_SERVICE (Module 2 entity change).
type EquipmentStatus =
  | "AVAILABLE"
  | "BOOKED"
  | "UNDER_MAINTENANCE"
  | "OUT_OF_SERVICE"
  | "RETIRED"
  | string;

interface Equipment {
  id: number;
  serial: string;
  equipmentName: string;
  category: string;
  description: string;
  acquisitionDate: string;
  institution: string;
  addedBy: string;
  status: EquipmentStatus;
}

// BookingStatus now includes NO_SHOW (Module 3 booking status).
type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED"
  | "WAITLIST"
  | "NO_SHOW";

interface Booking {
  id: number;
  equipment: Equipment;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
    institution: string;
    department: string;
  };
  startTime: string;
  endTime: string;
  status: BookingStatus;
  recurrencePattern?: string | null;
  parentBookingId?: number | null;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

// Waitlist is a SEPARATE entity in the real backend (table `waitlists`),
// not a Booking with WAITLIST status. Matches Waitlist.java:
// {id, equipment, user, startTime, endTime, createdAt}
interface WaitlistEntry {
  id: number;
  equipment: Equipment;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
    institution: string;
    department: string;
  };
  startTime: string;
  endTime: string;
  createdAt: string;
}

// Calibration & certification records (Module 2.v). Matches the real
// CalibrationRecord entity: {id, equipment, recordType, performedDate,
// nextDueDate, performedBy, result, certificateRef, notes, createdAt}.
// `equipmentId` is the denormalized FK for convenience.
interface CalibrationRecord {
  id: number;
  equipment: Equipment;
  equipmentId: number;
  recordType: string; // CALIBRATION | CERTIFICATION | INSPECTION | MAINTENANCE_CHECK
  performedDate: string;
  nextDueDate?: string;
  performedBy?: string;
  result?: string;
  certificateRef?: string;
  notes?: string;
  createdAt: string;
}

// Booking audit trail (Module 3.vi). One entry per booking lifecycle event.
interface BookingAudit {
  id: number;
  bookingId: number;
  equipmentId: number;
  equipmentName: string;
  userId: number;
  username: string;
  fromStatus: BookingStatus | null;
  toStatus: BookingStatus;
  action: string; // CREATE | ACCEPT | REJECT | START | CANCEL | COMPLETE | NO_SHOW
  performedBy: string;
  notes?: string;
  timestamp: string;
}

const users = new Map<number, MockUser>();
const equipment = new Map<number, Equipment>();
const bookings = new Map<number, Booking>();
const waitlist = new Map<number, WaitlistEntry>();
const calibrationRecords = new Map<number, CalibrationRecord>();
const auditLog = new Map<number, BookingAudit>();
let userSeq = 0;
let eqSeq = 0;
let bkSeq = 0;
let wlSeq = 0;
let calSeq = 0;
let auditSeq = 0;

const nowISO = () => new Date().toISOString();

function daysFromNow(d: number, h = 10) {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  dt.setHours(h, 0, 0, 0);
  return dt.toISOString();
}

function seed() {
  if (users.size > 0) return;
  const researcher: MockUser = {
    id: ++userSeq,
    username: "researcher",
    email: "researcher@demo.com",
    password: "password",
    role: "RESEARCHER",
    emailVerified: true,
    department: "Computer Science",
    institution: "Demo University",
    otp: "123456",
  };
  const manager: MockUser = {
    id: ++userSeq,
    username: "manager",
    email: "manager@demo.com",
    password: "password",
    role: "LAB_MANAGER",
    emailVerified: true,
    department: "Computer Science",
    institution: "Demo University",
    otp: "123456",
  };
  const technician: MockUser = {
    id: ++userSeq,
    username: "technician",
    email: "technician@demo.com",
    password: "password",
    role: "LAB_TECHNICIAN",
    emailVerified: true,
    department: "Computer Science",
    institution: "Demo University",
    otp: "123456",
  };
  users.set(researcher.id, researcher);
  users.set(manager.id, manager);
  users.set(technician.id, technician);

  const sample: Array<[string, string, string, string]> = [
    ["OSC-001", "Digital Oscilloscope", "Electronics", "4-channel 200 MHz digital oscilloscope with mixed-signal analysis and protocol decoding."],
    ["MIC-002", "Compound Microscope", "Micro Biology", "ESAW 1125x Student Compound Biological Microscope with prepared glass slides (100x–1125x)."],
    ["SPEC-003", "UV-Vis Spectrophotometer", "Chemistry", "Double-beam UV-Vis spectrophotometer, 190–1100 nm, for quantitative analysis."],
    ["CENT-004", "High-Speed Centrifuge", "Bio Chemistry", "Refrigerated high-speed centrifuge up to 25,000 rpm, 6x50 mL rotor."],
    ["PRI-005", "3D Printer (Resin)", "Prototyping", "High-resolution resin 3D printer, 25–100 µm layer height, build volume 145x145x185 mm."],
    ["LAS-006", "CO2 Laser Cutter", "Prototyping", "100W CO2 laser cutter, 900x600 mm bed, for acrylic/wood prototyping."],
  ];
  for (const [serial, name, category, desc] of sample) {
    const id = ++eqSeq;
    const status: EquipmentStatus =
      id === 4 ? "UNDER_MAINTENANCE" : id === 6 ? "RETIRED" : "AVAILABLE";
    equipment.set(id, {
      id,
      serial,
      equipmentName: name,
      category,
      description: desc,
      acquisitionDate: daysFromNow(-120),
      institution: "Demo University",
      addedBy: "manager",
      status,
    });
  }

  const r = researcher;
  const mk = (
    eqId: number,
    startH: number,
    endH: number,
    status: BookingStatus,
    dayOffset = 1,
  ): Booking => {
    const id = ++bkSeq;
    const eq = equipment.get(eqId)!;
    const s = new Date();
    s.setDate(s.getDate() + dayOffset);
    s.setHours(startH, 0, 0, 0);
    const e = new Date(s);
    e.setHours(endH, 0, 0, 0);
    return {
      id,
      equipment: eq,
      user: {
        id: r.id,
        username: r.username,
        email: r.email,
        role: r.role,
        institution: r.institution,
        department: r.department,
      },
      startTime: s.toISOString(),
      endTime: e.toISOString(),
      status,
      createdAt: new Date().toISOString(),
    };
  };
  bookings.set(1, mk(1, 10, 12, "PENDING", 1));
  bookings.set(2, mk(2, 9, 11, "CONFIRMED", 2));
  bookings.set(3, mk(3, 14, 16, "COMPLETED", -3));
  // Seed a waitlist entry (separate entity, not a WAITLIST booking)
  const wlEq = equipment.get(1)!;
  const wlS = new Date();
  wlS.setDate(wlS.getDate() + 3);
  wlS.setHours(15, 0, 0, 0);
  const wlE = new Date(wlS);
  wlE.setHours(17, 0, 0, 0);
  waitlist.set(++wlSeq, {
    id: wlSeq,
    equipment: wlEq,
    user: {
      id: r.id, username: r.username, email: r.email, role: r.role,
      institution: r.institution, department: r.department,
    },
    startTime: wlS.toISOString(),
    endTime: wlE.toISOString(),
    createdAt: new Date().toISOString(),
  });

  // Seed 2 calibration records for equipment id 1 (Module 2.v sample data):
  // a CALIBRATION performed 90 days ago (next due in 275 days) + a CERTIFICATION
  // performed 30 days ago (next due in 335 days).
  const calEq = equipment.get(1)!;
  const c1 = ++calSeq;
  calibrationRecords.set(c1, {
    id: c1,
    equipment: calEq,
    equipmentId: 1,
    recordType: "CALIBRATION",
    performedDate: daysFromNow(-90),
    nextDueDate: daysFromNow(275),
    performedBy: "manager",
    result: "PASS",
    certificateRef: "CAL-2026-001",
    notes: "Annual calibration by vendor. All channels within spec.",
    createdAt: nowISO(),
  });
  const c2 = ++calSeq;
  calibrationRecords.set(c2, {
    id: c2,
    equipment: calEq,
    equipmentId: 1,
    recordType: "CERTIFICATION",
    performedDate: daysFromNow(-30),
    nextDueDate: daysFromNow(335),
    performedBy: "manager",
    result: "PASS",
    certificateRef: "CERT-2026-007",
    notes: "Electrical safety certification.",
    createdAt: nowISO(),
  });

  // Seed an audit entry for each seeded booking (CREATE action).
  for (const b of bookings.values()) {
    logAudit(b, "CREATE", null, b.status, "manager");
  }
}
seed();

// --- helpers ----------------------------------------------------------------

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization,content-type",
      "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
    },
  });
}

function text(msg: string, status = 200): Response {
  return new Response(msg, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization,content-type",
      "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
    },
  });
}

function b64url(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function makeToken(user: MockUser): string {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub: String(user.id),
    email: user.email,
    username: user.username,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
  };
  return `${b64url(header)}.${b64url(payload)}.mock-signature`;
}

function getUserFromRequest(req: Request): MockUser | null {
  const auth = req.headers.get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return null;
  const token = auth.slice(7).trim();
  try {
    const payload = jwtDecode<{ sub?: string }>(token);
    if (!payload.sub) return null;
    return users.get(Number(payload.sub)) ?? null;
  } catch {
    return null;
  }
}

function requireAuth(req: Request): MockUser | null {
  return getUserFromRequest(req);
}

function toBookingUser(u: MockUser) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    institution: u.institution,
    department: u.department,
  };
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);
}

function findByEmail(email: string): MockUser | undefined {
  const e = (email || "").toLowerCase();
  for (const u of users.values()) {
    if (u.email.toLowerCase() === e) return u;
  }
  return undefined;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

// Append an audit entry for a booking lifecycle event (Module 3.vi). Called
// from every status-change handler (create/accept/reject/start/cancel/complete/noShow).
function logAudit(
  booking: Booking,
  action: string,
  fromStatus: BookingStatus | null,
  toStatus: BookingStatus,
  performedBy: string,
  notes?: string,
): BookingAudit {
  const id = ++auditSeq;
  const entry: BookingAudit = {
    id,
    bookingId: booking.id,
    equipmentId: booking.equipment.id,
    equipmentName: booking.equipment.equipmentName,
    userId: booking.user.id,
    username: booking.user.username,
    fromStatus,
    toStatus,
    action,
    performedBy,
    notes,
    timestamp: nowISO(),
  };
  auditLog.set(id, entry);
  return entry;
}

async function readBody(req: Request): Promise<any> {
  try {
    const raw = await req.text();
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  } catch {
    return {};
  }
}

// Compute the booked hours (clipped to [start, end]) for a list of bookings
// with status in the allowed set. Used by all utilization endpoints.
function bookedHoursIn(
  list: Booking[],
  start: string,
  end: string,
  allowed: BookingStatus[] = ["CONFIRMED", "IN_PROGRESS", "COMPLETED"],
): number {
  const s0 = new Date(start).getTime();
  const e0 = new Date(end).getTime();
  const ms = list
    .filter((b) => allowed.includes(b.status))
    .reduce((sum, b) => {
      const s = Math.max(new Date(b.startTime).getTime(), s0);
      const e = Math.min(new Date(b.endTime).getTime(), e0);
      return sum + Math.max(0, e - s);
    }, 0);
  return ms / 3600_000;
}

// Convert internal WaitlistEntry to the DTO shape with queue position.
function toWaitlistDTO(w: WaitlistEntry) {
  const ahead = Array.from(waitlist.values()).filter(
    (other) =>
      other.equipment.id === w.equipment.id &&
      new Date(other.createdAt).getTime() < new Date(w.createdAt).getTime(),
  ).length;
  return {
    id: w.id,
    equipmentId: w.equipment.id,
    equipmentName: w.equipment.equipmentName,
    userId: w.user.id,
    username: w.user.username,
    userDepartment: w.user.department,
    userInstitution: w.user.institution,
    startTime: w.startTime,
    endTime: w.endTime,
    createdAt: w.createdAt,
    position: ahead + 1,
  };
}

// --- route dispatch ---------------------------------------------------------

async function handle(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const method = req.method;
  const path = url.pathname;
  const q = url.searchParams;
  const body = await readBody(req);

  try {
    // ---- AUTH (public, no token) ----
    if (path === "/api/auth/register" && method === "POST") {
      const { username, email, password, role, department, institution } = body as {
        username: string; email: string; password: string; role: Role;
        department: string; institution: string;
      };
      for (const u of users.values()) {
        if (u.email.toLowerCase() === (email || "").toLowerCase()) {
          return text("Email already registered", 400);
        }
      }
      const id = ++userSeq;
      const user: MockUser = {
        id, username: username || email, email, password, role,
        emailVerified: false, department, institution, otp: "123456",
      };
      users.set(id, user);
      return json({ message: "Registration successful. Please verify your email.", email });
    }

    if (path === "/api/auth/verify" && method === "POST") {
      const { email, otp } = body as { email: string; otp: string };
      const user = findByEmail(email);
      if (!user) return text("User not found", 404);
      if (otp !== "123456" && otp !== user.otp) return text("Invalid or expired OTP", 400);
      user.emailVerified = true;
      return json({ message: "Email verified successfully. You can now log in." });
    }

    if (path === "/api/auth/login" && method === "POST") {
      const { email, password } = body as { email: string; password: string };
      const user = findByEmail(email);
      if (!user || user.password !== password) return text("Invalid email or password", 401);
      if (!user.emailVerified) return text("Please verify your email before logging in", 403);
      return json({ tokenType: "Bearer", accessToken: makeToken(user) });
    }

    if (path === "/api/auth/resend-otp" && method === "POST") {
      const { email } = body as { email: string };
      const user = findByEmail(email);
      if (!user) return text("User not found", 404);
      user.otp = "123456";
      return json({ message: "OTP resent successfully." });
    }

    if (path === "/api/auth/reset-password-request" && method === "POST") {
      const { email } = body as { email: string };
      const user = findByEmail(email);
      if (user) user.otp = "123456";
      return text("Reset OTP sent successfully!");
    }

    if (path === "/api/auth/reset-password" && method === "POST") {
      const { email, newPassword, otp } = body as { email: string; newPassword: string; otp: string };
      const user = findByEmail(email);
      if (!user) return text("User not found", 404);
      if (otp !== "123456" && otp !== user.otp) return text("Invalid or expired OTP", 400);
      user.password = newPassword;
      user.emailVerified = true;
      return text("Password changed successfully!");
    }

    if (path === "/api/auth/get-user-details" && method === "GET") {
      const user = requireAuth(req);
      if (!user) return text("Unauthorized", 401);
      const { password: _p, otp: _o, ...safe } = user;
      return json(safe);
    }

    // ---- EQUIPMENT (Bearer token) ----
    if (path === "/api/equipment/add-equipment" && method === "POST") {
      const user = requireAuth(req);
      if (!user) return text("Unauthorized", 401);
      const { serial, equipmentName, category, description, institution } = body as Equipment;
      const id = ++eqSeq;
      const eq: Equipment = {
        id, serial, equipmentName, category, description, institution,
        acquisitionDate: nowISO(), addedBy: user.username, status: "AVAILABLE",
      };
      equipment.set(id, eq);
      return json(eq, 201);
    }

    if (path === "/api/equipment/get-all-equipments" && method === "GET") {
      const user = requireAuth(req);
      if (!user) return text("Unauthorized", 401);
      return json(Array.from(equipment.values()));
    }

    if (path === "/api/equipment/get-my-equipments" && method === "GET") {
      const user = requireAuth(req);
      if (!user) return text("Unauthorized", 401);
      return json(Array.from(equipment.values()).filter((e) => e.addedBy === user.username));
    }

    {
      // #24 — get equipment details by id (all authed roles)
      const m = path.match(/^\/api\/equipment\/get-equipment\/(\d+)$/);
      if (m && method === "GET") {
        const user = requireAuth(req);
        if (!user) return text("Unauthorized", 401);
        const id = Number(m[1]);
        const eq = equipment.get(id);
        if (!eq) return text("Equipment not found", 404);
        return json(eq);
      }
    }

    {
      const m = path.match(/^\/api\/equipment\/update-equipment\/(\d+)$/);
      if (m && method === "PUT") {
        const user = requireAuth(req);
        if (!user) return text("Unauthorized", 401);
        const id = Number(m[1]);
        const eq = equipment.get(id);
        if (!eq) return text("Equipment not found", 404);
        Object.assign(eq, body as Partial<Equipment>);
        return json(eq);
      }
    }

    {
      const m = path.match(/^\/api\/equipment\/delete-equipment\/(\d+)$/);
      if (m && method === "DELETE") {
        const user = requireAuth(req);
        if (!user) return text("Unauthorized", 401);
        const id = Number(m[1]);
        if (!equipment.has(id)) return text("Equipment not found", 404);
        equipment.delete(id);
        for (const [bid, b] of bookings) if (b.equipment.id === id) bookings.delete(bid);
        return text("Equipment Deleted Successfully");
      }
    }

    {
      const m = path.match(/^\/api\/equipment\/update-equipment-status\/(\d+)$/);
      if (m && method === "PUT") {
        const user = requireAuth(req);
        if (!user) return text("Unauthorized", 401);
        const id = Number(m[1]);
        const eq = equipment.get(id);
        if (!eq) return text("Equipment not found", 404);
        eq.status = (body as { status: EquipmentStatus }).status;
        return json(eq);
      }
    }

    // ---- Calibration & certification records (Module 2.v) ----
    // GET /api/equipment/{equipmentId}/calibrations — list all records (all authed roles)
    {
      const m = path.match(/^\/api\/equipment\/(\d+)\/calibrations$/);
      if (m && method === "GET") {
        const user = requireAuth(req);
        if (!user) return text("Unauthorized", 401);
        const equipmentId = Number(m[1]);
        if (!equipment.has(equipmentId)) return text("Equipment not found", 404);
        const list = Array.from(calibrationRecords.values())
          .filter((c) => c.equipmentId === equipmentId)
          .sort((a, b) => new Date(b.performedDate).getTime() - new Date(a.performedDate).getTime());
        return json(list);
      }
    }

    // POST /api/equipment/{equipmentId}/calibrations — add a record (LAB_MANAGER, LAB_TECHNICIAN, SYSTEM_ADMIN)
    {
      const m = path.match(/^\/api\/equipment\/(\d+)\/calibrations$/);
      if (m && method === "POST") {
        const user = requireAuth(req);
        if (!user) return text("Unauthorized", 401);
        if (user.role !== "LAB_MANAGER" && user.role !== "LAB_TECHNICIAN" && user.role !== "SYSTEM_ADMIN") {
          return text("Forbidden", 403);
        }
        const equipmentId = Number(m[1]);
        const eq = equipment.get(equipmentId);
        if (!eq) return text("Equipment not found", 404);
        const {
          recordType, performedDate, nextDueDate, performedBy,
          result, certificateRef, notes,
        } = body as CalibrationRecord;
        if (!recordType || !performedDate) {
          return text("recordType and performedDate are required", 400);
        }
        const id = ++calSeq;
        const rec: CalibrationRecord = {
          id, equipment: eq, equipmentId, recordType, performedDate,
          nextDueDate, performedBy, result, certificateRef, notes,
          createdAt: nowISO(),
        };
        calibrationRecords.set(id, rec);
        return json(rec, 201);
      }
    }

    // GET /api/equipment/{equipmentId}/calibrations/due — records with nextDueDate in [from, to]
    {
      const m = path.match(/^\/api\/equipment\/(\d+)\/calibrations\/due$/);
      if (m && method === "GET") {
        const user = requireAuth(req);
        if (!user) return text("Unauthorized", 401);
        if (user.role !== "LAB_MANAGER" && user.role !== "LAB_TECHNICIAN" && user.role !== "SYSTEM_ADMIN") {
          return text("Forbidden", 403);
        }
        const equipmentId = Number(m[1]);
        const from = q.get("from");
        const to = q.get("to");
        let list = Array.from(calibrationRecords.values()).filter((c) => c.equipmentId === equipmentId);
        if (from && to) {
          list = list.filter((c) => {
            if (!c.nextDueDate) return false;
            return new Date(c.nextDueDate) >= new Date(from) && new Date(c.nextDueDate) <= new Date(to);
          });
        }
        return json(list);
      }
    }

    // ---- BOOKINGS (role-scoped Bearer token) ----
    if (path === "/api/bookings/all" && method === "GET") {
      // #25 — all bookings system-wide (LAB_MANAGER only)
      const user = requireAuth(req);
      if (!user) return text("Unauthorized", 401);
      if (user.role !== "LAB_MANAGER") return text("Forbidden", 403);
      return json(Array.from(bookings.values()));
    }

    if (path === "/api/bookings/create" && method === "POST") {
      const user = requireAuth(req);
      if (!user) return text("Unauthorized", 401);
      const { userId, equipmentId, startTime, endTime } = body as {
        userId: number; equipmentId: number; startTime: string; endTime: string;
      };
      const eq = equipment.get(equipmentId);
      if (!eq) return text("Equipment not found", 404);
      if (eq.status !== "AVAILABLE") {
        return text("Selected equipment is not available for booking.", 400);
      }
      // Matches real backend: also checks if this user already has an active
      // booking for this equipment (existsByEquipmentIdAndUserIdAndStatusIn)
      const alreadyHas = Array.from(bookings.values()).some(
        (b) =>
          b.equipment.id === equipmentId &&
          b.user.id === userId &&
          ["PENDING", "CONFIRMED"].includes(b.status),
      );
      if (alreadyHas) {
        return text("You already have an active or pending booking request for this equipment.", 400);
      }
      const conflict = Array.from(bookings.values()).some(
        (b) =>
          b.equipment.id === equipmentId &&
          ["PENDING", "CONFIRMED"].includes(b.status) &&
          overlaps(startTime, endTime, b.startTime, b.endTime),
      );
      const bookingUser = users.get(userId) ?? user;
      if (conflict) {
        // Real backend saves a Waitlist entity (separate from Booking), not a
        // WAITLIST-status booking.
        const wlId = ++wlSeq;
        waitlist.set(wlId, {
          id: wlId,
          equipment: eq,
          user: toBookingUser(bookingUser),
          startTime, endTime,
          createdAt: nowISO(),
        });
        return text("Slot conflicting with an active timeline. Auto-added to the Waitlist.");
      }
      const id = ++bkSeq;
      const booking: Booking = {
        id, equipment: eq, user: toBookingUser(bookingUser),
        startTime, endTime, status: "PENDING",
        createdAt: nowISO(),
      };
      bookings.set(id, booking);
      logAudit(booking, "CREATE", null, "PENDING", user.username);
      return text("Booking request submitted successfully. Awaiting Manager approval.");
    }

    // POST /api/bookings/create-recurring — RESEARCHER only. Creates a parent
    // booking + child instances (skipping conflicting slots) until recurrenceEndDate.
    if (path === "/api/bookings/create-recurring" && method === "POST") {
      const user = requireAuth(req);
      if (!user) return text("Unauthorized", 401);
      if (user.role !== "RESEARCHER") return text("Forbidden", 403);
      const {
        userId, equipmentId, startTime, endTime, recurrencePattern, recurrenceEndDate,
      } = body as {
        userId: number; equipmentId: number; startTime: string; endTime: string;
        recurrencePattern: "DAILY" | "WEEKLY"; recurrenceEndDate: string;
      };
      if (recurrencePattern !== "DAILY" && recurrencePattern !== "WEEKLY") {
        return text("Invalid recurrencePattern (must be DAILY or WEEKLY)", 400);
      }
      const eq = equipment.get(equipmentId);
      if (!eq) return text("Equipment not found", 404);
      const start = new Date(startTime);
      const end = new Date(endTime);
      const recurEnd = new Date(recurrenceEndDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || isNaN(recurEnd.getTime())) {
        return text("Invalid startTime/endTime/recurrenceEndDate", 400);
      }
      const durationMs = end.getTime() - start.getTime();
      if (durationMs <= 0) return text("endTime must be after startTime", 400);
      const stepMs = recurrencePattern === "DAILY" ? 24 * 3600_000 : 7 * 24 * 3600_000;
      const bookingUser = users.get(userId) ?? user;
      let count = 0;
      let parentId: number | null = null;
      let cur = new Date(start);
      // Cap iterations to avoid runaway loops on bad input (e.g. 1000 years).
      let safety = 0;
      while (cur.getTime() <= recurEnd.getTime() && safety < 1000) {
        safety++;
        const s = new Date(cur);
        const e = new Date(s.getTime() + durationMs);
        const conflict = Array.from(bookings.values()).some(
          (b) =>
            b.equipment.id === equipmentId &&
            ["PENDING", "CONFIRMED", "IN_PROGRESS"].includes(b.status) &&
            overlaps(s.toISOString(), e.toISOString(), b.startTime, b.endTime),
        );
        if (!conflict) {
          const id = ++bkSeq;
          const booking: Booking = {
            id, equipment: eq, user: toBookingUser(bookingUser),
            startTime: s.toISOString(), endTime: e.toISOString(),
            status: "PENDING",
            recurrencePattern,
            parentBookingId: parentId,
            createdAt: nowISO(),
          };
          bookings.set(id, booking);
          logAudit(booking, "CREATE", null, "PENDING", user.username, "recurring instance");
          if (parentId === null) parentId = id;
          count++;
        }
        cur = new Date(cur.getTime() + stepMs);
      }
      return text(`Recurring booking created: ${count} instances.`);
    }

    if (path === "/api/bookings/calendar" && method === "GET") {
      // Matches real backend: @PreAuthorize("hasAnyRole('RESEARCHER')") +
      // @RequestParam Long userId (required). User-scoped, not equipment-scoped.
      const user = requireAuth(req);
      if (!user) return text("Unauthorized", 401);
      if (user.role !== "RESEARCHER") return text("Forbidden", 403);
      const userId = q.get("userId");
      if (!userId) return text("Required request parameter 'userId' is not present", 400);
      const start = q.get("start");
      const end = q.get("end");
      let list = Array.from(bookings.values()).filter((b) => b.user.id === Number(userId));
      if (start && end) {
        list = list.filter(
          (b) => new Date(b.endTime) >= new Date(start) && new Date(b.startTime) <= new Date(end),
        );
      }
      return json(list);
    }

    // GET /api/bookings/equipment-calendar — ALL bookings (any user) on a piece
    // of equipment in a date range. All authed roles. Filters out CANCELLED +
    // REJECTED. Query: WHERE equipment.id = :equipmentId AND status NOT IN
    // (CANCELLED, REJECTED) AND startTime < :end AND endTime > :start.
    if (path === "/api/bookings/equipment-calendar" && method === "GET") {
      const user = requireAuth(req);
      if (!user) return text("Unauthorized", 401);
      const equipmentId = Number(q.get("equipmentId"));
      if (!equipmentId) {
        return text("Required request parameter 'equipmentId' is not present", 400);
      }
      const start = q.get("start");
      const end = q.get("end");
      let list = Array.from(bookings.values()).filter(
        (b) =>
          b.equipment.id === equipmentId &&
          !["CANCELLED", "REJECTED"].includes(b.status),
      );
      if (start && end) {
        const s0 = new Date(start);
        const e0 = new Date(end);
        list = list.filter(
          (b) => new Date(b.startTime) < e0 && new Date(b.endTime) > s0,
        );
      }
      return json(list);
    }

    {
      const m = path.match(/^\/api\/bookings\/my-dashboard\/(\d+)$/);
      if (m && method === "GET") {
        const user = requireAuth(req);
        if (!user) return text("Unauthorized", 401);
        const userId = Number(m[1]);
        const userBookings = Array.from(bookings.values()).filter((b) => b.user.id === userId);
        const userWaitlist = Array.from(waitlist.values())
          .filter((w) => w.user.id === userId)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        return json({ bookings: userBookings, waitlistEntries: userWaitlist });
      }
    }

    if (path === "/api/bookings/utilization" && method === "GET") {
      // Per-equipment utilization (LAB_MANAGER).
      const user = requireAuth(req);
      if (!user) return text("Unauthorized", 401);
      if (user.role !== "LAB_MANAGER") return text("Forbidden", 403);
      const equipmentId = Number(q.get("equipmentId"));
      const start = q.get("start");
      const end = q.get("end");
      const eq = equipment.get(equipmentId);
      if (!eq) return text("Equipment not found", 404);
      const rangeMs = new Date(end!).getTime() - new Date(start!).getTime();
      const availableHours = Math.max(0, rangeMs / 3600_000);
      const list = Array.from(bookings.values()).filter((b) => b.equipment.id === equipmentId);
      const bookedHours = bookedHoursIn(list, start!, end!);
      const utilizationPercentage =
        availableHours > 0 ? Math.round((bookedHours / availableHours) * 10000) / 100 : 0;
      return json({
        equipmentId,
        equipmentName: eq.equipmentName,
        bookedHours: round1(bookedHours),
        availableHours: round1(availableHours),
        utilizationPercentage,
      });
    }

    // GET /api/bookings/utilization/department — LAB_MANAGER. Aggregates
    // utilization across all equipment with the given department.
    if (path === "/api/bookings/utilization/department" && method === "GET") {
      const user = requireAuth(req);
      if (!user) return text("Unauthorized", 401);
      if (user.role !== "LAB_MANAGER") return text("Forbidden", 403);
      const department = q.get("department");
      const start = q.get("start");
      const end = q.get("end");
      if (!department) {
        return text("Required request parameter 'department' is not present", 400);
      }
      return json(scopeUtilization("DEPARTMENT", department, start!, end!, (e) => e.department === department));
    }

    // GET /api/bookings/utilization/institution — LAB_MANAGER. Same as department
    // but filters by institution.
    if (path === "/api/bookings/utilization/institution" && method === "GET") {
      const user = requireAuth(req);
      if (!user) return text("Unauthorized", 401);
      if (user.role !== "LAB_MANAGER") return text("Forbidden", 403);
      const institution = q.get("institution");
      const start = q.get("start");
      const end = q.get("end");
      if (!institution) {
        return text("Required request parameter 'institution' is not present", 400);
      }
      return json(scopeUtilization("INSTITUTION", institution, start!, end!, (e) => e.institution === institution));
    }

    // GET /api/bookings/utilization/heatmap — LAB_MANAGER. Returns array of
    // {dayOfWeek(1-7 Mon-Sun), hour(0-23), bookedHours, bookingCount}. For each
    // booking on the equipment in range, add 1 hour to each day-of-week/hour
    // bucket the booking covers.
    if (path === "/api/bookings/utilization/heatmap" && method === "GET") {
      const user = requireAuth(req);
      if (!user) return text("Unauthorized", 401);
      if (user.role !== "LAB_MANAGER") return text("Forbidden", 403);
      const equipmentId = Number(q.get("equipmentId"));
      if (!equipmentId) {
        return text("Required request parameter 'equipmentId' is not present", 400);
      }
      const start = q.get("start")!;
      const end = q.get("end")!;
      const s0 = new Date(start).getTime();
      const e0 = new Date(end).getTime();
      const buckets = new Map<string, { dayOfWeek: number; hour: number; bookedHours: number; bookingCount: number; }>();
      const list = Array.from(bookings.values()).filter(
        (b) =>
          b.equipment.id === equipmentId &&
          ["CONFIRMED", "IN_PROGRESS", "COMPLETED"].includes(b.status) &&
          new Date(b.startTime) < new Date(end) && new Date(b.endTime) > new Date(start),
      );
      for (const b of list) {
        const segStart = new Date(Math.max(new Date(b.startTime).getTime(), s0));
        const segEnd = new Date(Math.min(new Date(b.endTime).getTime(), e0));
        const cur = new Date(segStart);
        cur.setMinutes(0, 0, 0);
        while (cur < segEnd) {
          const nextHour = new Date(cur);
          nextHour.setHours(cur.getHours() + 1, 0, 0, 0);
          const hourEnd = nextHour < segEnd ? nextHour : segEnd;
          const segHours = (hourEnd.getTime() - cur.getTime()) / 3600_000;
          // JS getDay(): 0=Sun, 1=Mon..6=Sat. Convert to ISO 1-7 (Mon=1..Sun=7).
          const jsDay = cur.getDay();
          const isoDay = jsDay === 0 ? 7 : jsDay;
          const hour = cur.getHours();
          const k = `${isoDay}-${hour}`;
          let bucket = buckets.get(k);
          if (!bucket) {
            bucket = { dayOfWeek: isoDay, hour, bookedHours: 0, bookingCount: 0 };
            buckets.set(k, bucket);
          }
          bucket.bookedHours += segHours;
          bucket.bookingCount += 1;
          cur.setTime(hourEnd.getTime());
        }
      }
      const result = Array.from(buckets.values())
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.hour - b.hour)
        .map((r) => ({
          dayOfWeek: r.dayOfWeek,
          hour: r.hour,
          bookedHours: round1(r.bookedHours),
          bookingCount: r.bookingCount,
        }));
      return json(result);
    }

    // GET /api/bookings/utilization/idle — LAB_MANAGER. Returns array of
    // {equipmentId, equipmentName, totalPeriodHours, bookedHours, idleHours,
    // idlePercentage} for ALL non-RETIRED equipment.
    if (path === "/api/bookings/utilization/idle" && method === "GET") {
      const user = requireAuth(req);
      if (!user) return text("Unauthorized", 401);
      if (user.role !== "LAB_MANAGER") return text("Forbidden", 403);
      const start = q.get("start")!;
      const end = q.get("end")!;
      const periodMs = new Date(end).getTime() - new Date(start).getTime();
      const periodHours = Math.max(0, periodMs / 3600_000);
      const result = Array.from(equipment.values())
        .filter((e) => e.status !== "RETIRED")
        .map((e) => {
          const list = Array.from(bookings.values()).filter((b) => b.equipment.id === e.id);
          const bookedHours = bookedHoursIn(list, start, end);
          const idleHours = Math.max(0, periodHours - bookedHours);
          const idlePercentage =
            periodHours > 0 ? Math.round((idleHours / periodHours) * 10000) / 100 : 0;
          return {
            equipmentId: e.id,
            equipmentName: e.equipmentName,
            totalPeriodHours: round1(periodHours),
            bookedHours: round1(bookedHours),
            idleHours: round1(idleHours),
            idlePercentage,
          };
        });
      return json(result);
    }

    // GET /api/bookings/{id}/audit — RESEARCHER + LAB_MANAGER. Audit entries for
    // one booking, ordered by timestamp ASC.
    {
      const m = path.match(/^\/api\/bookings\/(\d+)\/audit$/);
      if (m && method === "GET") {
        const user = requireAuth(req);
        if (!user) return text("Unauthorized", 401);
        if (user.role !== "RESEARCHER" && user.role !== "LAB_MANAGER") {
          return text("Forbidden", 403);
        }
        const bookingId = Number(m[1]);
        const list = Array.from(auditLog.values())
          .filter((a) => a.bookingId === bookingId)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        return json(list);
      }
    }

    // GET /api/bookings/equipment-audit/{equipmentId} — LAB_MANAGER only. Audit
    // entries for one equipment, ordered by timestamp DESC.
    {
      const m = path.match(/^\/api\/bookings\/equipment-audit\/(\d+)$/);
      if (m && method === "GET") {
        const user = requireAuth(req);
        if (!user) return text("Unauthorized", 401);
        if (user.role !== "LAB_MANAGER") return text("Forbidden", 403);
        const equipmentId = Number(m[1]);
        const list = Array.from(auditLog.values())
          .filter((a) => a.equipmentId === equipmentId)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return json(list);
      }
    }

    {
      // #18–#22 lifecycle actions: no body, state determined by path.
      // NOTE: #17 (POST /{id}/status) is COMMENTED OUT in the real backend.
      const m = path.match(/^\/api\/bookings\/(\d+)\/(accept|reject|start|cancel|complete)$/);
      if (m && method === "PUT") {
        const user = requireAuth(req);
        if (!user) return text("Unauthorized", 401);
        const id = Number(m[1]);
        const action = m[2];
        const b = bookings.get(id);
        if (!b) return text("Booking not found", 404);
        const statusMap: Record<string, BookingStatus> = {
          accept: "CONFIRMED", reject: "REJECTED", start: "IN_PROGRESS",
          cancel: "CANCELLED", complete: "COMPLETED",
        };
        const auditActionMap: Record<string, string> = {
          accept: "ACCEPT", reject: "REJECT", start: "START",
          cancel: "CANCEL", complete: "COMPLETE",
        };
        const fromStatus = b.status;
        b.status = statusMap[action];
        // Module 3.vi: log an audit entry on every status change.
        logAudit(b, auditActionMap[action], fromStatus, b.status, user.username);
        // Auto-set equipment status: BOOKED on start, AVAILABLE on complete.
        if (action === "start") {
          b.equipment.status = "BOOKED";
        } else if (action === "complete") {
          b.equipment.status = "AVAILABLE";
        }
        // On cancel/complete, promote eligible waitlist entries (matches
        // real backend's promoteNextEligibleWaitlist).
        if (action === "cancel" || action === "complete") {
          const eqId = b.equipment.id;
          for (const [, w] of Array.from(waitlist.entries())) {
            if (w.equipment.id !== eqId) continue;
            const stillBlocked = Array.from(bookings.values()).some(
              (bb) =>
                bb.equipment.id === eqId &&
                ["PENDING", "CONFIRMED"].includes(bb.status) &&
                overlaps(w.startTime, w.endTime, bb.startTime, bb.endTime),
            );
            if (!stillBlocked) {
              const newId = ++bkSeq;
              const promoted: Booking = {
                id: newId, equipment: w.equipment, user: w.user,
                startTime: w.startTime, endTime: w.endTime, status: "PENDING",
                createdAt: nowISO(),
              };
              bookings.set(newId, promoted);
              logAudit(promoted, "CREATE", null, "PENDING", user.username, "promoted from waitlist");
              waitlist.delete(w.id);
            }
          }
        }
        const msg: Record<string, string> = {
          accept: "Booking accepted successfully.",
          reject: "Booking rejected successfully.",
          start: "Booking started successfully.",
          cancel: "Booking cancelled successfully.",
          complete: "Booking completed successfully.",
        };
        return text(msg[action]);
      }
    }

    // PUT /api/bookings/{bookingId}/no-show — LAB_MANAGER only. Sets status to
    // NO_SHOW. Only CONFIRMED bookings can be marked no-show.
    {
      const m = path.match(/^\/api\/bookings\/(\d+)\/no-show$/);
      if (m && method === "PUT") {
        const user = requireAuth(req);
        if (!user) return text("Unauthorized", 401);
        if (user.role !== "LAB_MANAGER") return text("Forbidden", 403);
        const id = Number(m[1]);
        const b = bookings.get(id);
        if (!b) return text("Booking not found", 404);
        if (b.status !== "CONFIRMED") {
          return text("Only confirmed bookings can be marked as no-show.", 400);
        }
        const fromStatus = b.status;
        b.status = "NO_SHOW";
        logAudit(b, "NO_SHOW", fromStatus, "NO_SHOW", user.username);
        return text("Booking marked as no-show.");
      }
    }

    // ---- WAITLIST MANAGEMENT (Module 3.v) ----

    // GET /api/waitlist — all waitlist entries system-wide (LAB_MANAGER)
    if (path === "/api/waitlist" && method === "GET") {
      const user = requireAuth(req);
      if (!user) return text("Unauthorized", 401);
      if (user.role !== "LAB_MANAGER") return text("Forbidden", 403);
      const all = Array.from(waitlist.values())
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return json(all.map((w) => toWaitlistDTO(w)));
    }

    {
      // GET /api/waitlist/equipment/{equipmentId} — waitlist for one equipment
      const m = path.match(/^\/api\/waitlist\/equipment\/(\d+)$/);
      if (m && method === "GET") {
        const user = requireAuth(req);
        if (!user) return text("Unauthorized", 401);
        const equipmentId = Number(m[1]);
        const queue = Array.from(waitlist.values())
          .filter((w) => w.equipment.id === equipmentId)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        return json(queue.map((w) => toWaitlistDTO(w)));
      }

      // POST /api/waitlist/equipment/{equipmentId}/promote — manually promote
      if (m && method === "POST" && path.endsWith("/promote")) {
        const user = requireAuth(req);
        if (!user) return text("Unauthorized", 401);
        if (user.role !== "LAB_MANAGER") return text("Forbidden", 403);
        const equipmentId = Number(m[1]);
        // Reuse the existing promotion logic
        for (const [, w] of Array.from(waitlist.entries())) {
          if (w.equipment.id !== equipmentId) continue;
          const stillBlocked = Array.from(bookings.values()).some(
            (bb) =>
              bb.equipment.id === equipmentId &&
              ["PENDING", "CONFIRMED", "IN_PROGRESS"].includes(bb.status) &&
              overlaps(w.startTime, w.endTime, bb.startTime, bb.endTime),
          );
          if (!stillBlocked) {
            const newId = ++bkSeq;
            const promoted: Booking = {
              id: newId, equipment: w.equipment, user: w.user,
              startTime: w.startTime, endTime: w.endTime, status: "PENDING",
            };
            bookings.set(newId, promoted);
            logAudit(promoted, "CREATE", null, "PENDING", user.username, "promoted from waitlist");
            waitlist.delete(w.id);
          }
        }
        return text(`Waitlist promotion checked for equipment ${equipmentId}.`);
      }
    }

    return text("Not found", 404);
  } catch (e) {
    return text(`Server error: ${(e as Error).message}`, 500);
  }
}

// Helper for the department + institution utilization endpoints (Module 4).
// Filters equipment by `predicate`, then aggregates booked hours across the
// matching equipment over [start, end].
function scopeUtilization(
  scope: "DEPARTMENT" | "INSTITUTION",
  name: string,
  start: string,
  end: string,
  predicate: (e: Equipment) => boolean,
) {
  const eqs = Array.from(equipment.values()).filter(predicate);
  const eqIds = new Set(eqs.map((e) => e.id));
  const periodMs = new Date(end).getTime() - new Date(start).getTime();
  const periodHours = Math.max(0, periodMs / 3600_000);
  const equipmentCount = eqs.length;
  const totalAvailableHours = equipmentCount * periodHours;
  const list = Array.from(bookings.values()).filter((b) => eqIds.has(b.equipment.id));
  const totalBookedHours = bookedHoursIn(list, start, end);
  const utilizationPercentage =
    totalAvailableHours > 0
      ? Math.round((totalBookedHours / totalAvailableHours) * 10000) / 100
      : 0;
  return {
    scope,
    name,
    equipmentCount,
    totalAvailableHours: round1(totalAvailableHours),
    totalBookedHours: round1(totalBookedHours),
    utilizationPercentage,
  };
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-headers": "authorization,content-type",
          "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
          "access-control-max-age": "86400",
        },
      });
    }
    return handle(req);
  },
});

console.log(`api-backend listening on http://localhost:${server.port}`);
