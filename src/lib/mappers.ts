export function mapStudent(s: any) {
  const firstName = s.firstName ?? "";
  const lastName = s.lastName ?? "";

  const paid =
    s.paidUn === true ||
    s.paid === true ||
    s.rentStatus === "paid" ||
    s.paymentStatus === "paid";

  return {
    id: s.id,
    firstName,
    lastName,
    name: s.name ?? `${firstName} ${lastName}`.trim(),
    phone: s.phoneNo ?? s.phone ?? "",
    phoneNo: s.phoneNo ?? s.phone ?? "",
    aadharNo: s.aadharNo ?? "",
    joiningDate: s.joiningDate ?? s.joinDate ?? "",
    roomNumber:
      s.roomNo?.toString() ??
      s.roomNumber?.toString() ??
      s.bed?.room?.roomNo?.toString() ??
      "-",
    roomNo:
      s.roomNo ??
      s.roomNumber ??
      s.bed?.room?.roomNo ??
      "-",
    floorNo:
      s.floorNo ??
      s.bed?.room?.floorNo ??
      "-",
    bedId: s.bedId ?? s.bed?.id ?? "",
    bedCode: s.bedCode ?? s.bed?.bedCode ?? "",
    rentStatus: paid ? "paid" : "unpaid",
    raw: s,
  };
}

export function mapPg(pg: any) {
  return {
    id: pg.id,
    name: pg.pgName ?? pg.name ?? "Unnamed PG",
    pgName: pg.pgName ?? pg.name ?? "Unnamed PG",
    location: pg.location ?? "-",
    totalFloors: pg.totalFloors ?? pg.floors?.length ?? 0,
    totalRooms: pg.totalRooms ?? pg.rooms?.length ?? 0,
    totalBeds: pg.totalBeds ?? pg.beds?.length ?? 0,
    roomsPerFloor: pg.roomsPerFloor ?? 0,
    bedsPerRoom: pg.bedsPerRoom ?? 0,
    raw: pg,
  };
}

export function mapBed(b: any) {
  const occupied =
    b.status === "OCCUPIED" ||
    b.occupied === true ||
    b.isOccupied === true ||
    b.studentId != null ||
    b.student != null;

  return {
    id: b.id,
    bedCode: b.bedCode ?? "",
    bedNo: b.bedNo ?? "",
    status: occupied ? "OCCUPIED" : "AVAILABLE",
    occupied,
    roomId: b.roomId ?? b.room?.id,
    roomNo: b.roomNo ?? b.room?.roomNo ?? "-",
    floorNo: b.floorNo ?? b.room?.floorNo ?? "-",
    studentId: b.studentId ?? b.student?.id ?? null,
    student: b.student ?? null,
    raw: b,
  };
}

export function mapRoom(r: any) {
  const beds = Array.isArray(r.beds) ? r.beds : [];

  const filledBeds = beds.filter((b: any) => {
    return (
      b.status === "OCCUPIED" ||
      b.occupied === true ||
      b.isOccupied === true ||
      b.studentId != null ||
      b.student != null
    );
  }).length;

  return {
    id: r.id,
    floorNo: r.floorNo ?? "-",
    roomNo: r.roomNo ?? r.roomNumber ?? r.id,
    roomNumber: r.roomNumber ?? r.roomNo ?? r.id,
    totalBeds: r.totalBeds ?? r.bedCount ?? beds.length,
    filledBeds,
    vacantBeds: (r.totalBeds ?? r.bedCount ?? beds.length) - filledBeds,
    beds,
    raw: r,
  };
}