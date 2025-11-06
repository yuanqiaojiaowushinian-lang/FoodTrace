'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ethers } from 'ethers'
import FoodTraceArtifact from '@/src/abi/FoodTrace.json'

// ✅ 换成你部署后的最新 FoodTrace 合约地址
const CONTRACT_ADDRESS = '0x65F2Ef6DA88aA95C2BDfDEF00Be29bD5A6835F0b'

type Product = {
    id: bigint
    name: string
    origin: string
    location: string
    productionDate: string
    description: string
    imageUrl: string
    status: string
    owner: string
    timestamp: bigint
}

export default function ProductsPage() {
    const router = useRouter()
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)

    // 🧠 从区块链获取全部产品
    useEffect(() => {
        ;(async () => {
            try {
                if (!window.ethereum) return alert('Please install MetaMask first!')
                const provider = new ethers.BrowserProvider(window.ethereum)
                const contract = new ethers.Contract(CONTRACT_ADDRESS, FoodTraceArtifact.abi, provider)

                const list = await contract.getAllProducts()
                const parsed = list.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    origin: p.origin,
                    location: p.location,
                    productionDate: p.productionDate,
                    description: p.description,
                    imageUrl: p.imageUrl,
                    status: p.status,
                    owner: p.owner,
                    timestamp: p.timestamp
                }))

                setProducts(parsed)
            } catch (err) {
                console.error(err)
                alert('❌ Failed to load product list. Please check your contract or network.')
            } finally {
                setLoading(false)
            }
        })()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-600">
                Loading product data...
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            {/* 顶部导航栏 */}
            <header className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-800">📦 All Registered Products</h1>
                <button
                    onClick={() => router.push('/')}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                >
                    Return to Homepage
                </button>
            </header>

            {/* 产品列表 */}
            {products.length === 0 ? (
                <div className="text-center text-gray-500">
                    There are no products available. Please register a product on the main page first.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((p) => (
                        <div
                            key={p.id.toString()}
                            onClick={() => router.push(`/trace/${p.id.toString()}`)}
                            className="cursor-pointer bg-white rounded-2xl shadow-md overflow-hidden transform transition hover:scale-[1.02] hover:shadow-xl"
                        >
                            {/* 图片显示区 */}
                            {p.imageUrl ? (
                                <img
                                    src={p.imageUrl}
                                    alt={p.name}
                                    className="w-full h-52 object-cover"
                                />
                            ) : (
                                <div className="w-full h-52 bg-gray-200 flex items-center justify-center text-gray-400">
                                    No Image
                                </div>
                            )}

                            {/* 产品信息 */}
                            <div className="p-4 space-y-1 text-gray-800">
                                <h2 className="text-lg font-semibold truncate">{p.name}</h2>
                                <p className="text-sm text-gray-600 truncate">Product ID: {p.id.toString()}</p>
                                <p className="text-sm text-gray-600 truncate">Origin: {p.origin}</p>
                                <p className="text-sm text-gray-600 truncate">Location: {p.location}</p>
                                <p className="text-sm text-gray-600 truncate">Date: {p.productionDate}</p>
                                <p className="text-sm text-gray-600 truncate">Owner: {p.owner.slice(0, 6)}...{p.owner.slice(-4)}</p>
                                <p className="text-sm">
                                    Status: <span className="font-medium text-blue-600">{p.status}</span>
                                </p>
                                <p className="text-xs text-gray-400">
                                    Last Update: {new Date(Number(p.timestamp) * 1000).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
