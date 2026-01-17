// components/certificate-display.tsx
"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Award, Download, Share2, CheckCircle, Calendar, FileText } from 'lucide-react'

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
      const response = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate certificate')
      }

      setCertificate(data)
      onCertificateGenerated?.(data)

    } catch (error: any) {
      console.error('Certificate generation error:', error)
      setError(error.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadCertificate = () => {
    if (!certificate?.pdfBase64) return

    // Create a blob from the base64 PDF
    const byteCharacters = atob(certificate.pdfBase64)
    const byteNumbers = new Array(byteCharacters.length)
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'application/pdf' })
    
    // Create download link
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
        // Convert base64 to blob for sharing
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
          text: `I just completed ${courseTitle}! Here's my certificate: ${certificate.certificateCode}`,
          files: [file]
        })
      } catch (error) {
        console.error('Error sharing certificate:', error)
      }
    } else {
      // Fallback: Copy certificate code to clipboard
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
    <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50/50 to-orange-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-700">
          <Award className="w-6 h-6" />
          Course Certificate
        </CardTitle>
        <CardDescription>
          Earn your official certificate upon course completion
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
            {error.includes('not completed') && (
              <p className="text-red-600 text-xs mt-2">
                Complete all lessons to unlock your certificate
              </p>
            )}
          </div>
        )}

        {certificate ? (
          <div className="space-y-4">
            {/* Certificate Preview */}
            <div className="p-6 bg-white rounded-xl border-2 border-amber-300 shadow-lg text-center">
              <div className="text-5xl text-amber-500 mb-4">🏆</div>
              <h3 className="text-2xl font-black text-amber-700 mb-2">
                Certificate of Completion
              </h3>
              <p className="text-slate-600 mb-6">This certifies that</p>
              
              <div className="border-b-2 border-amber-300 pb-4 mb-4">
                <h4 className="text-xl font-bold text-slate-800">
                  {certificate.student || 'Student Name'}
                </h4>
              </div>
              
              <p className="text-slate-600 mb-2">has successfully completed</p>
              <h5 className="text-lg font-bold text-amber-600 mb-6">
                {certificate.course || courseTitle}
              </h5>
              
              <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
                <div className="text-left">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span>Issued On</span>
                  </div>
                  <p className="font-semibold">
                    {formatDate(certificate.issuedAt)}
                  </p>
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <FileText className="w-4 h-4" />
                    <span>Certificate ID</span>
                  </div>
                  <p className="font-mono text-xs font-semibold">
                    {certificate.certificateCode}
                  </p>
                </div>
              </div>
            </div>

            {/* Verification Badge */}
            <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-700 font-medium">
                Certificate successfully generated and verified
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center p-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <Award className="w-10 h-10 text-amber-500" />
            </div>
            <h4 className="text-lg font-semibold text-slate-700 mb-2">
              Certificate Available
            </h4>
            <p className="text-slate-600 text-sm mb-6">
              Complete all lessons to unlock your official certificate of completion
            </p>
            
            {isGenerating ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-amber-600">Generating certificate...</span>
              </div>
            ) : (
              <Button
                onClick={generateCertificate}
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:shadow-lg"
              >
                <Award className="w-4 h-4 mr-2" />
                Generate Certificate
              </Button>
            )}
          </div>
        )}
      </CardContent>

      {certificate && (
        <CardFooter className="flex flex-col gap-3">
          <div className="flex gap-3 w-full">
            <Button
              onClick={downloadCertificate}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-glow"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button
              onClick={shareCertificate}
              variant="outline"
              className="flex-1 border-amber-300 text-amber-600 hover:bg-amber-50"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
          
          <div className="w-full text-center">
            <Badge variant="outline" className="text-xs bg-white/50">
              Certificate ID: {certificate.certificateCode}
            </Badge>
            <p className="text-xs text-slate-500 mt-2">
              Save this certificate to your profile for future reference
            </p>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}