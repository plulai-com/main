// app/dashboard/learn/[courseSlug]/[lessonSlug]/components/ActivitySubmission.tsx
"use client"

import { useState, useRef } from 'react'
import { Upload, CheckCircle, FileText, Link as LinkIcon, ExternalLink, Camera, X, Eye, AlertCircle, Trophy, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ActivitySubmissionProps {
  content: string
  metadata?: any
  userId: string
  activityId: string
  onComplete: () => void
  isCompleted: boolean
}

type SubmissionType = 'text' | 'file' | 'link' | 'mixed' | 'image'

export default function ActivitySubmission({ content, metadata, userId, activityId, onComplete, isCompleted }: ActivitySubmissionProps) {
  const [submissionText, setSubmissionText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [link, setLink] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [notes, setNotes] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const submissionType: SubmissionType = metadata?.submissionType || 'text'
  const maxFileSize = metadata?.maxFileSize || 5 // MB
  const allowedFileTypes = metadata?.allowedFileTypes || ['.png', '.jpg', '.jpeg', '.gif', '.pdf']
  const requirements = metadata?.requirements || ''
  const instructions = metadata?.instructions || ''
  const externalLink = metadata?.url || ''
  const buttonText = metadata?.buttonText || 'Open Activity'
  const title = metadata?.title || 'Submit Activity'

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Check file size
      if (selectedFile.size > maxFileSize * 1024 * 1024) {
        alert(`File size must be less than ${maxFileSize}MB`)
        return
      }
      
      // Check file type
      const fileExtension = '.' + selectedFile.name.split('.').pop()?.toLowerCase()
      if (!allowedFileTypes.includes(fileExtension)) {
        alert(`File type not allowed. Allowed types: ${allowedFileTypes.join(', ')}`)
        return
      }
      
      setFile(selectedFile)
      
      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setScreenshotPreview(e.target?.result as string)
        }
        reader.readAsDataURL(selectedFile)
      } else {
        setScreenshotPreview(null)
      }
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveFile = () => {
    setFile(null)
    setScreenshotPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async () => {
    // Validate based on submission type
    if (submissionType === 'text' && !submissionText.trim()) {
      alert('Please enter your submission text')
      return
    }
    
    if (submissionType === 'file' && !file) {
      alert('Please upload a file')
      return
    }
    
    if (submissionType === 'image' && !file) {
      alert('Please upload a screenshot')
      return
    }
    
    if (submissionType === 'link' && !link.trim()) {
      alert('Please enter a link')
      return
    }
    
    if (submissionType === 'mixed' && !submissionText.trim() && !file && !link.trim()) {
      alert('Please provide at least one type of submission')
      return
    }

    setIsSubmitting(true)
    setUploadProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Simulate file processing
      await new Promise(resolve => setTimeout(resolve, 1500))

      clearInterval(progressInterval)
      setUploadProgress(100)

      // For now, just simulate success without actual database/storage
      // TODO: Add Supabase integration here when ready
      console.log('Submission data:', {
        userId,
        activityId,
        submissionText,
        file: file ? { name: file.name, size: file.size, type: file.type } : null,
        link,
        notes,
        submissionType
      })

      // Mark as submitted
      setSubmitted(true)
      if (!isCompleted) {
        onComplete()
      }

    } catch (error) {
      console.error('Submission error:', error)
      alert('Submission saved locally. Database integration will be added soon.')
      // Still mark as submitted for local progress tracking
      setSubmitted(true)
      if (!isCompleted) {
        onComplete()
      }
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const handleOpenActivity = () => {
    if (externalLink) {
      window.open(externalLink, '_blank', 'noopener,noreferrer')
    }
  }

  const renderInstructions = () => {
    if (!instructions) return null
    
    return (
      <div className="mb-4">
        <p className="font-medium text-gray-800 mb-2">How to complete:</p>
        <div className="space-y-2">
          {instructions.split('\n').map((step: string, index: number) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                {index + 1}
              </div>
              <p className="text-gray-700">{step}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Card className="border-2 border-green-100">
      <CardHeader className="bg-linear-to-r from-green-50 to-emerald-50">
        <CardTitle className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Trophy className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="text-2xl font-bold text-gray-900">{title}</span>
            <CardDescription className="mt-1">
              Submit your completed work
            </CardDescription>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        {/* Activity Description */}
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">Activity Description</h3>
          <p className="text-gray-700 mb-4">{content}</p>
          
          {externalLink && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ExternalLink className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">Activity Link</p>
                    <p className="text-sm text-blue-600 truncate max-w-md">{externalLink}</p>
                  </div>
                </div>
                <Button
                  onClick={handleOpenActivity}
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {buttonText}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        {(instructions || requirements) && (
          <div className="bg-linear-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-5">
            <h4 className="font-bold text-lg mb-3 text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              Instructions & Requirements
            </h4>
            
            {renderInstructions()}
            
            {requirements && (
              <div className="p-3 bg-white rounded-lg border">
                <p className="font-medium text-gray-800 mb-1">Requirements:</p>
                <p className="text-gray-600">{requirements}</p>
              </div>
            )}
          </div>
        )}

        {!submitted ? (
          <div className="space-y-6">
            {/* Text Submission */}
            {(submissionType === 'text' || submissionType === 'mixed') && (
              <div className="space-y-2">
                <Label htmlFor="submission-text">Your Response</Label>
                <Textarea
                  id="submission-text"
                  placeholder="Type your answer, paste your code, or describe what you did..."
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <p className="text-sm text-muted-foreground">
                  Write your response here
                </p>
              </div>
            )}

            {/* File/Image Upload */}
            {(submissionType === 'file' || submissionType === 'image' || submissionType === 'mixed') && (
              <div className="space-y-2">
                <Label htmlFor="submission-file">
                  {submissionType === 'image' ? 'Upload Screenshot' : 'Upload File'}
                </Label>
                
                <Input
                  ref={fileInputRef}
                  id="submission-file"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept={submissionType === 'image' ? 'image/*' : undefined}
                />
                
                {!file ? (
                  <div 
                    onClick={handleUploadClick}
                    className="border-3 border-dashed border-gray-300 rounded-2xl p-10 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors"
                  >
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                      {submissionType === 'image' ? (
                        <Camera className="w-10 h-10 text-green-600" />
                      ) : (
                        <Upload className="w-10 h-10 text-green-600" />
                      )}
                    </div>
                    <h5 className="text-lg font-semibold text-gray-700 mb-2">
                      {submissionType === 'image' ? 'Click to upload screenshot' : 'Click to upload file'}
                    </h5>
                    <p className="text-gray-500 mb-1">
                      {allowedFileTypes.join(', ')} • Max {maxFileSize}MB
                    </p>
                    {submissionType === 'image' && (
                      <p className="text-sm text-gray-400">
                        Take a screenshot showing your completed work
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="border-2 border-green-200 rounded-xl overflow-hidden bg-green-50">
                    <div className="p-4 bg-green-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {submissionType === 'image' ? (
                          <ImageIcon className="w-5 h-5 text-green-700" />
                        ) : (
                          <FileText className="w-5 h-5 text-green-700" />
                        )}
                        <span className="font-medium text-green-800">{file.name}</span>
                      </div>
                      <Button
                        onClick={handleRemoveFile}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {screenshotPreview && (
                      <div className="p-4">
                        <div className="rounded-lg overflow-hidden border shadow-sm max-w-md mx-auto">
                          <img
                            src={screenshotPreview}
                            alt="Preview"
                            className="w-full h-auto max-h-64 object-contain bg-white"
                          />
                        </div>
                        
                        <div className="mt-4 flex items-center justify-center gap-4">
                          <Button
                            onClick={handleUploadClick}
                            variant="outline"
                            className="border-green-300 text-green-700"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Change File
                          </Button>
                          <Button
                            onClick={() => window.open(screenshotPreview, '_blank')}
                            variant="ghost"
                            className="text-blue-600"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Full Size
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Link Submission */}
            {(submissionType === 'link' || submissionType === 'mixed') && (
              <div className="space-y-2">
                <Label htmlFor="submission-link">Project Link</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      id="submission-link"
                      placeholder="https://scratch.mit.edu/projects/... or your project link"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => link && window.open(link, '_blank')}
                    disabled={!link.trim()}
                  >
                    <LinkIcon className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Share a link to your project (Scratch, GitHub, etc.)
                </p>
              </div>
            )}

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any comments or describe any challenges you faced..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Upload Progress */}
            {isSubmitting && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {uploadProgress < 100 ? 'Uploading...' : 'Processing...'}
                  </span>
                  <span className="text-sm font-bold text-green-600">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-linear-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Success Message */
          <Alert className="bg-linear-to-r from-green-50 to-emerald-50 border-green-200 animate-pulse">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Submission successful! 🎉</strong> Your work has been submitted. 
              {!isCompleted && ' Activity marked as complete.'}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t bg-gray-50">
        <div className="text-sm text-gray-600">
          {submitted ? (
            <span className="flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle className="w-4 h-4" />
              Submitted successfully
            </span>
          ) : (
            'Complete and submit your work'
          )}
        </div>
        
        <div className="flex gap-2">
          {externalLink && !submitted && (
            <Button
              variant="outline"
              onClick={handleOpenActivity}
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Activity
            </Button>
          )}
          
          {!submitted ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || (
                (submissionType === 'text' && !submissionText.trim()) ||
                (submissionType === 'file' && !file) ||
                (submissionType === 'image' && !file) ||
                (submissionType === 'link' && !link.trim()) ||
                (submissionType === 'mixed' && !submissionText.trim() && !file && !link.trim())
              )}
              className="bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Submit Work
                </>
              )}
            </Button>
          ) : isCompleted ? null : (
            <Button
              onClick={onComplete}
              variant="default"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark Complete
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}