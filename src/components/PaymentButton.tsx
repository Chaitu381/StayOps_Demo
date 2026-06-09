import { useState } from "react";
import { Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  monthlyStatusId: number | string;
  paid: boolean;
  onChanged?: (paid: boolean) => void;
  disabled?: boolean;
}

export default function PaymentButton({
  monthlyStatusId,
  paid,
  onChanged,
  disabled,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(paid);

  async function toggle() {
    if (loading || disabled) return;

    setLoading(true);
    const next = !current;

    try {
      await api.markPaid(monthlyStatusId, next);
      setCurrent(next);
      onChanged?.(next);
      toast.success(next ? "Marked Paid" : "Marked Unpaid");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  const style = current
    ? { backgroundColor: "hsl(160 84% 39%)", color: "white" }
    : { backgroundColor: "hsl(0, 100%, 35%)", color: "white" };


  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading || disabled}
      style={style}
      className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm border-0 disabled:opacity-100"
    >
      {loading && <Loader2 className="h-3 w-3 animate-spin" />}
      {current ? "Paid" : "Unpaid"}
    </button>
  );
}