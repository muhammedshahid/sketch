function convertToImageData(data, width, height) {
  return new ImageData(data, width, height)
}

function rgbToHsv(imageData) {
  const data = imageData.data
  const len = data.length
  const hsvData = new Uint8ClampedArray(len)

  for (let i = 0; i < len; i += 4) {
    const r = data[i] / 255
    const g = data[i + 1] / 255
    const b = data[i + 2] / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const delta = max - min

    let h, s, v

    // Hue
    if (delta === 0) {
      h = 0
    } else if (max === r) {
      h = (((g - b) / delta) % 6) + 1
    } else if (max === g) {
      h = (b - r) / delta + 2
    } else {
      h = (r - g) / delta + 4
    }

    h = Math.floor(h * 60) % 360

    // Saturation
    s = delta === 0 ? 0 : delta / max

    // Value
    v = max

    hsvData[i] = h
    hsvData[i + 1] = s * 255
    hsvData[i + 2] = v * 255
    hsvData[i + 3] = data[i + 3] // Alpha remains unchanged
  }

  return new ImageData(hsvData, imageData.width, imageData.height)
}

// Invert the colors
function invert(imageData) {
  let data = imageData
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i] // Red channel
    data[i + 1] = 255 - data[i + 1] // Green channel
    data[i + 2] = 255 - data[i + 2] // Blue channel
    // Alpha channel remains unchanged
  }
  return imageData
}

// Grayscale conversion function
function grayscale(imageData) {
  console.log(`1]grayscale appling`)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
    data[i] = avg // Red
    data[i + 1] = avg // Green
    data[i + 2] = avg // Blue
  }
  //ctx.putImageData(imageData, 0, 0)
  return imageData;
  console.log(`1]grayscale applied`)
}

// Function to perform histogram equalization
function histogramEqualization(imageData) {
  let width = imageData.width
  let height = imageData.height
  imageData = new Uint8ClampedArray(imageData.data)
  const numPixels = width * height
  const histogram = new Array(256).fill(0)

  // Calculate histogram
  for (let i = 0; i < numPixels * 4; i += 4) {
    const intensity = Math.round(
      (imageData[i] +
        imageData[i + 1] +
        imageData[i + 2]) /
      3
    )
    histogram[intensity]++
  }

  // Calculate cumulative distribution function (CDF)
  let sum = 0
  const cdf = histogram.map(count => {
    sum += count
    return sum
  })

  // Normalize CDF
  const normalizedCdf = cdf.map(value =>
    Math.round((value / numPixels) * 255)
  )

  // Apply equalization
  for (let i = 0; i < numPixels * 4; i += 4) {
    const intensity = Math.round(
      (imageData[i] +
        imageData[i + 1] +
        imageData[i + 2]) /
      3
    )
    const equalizedIntensity = normalizedCdf[intensity]
    imageData[i] = equalizedIntensity
    imageData[i + 1] = equalizedIntensity
    imageData[i + 2] = equalizedIntensity
  }

  return new ImageData(imageData, width, height)
}

function calculateGaussianKernel(sigma, radius) {
  const kernelSize = 2 * radius + 1 // always odd
  const kernel = new Float32Array(kernelSize)
  let sum = 0

  for (let i = -radius; i <= radius; i++) {
    const x = i
    const weight = Math.exp(-(x * x) / (2.0 * sigma * sigma))
    kernel[i + radius] = weight
    sum += weight
  }

  for (let i = 0; i < kernelSize; i++) {
    kernel[i] /= sum
  }

  return kernel
}

