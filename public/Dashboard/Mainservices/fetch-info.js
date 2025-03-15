// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getDatabase, ref, onValue, get, remove } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-database.js";

// Initialize Firebase dengan fetch config dari server
let firebaseApp;
let database;

async function initializeFirebase() {
  try {
    const response = await fetch('/firebase-config');
    const firebaseConfig = await response.json();
    
    firebaseApp = initializeApp(firebaseConfig);
    database = getDatabase(firebaseApp);
    
    // Setelah Firebase diinisialisasi, load data checkout
    fetchCheckoutData();
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    showErrorMessage("Gagal memuat konfigurasi Firebase");
  }
}

// Fungsi untuk memuat data checkout dari Firebase dan menampilkan dalam tabel
function fetchCheckoutData() {
  const checkoutRef = ref(database, 'checkout');
  const checkoutTableBody = document.getElementById('checkout-table');
  
  // Tampilkan loading indicator
  checkoutTableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Memuat data...</td></tr>';
  
  onValue(checkoutRef, (snapshot) => {
    // Sembunyikan loading indicator
    checkoutTableBody.innerHTML = '';
    
    if (snapshot.exists()) {
      const checkouts = snapshot.val();
      
      Object.keys(checkouts).forEach((key) => {
        const checkout = checkouts[key];
        
        // Buat baris tabel
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
          <td class="px-6 py-4 whitespace-nowrap">${checkout.namaLengkap}</td>
          <td class="px-6 py-4 whitespace-nowrap">${checkout.umur}</td>
          <td class="px-6 py-4 whitespace-nowrap">${checkout.jenjangPendidikan}</td>
          <td class="px-6 py-4 whitespace-nowrap">${checkout.whatsapp}</td>
          <td class="px-6 py-4 whitespace-nowrap">${checkout.programTitle}</td>
          <td class="px-6 py-4 whitespace-nowrap">
            <button class="detail-btn bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition duration-300" data-id="${key}">Detail</button>
            <button class="remove-btn bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300" data-id="${key}">Hapus</button>
            <a href="https://wa.me/${checkout.whatsapp}?text=Konnichiwa+terimakasih+sudah+mengirimkan+formulir+pendaftaran" class="bg-green-600 text-white px-1 rounded py-1">
          Hubungi</a>
            </td>
        `;
        
        // Tambahkan baris ke tabel
        checkoutTableBody.appendChild(row);
      });

      // Tambahkan event listener untuk tombol detail dan hapus
      addDetailButtonListeners();
      addRemoveButtonListeners();
    } else {
      // Tampilkan pesan jika tidak ada data
      checkoutTableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Tidak ada data checkout.</td></tr>';
    }
  }, (error) => {
    console.error("Error loading checkout data:", error);
    checkoutTableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Gagal memuat data checkout.</td></tr>';
  });
}

// Fungsi untuk menambahkan event listener ke tombol detail
function addDetailButtonListeners() {
  document.querySelectorAll('.detail-btn').forEach(button => {
    button.addEventListener('click', function() {
      const checkoutId = this.getAttribute('data-id');
      showCheckoutDetail(checkoutId);
    });
  });
}

// Fungsi untuk menampilkan detail checkout menggunakan SweetAlert2 modal
function showCheckoutDetail(checkoutId) {
  const checkoutRef = ref(database, `checkout/${checkoutId}`);

  get(checkoutRef).then((snapshot) => {
    if (snapshot.exists()) {
      const checkout = snapshot.val();

      // Tampilkan detail dalam modal SweetAlert2
      Swal.fire({
        title: `Detail Checkout`,
        html: `
          <div class="text-left space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Nama Lengkap</label>
              <p class="mt-1 text-gray-900">${checkout.namaLengkap}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Umur</label>
              <p class="mt-1 text-gray-900">${checkout.umur}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Jenjang Pendidikan</label>
              <p class="mt-1 text-gray-900">${checkout.jenjangPendidikan}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Nomor WhatsApp</label>
              <p class="mt-1 text-gray-900">${checkout.whatsapp}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Basic Bahasa Jepang</label>
              <p class="mt-1 text-gray-900">${checkout.basicJepang}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Sertifikat JLPT</label>
              <p class="mt-1 text-gray-900">${checkout.sertifikatJlpt}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Alasan Bergabung</label>
              <p class="mt-1 text-gray-900">${checkout.alasan}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Program</label>
              <p class="mt-1 text-gray-900">${checkout.programTitle}</p>
            </div>
          </div>
        `,
        showConfirmButton: false,
        showCloseButton: true,
        customClass: {
          container: 'swal2-container',
          popup: 'swal2-popup swal2-modal',
          closeButton: 'swal2-close',
        },
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Data tidak ditemukan',
        text: 'Detail checkout tidak tersedia.',
      });
    }
  }).catch((error) => {
    console.error("Error fetching checkout detail:", error);
    Swal.fire({
      icon: 'error',
      title: 'Gagal',
      text: 'Terjadi kesalahan saat memuat detail checkout.',
    });
  });
}

// Fungsi untuk menambahkan event listener ke tombol hapus
function addRemoveButtonListeners() {
  document.querySelectorAll('.remove-btn').forEach(button => {
    button.addEventListener('click', function() {
      const checkoutId = this.getAttribute('data-id');
      removeCheckoutData(checkoutId);
    });
  });
}

// Fungsi untuk menghapus data checkout
function removeCheckoutData(checkoutId) {
  Swal.fire({
    title: 'Konfirmasi Hapus',
    text: "Apakah Anda yakin ingin menghapus data ini?",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Ya, Hapus!',
    cancelButtonText: 'Batal'
  }).then((result) => {
    if (result.isConfirmed) {
      const checkoutRef = ref(database, `checkout/${checkoutId}`);
      remove(checkoutRef).then(() => {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: 'Data checkout berhasil dihapus.',
          timer: 1500
        });
        fetchCheckoutData(); // Refresh tabel setelah menghapus
      }).catch((error) => {
        console.error("Error removing checkout data:", error);
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: 'Terjadi kesalahan saat menghapus data checkout.'
        });
      });
    }
  });
}

// Fungsi untuk menampilkan pesan error
function showErrorMessage(message) {
  Swal.fire({
    icon: 'error',
    title: 'Error',
    text: message
  });
}

// Inisialisasi Firebase dan muat data saat halaman dimuat
document.addEventListener('DOMContentLoaded', initializeFirebase);