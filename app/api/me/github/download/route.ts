import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "octokit";
import { isAuthenticated } from "@/lib/auth";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  const user = await isAuthenticated();
  if (user instanceof NextResponse || !user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { repoName, owner, html } = await req.json();

  if (!repoName || !owner || !html) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
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

    const { data: refData } = await octokit.rest.git.getRef({
      owner,
      repo: repoName,
      ref: "heads/main",
    });

    const latestCommitSha = refData.object.sha;

    const { data: blobData } = await octokit.rest.git.createBlob({
      owner,
      repo: repoName,
      content: Buffer.from(html).toString("base64"),
      encoding: "base64",
    });

    const { data: treeData } = await octokit.rest.git.createTree({
      owner,
      repo: repoName,
      base_tree: latestCommitSha,
      tree: [
        {
          path: "index.html",
          mode: "100644",
          type: "blob",
          sha: blobData.sha,
        },
      ],
    });

    const { data: commitData } = await octokit.rest.git.createCommit({
      owner,
      repo: repoName,
      message: "feat: Add generated index.html from DeepSite",
      tree: treeData.sha,
      parents: [latestCommitSha],
    });

    await octokit.rest.git.updateRef({
      owner,
      repo: repoName,
      ref: "heads/main",
      sha: commitData.sha,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to download to repository" },
      { status: 500 }
    );
  }
}
