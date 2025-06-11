const cloudinary = require('cloudinary').v2
const { CloudinaryStorage } = require('multer-storage-cloudinary')

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
})

/**
 * Upload image buffer to Cloudinary
 * @param {Buffer} buffer - Image buffer
 * @param {string} folder - Cloudinary folder path
 * @param {Object} options - Additional Cloudinary options
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const uploadImageToCloudinary = async (buffer, folder, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type: 'image',
      format: 'jpg',
      quality: 'auto:good',
      fetch_format: 'auto',
      flags: 'progressive',
      ...options
    }

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error)
          reject(new Error(`Failed to upload image: ${error.message}`))
        } else {
          resolve(result)
        }
      }
    ).end(buffer)
  })
}

/**
 * Upload image from URL to Cloudinary
 * @param {string} imageUrl - Image URL
 * @param {string} folder - Cloudinary folder path
 * @param {Object} options - Additional Cloudinary options
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const uploadImageFromUrl = async (imageUrl, folder, options = {}) => {
  try {
    const uploadOptions = {
      folder,
      resource_type: 'image',
      format: 'jpg',
      quality: 'auto:good',
      fetch_format: 'auto',
      flags: 'progressive',
      ...options
    }

    const result = await cloudinary.uploader.upload(imageUrl, uploadOptions)
    return result
  } catch (error) {
    console.error('Cloudinary URL upload error:', error)
    throw new Error(`Failed to upload image from URL: ${error.message}`)
  }
}

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} - Cloudinary deletion result
 */
const deleteImageFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return result
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    throw new Error(`Failed to delete image: ${error.message}`)
  }
}

/**
 * Generate transformation URL for image
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} transformations - Transformation options
 * @returns {string} - Transformed image URL
 */
const getTransformedImageUrl = (publicId, transformations = {}) => {
  try {
    return cloudinary.url(publicId, {
      secure: true,
      quality: 'auto:good',
      fetch_format: 'auto',
      ...transformations
    })
  } catch (error) {
    console.error('Cloudinary transformation error:', error)
    return null
  }
}

/**
 * Create thumbnail from existing image
 * @param {string} publicId - Original image public ID
 * @param {string} folder - Destination folder
 * @param {Object} options - Thumbnail options
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const createThumbnail = async (publicId, folder, options = {}) => {
  try {
    const thumbnailOptions = {
      folder,
      width: 200,
      height: 200,
      crop: 'fill',
      quality: 'auto:low',
      format: 'jpg',
      ...options
    }

    // Get the original image URL with transformations
    const transformedUrl = cloudinary.url(publicId, thumbnailOptions)
    
    // Upload the transformed image as a new asset
    const result = await cloudinary.uploader.upload(transformedUrl, {
      folder: `${folder}/thumbnails`,
      public_id: `${publicId}_thumb`
    })

    return result
  } catch (error) {
    console.error('Thumbnail creation error:', error)
    throw new Error(`Failed to create thumbnail: ${error.message}`)
  }
}

/**
 * Validate image file
 * @param {Object} file - File object
 * @returns {Object} - Validation result
 */
const validateImageFile = (file) => {
  const errors = []
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ]

  if (!file) {
    errors.push('File is required')
    return { isValid: false, errors }
  }

  // Check file type
  if (file.mimetype && !allowedTypes.includes(file.mimetype)) {
    errors.push('Only JPEG, PNG, and WebP files are allowed')
  }

  // Check file size
  if (file.size && file.size > maxSize) {
    errors.push('File size must be less than 10MB')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Get Cloudinary storage configuration for multer
 * @param {string} folder - Upload folder
 * @returns {Object} - Multer storage configuration
 */
const getCloudinaryStorage = (folder) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: folder,
      format: async (req, file) => 'jpg',
      public_id: (req, file) => {
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(2, 15)
        return `${timestamp}_${random}`
      },
      transformation: [
        {
          quality: 'auto:good',
          fetch_format: 'auto'
        }
      ]
    }
  })
}

/**
 * Batch delete images from Cloudinary
 * @param {Array} publicIds - Array of public IDs to delete
 * @returns {Promise<Object>} - Batch deletion result
 */
const batchDeleteImages = async (publicIds) => {
  try {
    if (!publicIds || publicIds.length === 0) {
      return { deleted: [], errors: [] }
    }

    const result = await cloudinary.api.delete_resources(publicIds)
    return result
  } catch (error) {
    console.error('Batch delete error:', error)
    throw new Error(`Failed to batch delete images: ${error.message}`)
  }
}

/**
 * Get image metadata from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} - Image metadata
 */
const getImageMetadata = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId)
    return {
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      url: result.secure_url,
      createdAt: result.created_at,
      tags: result.tags || []
    }
  } catch (error) {
    console.error('Get metadata error:', error)
    throw new Error(`Failed to get image metadata: ${error.message}`)
  }
}

/**
 * Search images in Cloudinary
 * @param {string} expression - Search expression
 * @param {Object} options - Search options
 * @returns {Promise<Object>} - Search results
 */
const searchImages = async (expression, options = {}) => {
  try {
    const searchOptions = {
      expression,
      max_results: 50,
      sort_by: [['created_at', 'desc']],
      ...options
    }

    const result = await cloudinary.search.expression(expression).execute()
    return result
  } catch (error) {
    console.error('Search images error:', error)
    throw new Error(`Failed to search images: ${error.message}`)
  }
}

module.exports = {
  cloudinary,
  uploadImageToCloudinary,
  uploadImageFromUrl,
  deleteImageFromCloudinary,
  getTransformedImageUrl,
  createThumbnail,
  validateImageFile,
  getCloudinaryStorage,
  batchDeleteImages,
  getImageMetadata,
  searchImages
}