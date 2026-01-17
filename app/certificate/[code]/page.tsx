// app/certificate/verify/[code]/page.tsx
import { createClient } from '@/lib/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, Calendar, Award, User, BookOpen } from 'lucide-react'

interface CertificateVerificationPageProps {
  params: { code: string }
}

export default async function CertificateVerificationPage({ 
  params 
}: CertificateVerificationPageProps) {
  const supabase = await createClient()
  const certificateCode = decodeURIComponent(params.code)

  // Fetch certificate details
  const { data: certificate } = await supabase
    .from('certificates')
    .select(`
      *,
      profiles:user_id (
        username,
        email
      ),
      courses:course_id (
        title,
        description,
        order_index
      )
    `)
    .eq('certificate_code', certificateCode)
    .single()

  if (!certificate) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-6 h-6" />
              Certificate Not Found
            </CardTitle>
            <CardDescription>
              The certificate you are looking for does not exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Certificate Code: <code className="bg-slate-100 px-2 py-1 rounded">{certificateCode}</code>
            </p>
            <div className="text-center">
              <p className="text-slate-500">
                Please verify the certificate code and try again.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-2 border-green-200 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-6 h-6" />
                Certificate Verified
              </CardTitle>
              <CardDescription>
                This certificate has been verified and is authentic
              </CardDescription>
            </div>
            <Badge className="bg-green-100 text-green-700 border-green-300">
              <CheckCircle className="w-3 h-3 mr-1" />
              Valid
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-8">
          <div className="space-y-8">
            {/* Certificate Header */}
            <div className="text-center border-b-2 border-green-200 pb-6">
              <div className="text-5xl text-amber-500 mb-2">🏆</div>
              <h1 className="text-3xl font-black text-slate-800 mb-2">
                Certificate of Completion
              </h1>
              <p className="text-slate-600">This certifies that</p>
            </div>

            {/* Student Information */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                {certificate.profiles?.username || 'Student Name'}
              </h2>
              <p className="text-slate-600 mb-4">has successfully completed the course</p>
              <h3 className="text-xl font-bold text-green-700 mb-8">
                {certificate.courses?.title || 'Course Title'}
              </h3>
            </div>

            {/* Certificate Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <User className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-500">Student</p>
                    <p className="font-semibold">{certificate.profiles?.username}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <BookOpen className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-500">Course</p>
                    <p className="font-semibold">{certificate.courses?.title}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-500">Issued On</p>
                    <p className="font-semibold">{formatDate(certificate.issued_at)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Award className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-500">Certificate ID</p>
                    <p className="font-mono text-sm font-semibold">{certificate.certificate_code}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Note */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-green-800 font-medium mb-1">
                    This certificate is verified and authentic
                  </p>
                  <p className="text-green-700 text-sm">
                    The certificate was issued by the official learning platform and has been 
                    verified through our secure validation system.
                  </p>
                </div>
              </div>
            </div>

            {/* Share URL */}
            <div className="text-center">
              <p className="text-sm text-slate-500 mb-2">
                Share this verification link:
              </p>
              <code className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm break-all">
                {`https://your-domain.com/certificate/verify/${certificate.certificate_code}`}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}