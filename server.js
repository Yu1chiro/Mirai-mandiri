import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import {rateLimit} from 'express-rate-limit';
import {RateLimiterMemory} from 'rate-limiter-flexible';
import { body, validationResult } from 'express-validator';

dotenv.config();
const app = express();
const __dirname = path.resolve();

// Inisialisasi Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
};

const firebaseAdmin = initializeApp({
  credential: cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

// Middleware untuk cache control
app.use((req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  });
  next();
});

// Middleware untuk verifikasi autentikasi
const authMiddleware = async (req, res, next) => {
  try {
    const sessionCookie = req.cookies.session || '';
    if (!sessionCookie) {
      return res.redirect('/403');
    }

    const decodedClaim = await getAuth().verifySessionCookie(sessionCookie, true);
    const userRecord = await getAuth().getUser(decodedClaim.uid);

    // Verifikasi role admin
    const db = getDatabase();
    const adminRef = db.ref(`admin/${userRecord.uid}`);
    const adminSnapshot = await adminRef.once('value');
    
    if (!adminSnapshot.exists() || adminSnapshot.val().role !== 'admin') {
      return res.redirect('/403');
    }

    req.user = userRecord;
    next();
  } catch (error) {
    console.error('Verifikasi sesi gagal:', error);
    res.redirect('/403');
  }
};

// Middleware untuk parsing cookie
app.use(express.json());
app.use(cookieParser());
// Endpoint untuk firebase config
// Middleware untuk melindungi endpoint /firebase-config
const protectFirebaseConfig = async (req, res, next) => {
  try {
    const sessionCookie = req.cookies.session || '';
    if (!sessionCookie) {
      // Redirect ke route /403
      return res.redirect('/403');
    }

    // Verifikasi session cookie menggunakan Firebase Admin SDK
    const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true);
    const userRecord = await getAuth().getUser(decodedClaims.uid);

    // Verifikasi role admin (opsional, jika diperlukan)
    const db = getDatabase();
    const adminRef = db.ref(`admin/${userRecord.uid}`);
    const adminSnapshot = await adminRef.once('value');

    if (!adminSnapshot.exists() || adminSnapshot.val().role !== 'admin') {
      // Redirect ke route /403
      return res.redirect('/403');
    }

    // Jika verifikasi berhasil, lanjutkan ke endpoint
    req.user = userRecord;
    next();
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    // Redirect ke route /403
    res.redirect('/403');
  }
};
app.get('/firebase', protectFirebaseConfig, (req, res) => {
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
  };

  res.json(firebaseConfig);
});
app.get('/auth-config', (req, res) => {
  const firebaseClientConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
  };

  res.json(firebaseClientConfig);
});

// Konfigurasi rate-limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // Maksimal 5 percobaan login per IP
  message: 'Terlalu banyak percobaan login, silakan coba lagi setelah 15 menit.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Terlalu banyak percobaan login, silakan coba lagi setelah 15 menit.',
      retryAfter: 15 * 60, // Waktu tunggu dalam detik
    });
  },
});

// Rate-limiter berbasis IP
const ipLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // Maksimal 5 percobaan login per IP
  message: 'Terlalu banyak percobaan login, silakan coba lagi setelah 15 menit.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Terlalu banyak percobaan login, silakan coba lagi setelah 15 menit.',
      retryAfter: 15 * 60, // Waktu tunggu dalam detik
    });
  },
});

// Rate-limiter berbasis email
const emailLimiter = new RateLimiterMemory({
  points: 5, // Maksimal 5 percobaan
  duration: 15 * 60, // 15 menit
});

app.post('/sessionLogin', ipLimiter, async (req, res) => {
  const { idToken, email } = req.body;

  try {
    // Cek rate-limit berbasis email
    await emailLimiter.consume(email);

    const expiresIn = 60 * 60 * 24 * 1 * 1000; // 1
    const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn });

    res.cookie('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.json({ status: 'success' });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Kesalahan membuat sesi:', error);
      res.status(401).json({ status: 'error', message: 'Unauthorized' });
    } else {
      // Jika rate-limit terlampaui
      res.status(429).json({
        status: 'error',
        message: 'Terlalu banyak percobaan login, silakan coba lagi setelah 15 menit.',
        retryAfter: 15 * 60, // Waktu tunggu dalam detik
      });
    }
  }
});
// Endpoint untuk logout
app.post('/sessionLogout', (req, res) => {
  res.clearCookie('session');
  res.json({ status: 'success' });
});

// sanitazion middleware 
const validateCheckoutData = [
  body('namaLengkap').trim().notEmpty().withMessage('Nama lengkap harus diisi').escape(),
  body('umur').isInt({ min: 1 }).withMessage('Umur harus berupa angka positif').toInt(),
  body('jenjangPendidikan').trim().notEmpty().withMessage('Jenjang pendidikan harus diisi').escape(),
  body('whatsapp').trim().notEmpty().withMessage('Nomor WhatsApp harus diisi').escape(),
  body('basicJepang').optional().trim().escape(),
  body('sertifikatJlpt').optional().trim().escape(),
  body('alasan').trim().notEmpty().withMessage('Alasan harus diisi').escape(),
];

