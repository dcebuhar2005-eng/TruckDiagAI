import Link from "next/link";
import FaultList from "./FaultList";
import { supabase } from "@/src/lib/supabase";
import AddFaultButton from "./AddFaultButton";

export default async function Home() {
  const { data, error } = await supabase
    .from("fault_cases")
    .select("*");

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      

      <br />

     <AddFaultButton />

      <br />
      <br />

      {error && <p>Greška: {error.message}</p>}

      

      <FaultList data={data || []} />
    </div>
  );
}