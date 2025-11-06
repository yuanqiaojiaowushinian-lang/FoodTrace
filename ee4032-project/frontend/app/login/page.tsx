'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import { connectWalletAndEnsureSepolia } from '@/lib/web3';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMsg, setModalMsg] = useState('');

    // 背景音乐
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.4); // 0~1

    // 初始：静音自动播放；首次交互后自动取消静音并继续播放
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.volume = volume;        // 设置初始音量
        audio.muted = true;           // 允许自动播放
        const tryAutoplay = async () => {
            try {
                await audio.play();
                setIsPlaying(true);
            } catch {
                // 部分设备仍可能阻止，但不报错让用户交互后再放
            }
        };
        tryAutoplay();

        const unlock = async () => {
            try {
                if (!audio) return;
                audio.muted = false;
                audio.volume = volume;
                if (audio.paused) await audio.play();
                setIsPlaying(!audio.paused);
            } catch {/* 忽略 */}
            // 只需要一次
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
        };

        // 任意一次用户交互→取消静音
        window.addEventListener('pointerdown', unlock, { once: true });
        window.addEventListener('keydown', unlock, { once: true });

        // 标签页切换时，回到前台自动恢复播放
        const onVis = async () => {
            if (document.visibilityState === 'visible' && audio && !audio.muted) {
                try { if (audio.paused) await audio.play(); setIsPlaying(!audio.paused); } catch {}
            }
        };
        document.addEventListener('visibilitychange', onVis);

        // 卸载/跳转时，暂停音乐
        return () => {
            document.removeEventListener('visibilitychange', onVis);
            try { audio.pause(); } catch {}
        };
    }, []); // 仅初始化一次

    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume;
    }, [volume]);

    async function handleConnect() {
        setLoading(true);
        try {
            await connectWalletAndEnsureSepolia();
            router.replace('/'); // 成功→主页
        } catch (err: any) {
            const message = err?.code === 4001 ? 'You canceled the connection request.' : err?.message || 'Connection failed, please try again.';
            setModalMsg(message);
            setModalOpen(true);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
            {/* 背景插图（页面上“镶嵌”分布） */}
            <Image
                src="/images/watermelon.png"     // 放到 public/images/watermelon.png
                alt="watermelon"
                width={160}
                height={160}
                className="select-none pointer-events-none absolute left-130 bottom-30 opacity-70 animate-[float_6s_ease-in-out_infinite]"
            />
            <Image
                src="/images/nangua.png"     // 放到 public/images/nangua.png
                alt="nangua"
                width={160}
                height={160}
                className="select-none pointer-events-none absolute left-170 bottom-30 opacity-70 animate-[float_6s_ease-in-out_infinite]"
            />
            <Image
                src="/images/tomato.png"   // 放到 public/images/tomato.png
                alt="tomato"
                width={140}
                height={140}
                className="select-none pointer-events-none absolute right-130 bottom-30 opacity-80 animate-[float_7s_ease-in-out_infinite]"
            />
            <Image
                src="/images/login.png"   // 放到 public/images/login.png
                alt="login"
                width={500}
                height={500}
                className="select-none pointer-events-none absolute right-152 top-10 opacity-80 animate-[float_7s_ease-in-out_infinite]"
            />
            <Image
                src="/images/left.png"   // 放到 public/images/left.png
                alt="left"
                width={450}
                height={300}
                className="select-none pointer-events-none absolute left-0 top-10 opacity-80 animate-[float_7s_ease-in-out_infinite]"
            />
            <Image
                src="/images/right.png"   // 放到 public/images/right.png
                alt="right"
                width={450}
                height={300}
                className="select-none pointer-events-none absolute right-0 top-10 opacity-80 animate-[float_7s_ease-in-out_infinite]"
            />
            <Image
                src="/images/carrot.png"   // 放到 public/images/carrot.png
                alt="carrot"
                width={120}
                height={120}
                className="select-none pointer-events-none absolute left-220 bottom-30 rotate-12 opacity-80 animate-[float_8s_ease-in-out_infinite]"
            />
            <Image
                src="/images/basket.png"   // 放到 public/images/basket.png
                alt="basket"
                width={220}
                height={220}
                className="select-none pointer-events-none absolute right-50 bottom-20 opacity-70 animate-[float_9s_ease-in-out_infinite]"
            />

            {/* 登录卡片 */}
            <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
                <div className="w-full max-w-md rounded-2xl bg-white/70 backdrop-blur-xl shadow-2xl ring-1 ring-black/5 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Image src="/images/logo.png" alt="logo" width={40} height={40} /> {/* 可选：public/images/logo.png */}
                        <h1 className="text-2xl font-bold">Log in to FoodTrace</h1>
                    </div>

                    <p className="text-gray-600 mb-6">
                        Please connect to MetaMask and ensure the network is the <b>Sepolia</b> test network.
                    </p>

                    <button
                        onClick={handleConnect}
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-black text-white hover:bg-gray-800 disabled:opacity-60"
                    >
                        {loading ? '连接中…' : '连接 MetaMask'}
                    </button>

                    {/* 音乐控制（自动播放，提供音量滑块） */}
                    <div className="mt-6 flex items-center justify-between gap-4">
                        <span className="text-sm text-gray-600">Background music</span>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={volume}
                            onChange={(e) => setVolume(Number(e.target.value))}
                            className="w-40 accent-emerald-600"
                            aria-label="music volume"
                            title="音量"
                        />
                        <span className="text-xs text-gray-500 w-12 text-right">
              {Math.round(volume * 100)}%
            </span>
                    </div>

                    {/* 隐藏的 audio 元素：静音自动播放，循环 */}
                    <audio ref={audioRef} src="/audio/bg.mp3" autoPlay loop preload="auto" />
                </div>
            </div>

            {/* 浮动动画 */}
            <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px) }
          50% { transform: translateY(-10px) }
          100% { transform: translateY(0px) }
        }
      `}</style>

            <Modal open={modalOpen} title="提示" message={modalMsg} onClose={() => setModalOpen(false)} />
        </div>
    );
}

