import { supabase } from "@/src/lib/supabase";
import EditFaultForm from "./EditFaultForm";

export default async function EditFaultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return <div style={{ padding: "20px" }}>Moraš biti prijavljen.</div>;
  }

  const { data, error } = await supabase
    .from("fault_cases")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return <div style={{ padding: "20px" }}>Greška: {error.message}</div>;
  }

  if (data.user_id !== user.id) {
    return (
      <div style={{ padding: "20px" }}>
        Nemaš dopuštenje uređivati ovaj kvar.
      </div>
    );
  }

  return <EditFaultForm fault={data} />;
}