// Function for applying Gaussian blur (you need to implement this)
function gaussianBlur(imageData, sigma) {
  console.log(`2]GaussianBlur appling`)
  // Get image data from the canvas
  let width = imageData.width
  let height = imageData.height
  // const imageData = ctx.getImageData(0, 0, width, height)

  // Calculate the Gaussian kernel based on desired sigma and radius
  //const sigma = 5 // controls the "spread" of the Gaussian function and the smoothness of the blur. Higher sigma values lead to a wider bell curve and a softer blur.
  const radius = 5 // Adjust radius as needed
  const kernel = calculateGaussianKernel(sigma, radius)
  console.log(kernel)

  // Perform horizontal blur pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let red = 0,
        green = 0,
        blue = 0,
        alpha = 0
      for (let dx = -radius; dx <= radius; dx++) {
        const clampedX = Math.max(0, Math.min(width - 1, x + dx))
        const weight = kernel[dx + radius]
        const index = (y * width + clampedX) * 4
        red += imageData.data[index] * weight
        green += imageData.data[index + 1] * weight
        blue += imageData.data[index + 2] * weight
        alpha += imageData.data[index + 3] * weight
      }
      imageData.data[(y * width + x) * 4] = red
      imageData.data[(y * width + x) * 4 + 1] = green
      imageData.data[(y * width + x) * 4 + 2] = blue
      imageData.data[(y * width + x) * 4 + 3] = alpha
    }
  }

  // Perform vertical blur pass
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let red = 0,
        green = 0,
        blue = 0,
        alpha = 0
      for (let dy = -radius; dy <= radius; dy++) {
        const clampedY = Math.max(0, Math.min(height - 1, y + dy))
        const weight = kernel[dy + radius]
        const index = (clampedY * width + x) * 4
        red += imageData.data[index] * weight
        green += imageData.data[index + 1] * weight
        blue += imageData.data[index + 2] * weight
        alpha += imageData.data[index + 3] * weight
      }
      imageData.data[(y * width + x) * 4] = red
      imageData.data[(y * width + x) * 4 + 1] = green
      imageData.data[(y * width + x) * 4 + 2] = blue
      imageData.data[(y * width + x) * 4 + 3] = alpha
    }
  }

  // Put blurred data back onto the original image
  //ctx.putImageData(imageData, 0, 0)
  console.log(`2]GaussianBlur applied`)
  return imageData;
}

// Function for applying Sobel operator (you need to implement this)
function sobelOperator(imageData) {
  console.log(`3]SobelOperator appling`)
  const width = imageData.width
  const height = imageData.height
  const data = imageData.data
  const outputData = new Uint8ClampedArray(data.length)
  //const gradientMagnitude = new Uint8ClampedArray(data.length)
  //const gradientDirection = new Float32Array(data.length)

  const sobelX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
  ]

  const sobelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ]

  function getPixel(x, y) {
    if (x < 0 || y < 0 || x >= width || y >= height) {
      return 0
    }
    return data[(y * width + x) * 4]
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let pixelX = 0
      let pixelY = 0

      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          pixelX += sobelX[i + 1][j + 1] * getPixel(x + j, y + i)
          pixelY += sobelY[i + 1][j + 1] * getPixel(x + j, y + i)
        }
      }

      const magnitude = Math.sqrt(pixelX * pixelX + pixelY * pixelY)
      //const direction = Math.atan2(pixelY, pixelX)

      const index = (y * width + x) * 4
      outputData[index] = magnitude
      outputData[index + 1] = magnitude
      outputData[index + 2] = magnitude
      outputData[index + 3] = 255 // Alpha

      //gradientMagnitude[index / 4] = magnitude
      //gradientDirection[index / 4] = direction
    }
  }
  console.log(`3]SobelOperator applied`)
  return outputData
  //return convertToImageData(outputData, width, height);
  //return { gradientMagnitude, gradientDirection, outputData }
}

// Function for adjusting brightness and contrast
function adjustBrightnessAndContrast2(imageData, brightness, contrast) {
  const copyImageData = new Uint8ClampedArray(imageData.data);
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))

  for (let i = 0; i < copyImageData.length; i += 4) {
    // Adjust brightness and contrast of each pixel
    copyImageData[i] = factor * (copyImageData[i] - 128) + 128 + brightness // Red channel
    copyImageData[i + 1] = factor * (copyImageData[i + 1] - 128) + 128 + brightness // Green channel
    copyImageData[i + 2] = factor * (copyImageData[i + 2] - 128) + 128 + brightness // Blue channel
  }
  return convertToImageData(copyImageData, imageData.width, imageData.height)
}