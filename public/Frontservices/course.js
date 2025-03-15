// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-database.js";

// Initialize Firebase dengan fetch config dari server
let firebaseApp;
let database;

async function initializeFirebase() {
  try {
    const response = await fetch('/firebase-config');
    const firebaseConfig = await response.json();
    
    firebaseApp = initializeApp(firebaseConfig);
    database = getDatabase(firebaseApp);
    
    // Setelah Firebase diinisialisasi, load data program
    fetchPrograms();
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    showErrorMessage("Gagal memuat konfigurasi Firebase");
  }
}

// Fungsi untuk memuat data program dari Firebase dan menampilkan dalam card
function fetchPrograms() {
  const programsRef = ref(database, 'list-program');
  const courseFetchContainer = document.getElementById('course-fetch');
  
  // Tampilkan loading indicator
  courseFetchContainer.innerHTML = `
   <div class="flex justify-center items-center py-4">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <p class="ms-5">tunggu sebentar...</p>
            </div>
  `;
  
  onValue(programsRef, (snapshot) => {
    // Sembunyikan loading indicator
    courseFetchContainer.innerHTML = '';
    
    if (snapshot.exists()) {
      const programs = snapshot.val();
      
      Object.keys(programs).forEach((key) => {
        const program = programs[key];
        
        // Buat card template
        const card = document.createElement('div');
        card.className = 'card bg-white rounded-lg shadow-xl overflow-hidden hover:shadow-2xl transition duration-300';
card.innerHTML = `
  <img src="${program.thumbnail || '/api/placeholder/400/225'}" alt="${program.title}" class="w-full h-48 object-cover">
  <div class="p-6">
    <!-- Title dan Kategori -->
    <div class="mb-4">
      <h3 class="text-2xl font-bold text-gray-900 mb-2 text-start leading-tight">${program.title}</h3>
      <span class="inline-block bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1 rounded-full">${program.kategori}</span>
    </div>

    <!-- Rating -->
    <div class="flex items-center mb-4">
      <span class="text-yellow-500 text-lg mr-2">
        ${generateStarRating(program.rate || 0)}
      </span>
      <span class="text-gray-600 text-sm">(${program.rate || 0})</span>
    </div>

    <!-- Deskripsi -->
    <p class="text-gray-600 text-sm text-justify mb-4">${program.description || 'Tidak ada deskripsi'}</p>

    <!-- Durasi dan Alumni -->
    <div class="flex justify-between items-center mb-6 text-sm text-gray-700">
      <span><i class="fas fa-clock mr-2"></i>${program.durasi}</span>
      <span><i class="fas fa-user-graduate mr-2"></i>${program.jumlahAlumni || 0} Alumni</span>
    </div>

    <!-- Tombol Daftar Sekarang -->
     <button href="${program.thumbnail}" id="detail" class="w-full mb-3 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 font-semibold">
    Detail
    </button>
    <button class="daftar-sekarang w-full bg-yellow-600 text-white py-3 px-6 rounded-lg hover:bg-yellow-700 transition duration-300 font-semibold">
      Daftar Sekarang
    </button>
   
  </div>
`;
        // Tambahkan card ke container
        courseFetchContainer.appendChild(card);
      });
    } else {
      // Tampilkan pesan jika tidak ada data
      courseFetchContainer.innerHTML = '<div class="text-center py-8 text-gray-500">Tidak ada data program.</div>';
    }
  }, (error) => {
    console.error("Error loading programs:", error);
    courseFetchContainer.innerHTML = '<div class="text-center py-8 text-red-500">Gagal memuat data program.</div>';
  });
}



// Event listener untuk tombol "Daftar Sekarang" menggunakan event delegation
document.getElementById('course-fetch').addEventListener('click', (event) => {
    document.getElementById('detail').addEventListener('click', function (e) {
        e.preventDefault();
        const thumbnailUrl = e.target.getAttribute('href'); // Mengambil URL dari atribut href
    
        Swal.fire({
            imageUrl: thumbnailUrl,
        });
    });
  if (event.target.classList.contains('daftar-sekarang')) {
    event.preventDefault(); // Mencegah default behavior dari link
    
    // Cari elemen card terdekat
    const card = event.target.closest('.card');
    if (!card) {
      console.error('Elemen card tidak ditemukan.');
      return;
    }
    
    // Ambil judul program dari card yang diklik
    const programTitle = card.querySelector('h3')?.textContent;
    if (!programTitle) {
      console.error('Judul program tidak ditemukan.');
      return;
    }
    
    // Tampilkan form checkout
    showCheckoutForm(programTitle);
  }
});

