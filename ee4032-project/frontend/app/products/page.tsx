'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ethers } from 'ethers'
import FoodTraceArtifact from '@/src/abi/FoodTrace.json'

const CONTRACT_ADDRESS = '0x66D5BCe2132b1163CEBB3Bca660a06C2a7294501' // ✅ 替换成最新部署地址

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
            <header className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-800">📦 All registered products</h1>
                <button
                    onClick={() => router.push('/')}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                >
                    Return to homepage
                </button>
            </header>

            {products.length === 0 ? (
                <div className="text-center text-gray-500">There are no products available. Please register on the main page first.</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((p) => (
                        <div
                            key={p.id.toString()}
                            onClick={() => router.push(`/trace/${p.id.toString()}`)}
                            className="cursor-pointer bg-white rounded-2xl shadow-md overflow-hidden transform transition hover:scale-[1.02] hover:shadow-xl"
                        >
                            {p.imageUrl ? (
                                <img
                                    src={p.imageUrl}
                                    alt={p.name}
                                    className="w-full h-52 object-cover"
                                />
                            ) : (
                                <div className="w-full h-52 bg-gray-200 flex items-center justify-center text-gray-400">
                                    无图片
                                </div>
                            )}

                            <div className="p-4 space-y-1 text-gray-800">
                                <h2 className="text-lg font-semibold truncate">{p.name}</h2>
                                <p className="text-sm text-gray-600 truncate">ID：{p.id.toString()}</p>
                                <p className="text-sm text-gray-600 truncate">Place of origin:Place of origin:{p.origin}</p>
                                <p className="text-sm text-gray-600 truncate">Location:{p.location}</p>
                                <p className="text-sm text-gray-600 truncate">Production date:{p.productionDate}</p>
                                <p className="text-sm">
                                    State:
                                    <span className="font-medium text-blue-600">{p.status}</span>
                                </p>
                                <p className="text-xs text-gray-400">
                                    Update time:{new Date(Number(p.timestamp) * 1000).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
