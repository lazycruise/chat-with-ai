import Klu from "@kluai/core";
import { NextResponse } from "next/server";

const guid = "84b6a1d5-9731-40ed-8a58-dd384d020507";

export async function POST(request) {
  const value = await request.json();
  const input = await value.prompt;

  const klu = new Klu(process.env.KLU_API_Key);
  const result = await klu.actions.prompt(guid, {
    content: input,
  });

  return NextResponse.json({ result: result });
}
