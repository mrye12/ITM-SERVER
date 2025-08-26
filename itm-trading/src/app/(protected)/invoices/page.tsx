import { getServerSupabase } from "@/lib/supabase/auth"

export default async function InvoicesPage() {
  const supabase = await getServerSupabase()
  const { data } = await supabase.from("invoices").select("*").order("created_at", { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Invoices</h1>
      <div className="bg-white border rounded p-4">
        <table className="w-full table-auto">
          <thead>
            <tr>
              <th className="p-2 border">Sales ID</th>
              <th className="p-2 border">Amount</th>
              <th className="p-2 border">Due Date</th>
              <th className="p-2 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((r: any) => (
              <tr key={r.id}>
                <td className="p-2 border">{r.sales_id}</td>
                <td className="p-2 border">${r.amount}</td>
                <td className="p-2 border">{new Date(r.due_date).toLocaleDateString()}</td>
                <td className="p-2 border">{r.status}</td>
              </tr>
            )) ?? <tr><td className="p-2" colSpan={4}>No data</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
