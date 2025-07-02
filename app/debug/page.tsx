import { getUser, getCustomerState, getUserUsageData } from '@/lib/auth/server'
import { redirect } from 'next/navigation'

export default async function DebugPage() {
  const user = await getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch all user-related data from Polar
  const [customerState, usageData] = await Promise.all([
    getCustomerState(),
    getUserUsageData()
  ])

  const debugData = {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      polar_customer_id: user.polar_customer_id
    },
    polar: {
      customerState,
      usageData
    },
    timestamp: new Date().toISOString()
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Debug - User Polar Data</h1>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">User Information</h2>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
            {JSON.stringify(debugData.user, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Polar Customer State</h2>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
            {JSON.stringify(debugData.polar.customerState, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Usage Data</h2>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
            {JSON.stringify(debugData.polar.usageData, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Complete Debug Data</h2>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
            {JSON.stringify(debugData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}