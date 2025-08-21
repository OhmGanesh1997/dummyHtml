import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";

export async function GET() {
  const user = await isAuthenticated();
  if (user instanceof NextResponse || !user) {
    return NextResponse.json({ connected: false });
  }

  await dbConnect();
  const dbUser = await User.findOne({ huggingfaceId: user.id });

  if (!dbUser || !dbUser.githubAccessToken) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({ connected: true });
}
