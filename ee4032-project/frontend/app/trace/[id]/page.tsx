'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ethers } from 'ethers'
import FoodTraceArtifact from '@/src/abi/FoodTrace.json'

const CONTRACT_ADDRESS = '0x66D5BCe2132b1163CEBB3Bca660a06C2a7294501' // ✅ 最新部署地址

export default function TracePage() {
  const { id } = useParams()
  const router = useRouter()
  const [contract, setContract] = useState<any>(null)
  const [product, setProduct] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [newStatus, setNewStatus] = useState('')
  const [newImageUrl, setNewImageUrl] = useState('')
  const [loading, setLoading] = useState(true)

  // 🟢 初始化合约
  useEffect(() => {
    ;(async () => {
      if (!window.ethereum) return alert('Please install MetaMask first.')
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const c = new ethers.Contract(CONTRACT_ADDRESS, FoodTraceArtifact.abi, signer)
      setContract(c)
    })()
  }, [])

  // 🟢 加载产品信息 + 历史记录
  async function loadProduct() {
    if (!contract) return
    try {
      const pid = Array.isArray(id) ? id[0] : id!
      const p = await contract.getProduct(pid)
      setProduct(p)

      if (contract.getProductHistory) {
        const h = await contract.getProductHistory(pid)
        setHistory(h)
      }
    } catch (e) {
      console.error(e)
      alert('❌ Product information loading failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (contract) {
      ;(async () => {
        await loadProduct()
      })()
    }
  }, [contract])

  // 🟠 更新状态（可选图片）
  async function handleUpdate() {
    if (!contract) return alert('Wallet not connected')
    if (!newStatus.trim()) return alert('Please enter new status.')

    const pid = Array.isArray(id) ? id[0] : id!
    try {
      const tx = await contract.updateStatus(
          BigInt(pid),
          newStatus.trim(),
          newImageUrl.trim()
      )
      await tx.wait()
      alert('✅ Status updated successfully!')
      setNewStatus('')
      setNewImageUrl('')
      await loadProduct()
    } catch (e: any) {
      console.error(e)
      alert(`❌ Update failed: ${e.reason || e.message}`)
    }
  }

  // ✅ 验证哈希与签名
  async function handleVerify() {
    if (!contract || !product) return alert('No product loaded')

    const pid = Array.isArray(id) ? id[0] : id!
    try {
      // ✅ ⚠️ 现在 verifyProductData 不再包含 imageUrl 参数
      const [hashOk, sigOk] = await Promise.all([
        contract.verifyProductData(
            BigInt(pid),
            product.name,
            product.origin,
            product.location,
            product.productionDate,
            product.description
        ),
        contract.verifySignature(BigInt(pid))
      ])

      if (hashOk && sigOk) {
        alert('✅ Verification passed: Data & signature both valid.')
      } else if (!hashOk && sigOk) {
        alert('⚠️ Data hash mismatch — product details may have been altered!')
      } else if (hashOk && !sigOk) {
        alert('⚠️ Signature invalid — product not signed by owner!')
      } else {
        alert('❌ Both data and signature verification failed!')
      }
    } catch (e: any) {
      console.error(e)
      alert('❌ Verification failed: ' + (e.reason || e.message))
    }
  }

  if (loading || !product) {
    return (
        <div className="min-h-screen flex items-center justify-center text-gray-500">
          Loading product details...
        </div>
    )
  }

  return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-md">
          <button
              onClick={() => router.push('/products')}
              className="text-blue-600 text-sm mb-3 hover:underline"
          >
            ← Return to product list
          </button>

          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          {product.imageUrl && (
              <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-64 object-cover rounded-lg mb-4 border"
              />
          )}

          {/* 产品信息 */}
          <div className="space-y-2 text-gray-800">
            <p><b>ID:</b> {product.id.toString()}</p>
            <p><b>Origin:</b> {product.origin}</p>
            <p><b>Location:</b> {product.location}</p>
            <p><b>Production Date:</b> {product.productionDate}</p>
            <p><b>Description:</b> {product.description}</p>
            <p><b>Status:</b> {product.status}</p>
            <p><b>Owner:</b> {product.owner}</p>
            <p>
              <b>Data Hash:</b>{' '}
              <span className="text-xs break-all text-gray-600">
              {product.dataHash}
            </span>
            </p>
            <p className="text-sm text-gray-500">
              Last Updated: {new Date(Number(product.timestamp) * 1000).toLocaleString()}
            </p>
          </div>

          {/* 验证签名按钮 */}
          <div className="mt-4">
            <button
                onClick={handleVerify}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Verify Data Hash & Signature
            </button>
          </div>

          {/* 状态更新 */}
          <div className="mt-8 border-t pt-6">
            <h2 className="text-xl font-semibold mb-3">Update Product Status</h2>
            <div className="grid grid-cols-1 gap-3">
              <input
                  className="border p-2 rounded"
                  placeholder="New Status (e.g., Shipped)"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
              />
              <input
                  className="border p-2 rounded"
                  placeholder="Image URL (optional)"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
              />
              <button
                  onClick={handleUpdate}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Submit Update
              </button>
            </div>
          </div>

          {/* 📜 历史时间线 */}
          <h2 className="text-2xl font-semibold mt-8 mb-4">
            📜 Product Status Timeline
          </h2>
          <div className="relative border-l-2 border-gray-300 ml-3">
            {history.length === 0 ? (
                <p className="ml-4 text-gray-500">No historical records available.</p>
            ) : (
                [...history].reverse().map((h, i) => (
                    <div key={i} className="ml-6 mb-6 relative">
                      <div className="absolute -left-3 top-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                        <p className="font-semibold text-gray-800">
                          Status: <span className="text-green-700">{h.status}</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          Time: {new Date(Number(h.timestamp) * 1000).toLocaleString()}
                        </p>
                        {h.imageUrl && (
                            <img
                                src={h.imageUrl}
                                alt="Status Image"
                                className="mt-2 w-48 h-48 object-cover rounded-lg border"
                            />
                        )}
                      </div>
                    </div>
                ))
            )}
          </div>
        </div>
      </div>
  )
}
