import { NextRequest, NextResponse } from "next/server";

import { simulateKycProcess } from "@/lib/mock-kyc";

export const runtime = "nodejs";
export const maxDuration = 30;

const wait = (duration: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, duration);
  });

export async function POST(request: NextRequest) {
  let payload: { identityFileName?: string | null; addressFileName?: string | null } = {};

  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    payload = {};
  }

  await wait(1400);

  const result = simulateKycProcess({
    identityFileName: payload.identityFileName,
    addressFileName: payload.addressFileName,
  });

  return NextResponse.json(result);
}
