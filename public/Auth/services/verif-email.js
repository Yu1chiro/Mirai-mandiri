import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAuth, sendEmailVerification } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';

// Fungsi untuk mendapatkan konfigurasi Firebase
async function getFirebaseConfig() {
  try {
    const response = await fetch('/auth-config'); // Pastikan endpoint ini benar
    if (!response.ok) throw new Error('Failed to load Firebase config');
    return response.json();
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw new Error('Gagal memuat konfigurasi Firebase');
  }
}

// Inisialisasi Firebase
getFirebaseConfig().then(firebaseConfig => {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app); // Inisialisasi auth

  // Tangani klik tombol verif-email
  document.getElementById('verif-email').addEventListener('click', () => {
    // Tampilkan modal SweetAlert2 untuk memasukkan email
    Swal.fire({
      title: 'Verifikasi Email',
      input: 'email',
      inputPlaceholder: 'Masukkan email yang ingin diverifikasi',
      showCancelButton: true,
      confirmButtonText: 'Kirim Verifikasi',
      cancelButtonText: 'Batal',
      inputValidator: (value) => {
        if (!value) {
          return 'Email tidak boleh kosong!';
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Format email tidak valid!';
        }
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const email = result.value;

        // Kirim email verifikasi
        sendEmailVerification(auth.currentUser)
          .then(() => {
            Swal.fire({
              icon: 'success',
              title: 'Email Verifikasi Dikirim',
              text: `Email verifikasi telah dikirim ke ${email}. Silakan cek inbox Anda.`,
              confirmButtonText: 'OK',
            });
          })
          .catch((error) => {
            console.error('Gagal mengirim email verifikasi:', error);
            Swal.fire({
              icon: 'error',
              title: 'Gagal Mengirim Email Verifikasi',
              text: `Terjadi kesalahan: ${error.message}`,
              confirmButtonText: 'OK',
            });
          });
      }
    });
  });
});