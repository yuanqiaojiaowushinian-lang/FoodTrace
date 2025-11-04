import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // ✅ 正确写法：把 turbopack 放到顶层，而不是 experimental 里
    turbopack: {
        // 让 Next.js 识别当前 frontend 文件夹为项目根目录
        root: __dirname,
    },
};

export default nextConfig;
