import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Input,
  Label,
  Avatar,
  AvatarImage,
  AvatarFallback
} from '@/components/ui'
import { 
  Eye, 
  Check, 
  X, 
  Clock, 
  User, 
  Calendar, 
  FileText, 
  AlertTriangle,
  Download,
  Zoom,
  RefreshCw
} from 'lucide-react'
import { useQuery, useMutation, useSubscription } from '@apollo/client'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'

import {
  GET_AGE_VERIFICATION_REVIEWS,
  REVIEW_AGE_VERIFICATION,
  NEW_AGE_VERIFICATION_SUBMISSION
} from '../../apollo/queries/ageVerification'

const AgeVerificationReview = () => {
  const [selectedReview, setSelectedReview] = useState(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [reviewStatus, setReviewStatus] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [correctedDateOfBirth, setCorrectedDateOfBirth] = useState('')
  const [filterStatus, setFilterStatus] = useState('PENDING')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch pending reviews
  const { data, loading, error, refetch } = useQuery(GET_AGE_VERIFICATION_REVIEWS, {
    variables: { limit: 50, offset: 0 },
    pollInterval: 30000 // Poll every 30 seconds
  })

  // Review mutation
  const [reviewVerification, { loading: reviewLoading }] = useMutation(REVIEW_AGE_VERIFICATION, {
    onCompleted: (data) => {
      if (data.reviewAgeVerification.success) {
        toast.success('Age verification reviewed successfully')
        setReviewDialogOpen(false)
        setSelectedReview(null)
        setReviewStatus('')
        setRejectionReason('')
        setCorrectedDateOfBirth('')
        refetch()
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to review age verification')
    }
  })

  // Subscribe to new submissions
  useSubscription(NEW_AGE_VERIFICATION_SUBMISSION, {
    onSubscriptionData: ({ subscriptionData }) => {
      if (subscriptionData.data) {
        toast.success('New age verification submission received')
        refetch()
      }
    }
  })

  const reviews = data?.getAgeVerificationReviews || []

  const filteredReviews = reviews.filter(review => {
    const matchesStatus = filterStatus === 'ALL' || review.document.status === filterStatus
    const matchesSearch = !searchTerm || 
      review.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const handleReviewClick = (review) => {
    setSelectedReview(review)
    setReviewDialogOpen(true)
    setReviewStatus('')
    setRejectionReason('')
    setCorrectedDateOfBirth(
      review.document.dateOfBirth ? 
      format(new Date(review.document.dateOfBirth), 'yyyy-MM-dd') : 
      ''
    )
  }

  const handleSubmitReview = async () => {
    if (!reviewStatus) {
      toast.error('Please select a review status')
      return
    }

    if (reviewStatus === 'REJECTED' && !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    try {
      await reviewVerification({
        variables: {
          input: {
            userId: selectedReview.user._id,
            status: reviewStatus,
            rejectionReason: reviewStatus === 'REJECTED' ? rejectionReason : null,
            dateOfBirth: correctedDateOfBirth || null
          }
        }
      })
    } catch (error) {
      console.error('Review submission error:', error)
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      PENDING: 'warning',
      VERIFIED: 'success',
      REJECTED: 'destructive'
    }
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>
  }

  const getPriorityColor = (priority) => {
    if (priority >= 8) return 'text-red-600'
    if (priority >= 5) return 'text-orange-600'
    return 'text-green-600'
  }

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading reviews...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load age verification reviews: {error.message}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Age Verification Reviews</h1>
          <p className="text-muted-foreground">
            Review and approve age verification submissions
          </p>
        </div>
        <Button onClick={refetch} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {reviews.filter(r => r.document.status === 'PENDING').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Check className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold">
                  {reviews.filter(r => r.document.status === 'VERIFIED').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <X className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">
                  {reviews.filter(r => r.document.status === 'REJECTED').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{reviews.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReviews.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No reviews found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <div
                  key={review._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleReviewClick(review)}
                >
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={review.user.avatar} />
                      <AvatarFallback>
                        {review.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{review.user.name}</p>
                      <p className="text-sm text-muted-foreground">{review.user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Submitted: {format(new Date(review.submittedAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {review.document.document.documentType.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Priority: <span className={getPriorityColor(review.priority)}>
                          {review.priority}/10
                        </span>
                      </p>
                    </div>
                    {getStatusBadge(review.document.status)}
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Age Verification</DialogTitle>
          </DialogHeader>
          
          {selectedReview && (
            <div className="space-y-6">
              {/* User Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    User Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <p className="font-medium">{selectedReview.user.name}</p>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <p className="font-medium">{selectedReview.user.email}</p>
                    </div>
                    <div>
                      <Label>Submitted</Label>
                      <p className="font-medium">
                        {format(new Date(selectedReview.submittedAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    <div>
                      <Label>Document Type</Label>
                      <p className="font-medium">
                        {selectedReview.document.document.documentType.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Document Image */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Document Image
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setImageDialogOpen(true)}
                      >
                        <Zoom className="h-4 w-4 mr-2" />
                        Zoom
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(selectedReview.document.document.url, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <img
                    src={selectedReview.document.document.url}
                    alt="ID Document"
                    className="max-w-full h-auto border rounded-lg"
                    style={{ maxHeight: '400px' }}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    File size: {(selectedReview.document.document.fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </CardContent>
              </Card>

              {/* Review Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Review Decision</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="review-status">Status</Label>
                    <Select value={reviewStatus} onValueChange={setReviewStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select review status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VERIFIED">Approve</SelectItem>
                        <SelectItem value="REJECTED">Reject</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="date-of-birth">Date of Birth (if correction needed)</Label>
                    <Input
                      id="date-of-birth"
                      type="date"
                      value={correctedDateOfBirth}
                      onChange={(e) => setCorrectedDateOfBirth(e.target.value)}
                    />
                    {correctedDateOfBirth && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Age: {calculateAge(correctedDateOfBirth)} years
                      </p>
                    )}
                  </div>

                  {reviewStatus === 'REJECTED' && (
                    <div>
                      <Label htmlFor="rejection-reason">Rejection Reason</Label>
                      <Textarea
                        id="rejection-reason"
                        placeholder="Please provide a clear reason for rejection..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={reviewLoading || !reviewStatus}
            >
              {reviewLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Zoom Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Document Image - Full Size</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="flex justify-center">
              <img
                src={selectedReview.document.document.url}
                alt="ID Document - Full Size"
                className="max-w-full h-auto"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AgeVerificationReview