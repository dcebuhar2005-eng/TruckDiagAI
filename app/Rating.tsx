"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import { t } from "@/app/translations";

export default function Rating({ faultId }: { faultId: number }) {
  const [average, setAverage] = useState(0);
  const [votes, setVotes] = useState(0);

  useEffect(() => {
    loadRatings();
  }, []);

  async function loadRatings() {
    const { data } = await supabase
      .from("ratings")
      .select("*")
      .eq("fault_id", faultId);

    if (!data || data.length === 0) {
      setAverage(0);
      setVotes(0);
      return;
    }

    const total = data.reduce(
      (sum: number, item: any) => sum + item.rating,
      0
    );

    setAverage(total / data.length);
    setVotes(data.length);
  }

  async function rate(stars: number) {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      alert(t("mustLogin"));
      return;
    }

    const userId = userData.user.id;

    const { data: existing } = await supabase
      .from("ratings")
      .select("*")
      .eq("fault_id", faultId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("ratings")
        .update({ rating: stars })
        .eq("id", existing.id);
    } else {
      await supabase.from("ratings").insert({
        fault_id: faultId,
        user_id: userId,
        rating: stars,
      });
    }

    loadRatings();
  }

  return (
    <div style={{ marginTop: "12px" }}>
      <div style={{ fontSize: "22px" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => rate(star)}
            title={t("rateFault")}
            style={{
              cursor: "pointer",
              marginRight: "4px",
            }}
          >
            ⭐
          </span>
        ))}
      </div>

      <p style={{ fontSize: "14px", marginTop: "6px" }}>
        {t("average")}: {average.toFixed(1)} ⭐ ({votes} {t("votes")})
      </p>
    </div>
  );
}