// Endpoint untuk menyimpan data checkout
app.post('/saveCheckout', validateCheckoutData, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { namaLengkap, umur, jenjangPendidikan, whatsapp, basicJepang, sertifikatJlpt, alasan, programTitle } = req.body;

  // Simpan data ke Firebase
  const checkoutRef = ref(database, 'checkout');
  const newCheckoutRef = push(checkoutRef);

  set(newCheckoutRef, {
    namaLengkap,
    umur,
    jenjangPendidikan,
    whatsapp,
    basicJepang,
    sertifikatJlpt,
    alasan,
    programTitle,
    createdAt: new Date().toISOString()
  }).then(() => {
    res.json({ status: 'success', message: 'Thankyou kami akan menghubungi anda via whatsapp' });
  }).catch((error) => {
    console.error("Error saving checkout data:", error);
    res.status(500).json({ status: 'error', message: 'Anda terdeteksi melakukan hal tidak etis, mohon isi form dengan fromat semestinya' });
  });
});
// Pengaturan static files
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  lastModified: false,
  setHeaders: (res, path) => {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
  }
}));


// denied access config
app.get('/403', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', '403.html'));
});
app.get('/sign', (req, res) => {
  res.redirect('/Auth/sign');
});
app.get('/Auth/sign', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/Auth', 'sign.html'));
});
// testimonial
app.get('/form', (req, res) => {
  res.redirect('/testimonial/form');
});
app.get('/testimonial/form', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/testimonial', 'form.html'));
});
// Route navigation
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});
app.get('/advantages', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'advantages.html'));
});
app.get('/courses', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'courses.html'));
});

// Route middleware auth
app.get('/admin', authMiddleware, (req, res) => {
  res.redirect('/Dashboard/admin');
});

app.get('/Dashboard/admin', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/Dashboard', 'admin.html'));
});
// 
app.get('/testimoni-manage', authMiddleware, (req, res) => {
  res.redirect('/Dashboard/testimoni-manage');
});

app.get('/Dashboard/testimoni-manage', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/Dashboard', 'testimoni-manage.html'));
});
// 
app.get('/tutor', authMiddleware, (req, res) => {
  res.redirect('/Dashboard/tutor');
});

app.get('/Dashboard/tutor', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/Dashboard', 'tutor.html'));
});
// statistc
app.get('/statistic', authMiddleware, (req, res) => {
  res.redirect('/Dashboard/statistic');
});

app.get('/Dashboard/statistic', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/Dashboard', 'statistic.html'));
});



// Handler untuk rute yang tidak ditemukan - moved before app.listen()
app.use((req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 Not Found</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[url('/img/bg.jpg')] bg-cover bg-no-repeat flex items-center justify-center min-h-screen">
  <div class="bg-gradient-to-r from-[#0a387f] to-[#1C1678] animate-card text-white rounded-lg shadow-2xl p-8 mx-auto max-w-lg relative overflow-hidden">
    <!-- Logo -->
    <div class="flex justify-center mb-6">
      <img src="https://ucarecdn.com/61b8e223-d2bd-4b49-b5ca-702959bffc7a/Screenshot20250311023342.png" alt="Logo" class="h-16 rounded-full">
    </div>

    <!-- Animated Background Element -->
    <div class="absolute inset-0 z-0">
      <div class="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-r from-[#ffffff22] to-[#ffffff11] rounded-full animate-float"></div>
      <div class="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-r from-[#ffffff22] to-[#ffffff11] rounded-full animate-float-delay"></div>
    </div>

    <!-- Content -->
    <div class="relative z-10">
      <h1 class="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[hsl(42,85%,65%)] to-[hsl(42,80%,85%)] text-center text-4xl mb-4 font-custom">
        404 Page Not Found
      </h1>
      <p class="text-center text-lg mb-6">
        Sepertinya halaman yang Anda cari tidak tersedia
      </p>
      <div class="flex justify-center">
        <a href="/" class="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition transform hover:scale-105">
          Kembali ke Beranda
        </a>
      </div>
    </div>
  </div>

  <!-- Custom Animations -->
  <style>
    @keyframes float {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-20px);
      }
    }
    @keyframes float-delay {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-20px);
      }
    }
    .animate-float {
      animation: float 6s ease-in-out infinite;
    }
    .animate-float-delay {
      animation: float-delay 6s ease-in-out infinite;
      animation-delay: 2s;
    }
    .animate-card {
      animation: fadeIn 1s ease-in-out;
    }
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  </style>
</body>
</html>
    `);
});

// Start the server
app.listen(3000, () => console.log('Server running at http://localhost:3000'));