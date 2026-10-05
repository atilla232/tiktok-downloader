import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url || !url.includes('tiktok.com')) {
      return NextResponse.json(
        { error: 'URL TikTok tidak valid. Pastikan format link benar.' },
        { status: 400 }
      );
    }

    // --- ENGINE 1: TikWM dengan Anti-Block Headers ---
    try {
      const response1 = await fetch('https://www.tikwm.com/api/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          'Referer': 'https://www.tikwm.com/',
          'Origin': 'https://www.tikwm.com',
        },
        body: new URLSearchParams({ url, hd: '1' }),
        cache: 'no-store',
      });

      const resText1 = await response1.text();
      let result1;
      try {
        result1 = JSON.parse(resText1);
      } catch (e) {
        result1 = null;
      }

      if (result1 && result1.code === 0 && result1.data) {
        const data = result1.data;
        const baseUrl = 'https://www.tikwm.com';
        
        return NextResponse.json({
          success: true,
          title: data.title || 'TikTok Video',
          author: {
            nickname: data.author?.nickname || 'Unknown',
            unique_id: data.author?.unique_id || 'user',
            avatar: data.author?.avatar ? (data.author.avatar.startsWith('http') ? data.author.avatar : `${baseUrl}${data.author.avatar}`) : '',
          },
          cover: data.cover ? (data.cover.startsWith('http') ? data.cover : `${baseUrl}${data.cover}`) : '',
          downloads: {
            no_watermark: data.play ? (data.play.startsWith('http') ? data.play : `${baseUrl}${data.play}`) : null,
            hd_no_watermark: data.hdplay ? (data.hdplay.startsWith('http') ? data.hdplay : `${baseUrl}${data.hdplay}`) : (data.play ? (data.play.startsWith('http') ? data.play : `${baseUrl}${data.play}`) : null),
            music_mp3: data.music ? (data.music.startsWith('http') ? data.music : `${baseUrl}${data.music}`) : null,
          },
        });
      }
    } catch (err1) {
      console.log('Engine 1 gagal, beralih ke Engine 2...', err1);
    }

    // --- ENGINE 2: Fallback Engine (Worker CDN) ---
    try {
      const response2 = await fetch(`https://tdownv4.sl-bjs.workers.dev/?down=${encodeURIComponent(url)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        cache: 'no-store',
      });

      const data2 = await response2.json();
      const item = data2.data || data2;

      if (item && (item.play || item.video)) {
        return NextResponse.json({
          success: true,
          title: item.title || 'TikTok Video',
          author: {
            nickname: item.author?.nickname || item.author || 'User',
            unique_id: item.author?.unique_id || 'user',
            avatar: item.author?.avatar || '',
          },
          cover: item.cover || item.origin_cover || '',
          downloads: {
            no_watermark: item.play || item.video,
            hd_no_watermark: item.hdplay || item.play || item.video,
            music_mp3: item.music || item.audio,
          },
        });
      }
    } catch (err2) {
      console.log('Engine 2 gagal...', err2);
    }

    // Jika kedua engine gagal/dibatasi
    return NextResponse.json(
      { error: 'Gagal mengambil video. TikTok sedang membatasi akses server. Silakan coba link lain atau beberapa saat lagi.' },
      { status: 400 }
    );

  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem internal.' },
      { status: 500 }
    );
  }
}
