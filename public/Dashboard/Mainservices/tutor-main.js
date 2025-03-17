import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue, remove, update, get } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-database.js";

// Initialize Firebase
let firebaseApp;
let database;

async function initializeFirebase() {
  try {
    const response = await fetch('/firebase');
    const firebaseConfig = await response.json();
    firebaseApp = initializeApp(firebaseConfig);
    database = getDatabase(firebaseApp);
    console.log("Firebase initialized successfully!");

    // Setelah Firebase diinisialisasi, jalankan fungsi-fungsi yang membutuhkan Firebase
    setupEventListeners();
    fetchTutors();
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
}

// Fungsi untuk mengatur event listener setelah Firebase diinisialisasi
function setupEventListeners() {
  document.getElementById('add-tutor').addEventListener('click', () => {
    Swal.fire({
      title: 'Tambah Tutor Baru',
      html: `
      <div class="space-y-6 bg-white p-8 rounded-lg shadow-md">
    <div class="space-y-2">
        <label for="nama-tutor" class="block text-start text-sm font-medium text-gray-700">Nama Tutor</label>
        <input id="nama-tutor" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Masukkan Nama Tutor">
    </div>

    <div class="space-y-2">
        <label for="thumbnail-tutor" class="block text-start text-sm font-medium text-gray-700">Thumbnail Tutor (URL Gambar)</label>
        <input id="thumbnail-tutor" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Masukkan URL Gambar">
    </div>

    <div class="space-y-2">
        <label for="status-tutor" class="block text-start text-sm font-medium text-gray-700">Status Tutor</label>
        <select id="status-tutor" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="Pegawai">Pegawai</option>
            <option value="Staff">Staff</option>
            <option value="CEO">CEO</option>
            <option value="Mahasiswa">Mahasiswa</option>
        </select>
    </div>

    <div class="space-y-2">
        <label for="sertifikasi-tutor" class="block text-start text-sm font-medium text-gray-700">Sertifikasi Tutor</label>
        <select id="sertifikasi-tutor" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="JLPT N1">JLPT N1</option>
            <option value="JLPT N2">JLPT N2</option>
            <option value="JLPT N3">JLPT N3</option>
            <option value="JLPT N4">JLPT N4</option>
        </select>
    </div>

    <div class="space-y-2">
        <label for="bidang-mapel" class="block text-start text-sm font-medium text-gray-700">Bidang Mata Pelajaran</label>
        <select id="bidang-mapel" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="Bunpou">Bunpou</option>
            <option value="Kanji">Kanji</option>
            <option value="Kaiwa">Kaiwa</option>
        </select>
    </div>
</div>
      `,
      confirmButtonText:'Tambah',
      focusConfirm: false,
      preConfirm: () => {
        const nama = document.getElementById('nama-tutor').value;
        const thumbnail = document.getElementById('thumbnail-tutor').value;
        const status = document.getElementById('status-tutor').value;
        const sertifikasi = document.getElementById('sertifikasi-tutor').value;
        const bidangMapel = document.getElementById('bidang-mapel').value;

        if (!nama || !thumbnail || !status || !sertifikasi || !bidangMapel) {
          Swal.showValidationMessage('Semua field harus diisi');
          return false;
        }

        return { nama, thumbnail, status, sertifikasi, bidangMapel };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const tutorData = result.value;
        addTutorToDatabase(tutorData);
      }
    });
  });
}

// Fungsi untuk menambahkan data tutor ke Realtime Database
function addTutorToDatabase(tutorData) {
  const tutorRef = ref(database, 'tutor-list');
  const newTutorRef = push(tutorRef);
  set(newTutorRef, tutorData)
    .then(() => {
      Swal.fire('Berhasil!', 'Tutor berhasil ditambahkan.', 'success');
      fetchTutors(); // Refresh tabel setelah menambahkan data
    })
    .catch((error) => {
      Swal.fire('Error!', 'Gagal menambahkan tutor.', 'error');
      console.error("Error adding tutor:", error);
    });
}

// Fungsi untuk mengambil data tutor dari Realtime Database
function fetchTutors() {
  const tutorRef = ref(database, 'tutor-list');
  const tutorTable = document.getElementById('tutor-table').getElementsByTagName('tbody')[0];
  tutorTable.innerHTML = '<tr><td colspan="6" class="text-center py-4">Memuat data...</td></tr>';

  onValue(tutorRef, (snapshot) => {
    tutorTable.innerHTML = ''; // Kosongkan tabel sebelum mengisi ulang
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const tutor = childSnapshot.val();
        const tutorId = childSnapshot.key;

        const row = `
          <tr class="hover:bg-gray-50">
            <td class="px-6 py-4">${tutor.nama}</td>
            <td class="px-6 py-4"><img src="${tutor.thumbnail}" alt="Thumbnail" class="w-12 h-12 rounded-lg"></td>
            <td class="px-6 py-4">${tutor.status}</td>
            <td class="px-6 py-4">${tutor.sertifikasi}</td>
            <td class="px-6 py-4">${tutor.bidangMapel}</td>
            <td class="px-6 py-4 flex space-x-2">
              <button onclick="editTutor('${tutorId}')" class="bg-yellow-700 text-white px-3 py-1 rounded-lg">Edit</button>
              <button onclick="deleteTutor('${tutorId}')" class="bg-red-600 text-white px-3 py-1 rounded-lg">Hapus</button>
              <button onclick="viewTutorDetail('${tutorId}')" class="bg-green-500 text-white px-3 py-1 rounded-lg">Detail</button>
            </td>
          </tr>
        `;
        tutorTable.innerHTML += row;
      });
    } else {
      tutorTable.innerHTML = '<tr><td colspan="6" class="text-center py-4">Tidak ada data tutor.</td></tr>';
    }
  });
}

