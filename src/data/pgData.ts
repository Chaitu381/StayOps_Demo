// Type-only module. NO mock data is generated here.
// All runtime data must come from the backend (see src/lib/api.ts).

export interface Student {
  id: string;
  name: string;
  phone: string;
  photo: string;
  roomNumber: string;
  bedNumber: number;
  rentStatus: "paid" | "unpaid";
  joinDate: string;
}

export interface Bed {
  id: number;
  occupied: boolean;
  student?: Student;
}

export interface Room {
  id: string;
  roomNumber: string;
  floorId: string;
  beds: Bed[];
}

export interface Floor {
  id: string;
  name: string;
  rooms: Room[];
}

export interface MenuItem {
  id: string;
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  phone: string;
  shift: string;
}

// Empty defaults — populated only by backend fetches in pages.
export const floors: Floor[] = [];
export const menuItems: MenuItem[] = [];
export const workers: Worker[] = [];

// Pure helpers (work on whatever data is passed via the `floors` export).
export function getFloorStats(floor: Floor) {
  const totalRooms = floor.rooms.length;
  const totalBeds = floor.rooms.reduce((sum, r) => sum + r.beds.length, 0);
  const filledBeds = floor.rooms.reduce(
    (sum, r) => sum + r.beds.filter((b) => b.occupied).length,
    0,
  );
  const vacantBeds = totalBeds - filledBeds;
  return { totalRooms, totalBeds, filledBeds, vacantBeds };
}

export function getAllStudents(): Student[] {
  return floors.flatMap((f) =>
    f.rooms.flatMap((r) => r.beds.filter((b) => b.student).map((b) => b.student!)),
  );
}

export function getTotalStats() {
  const all = floors.map(getFloorStats);
  return {
    totalCapacity: all.reduce((s, a) => s + a.totalBeds, 0),
    filledBeds: all.reduce((s, a) => s + a.filledBeds, 0),
    vacantBeds: all.reduce((s, a) => s + a.vacantBeds, 0),
  };
}

export function getVacantRooms(): Room[] {
  return floors.flatMap((f) => f.rooms.filter((r) => r.beds.some((b) => !b.occupied)));
}
