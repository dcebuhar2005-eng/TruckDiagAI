import { supabase } from "@/src/lib/supabase";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  const { data: faults } = await supabase
    .from("fault_cases")
    .select("*")
    .eq("user_id", id);

  if (error) {
    return <div style={{ padding: "20px" }}>Profil nije pronađen.</div>;
  }

  const whatsappNumber = profile.phone
    ? profile.phone.replace(/\D/g, "")
    : "";

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
      <h1>👤 {profile.name || "Nepoznat korisnik"}</h1>

      {profile.company && (
        <p>
          <b>🏢 Firma:</b> {profile.company}
        </p>
      )}

      {profile.city && (
        <p>
          <b>📍 Grad:</b> {profile.city}
        </p>
      )}

      {profile.phone && (
        <>
          <p>
            <b>📞 Telefon:</b> {profile.phone}
          </p>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginTop: "15px",
              marginBottom: "20px",
            }}
          >
            <a href={`tel:${profile.phone}`}>
              <button
                style={{
                  background: "#16a34a",
                  color: "white",
                  border: "none",
                  padding: "12px 18px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                📞 Nazovi
              </button>
            </a>

            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
            >
              <button
                style={{
                  background: "#25D366",
                  color: "white",
                  border: "none",
                  padding: "12px 18px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                💬 WhatsApp
              </button>
            </a>
          </div>
        </>
      )}

      {profile.bio && (
        <p>
          <b>📝 Opis:</b> {profile.bio}
        </p>
      )}

      <hr style={{ margin: "20px 0" }} />

      <h2>🔧 Objavljeni kvarovi: {faults?.length || 0}</h2>

      {faults?.map((fault: any) => (
        <div
          key={fault.id}
          className="card-hover"
          style={{
            padding: "15px",
            borderRadius: "10px",
            marginBottom: "15px",
          }}
        >
          <h3>
            {fault.brand} {fault.model}
          </h3>

          <p>
            <b>Motor:</b> {fault.engine}
          </p>

          <p>
            <b>Simptomi:</b> {fault.symptoms}
          </p>

          <p>
            <b>Rješenje:</b> {fault.solution}
          </p>
        </div>
      ))}
    </div>
  );
}