// Fungsi Edit Tutor
window.editTutor = (tutorId) => {
  const tutorRef = ref(database, `tutor-list/${tutorId}`);
  get(tutorRef).then((snapshot) => {
    if (snapshot.exists()) {
      const tutor = snapshot.val();
      Swal.fire({
        title: 'Edit Tutor',
        html: `
          <div class="space-y-6 bg-white p-8 rounded-lg shadow-md">
    <!-- Nama Tutor -->
    <div class="space-y-2">
        <label for="edit-nama-tutor" class="block text-start text-sm font-medium text-gray-700">Nama Tutor</label>
        <input id="edit-nama-tutor" value="${tutor.nama}" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Masukkan Nama Tutor">
    </div>

    <!-- Thumbnail Tutor -->
    <div class="space-y-2">
        <label for="edit-thumbnail-tutor" class="block text-start text-sm font-medium text-gray-700">Thumbnail Tutor (URL Gambar)</label>
        <input id="edit-thumbnail-tutor" value="${tutor.thumbnail}" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Masukkan URL Gambar">
    </div>

    <!-- Status Tutor -->
    <div class="space-y-2">
        <label for="edit-status-tutor" class="block text-start text-sm font-medium text-gray-700">Status Tutor</label>
        <select id="edit-status-tutor" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="Pegawai" ${tutor.status === 'Pegawai' ? 'selected' : ''}>Pegawai</option>
            <option value="Staff" ${tutor.status === 'Staff' ? 'selected' : ''}>Staff</option>
            <option value="CEO" ${tutor.status === 'CEO' ? 'selected' : ''}>CEO</option>
            <option value="Mahasiswa" ${tutor.status === 'Mahasiswa' ? 'selected' : ''}>Mahasiswa</option>
        </select>
    </div>

    <!-- Sertifikasi Tutor -->
    <div class="space-y-2">
        <label for="edit-sertifikasi-tutor" class="block text-start text-sm font-medium text-gray-700">Sertifikasi Tutor</label>
        <select id="edit-sertifikasi-tutor" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="JLPT N1" ${tutor.sertifikasi === 'JLPT N1' ? 'selected' : ''}>JLPT N1</option>
            <option value="JLPT N2" ${tutor.sertifikasi === 'JLPT N2' ? 'selected' : ''}>JLPT N2</option>
            <option value="JLPT N3" ${tutor.sertifikasi === 'JLPT N3' ? 'selected' : ''}>JLPT N3</option>
            <option value="JLPT N4" ${tutor.sertifikasi === 'JLPT N4' ? 'selected' : ''}>JLPT N4</option>
        </select>
    </div>

    <!-- Bidang Mata Pelajaran -->
    <div class="space-y-2">
        <label for="edit-bidang-mapel" class="block text-start text-sm font-medium text-gray-700">Bidang Mata Pelajaran</label>
        <select id="edit-bidang-mapel" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="Bunpou" ${tutor.bidangMapel === 'Bunpou' ? 'selected' : ''}>Bunpou</option>
            <option value="Kanji" ${tutor.bidangMapel === 'Kanji' ? 'selected' : ''}>Kanji</option>
            <option value="Kaiwa" ${tutor.bidangMapel === 'Kaiwa' ? 'selected' : ''}>Kaiwa</option>
        </select>
    </div>
</div>
        `, 
        confirmButtonText:'Save',
        focusConfirm: false,
        preConfirm: () => {
          const nama = document.getElementById('edit-nama-tutor').value;
          const thumbnail = document.getElementById('edit-thumbnail-tutor').value;
          const status = document.getElementById('edit-status-tutor').value;
          const sertifikasi = document.getElementById('edit-sertifikasi-tutor').value;
          const bidangMapel = document.getElementById('edit-bidang-mapel').value;

          if (!nama || !thumbnail || !status || !sertifikasi || !bidangMapel) {
            Swal.showValidationMessage('Semua field harus diisi');
            return false;
          }

          return { nama, thumbnail, status, sertifikasi, bidangMapel };
        }
      }).then((result) => {
        if (result.isConfirmed) {
          const updatedData = result.value;
          update(tutorRef, updatedData)
            .then(() => {
              Swal.fire('Berhasil!', 'Data tutor berhasil diperbarui.', 'success');
              fetchTutors(); // Refresh tabel setelah mengedit data
            })
            .catch((error) => {
              Swal.fire('Error!', 'Gagal memperbarui data tutor.', 'error');
              console.error("Error updating tutor:", error);
            });
        }
      });
    }
  });
};

