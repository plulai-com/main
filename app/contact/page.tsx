// app/contact/page.tsx
"use client"

import { useState } from "react"
import { HeaderLanding } from "@/components/header-landing"
import { FooterLanding } from "@/components/footer-landing"
import { Mail, Phone, MapPin, Send, Clock, Globe, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/client" // <-- Changed import

// Define the form data type matching your table schema
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  plan: string;
}

export default function ContactPage() {
  // Form state
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    subject: "General Inquiry",
    message: "",
    plan: ""
  })

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' })

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus({ type: null, message: '' })

    // Validate required fields
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.message.trim()) {
      setSubmitStatus({
        type: 'error',
        message: 'Please fill in all required fields.'
      })
      setIsSubmitting(false)
      return
    }

    // Validate email format (matching your SQL constraint)
    const emailRegex = /^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+\.[A-Za-z]+$/
    if (!emailRegex.test(formData.email)) {
      setSubmitStatus({
        type: 'error',
        message: 'Please enter a valid email address (e.g., name@example.com).'
      })
      setIsSubmitting(false)
      return
    }

    try {
      // Create Supabase client instance
      const supabase = createClient() // <-- Create the client here

      // Prepare data for Supabase
      const submissionData = {
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        email: formData.email.trim(),
        subject: formData.subject,
        message: formData.message.trim(),
        plan: formData.plan.trim() || null,
        status: 'new'
      }

      // Insert into Supabase
      const { data, error } = await supabase
        .from('contact_submissions')
        .insert([submissionData])
        .select()

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(error.message || 'Failed to submit form')
      }

      // Success
      setSubmitStatus({
        type: 'success',
        message: 'Thank you! Your message has been sent successfully. We\'ll get back to you soon.'
      })

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        subject: "General Inquiry",
        message: "",
        plan: ""
      })

    } catch (error: any) {
      console.error('Submission error:', error)
      setSubmitStatus({
        type: 'error',
        message: error.message || 'An error occurred while sending your message. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <HeaderLanding />

      <main className="pt-32 pb-20">
        {/* Hero Section */}
        <section className="container mx-auto px-4 text-center mb-16">
          <Badge className="bg-[#1CB0F6]/10 text-[#1CB0F6] border-[#1CB0F6]/20 px-6 py-2 text-sm font-black uppercase tracking-[0.2em] rounded-full mb-6">
            Get in Touch
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] text-slate-900 mb-6">
            Let's Build <br />
            <span className="text-[#1CB0F6]">The Future Together</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto font-medium">
            Have questions, suggestions, or partnership ideas? We'd love to hear from you.
          </p>
        </section>

        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-2xl font-black text-slate-900 mb-6">Send us a message</h2>

              {/* Status Messages */}
              {submitStatus.type && (
                <div className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${
                  submitStatus.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  {submitStatus.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-medium">{submitStatus.message}</p>
                    {submitStatus.type === 'success' && (
                      <p className="text-sm mt-1">You should receive a confirmation email shortly.</p>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      First Name *
                    </label>
                    <Input
                      name="firstName"
                      placeholder="Your first name"
                      className="h-12"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Last Name *
                    </label>
                    <Input
                      name="lastName"
                      placeholder="Your last name"
                      className="h-12"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Email *
                  </label>
                  <Input
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    className="h-12"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    We'll only use this to respond to your inquiry
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Subject *
                  </label>
                  <select
                    name="subject"
                    className="w-full h-12 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1CB0F6] focus:border-transparent"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Press/Media">Press/Media</option>
                    <option value="Careers">Careers</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Interested Plan (Optional)
                  </label>
                  <select
                    name="plan"
                    className="w-full h-12 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1CB0F6] focus:border-transparent"
                    value={formData.plan}
                    onChange={handleInputChange}
                  >
                    <option value="">Select a plan</option>
                    <option value="Explorer">Explorer - $300 (3 months)</option>
                    <option value="Legend">Legend - $999 (1 year)</option>
                    <option value="Family">Family - $280 per account</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Message *
                  </label>
                  <Textarea
                    name="message"
                    placeholder="Tell us how we can help you..."
                    className="min-h-[150px]"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Please provide as much detail as possible so we can help you better
                  </p>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-[#1CB0F6] hover:bg-[#14D4F4] text-white font-bold h-12 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Contact Information Sidebar */}
            <div className="space-y-8">
              {/* Contact Info Card */}
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-8">
                <h2 className="text-2xl font-black text-slate-900 mb-6">Contact Information</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#1CB0F6]/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-[#1CB0F6]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Email</h4>
                      <p className="text-slate-600">hello@plulai.com</p>
                      <p className="text-slate-600">support@plulai.com</p>
                      <p className="text-sm text-slate-500 mt-1">For general inquiries and support</p>
                    </div>
                  </div>

                  {/* <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#1CB0F6]/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-[#1CB0F6]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Phone</h4>
                      <p className="text-slate-600">+1 (555) 123-4567</p>
                      <p className="text-sm text-slate-500 mt-1">Monday to Friday, 9AM - 5PM EST</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#1CB0F6]/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-[#1CB0F6]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Address</h4>
                      <p className="text-slate-600">123 Innovation Drive</p>
                      <p className="text-slate-600">San Francisco, CA 94107</p>
                      <p className="text-sm text-slate-500 mt-1">Visit us by appointment</p>
                    </div>
                  </div> */}
                </div>
              </div>

              {/* Business Hours Card */}
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Business Hours
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-3 border-b border-slate-100">
                    <span className="font-medium text-slate-700">Monday - Friday</span>
                    <span className="font-bold text-slate-900">9:00 AM - 6:00 PM EST</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-slate-100">
                    <span className="font-medium text-slate-700">Saturday</span>
                    <span className="font-bold text-slate-900">10:00 AM - 4:00 PM EST</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="font-medium text-slate-700">Sunday</span>
                    <span className="font-bold text-slate-900 text-red-500">Closed</span>
                  </div>
                </div>
              </div>

              {/* Global Reach Card */}
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Global Reach
                </h3>
                <p className="text-slate-600 mb-4">
                  We serve creators from around the world. Our platform is available in multiple languages:
                </p>
                <div className="flex flex-wrap gap-2">
                  {["English", "العربية", "Français", "Español", "Deutsch", "中文"].map((lang) => (
                    <Badge
                      key={lang}
                      className="bg-slate-100 text-slate-700 border-slate-200 font-medium hover:bg-slate-200 transition-colors"
                    >
                      {lang}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-slate-500 mt-4">
                  Need support in another language? Let us know in your message!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <FooterLanding />
    </div>
  )
}