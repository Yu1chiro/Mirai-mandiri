// Import Firebase (tanpa Storage)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue, remove, update, get } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-database.js";

// Initialize Firebase dengan fetch config dari server
let firebaseApp;
let database;

async function initializeFirebase() {
  try {
    const response = await fetch('/firebase');
    const firebaseConfig = await response.json();
    
    firebaseApp = initializeApp(firebaseConfig);
    database = getDatabase(firebaseApp);
    
    // Setelah Firebase diinisialisasi, load data program
    loadPrograms();
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    showErrorMessage("Gagal memuat konfigurasi Firebase");
  }
}

// Fungsi untuk memuat data program dari Firebase
function loadPrograms() {
  const programsRef = ref(database, 'list-program');
  const tableBody = document.getElementById('programTableBody');
  
  // Tampilkan loading indicator
  document.getElementById('loadingIndicator').classList.remove('hidden');
  
  onValue(programsRef, (snapshot) => {
    // Sembunyikan loading indicator
    document.getElementById('loadingIndicator').classList.add('hidden');
    
    if (snapshot.exists()) {
      const programs = snapshot.val();
      tableBody.innerHTML = '';
      
      Object.keys(programs).forEach((key) => {
        const program = programs[key];
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
          <td class="px-6 py-4 whitespace-nowrap">
            <img src="${program.thumbnail || '/img/default-thumbnail.jpg'}" alt="${program.title}" class="h-16 w-24 object-cover rounded">
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-medium text-gray-900">${program.title}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
              ${program.kategori}
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
              ${program.durasi}
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">${program.rate || 0}/5</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            ${program.jumlahAlumni || 0}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button class="edit-btn text-blue-600 hover:text-blue-900 mr-3" data-id="${key}">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button class="delete-btn text-red-600 hover:text-red-900" data-id="${key}">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </td>
        `;
        tableBody.appendChild(row);
      });
      
      // Tambahkan event listeners untuk tombol edit dan delete
      addEventListenersToButtons();
    } else {
      tableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Tidak ada data program</td></tr>';
    }
  }, (error) => {
    console.error("Error loading programs:", error);
    document.getElementById('loadingIndicator').classList.add('hidden');
    tableBody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Gagal memuat data program</td></tr>';
  });
}

// Fungsi untuk menambahkan event listeners ke tombol edit dan delete
function addEventListenersToButtons() {
  // Event listener untuk tombol edit
  document.querySelectorAll('.edit-btn').forEach(button => {
    button.addEventListener('click', function() {
      const programId = this.getAttribute('data-id');
      editProgram(programId);
    });
  });
  
  // Event listener untuk tombol delete
  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', function() {
      const programId = this.getAttribute('data-id');
      deleteProgram(programId);
    });
  });
}

// Fungsi untuk menampilkan form tambah program
async function showAddProgramForm() {
  const { value: formValues } = await Swal.fire({
    html: `
<form id="addProgramForm" class="space-y-6 bg-white p-8 rounded-2xl shadow-lg transform transition-all duration-300 hover:shadow-2xl">
  <h2 class="text-lg font-bold text-gray-800 mb-6 text-center">Tambah Program Baru</h2>
  
  <!-- Judul Program -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1 text-start">Judul Program</label>
    <input id="title" class="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none" type="text" required>
  </div>

  <!-- Thumbnail (URL) -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1 text-start">Thumbnail (URL)</label>
    <input id="thumbnail" class="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none" type="text" placeholder="Masukkan URL gambar">
  </div>

  <!-- Kategori -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1 text-start">Kategori</label>
    <select id="kategori" class="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none appearance-none bg-white">
      <option value="">Pilih kategori</option>
      <option value="Tokutei Ginou">Tokutei Ginou</option>
      <option value="Pengolahan Makanan">Pengolahan Makanan</option>
      <option value="Perkebunan">Perkebunan</option>
      <option value="Pertanian">Pertanian</option>
    </select>
  </div>
  <!-- Durasi Program -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1 text-start">Pilih durasi program</label>
    <select id="durasi" class="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none appearance-none bg-white">
      <option value="">Pilih durasi</option>
      <option value="3 Bulan">3 bulan</option>
      <option value="6 Bulan">6 bulan</option>
     
    </select>
  </div>

  <!-- Rating dan Jumlah Alumni -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1 text-start">Rating (1-5)</label>
      <input id="rate" class="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none" type="number" min="1" max="5" required>
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1 text-start">Jumlah Alumni</label>
      <input id="jumlahAlumni" class="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none" type="number" min="0" required>
    </div>
  </div>

  <!-- Deskripsi -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1 text-start">Deskripsi</label>
    <textarea id="description" class="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none" rows="4" required></textarea>
  </div>

</form>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Simpan',
    cancelButtonText: 'Batal',
    preConfirm: () => {
      const title = document.getElementById('title').value;
      const kategori = document.getElementById('kategori').value;
      const durasi = document.getElementById('durasi').value;
      const rate = document.getElementById('rate').value;
      const jumlahAlumni = document.getElementById('jumlahAlumni').value;
      const description = document.getElementById('description').value;
      const thumbnailUrl = document.getElementById('thumbnail').value;
      
      if (!title || !kategori || !durasi || !rate || !jumlahAlumni || !description) {
        Swal.showValidationMessage('Semua field harus diisi');
        return false;
      }
      
      return {
        title,
        kategori,
        durasi,
        rate,
        jumlahAlumni,
        description,
        thumbnailUrl
      };
    }
  });
  
  if (formValues) {
    // Tampilkan loading
    Swal.fire({
      title: 'Sedang Menyimpan...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    try {
      // Simpan data program ke Firebase
      const programsRef = ref(database, 'list-program');
      const newProgramRef = push(programsRef);
      
      await set(newProgramRef, {
        title: formValues.title,
        thumbnail: formValues.thumbnailUrl || '/img/default-thumbnail.jpg',
        kategori: formValues.kategori,
        durasi: formValues.durasi,
        rate: parseFloat(formValues.rate),
        jumlahAlumni: parseInt(formValues.jumlahAlumni),
        description: formValues.description,
        createdAt: new Date().toISOString()
      });
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Program berhasil ditambahkan',
      });
    } catch (error) {
      console.error("Error adding program:", error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Terjadi kesalahan saat menambahkan program: ' + error.message
      });
    }
  }
}

// Fungsi untuk mengedit program
async function editProgram(programId) {
  try {
    // Ambil data program yang akan diedit
    const programRef = ref(database, `list-program/${programId}`);
    const snapshot = await get(programRef);
    
    if (snapshot.exists()) {
      const program = snapshot.val();
      
      const { value: formValues } = await Swal.fire({
        html: `
        <form id="editProgramForm" class="space-y-8 p-8 bg-white rounded-2xl shadow-xl">
  <h2 class="text-lg font-bold text-gray-900 mb-6">Edit Program</h2>
  
  <div>
    <label class="block text-sm font-semibold text-gray-700 mb-2 text-start">Judul Program</label>
    <input id="edit-title" class="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition duration-200 sm:text-sm" type="text" value="${program.title}" required>
  </div>

  <div>
    <label class="block text-sm font-semibold text-gray-700 mb-2 text-start">Thumbnail (URL)</label>
    <input id="edit-thumbnail" class="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition duration-200 sm:text-sm" type="text" value="${program.thumbnail || ''}" placeholder="Masukkan URL gambar">
  </div>

  <div>
    <label class="block text-sm font-semibold text-gray-700 mb-2 text-start">Kategori</label>
    <select id="edit-kategori" class="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition duration-200 sm:text-sm">
      <option value="Tokutei Ginou" ${program.kategori === 'Tokutei Ginou' ? 'selected' : ''}>Tokutei Ginou</option>
      <option value="Pertanian" ${program.kategori === 'Pertanian' ? 'selected' : ''}>Pertanian</option>
      <option value="Perkebunan" ${program.kategori === 'Perkebunan' ? 'selected' : ''}>Perkebunan</option>
      <option value="Pengolahan Makanan" ${program.kategori === 'Pengolahan Makanan' ? 'selected' : ''}>Pengolahan Makanan</option>
    </select>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-2 text-start">Rating (1-5)</label>
      <input id="edit-rate" class="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition duration-200 sm:text-sm" type="number" min="1" max="5" value="${program.rate}" required>
    </div>

    <div>
      <label class="block text-sm font-semibold text-gray-700 mb-2 text-start">Jumlah Alumni</label>
      <input id="edit-jumlahAlumni" class="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition duration-200 sm:text-sm" type="number" min="0" value="${program.jumlahAlumni}" required>
    </div>
  </div>

  <div>
    <label class="block text-sm font-semibold text-gray-700 mb-2 text-start">Deskripsi</label>
    <textarea id="edit-description" class="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition duration-200 sm:text-sm" rows="5" required>${program.description}</textarea>
  </div>
</form>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Simpan Perubahan',
        cancelButtonText: 'Batal',
        preConfirm: () => {
          const title = document.getElementById('edit-title').value;
          const kategori = document.getElementById('edit-kategori').value;
          const rate = document.getElementById('edit-rate').value;
          const jumlahAlumni = document.getElementById('edit-jumlahAlumni').value;
          const description = document.getElementById('edit-description').value;
          const thumbnailUrl = document.getElementById('edit-thumbnail').value;
          
          if (!title || !kategori || !rate || !jumlahAlumni || !description) {
            Swal.showValidationMessage('Semua field harus diisi');
            return false;
          }
          
          return {
            title,
            kategori,
            rate,
            jumlahAlumni,
            description,
            thumbnailUrl
          };
        }
      });
      
      if (formValues) {
        // Tampilkan loading
        Swal.fire({
          title: 'Sedang Menyimpan...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        try {
          // Update data program di Firebase
          await update(programRef, {
            title: formValues.title,
            thumbnail: formValues.thumbnailUrl || '/img/default-thumbnail.jpg',
            kategori: formValues.kategori,
            rate: parseFloat(formValues.rate),
            jumlahAlumni: parseInt(formValues.jumlahAlumni),
            description: formValues.description,
            updatedAt: new Date().toISOString()
          });
          
          Swal.fire({
            icon: 'success',
            title: 'Berhasil',
            text: 'Program berhasil diperbarui',
            timer: 1500
          });
        } catch (error) {
          console.error("Error updating program:", error);
          Swal.fire({
            icon: 'error',
            title: 'Gagal',
            text: 'Terjadi kesalahan saat memperbarui program: ' + error.message
          });
        }
      }
    } else {
      showErrorMessage("Program tidak ditemukan");
    }
  } catch (error) {
    console.error("Error fetching program:", error);
    showErrorMessage("Gagal memuat data program untuk diedit");
  }
}

// Fungsi untuk menghapus program
function deleteProgram(programId) {
  Swal.fire({
    title: 'Konfirmasi Hapus',
    text: "Apakah Anda yakin ingin menghapus program ini? Tindakan ini tidak dapat dibatalkan.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Ya, Hapus!',
    cancelButtonText: 'Batal'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        // Hapus program dari Firebase
        const programRef = ref(database, `list-program/${programId}`);
        await remove(programRef);
        Swal.fire({
            icon: 'success',
            title: 'Berhasil',
            text: 'Program berhasil dihapus',
            timer: 1500
          });
        } catch (error) {
          console.error("Error deleting program:", error);
          Swal.fire({
            icon: 'error',
            title: 'Gagal',
            text: 'Terjadi kesalahan saat menghapus program: ' + error.message
          });
        }
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
  
  // Event listener untuk tombol tambah program
  document.getElementById('ProgramBtn').addEventListener('click', showAddProgramForm);
  
  // Inisialisasi Firebase dan muat data saat halaman dimuat
  document.addEventListener('DOMContentLoaded', initializeFirebase);