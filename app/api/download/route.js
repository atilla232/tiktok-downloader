import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url || !url.includes("tiktok.com")) {
      return NextResponse.json(
        { error: "URL TikTok tidak valid. Pastikan format link benar." },
        { status: 400 },
      );
    }

    // Mengambil data dari engine TikWM API
    const response = await fetch("https://www.tikwm.com/api/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: new URLSearchParams({
        url: url,
        hd: "1",
      }),
    });

    const result = await response.json();

    if (result.code !== 0 || !result.data) {
      return NextResponse.json(
        {
          error:
            "Gagal mengambil data video. Pastikan akun/video tidak diprivate.",
        },
        { status: 400 },
      );
    }

    const data = result.data;
    const baseUrl = "https://www.tikwm.com";

    return NextResponse.json({
      success: true,
      title: data.title || "TikTok Video",
      author: {
        nickname: data.author?.nickname || "Unknown",
        unique_id: data.author?.unique_id || "user",
        avatar: data.author?.avatar
          ? data.author.avatar.startsWith("http")
            ? data.author.avatar
            : `${baseUrl}${data.author.avatar}`
          : "",
      },
      cover: data.cover
        ? data.cover.startsWith("http")
          ? data.cover
          : `${baseUrl}${data.cover}`
        : "",
      downloads: {
        no_watermark: data.play
          ? data.play.startsWith("http")
            ? data.play
            : `${baseUrl}${data.play}`
          : null,
        hd_no_watermark: data.hdplay
          ? data.hdplay.startsWith("http")
            ? data.hdplay
            : `${baseUrl}${data.hdplay}`
          : data.play
            ? data.play.startsWith("http")
              ? data.play
              : `${baseUrl}${data.play}`
            : null,
        music_mp3: data.music
          ? data.music.startsWith("http")
            ? data.music
            : `${baseUrl}${data.music}`
          : null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server. Coba lagi nanti." },
      { status: 500 },
    );
  }
}