// Fungsi untuk menampilkan form checkout
function showCheckoutForm(programTitle) {
  Swal.fire({
    html: `
    <form id="checkoutForm" class="bg-white p-8 rounded-2xl shadow-xl space-y-6">
  <h2 class="text-lg font-bold text-gray-800 mb-6">Form Pendaftaran ${programTitle} </h2>

  <!-- Nama Lengkap -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2 text-start">Nama Lengkap</label>
    <input id="nama-lengkap" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none" type="text" required>
  </div>

  <!-- Umur -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2 text-start">Umur</label>
    <input id="umur" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none" type="number" required>
  </div>

  <!-- Jenjang Pendidikan -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2 text-start">Jenjang Pendidikan</label>
    <select id="jenjang-pendidikan" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none appearance-none bg-white" required>
      <option value="">Pilih</option>
      <option value="SMA/SMK">SMA/SMK</option>
      <option value="Diploma">Diploma</option>
      <option value="Sarjana">Sarjana</option>
      <option value="Lainnya">Lainnya</option>
    </select>
  </div>

  <!-- Nomor WhatsApp -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2 text-start">Nomor WhatsApp</label>
    <input id="whatsapp" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none" type="tel" required>
  </div>

  <!-- Basic Bahasa Jepang -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2 text-start">Apakah sudah memiliki basic bahasa Jepang?</label>
    <select id="basic-jepang" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none">
      <option value="Sudah">Sudah</option>
      <option value="Belum">Belum</option>
    </select>
  </div>

  <!-- Sertifikat JLPT -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2 text-start">Apakah memiliki sertifikat JLPT?</label>
    <select id="sertifikat-jlpt" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none">
      <option value="Ya">Ya</option>
      <option value="Tidak">Tidak</option>
    </select>
  </div>

  <!-- Alasan Bergabung -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2 text-start">Alasan ingin bergabung program ini</label>
    <textarea id="alasan" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none" rows="4" required></textarea>
  </div>

  <!-- Tombol Submit -->
 
</form>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Submit',
    cancelButtonText: 'Batal',
    preConfirm: () => {
      const namaLengkap = document.getElementById('nama-lengkap').value;
      const umur = document.getElementById('umur').value;
      const jenjangPendidikan = document.getElementById('jenjang-pendidikan').value;
      const whatsapp = document.getElementById('whatsapp').value;
      const basicJepang = document.getElementById('basic-jepang').value;
      const sertifikatJlpt = document.getElementById('sertifikat-jlpt').value;
      const alasan = document.getElementById('alasan').value;

      if (!namaLengkap || !umur || !jenjangPendidikan || !whatsapp || !alasan) {
        Swal.showValidationMessage('Harap isi semua field yang wajib');
        return false;
      }

      return {
        namaLengkap,
        umur,
        jenjangPendidikan,
        whatsapp,
        basicJepang,
        sertifikatJlpt,
        alasan,
        programTitle
      };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const checkoutData = result.value;
      saveCheckoutData(checkoutData);
    }
  });
}

// Fungsi untuk menyimpan data checkout ke Firebase
function saveCheckoutData(data) {
  const checkoutRef = ref(database, 'checkout');
  const newCheckoutRef = push(checkoutRef);

  set(newCheckoutRef, {
    namaLengkap: data.namaLengkap,
    umur: data.umur,
    jenjangPendidikan: data.jenjangPendidikan,
    whatsapp: data.whatsapp,
    basicJepang: data.basicJepang,
    sertifikatJlpt: data.sertifikatJlpt,
    alasan: data.alasan,
    programTitle: data.programTitle,
    createdAt: new Date().toISOString()
  }).then(() => {
    Swal.fire({
      icon: 'success',
      title: 'Thankyou !',
      text: 'Kami akan menghubungi anda via whatsapp untuk informasi lebih lanjut',
    });
  }).catch((error) => {
    console.error("Error saving checkout data:", error);
    Swal.fire({
      icon: 'error',
      title: 'Gagal',
      text: 'Terjadi kesalahan saat menyimpan data checkout.'
    });
  });
}

// Fungsi untuk menghasilkan bintang rating
function generateStarRating(rating) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  let stars = '';
  
  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="fas fa-star"></i>';
  }
  
  if (halfStar) {
    stars += '<i class="fas fa-star-half-alt"></i>';
  }
  
  for (let i = 0; i < 5 - Math.ceil(rating); i++) {
    stars += '<i class="far fa-star"></i>';
  }
  
  return stars;
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