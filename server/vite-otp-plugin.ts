import type { Plugin } from 'vite'
import { generateAndStoreOtp, sendOtpEmail, verifyOtpCode } from './otp-service.ts'

// Helper to parse JSON body from incoming Node.js request
function parseBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk: any) => { data += chunk })
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

export function otpApiPlugin(): Plugin {
  return {
    name: 'otp-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/auth/')) {
          return next()
        }

        // Enable JSON responses
        res.setHeader('Content-Type', 'application/json')

        try {
          // Route 1: /api/auth/send-otp
          if (req.url === '/api/auth/send-otp' && req.method === 'POST') {
            const body = await parseBody(req)
            const { email, purpose = 'signup' } = body

            if (!email) {
              res.statusCode = 400
              return res.end(JSON.stringify({ success: false, error: 'Email is required.' }))
            }

            // 1. Generate & Store OTP
            const otpResult = await generateAndStoreOtp(email, purpose)
            if (!otpResult.success) {
              res.statusCode = 429
              return res.end(JSON.stringify({ success: false, error: otpResult.error, cooldownSeconds: otpResult.cooldownSeconds }))
            }

            // 2. Send via Gmail SMTP / Resend
            const mailResult = await sendOtpEmail(email, otpResult.otp!)

            // Return response (include otp in dev fallback if SMTP not set)
            return res.end(JSON.stringify({
              success: true,
              message: mailResult.success
                ? `Verification OTP sent to ${email}`
                : `OTP generated. (Notice: ${mailResult.error})`,
              emailSent: mailResult.success,
              method: mailResult.method,
              devOtp: !mailResult.success ? otpResult.otp : undefined,
            }))
          }

          // Route 2: /api/auth/verify-otp
          if (req.url === '/api/auth/verify-otp' && req.method === 'POST') {
            const body = await parseBody(req)
            const { email, otp, purpose = 'signup' } = body

            if (!email || !otp) {
              res.statusCode = 400
              return res.end(JSON.stringify({ success: false, error: 'Email and OTP are required.' }))
            }

            const verifyResult = await verifyOtpCode(email, otp, purpose)
            if (!verifyResult.success) {
              res.statusCode = 400
              return res.end(JSON.stringify({ success: false, error: verifyResult.error }))
            }

            return res.end(JSON.stringify({ success: true, message: 'OTP verified successfully.' }))
          }

          next()
        } catch (err: any) {
          console.error('[OTP API Error]:', err)
          res.statusCode = 500
          res.end(JSON.stringify({ success: false, error: err?.message || 'Server error' }))
        }
      })
    },
  }
}
