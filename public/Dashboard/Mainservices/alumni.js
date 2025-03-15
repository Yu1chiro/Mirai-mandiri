import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue, remove, get } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-database.js";

// Initialize Firebase
let firebaseApp;
let database;

async function initializeFirebase() {
  try {
    const response = await fetch('/firebase-config');
    const firebaseConfig = await response.json();
    firebaseApp = initializeApp(firebaseConfig);
    database = getDatabase(firebaseApp);
    console.log("Firebase initialized successfully!");

    // Setelah Firebase diinisialisasi, jalankan fungsi-fungsi yang membutuhkan Firebase
    setupEventListeners();
    fetchAlumni();
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
}

// Fungsi untuk mengatur event listener setelah Firebase diinisialisasi
function setupEventListeners() {
    document.getElementById('add-Alumni').addEventListener('click', () => {
      Swal.fire({
        title: 'Tambah Alumni',
        html: `
        <div class="space-y-6 bg-white p-8 rounded-lg shadow-md">
          <div class="space-y-2">
              <label for="nama-alumni" class="block text-start text-sm font-medium text-gray-700">Nama alumni</label>
              <input id="nama-alumni" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Masukkan Nama Tutor">
          </div>
  
          <div class="space-y-2">
              <label for="thumbnail-alumni" class="block text-start text-sm font-medium text-gray-700">Thumbnail alumni (URL Gambar)</label>
              <input id="thumbnail-alumni" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Masukkan URL Gambar">
          </div>
  
          <div class="space-y-2">
              <label for="bidang-alumni" class="block text-start text-sm font-medium text-gray-700">Bidang </label>
              <select id="bidang-alumni" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Pilih</option>
                  <option value="Tokutei Ginou">Tokutei Ginou</option>
                  <option value="Pengolahan Makanan">Pengolahan Makanan</option>
                  <option value="Kontruksi">Kontruksi</option>
                  <option value="Perkebunan">Perkebunan</option>
              </select>
          </div>
  
          <div class="space-y-2">
              <label for="location" class="block text-start text-sm font-medium text-gray-700">Penempatan </label>
              <input id="location" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Masukkan Lokasi Penempatan">
          </div>
  
          <div class="space-y-2">
              <label for="tahun" class="block text-start text-sm font-medium text-gray-700">Tahun </label>
              <input id="tahun" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Pilih Tahun">
          </div>
  
          <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700 mb-2 text-start">Alasan ingin bergabung program ini</label>
              <textarea id="deskripsi" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none" rows="4" required></textarea>
          </div>
        </div>
        `,
        confirmButtonText: 'Tambah',
        focusConfirm: false,
        didOpen: () => {
          // Inisialisasi Flatpickr pada input tahun
          flatpickr("#tahun", {
            dateFormat: "Y", // Hanya menampilkan tahun
            defaultDate: new Date().getFullYear().toString(), // Default ke tahun sekarang
            minDate: "2000", // Batas minimal tahun
            maxDate: new Date().getFullYear().toString(), // Batas maksimal tahun
          });
        },
        preConfirm: () => {
          const nama = document.getElementById('nama-alumni').value;
          const thumbnail = document.getElementById('thumbnail-alumni').value;
          const bidang = document.getElementById('bidang-alumni').value;
          const location = document.getElementById('location').value;
          const tahun = document.getElementById('tahun').value;
          const deskripsi = document.getElementById('deskripsi').value;
  
          if (!nama || !thumbnail || !bidang || !location || !tahun || !deskripsi) {
            Swal.showValidationMessage('Semua field harus diisi');
            return false;
          }
  
          return { nama, thumbnail, bidang, location, tahun, deskripsi };
        }
      }).then((result) => {
        if (result.isConfirmed) {
          const alumniData = result.value;
          addAlumniToDatabase(alumniData);
        }
      });
    });
  }
// Fungsi untuk menambahkan data alumni ke Realtime Database
function addAlumniToDatabase(alumniData) {
    const alumniRef = ref(database, 'alumni-list');
    const newAlumniRef = push(alumniRef);
    set(newAlumniRef, alumniData)
      .then(() => {
        Swal.fire('Berhasil!', 'Alumni berhasil ditambahkan.', 'success');
        fetchAlumni(); // Refresh tabel setelah menambahkan data
      })
      .catch((error) => {
        Swal.fire('Error!', 'Gagal menambahkan alumni.', 'error');
        console.error("Error adding alumni:", error);
      });
  }

// Fungsi untuk mengambil data alumni dari Realtime Database
function fetchAlumni() {
    const alumniRef = ref(database, 'alumni-list');
    const alumniTable = document.getElementById('alumni-table').getElementsByTagName('tbody')[0];
    alumniTable.innerHTML = '<tr><td colspan="7" class="text-center py-4">Memuat data...</td></tr>';
  
    onValue(alumniRef, (snapshot) => {
      alumniTable.innerHTML = ''; // Kosongkan tabel sebelum mengisi ulang
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const alumni = childSnapshot.val();
          const alumniId = childSnapshot.key;
  
          const row = `
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4">${alumni.nama}</td>
              <td class="px-6 py-4"><img src="${alumni.thumbnail}" alt="Thumbnail" class="w-12 h-12 rounded-lg"></td>
              <td class="px-6 py-4">${alumni.bidang}</td>
              <td class="px-6 py-4">${alumni.location}</td>
              <td class="px-6 py-4">${alumni.tahun}</td>
              <td class="px-6 py-4">${alumni.deskripsi}</td>
              <td class="px-6 py-4 flex space-x-2">
                <button onclick="deleteAlumni('${alumniId}')" class="bg-red-600 text-white px-3 py-1 rounded-lg">Hapus</button>
                <button onclick="viewalumniDetail('${alumniId}')" class="bg-green-500 text-white px-3 py-1 rounded-lg">Detail</button>
              </td>
            </tr>
          `;
          alumniTable.innerHTML += row;
        });
      } else {
        alumniTable.innerHTML = '<tr><td colspan="7" class="text-center py-4">Tidak ada data alumni.</td></tr>';
      }
    });
  }

