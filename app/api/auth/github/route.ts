import { NextResponse } from "next/server";

export async function GET() {
  const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  if (!GITHUB_CLIENT_ID) {
    return NextResponse.json(
      { error: "GITHUB_CLIENT_ID is not set" },
      { status: 500 }
    );
  }
  const redirect_uri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`;
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri,
    scope: "repo,user:email",
  });

  const url = `https://github.com/login/oauth/authorize?${params.toString()}`;
  return NextResponse.redirect(url);
}
