import { NextResponse } from "next/server";

// Prazan proxy: sprječava da Next pri gradnji na Vercelu preuzme proxy.ts
// nadređene aplikacije (TruckDiag) kad je korijen praćenja datoteka cijeli repozitorij.
export function proxy() {
  return NextResponse.next();
}

export const config = { matcher: ["/__nikad__"] };