// Fungsi Hapus Alumni
window.deleteAlumni = (alumniId) => {
  Swal.fire({
    title: 'Apakah Anda yakin?',
    text: "Data alumni akan dihapus secara permanen!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Ya, hapus!'
  }).then((result) => {
    if (result.isConfirmed) {
      const alumniRef = ref(database, `alumni-list/${alumniId}`);
      remove(alumniRef)
        .then(() => {
          Swal.fire('Berhasil!', 'Data alumni berhasil dihapus.', 'success');
          fetchAlumni(); // Refresh tabel setelah menghapus data
        })
        .catch((error) => {
          Swal.fire('Error!', 'Gagal menghapus data alumni.', 'error');
          console.error("Error deleting alumni:", error);
        });
    }
  });
};

// Fungsi Detail Alumni
window.viewalumniDetail = (alumniId) => {
    const alumniRef = ref(database, `alumni-list/${alumniId}`);
    get(alumniRef).then((snapshot) => {
      if (snapshot.exists()) {
        const alumni = snapshot.val();
        Swal.fire({
          title: 'Detail Alumni',
          html: `
            <div class="text-left space-y-2">
              <p><strong>Nama:</strong> ${alumni.nama}</p>
              <p><strong>Thumbnail:</strong> <img src="${alumni.thumbnail}" alt="Thumbnail" class="w-12 h-12 rounded-full"></p>
              <p><strong>Bidang:</strong> ${alumni.bidang}</p>
              <p><strong>Penempatan:</strong> ${alumni.location}</p>
              <p><strong>Tahun:</strong> ${alumni.tahun}</p>
              <p><strong>Deskripsi:</strong> ${alumni.deskripsi}</p>
            </div>
          `,
          confirmButtonText: 'Tutup'
        });
      }
    });
  };
// Inisialisasi Firebase saat halaman dimuat
initializeFirebase();