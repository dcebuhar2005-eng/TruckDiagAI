"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import { t } from "./translations";

export default function Comments({ faultId }: { faultId: number }) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
    getUser();
  }, []);

  async function getUser() {
    const { data } = await supabase.auth.getUser();
    setCurrentUserId(data.user?.id || null);
  }

  async function loadComments() {
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("fault_id", faultId)
      .order("created_at", { ascending: false });

    setComments(data || []);
  }

  async function addComment() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      alert("Moraš biti prijavljen.");
      return;
    }

    if (!newComment.trim()) return;

    const { error } = await supabase.from("comments").insert({
      fault_id: faultId,
      user_id: userData.user.id,
      comment: newComment,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setNewComment("");
    loadComments();
  }

  async function deleteComment(id: number) {
    const confirmDelete = window.confirm(
      "Jesi siguran da želiš obrisati komentar?"
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadComments();
  }

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>{t("comments")}</h3>

      <textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        placeholder={t("writeComment")}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px",
        }}
      />

      <button onClick={addComment}>
        {t("addComment")}
      </button>

      <div style={{ marginTop: "15px" }}>
        {comments.map((c) => (
          <div
            key={c.id}
            style={{
              border: "1px solid #444",
              padding: "10px",
              marginBottom: "10px",
              borderRadius: "8px",
            }}
          >
            <p>{c.comment}</p>

            {currentUserId === c.user_id && (
              <button
                onClick={() => deleteComment(c.id)}
                style={{
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  marginTop: "8px",
                }}
              >
                {t("deleteComment") || "🗑️ Obriši komentar"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}