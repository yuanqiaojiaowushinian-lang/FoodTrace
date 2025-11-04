'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ethers } from 'ethers'
import { checkConnectedAndSepolia } from '@/lib/web3'
import FoodTraceArtifact from '@/src/abi/FoodTrace.json'

// ✅ 换成你重新部署后的合约地址（带哈希+签名版本）
const CONTRACT_ADDRESS = '0x01736949e2E27394Be6b373D0071A42Faa41A162'

export default function Home() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [account, setAccount] = useState('')
  const [contract, setContract] = useState<any>(null)
  const [signer, setSigner] = useState<any>(null)

  // 注册表单字段
  const [name, setName] = useState('')
  const [origin, setOrigin] = useState('')
  const [location, setLocation] = useState('')
  const [productionDate, setProductionDate] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('') // ✅ 仅 URL
  const [password, setPassword] = useState('')

  // 连接钱包与合约
  useEffect(() => {
    ;(async () => {
      const { connected, onSepolia } = await checkConnectedAndSepolia()
      if (!connected || !onSepolia) {
        router.replace('/login')
        return
      }

      const provider = new ethers.BrowserProvider(window.ethereum!)
      const signerInstance = await provider.getSigner()
      const c = new ethers.Contract(CONTRACT_ADDRESS, FoodTraceArtifact.abi, signerInstance)
      setSigner(signerInstance)
      setContract(c)
      setAccount(await signerInstance.getAddress())

      // 监听账号或网络切换
      window.ethereum?.on?.('accountsChanged', () => router.replace('/login'))
      window.ethereum?.on?.('chainChanged', () => router.replace('/login'))
      setReady(true)
    })()
  }, [router])

  // 注册条件判断
  const canSubmitRegister = useMemo(
      () => [name, origin, location, productionDate, description, password, imageUrl].every(v => v.trim()),
      [name, origin, location, productionDate, description, password, imageUrl]
  )

  // ✅ 注册产品（自动生成哈希 + 签名）
  async function registerProduct() {
    if (!contract || !signer) return alert('❌ Wallet not connected')

    try {
      // ✅ 1️⃣ 计算哈希（保持与合约一致的字段顺序）
      const dataHash = ethers.solidityPackedKeccak256(
          ['string', 'string', 'string', 'string', 'string'],
          [name, origin, location, productionDate, description]
      )

      // ✅ 2️⃣ 生成签名（MetaMask 弹窗）
      const signature = await signer.signMessage(ethers.getBytes(dataHash))

      // ✅ 3️⃣ 调用合约注册
      const tx = await contract.registerProduct(
          name.trim(),
          origin.trim(),
          location.trim(),
          productionDate.trim(),
          description.trim(),
          imageUrl.trim(),
          signature,
          password
      )

      await tx.wait()
      alert('✅ Product registered successfully with signature!')
      setName('')
      setOrigin('')
      setLocation('')
      setProductionDate('')
      setDescription('')
      setImageUrl('')
      setPassword('')
    } catch (e: any) {
      console.error(e)
      alert('❌ Register failed: ' + (e.reason || e.message || 'Unknown error'))
    }
  }

  if (!ready)
    return (
        <div className="min-h-screen flex items-center justify-center text-gray-600">
          Checking wallet connection…
        </div>
    )

  return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* 顶部栏 */}
          <header className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">🥦 FoodTrace DApp</h1>
            <div className="flex gap-4 items-center">
              <button
                  onClick={() => router.push('/products')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                View all products
              </button>
              <div className="text-sm text-gray-600">Connected: {account}</div>
            </div>
          </header>

          {/* ✅ 注册产品 */}
          <section className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Register a product (with hash signature verification)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="border p-2 rounded" placeholder="Product Name"
                     value={name} onChange={(e) => setName(e.target.value)} />
              <input className="border p-2 rounded" placeholder="Origin"
                     value={origin} onChange={(e) => setOrigin(e.target.value)} />
              <input className="border p-2 rounded" placeholder="Location"
                     value={location} onChange={(e) => setLocation(e.target.value)} />
              <input className="border p-2 rounded"
                     placeholder="Production Date (e.g., 2025-10-08 10:00)"
                     value={productionDate} onChange={(e) => setProductionDate(e.target.value)} />
              <input className="border p-2 rounded md:col-span-2" placeholder="Description"
                     value={description} onChange={(e) => setDescription(e.target.value)} />

              {/* ✅ 图片 URL 输入框 */}
              <div className="md:col-span-2 flex flex-col">
                <label className="text-gray-700 mb-1 font-medium">Image link (URL)：</label>
                <input
                    type="text"
                    className="border p-2 rounded w-full"
                    placeholder="For example：https://i.imgur.com/abc123.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                />
                {imageUrl && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-500 mb-1">Preview：</p>
                      <img src={imageUrl} alt="preview" className="w-48 h-48 object-cover rounded-xl border" />
                    </div>
                )}
              </div>

              <input
                  className="border p-2 rounded md:col-span-2"
                  type="password"
                  placeholder="Internal Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
                disabled={!canSubmitRegister}
                onClick={registerProduct}
                className="mt-4 px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50 hover:bg-green-700"
            >
              Submit Registration
            </button>
          </section>
        </div>
      </div>
  )
}
