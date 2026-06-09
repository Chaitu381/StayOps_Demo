import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";

export default function RoomSetup() {
  const navigate = useNavigate();
  const [totalFloors, setTotalFloors] = useState("5");
  const [roomsPerFloor, setRoomsPerFloor] = useState("8");
  const [bedsPerRoom, setBedsPerRoom] = useState("4");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const tf = Number(totalFloors);
    const rpf = Number(roomsPerFloor);
    const bpr = Number(bedsPerRoom);
    if (!tf || !rpf || !bpr || tf < 1 || rpf < 1 || bpr < 1) {
      toast.error("All values must be positive numbers");
      return;
    }
    setLoading(true);
    try {
      await api.setup({ totalFloors: tf, roomsPerFloor: rpf, bedsPerRoom: bpr });
      toast.success("Setup completed");
      navigate(-1);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Setup failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Room Setup</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Initialize floors, rooms and beds for the property.
        </p>
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="tf">Total Floors</Label>
              <Input id="tf" type="number" min={1} value={totalFloors} onChange={(e) => setTotalFloors(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rpf">Rooms per Floor</Label>
              <Input id="rpf" type="number" min={1} value={roomsPerFloor} onChange={(e) => setRoomsPerFloor(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bpr">Beds per Room</Label>
              <Input id="bpr" type="number" min={1} value={bedsPerRoom} onChange={(e) => setBedsPerRoom(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Run Setup
            </Button>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
