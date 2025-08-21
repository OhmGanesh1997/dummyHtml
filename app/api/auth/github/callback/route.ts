import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "octokit";

import { isAuthenticated } from "@/lib/auth";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  const user = await isAuthenticated();
  if (user instanceof NextResponse || !user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json(
      { error: "No code provided" },
      { status: 400 }
    );
  }

  const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "GitHub client ID or secret not set" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
        }),
      }
    );

    const data = await response.json();
    if (data.error) {
      return NextResponse.json({ error: data.error_description }, { status: 400 });
    }

    const accessToken = data.access_token;
    const octokit = new Octokit({ auth: accessToken });
    await octokit.rest.users.getAuthenticated();

    await dbConnect();
    await User.findOneAndUpdate(
      { huggingfaceId: user.id },
      {
        huggingfaceId: user.id,
        githubAccessToken: accessToken,
      },
      { upsert: true, new: true }
    );

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <script>
            window.opener.postMessage("github_auth_success", "${process.env.NEXT_PUBLIC_APP_URL}");
            window.close();
          </script>
        </head>
        <body>
          <p>Authentication successful! You can now close this window.</p>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });

  } catch (error) {
    console.error(error);
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <script>
            window.close();
          </script>
        </head>
        <body>
          <p>An error occurred during authentication. Please try again.</p>
        </body>
      </html>
    `;
    return new NextResponse(html, {
        headers: {
            "Content-Type": "text/html",
        },
        status: 500,
    });
  }
}
