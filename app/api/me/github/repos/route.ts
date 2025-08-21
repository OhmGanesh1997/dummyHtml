import { NextResponse } from "next/server";
import { Octokit } from "octokit";

import { isAuthenticated } from "@/lib/auth";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";

export async function GET() {
  const user = await isAuthenticated();
  if (user instanceof NextResponse || !user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const dbUser = await User.findOne({ huggingfaceId: user.id });

  if (!dbUser || !dbUser.githubAccessToken) {
    return NextResponse.json(
      { error: "GitHub account not connected" },
      { status: 400 }
    );
  }

  try {
    const octokit = new Octokit({ auth: dbUser.githubAccessToken });
    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
      type: "owner",
    });
    return NextResponse.json({ repos });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
