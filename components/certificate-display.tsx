// components/certificate-display.tsx
"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Award, Download, Share2, CheckCircle, Calendar, FileText, Shield, Star } from 'lucide-react'

interface CertificateDisplayProps {
  courseId: string
  courseTitle: string
  userId: string
  onCertificateGenerated?: (certificate: any) => void
}

export default function CertificateDisplay({ 
  courseId, 
  courseTitle,
  userId,
  onCertificateGenerated 
}: CertificateDisplayProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [certificate, setCertificate] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const generateCertificate = async () => {
    setIsGenerating(true)
    setError(null)
    
    try {
      console.log('Generating certificate for course:', courseId)
      
      const response = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      })

      console.log('Response status:', response.status)

      const data = await response.json()
      console.log('Response data:', data)

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to generate certificate')
      }

      setCertificate(data)
      onCertificateGenerated?.(data)

    } catch (error: any) {
      console.error('Certificate generation error:', error)
      setError(error.message || 'Failed to generate certificate. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadCertificate = () => {
    if (!certificate?.pdfBase64) return

    const byteCharacters = atob(certificate.pdfBase64)
    const byteNumbers = new Array(byteCharacters.length)
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'application/pdf' })
    
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Certificate-${courseTitle.replace(/\s+/g, '-')}-${certificate.certificateCode}.pdf`
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const shareCertificate = async () => {
    if (!certificate) return

    if (navigator.share) {
      try {
        const byteCharacters = atob(certificate.pdfBase64)
        const byteNumbers = new Array(byteCharacters.length)
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'application/pdf' })
        const file = new File([blob], `Certificate-${certificate.certificateCode}.pdf`, { type: 'application/pdf' })

        await navigator.share({
          title: `My ${courseTitle} Certificate`,
          text: `I just completed ${courseTitle}! Certificate: ${certificate.certificateCode}`,
          files: [file]
        })
      } catch (error) {
        console.error('Error sharing certificate:', error)
      }
    } else {
      navigator.clipboard.writeText(`I completed ${courseTitle}! Certificate ID: ${certificate.certificateCode}`)
      alert('Certificate code copied to clipboard!')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Card className="border-2 border-[#E5E5E5] shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-[#FAA918] to-[#FAA918]/80 text-white pb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Award className="w-7 h-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white">Certificate of Completion</CardTitle>
              <CardDescription className="text-white/90">Official Course Certification</CardDescription>
            </div>
          </div>
          {certificate && (
            <Shield className="w-8 h-8 text-white/80" />
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {error && (
          <div className="p-4 bg-[#D33131]/10 border-2 border-[#D33131] rounded-xl">
            <p className="text-[#D33131] font-medium">{error}</p>
            {error.includes('not completed') && (
              <p className="text-[#D33131]/80 text-sm mt-2">
                Complete all lessons to unlock your certificate
              </p>
            )}
          </div>
        )}

        {certificate ? (
          <div className="space-y-6">
            {/* Professional Certificate Preview */}
            <div className="relative bg-gradient-to-br from-white via-[#F5F5F5] to-white rounded-2xl border-4 border-[#FAA918] p-8 shadow-2xl overflow-hidden">
              {/* Decorative corners */}
              <div className="absolute top-0 left-0 w-20 h-20 border-t-4 border-l-4 border-[#FAA918]/30"></div>
              <div className="absolute top-0 right-0 w-20 h-20 border-t-4 border-r-4 border-[#FAA918]/30"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 border-b-4 border-l-4 border-[#FAA918]/30"></div>
              <div className="absolute bottom-0 right-0 w-20 h-20 border-b-4 border-r-4 border-[#FAA918]/30"></div>
              
              {/* Gold Badge */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-[#FAA918] to-[#FAA918]/70 rounded-full flex items-center justify-center shadow-lg">
                    <Star className="w-12 h-12 text-white fill-white" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#58CC02] rounded-full flex items-center justify-center border-2 border-white shadow-md">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>

              {/* Certificate Header */}
              <div className="text-center mb-6">
                <h3 className="text-3xl font-black text-[#2B70C9] mb-2 tracking-tight">
                  CERTIFICATE OF ACHIEVEMENT
                </h3>
                <div className="h-1 w-32 bg-gradient-to-r from-transparent via-[#FAA918] to-transparent mx-auto"></div>
              </div>

              {/* Recipient */}
              <div className="text-center mb-6">
                <p className="text-[#6F6F6F] text-sm uppercase tracking-widest mb-2">This certifies that</p>
                <div className="bg-[#1CB0F6]/5 border-2 border-[#1CB0F6] rounded-xl px-6 py-4 inline-block">
                  <h4 className="text-2xl font-bold text-[#2B70C9]">
                    {certificate.student || 'Student Name'}
                  </h4>
                </div>
              </div>

              {/* Course Name */}
              <div className="text-center mb-6">
                <p className="text-[#6F6F6F] text-sm mb-2">has successfully completed the course</p>
                <h5 className="text-xl font-bold text-[#FAA918]">
                  {certificate.course || courseTitle}
                </h5>
              </div>

              {/* Certificate Details */}
              <div className="grid grid-cols-2 gap-6 mt-8 pt-6 border-t-2 border-[#E5E5E5]">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center gap-2 text-[#6F6F6F] mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wide">Date Issued</span>
                  </div>
                  <p className="font-bold text-[#2B70C9]">
                    {formatDate(certificate.issuedAt)}
                  </p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center gap-2 text-[#6F6F6F] mb-2">
                    <FileText className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wide">Certificate ID</span>
                  </div>
                  <p className="font-mono text-sm font-bold text-[#2B70C9]">
                    {certificate.certificateCode}
                  </p>
                </div>
              </div>

              {/* Signature Line */}
              <div className="mt-8 pt-6 border-t border-[#E5E5E5]">
                <div className="flex justify-center">
                  <div className="text-center">
                    <div className="w-48 border-t-2 border-[#2B70C9] mb-2"></div>
                    <p className="text-xs text-[#6F6F6F] font-medium">Authorized Signature</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Status */}
            <div className="flex items-center gap-3 p-4 bg-[#58CC02]/10 rounded-xl border-2 border-[#58CC02]">
              <div className="w-10 h-10 bg-[#58CC02] rounded-full flex items-center justify-center shrink-0">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-[#58CC02]">Certificate Verified</p>
                <p className="text-sm text-[#6F6F6F]">This certificate is authentic and blockchain-secured</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="relative inline-block mb-6">
              <div className="w-32 h-32 bg-gradient-to-br from-[#FAA918]/20 to-[#FAA918]/5 rounded-full flex items-center justify-center">
                <div className="w-24 h-24 bg-gradient-to-br from-[#FAA918] to-[#FAA918]/80 rounded-full flex items-center justify-center shadow-lg">
                  <Award className="w-12 h-12 text-white" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-[#1CB0F6] rounded-full flex items-center justify-center border-4 border-white shadow-md">
                <Star className="w-5 h-5 text-white fill-white" />
              </div>
            </div>

            <h4 className="text-2xl font-bold text-[#2B70C9] mb-3">
              Earn Your Certificate
            </h4>
            <p className="text-[#6F6F6F] mb-8 max-w-md mx-auto">
              Complete all course lessons to unlock your official certificate of completion. Show your achievement to the world!
            </p>
            
            {isGenerating ? (
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-[#FAA918]/10 rounded-xl">
                <div className="w-5 h-5 border-3 border-[#FAA918] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[#FAA918] font-bold">Generating your certificate...</span>
              </div>
            ) : (
              <Button
                onClick={generateCertificate}
                className="bg-gradient-to-r from-[#FAA918] to-[#FAA918]/80 text-white font-bold px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                <Award className="w-5 h-5 mr-2" />
                Generate My Certificate
              </Button>
            )}

            {/* Benefits List */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="p-4 bg-[#F5F5F5] rounded-xl text-center">
                <Shield className="w-6 h-6 text-[#1CB0F6] mx-auto mb-2" />
                <p className="text-xs font-medium text-[#6F6F6F]">Blockchain Verified</p>
              </div>
              <div className="p-4 bg-[#F5F5F5] rounded-xl text-center">
                <Download className="w-6 h-6 text-[#1CB0F6] mx-auto mb-2" />
                <p className="text-xs font-medium text-[#6F6F6F]">Download as PDF</p>
              </div>
              <div className="p-4 bg-[#F5F5F5] rounded-xl text-center">
                <Share2 className="w-6 h-6 text-[#1CB0F6] mx-auto mb-2" />
                <p className="text-xs font-medium text-[#6F6F6F]">Share on Social</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {certificate && (
        <CardFooter className="bg-[#F5F5F5] border-t-2 border-[#E5E5E5] p-6">
          <div className="w-full space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={downloadCertificate}
                className="bg-[#1CB0F6] hover:bg-[#14D4F4] text-white font-bold rounded-xl py-6 shadow-md"
              >
                <Download className="w-5 h-5 mr-2" />
                Download PDF
              </Button>
              <Button
                onClick={shareCertificate}
                className="bg-[#58CC02] hover:bg-[#58CC02]/90 text-white font-bold rounded-xl py-6 shadow-md"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share
              </Button>
            </div>
            
            <div className="text-center p-3 bg-white rounded-xl border border-[#E5E5E5]">
              <p className="text-xs text-[#6F6F6F] mb-1">Certificate ID</p>
              <p className="font-mono text-sm font-bold text-[#2B70C9]">{certificate.certificateCode}</p>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}