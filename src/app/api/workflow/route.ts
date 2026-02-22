import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const WORKFLOW_FILE = path.join(process.cwd(), "src", "data", "workflow.md");

export async function GET() {
  try {
    const workflowData = await fs.readFile(WORKFLOW_FILE, "utf8");
    return NextResponse.json({ 
      success: true, 
      data: workflowData,
      lastModified: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to read workflow file:", error);
    return NextResponse.json(
      { success: false, error: "ワークフロー図の読み込みに失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json();
    
    if (typeof data !== "string") {
      return NextResponse.json(
        { success: false, error: "無効なデータ形式です" },
        { status: 400 }
      );
    }

    await fs.writeFile(WORKFLOW_FILE, data, "utf8");
    
    return NextResponse.json({ 
      success: true, 
      message: "ワークフロー図を保存しました",
      lastModified: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to save workflow file:", error);
    return NextResponse.json(
      { success: false, error: "ワークフロー図の保存に失敗しました" },
      { status: 500 }
    );
  }
}