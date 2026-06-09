import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { LoadingState, ErrorState } from "@/components/DataState";
import EmptyState from "@/components/EmptyState";
import PaymentButton from "@/components/PaymentButton";

interface MonthlyStatus {
  id: number;
  studentId?: number;
  studentName?: string;
  month?: number | string;
  year?: number | string;
  paid?: boolean;
}

export default function MonthlyStatusPage() {
  const [items, setItems] = useState<MonthlyStatus[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const d = await api.listMonthly();
      setItems(d as MonthlyStatus[]);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Monthly Status</h1>
        <Card>
          {loading && <LoadingState />}
          {!loading && error && <div className="p-4"><ErrorState error={error} /></div>}
          {!loading && !error && (!items || items.length === 0) && <EmptyState title="No records" />}
          {!loading && !error && items && items.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      {m.studentName || `#${m.studentId}`}
                    </TableCell>
                    <TableCell>{m.month ?? "-"}</TableCell>
                    <TableCell>{m.year ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      <PaymentButton
                        monthlyStatusId={m.id}
                        paid={!!m.paid}
                        onChanged={() => refresh()}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </Layout>
  );
}
