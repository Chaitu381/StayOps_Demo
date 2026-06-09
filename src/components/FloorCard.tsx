import { motion } from "framer-motion";
import { Building2, BedDouble } from "lucide-react";
import { Floor, getFloorStats } from "@/data/pgData";

interface FloorCardProps {
  floor: Floor;
  onClick: () => void;
}

export default function FloorCard({ floor, onClick }: FloorCardProps) {
  const stats = getFloorStats(floor);
  const occupancy = stats.totalBeds ? Math.round((stats.filledBeds / stats.totalBeds) * 100) : 0;
  const vacant = 100 - occupancy;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cursor-pointer rounded-xl bg-card p-5 shadow-sm border border-border transition-shadow hover:shadow-lg"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-foreground">{floor.name}</h3>
        </div>
        <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-md">
          {stats.totalRooms} rooms
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2.5">
          <p className="text-[11px] font-medium text-emerald-700">Filled</p>
          <p className="text-lg font-bold text-emerald-900 flex items-center gap-1">
            <BedDouble className="h-4 w-4" /> {stats.filledBeds}
          </p>
        </div>
        <div className="rounded-lg bg-sky-50 border border-sky-100 p-2.5">
          <p className="text-[11px] font-medium text-sky-700">Vacant</p>
          <p className="text-lg font-bold text-sky-900 flex items-center gap-1">
            <BedDouble className="h-4 w-4" /> {stats.vacantBeds}
          </p>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span className="font-medium">Occupancy</span>
          <span className="font-semibold text-foreground">{occupancy}%</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-sky-100 overflow-hidden flex">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${occupancy}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-emerald-500"
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>{occupancy}% filled</span>
          <span>{vacant}% vacant</span>
        </div>
      </div>
    </motion.div>
  );
}
