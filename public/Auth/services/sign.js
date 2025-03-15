import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAuth, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';

// Mendapatkan konfigurasi Firebase dari server
async function getFirebaseConfig() {
  try {
    const response = await fetch('/firebase-config');
    if (!response.ok) throw new Error('Failed to load Firebase config');
    return response.json();
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw new Error('Gagal memuat konfigurasi Firebase');
  }
}

getFirebaseConfig().then(firebaseConfig => {
  // Inisialisasi Firebase dengan konfigurasi dari server
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app); // Inisialisasi auth

  // Form login submit handler
  document.getElementById('login-check').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      // Tampilkan animasi loading
      Swal.fire({
        title: 'Authentication',
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading();
        }
      });

      // Cek apakah email dan password sudah diisi
      if (!email || !password) {
        throw new Error('Email dan password tidak boleh kosong');
      }

      // Login dengan Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Periksa apakah email pengguna telah diverifikasi
      if (!user.emailVerified) {
        Swal.close(); // Hentikan animasi loading
        
        // Tampilkan pesan untuk memverifikasi email terlebih dahulu
        Swal.fire({
          icon: 'warning',
          title: 'Email Belum Diverifikasi',
          text: 'Silakan periksa email Anda untuk memverifikasi akun sebelum login.',
          confirmButtonText: 'OK'
        });
        
        return; // Jangan izinkan login jika email belum diverifikasi
      }

      // Dapatkan token ID dari pengguna yang berhasil login
      const idToken = await user.getIdToken();

      // Kirim idToken ke server untuk membuat session cookie
      const sessionResponse = await fetch('/sessionLogin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ idToken })
      });

      // Pastikan session berhasil dibuat
      if (!sessionResponse.ok) {
        throw new Error('Gagal membuat sesi');
      }

      // Jika email telah diverifikasi dan session berhasil dibuat, arahkan ke Dashboard
      Swal.close(); // Hentikan animasi loading

      Swal.fire({
        icon: 'success',
        title: 'Login Verified!',
        html: 'redirecting.....',
        showConfirmButton: false,
        timer: 2000
      }).then(() => {
        window.location.href = '/admin';
      });

    } catch (error) {
      // Hentikan animasi loading jika gagal login
      Swal.close();

      // Tampilkan pesan error
      Swal.fire({
        icon: 'error',
        title: 'Incorrect!',
        text: 'Your Email & Password Incorrect!',
        confirmButtonText: 'Tutup'
      });
    }
  });
});