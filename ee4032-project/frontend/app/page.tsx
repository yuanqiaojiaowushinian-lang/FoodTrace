'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ethers } from 'ethers'
import { checkConnectedAndSepolia } from '@/lib/web3'
import FoodTraceArtifact from '@/src/abi/FoodTrace.json'

// ✅ 换成你部署的最新 FoodTrace 合约地址
const CONTRACT_ADDRESS = '0x65F2Ef6DA88aA95C2BDfDEF00Be29bD5A6835F0b'

export default function Home() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [account, setAccount] = useState('')
  const [contract, setContract] = useState<any>(null)
  const [signer, setSigner] = useState<any>(null)

  // 表单字段
  const [name, setName] = useState('')
  const [origin, setOrigin] = useState('')
  const [location, setLocation] = useState('')
  const [productionDate, setProductionDate] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [password, setPassword] = useState('')
  const [salt, setSalt] = useState('')

  // 上传状态
  const [committedHash, setCommittedHash] = useState<string | null>(null)

  // 🪙 钱包连接
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

      window.ethereum?.on?.('accountsChanged', () => router.replace('/login'))
      window.ethereum?.on?.('chainChanged', () => router.replace('/login'))
      setReady(true)
    })()
  }, [router])

  // 🧩 检查链上是否已有 commit（刷新后可直接 reveal）
  useEffect(() => {
    (async () => {
      if (!contract || !account) return
      try {
        const existingCommit = await contract.commits(account)
        if (existingCommit && existingCommit !== ethers.ZeroHash) {
          setCommittedHash(existingCommit)
          console.log('✅ Found existing commit on-chain:', existingCommit)
        }
      } catch (e) {
        console.error('❌ Failed to check existing commit:', e)
      }
    })()
  }, [contract, account])

  // 📄 解析 txt 文件并自动填充
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const lines = text.split('\n').map((l) => l.trim())
    const data: any = {}
    lines.forEach((line) => {
      const [key, ...rest] = line.split(':')
      data[key.trim()] = rest.join(':').trim()
    })
    setName(data.name || '')
    setOrigin(data.origin || '')
    setLocation(data.location || '')
    setProductionDate(data.productionDate || '')
    setDescription(data.description || '')
    setSalt(data.salt || ethers.hexlify(ethers.randomBytes(8)))
  }

  // 注册按钮可用条件
  const canSubmitRegister = useMemo(
      () => [name, origin, location, productionDate, description, password, imageUrl].every((v) => v.trim()),
      [name, origin, location, productionDate, description, password, imageUrl]
  )

  // ✅ 阶段1：Commit（提交哈希）
  async function commitHash() {
    if (!contract || !signer) return alert('❌ Wallet not connected')

    try {
      const usedSalt = salt || ethers.hexlify(ethers.randomBytes(8))
      setSalt(usedSalt)

      const commitHash = ethers.solidityPackedKeccak256(
          ['string', 'string', 'string', 'string', 'string', 'string'],
          [name, origin, location, productionDate, description, usedSalt]
      )

      const tx = await contract.commitProductHash(commitHash)
      await tx.wait()

      setCommittedHash(commitHash)
      alert('✅ Hash committed successfully! You can now reveal & register.')
    } catch (e: any) {
      console.error(e)
      alert('❌ Commit failed: ' + (e.reason || e.message || 'Unknown error'))
    }
  }

  // ✅ 阶段2：Register（揭示并上架）
  async function registerProduct() {
    if (!contract || !signer) return alert('❌ Wallet not connected')
    if (!committedHash) return alert('❌ Please commit the hash first.')

    try {
      const dataHash = ethers.solidityPackedKeccak256(
          ['string', 'string', 'string', 'string', 'string', 'string'],
          [name, origin, location, productionDate, description, salt]
      )

      const signature = await signer.signMessage(ethers.getBytes(dataHash))

      const tx = await contract.registerProduct(
          name.trim(),
          origin.trim(),
          location.trim(),
          productionDate.trim(),
          description.trim(),
          imageUrl.trim(),
          signature,
          password.trim(),
          salt
      )

      await tx.wait()
      alert('✅ Product successfully registered & revealed!')

      // 重置表单
      setName('')
      setOrigin('')
      setLocation('')
      setProductionDate('')
      setDescription('')
      setImageUrl('')
      setPassword('')
      setSalt('')
      setCommittedHash(null)
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
            <h1 className="text-3xl font-bold">🥦 FoodTrace DApp (Commit–Reveal Edition)</h1>
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

          {/* 主体部分 */}
          <section className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Product Registration (Commit–Reveal Workflow)
            </h2>

            {/* Upload TXT file */}
            <div className="mb-4">
              <label className="font-medium text-gray-700">Upload product .txt file:</label>
              <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="block mt-1 border p-2 rounded w-full"
              />
            </div>

            {/* 表单 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="border p-2 rounded" placeholder="Product Name"
                     value={name} onChange={(e) => setName(e.target.value)} />
              <input className="border p-2 rounded" placeholder="Origin"
                     value={origin} onChange={(e) => setOrigin(e.target.value)} />
              <input className="border p-2 rounded" placeholder="Location"
                     value={location} onChange={(e) => setLocation(e.target.value)} />
              <input className="border p-2 rounded"
                     placeholder="Production Date (e.g. 2025-11-06)"
                     value={productionDate} onChange={(e) => setProductionDate(e.target.value)} />
              <input className="border p-2 rounded md:col-span-2" placeholder="Description"
                     value={description} onChange={(e) => setDescription(e.target.value)} />

              {/* 图片预览 */}
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
                      <img src={imageUrl} alt="preview"
                           className="w-48 h-48 object-cover rounded-xl border" />
                    </div>
                )}
              </div>

              {/* salt 与密码 */}
              <input className="border p-2 rounded" placeholder="Salt (auto-generated)"
                     value={salt} onChange={(e) => setSalt(e.target.value)} />
              <input className="border p-2 rounded"
                     type="password"
                     placeholder="Internal Password"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)} />
            </div>

            {/* 按钮区 */}
            <div className="flex gap-3 mt-4">
              <button
                  onClick={commitHash}
                  disabled={!canSubmitRegister}
                  className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700"
              >
                1️⃣ Commit Product Hash
              </button>

              <button
                  onClick={registerProduct}
                  disabled={!committedHash}
                  className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50 hover:bg-green-700"
              >
                2️⃣ Reveal & Register Product
              </button>
            </div>

            {/* 状态展示 */}
            {committedHash ? (
                <p className="mt-3 text-sm text-green-700 break-all">
                  ✅ Existing on-chain commit detected: <br />
                  <span className="font-mono">{committedHash}</span>
                </p>
            ) : (
                <p className="mt-3 text-sm text-gray-500">
                  ℹ️ No on-chain commit found yet. Please upload and commit your product first.
                </p>
            )}
          </section>
        </div>
      </div>
  )
}