// Fungsi Hapus Tutor
window.deleteTutor = (tutorId) => {
  Swal.fire({
    title: 'Apakah Anda yakin?',
    text: "Data tutor akan dihapus secara permanen!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Ya, hapus!'
  }).then((result) => {
    if (result.isConfirmed) {
      const tutorRef = ref(database, `tutor-list/${tutorId}`);
      remove(tutorRef)
        .then(() => {
          Swal.fire('Berhasil!', 'Data tutor berhasil dihapus.', 'success');
          fetchTutors(); // Refresh tabel setelah menghapus data
        })
        .catch((error) => {
          Swal.fire('Error!', 'Gagal menghapus data tutor.', 'error');
          console.error("Error deleting tutor:", error);
        });
    }
  });
};

// Fungsi Detail Tutor
window.viewTutorDetail = (tutorId) => {
  const tutorRef = ref(database, `tutor-list/${tutorId}`);
  get(tutorRef).then((snapshot) => {
    if (snapshot.exists()) {
      const tutor = snapshot.val();
      Swal.fire({
        title: 'Detail Tutor',
        html: `
          <div class="text-left space-y-2">
            <p><strong>Nama:</strong> ${tutor.nama}</p>
            <p><strong>Thumbnail:</strong> <img src="${tutor.thumbnail}" alt="Thumbnail" class="w-12 h-12 rounded-full"></p>
            <p><strong>Status:</strong> ${tutor.status}</p>
            <p><strong>Sertifikasi:</strong> ${tutor.sertifikasi}</p>
            <p><strong>Bidang Mapel:</strong> ${tutor.bidangMapel}</p>
          </div>
        `,
        confirmButtonText: 'Tutup'
      });
    }
  });
};

// Inisialisasi Firebase saat halaman dimuat
initializeFirebase();