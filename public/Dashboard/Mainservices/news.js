// Import Firebase
// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue, remove, update, get } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

// Initialize Firebase dengan fetch config dari server
let firebaseApp;
let database;
let auth;
async function initializeFirebase() {
  try {
    const response = await fetch('/firebase');
    const firebaseConfig = await response.json();
    
    firebaseApp = initializeApp(firebaseConfig);
    database = getDatabase(firebaseApp);
    auth = getAuth(firebaseApp);
    
    // Setelah Firebase diinisialisasi, load data program
    loadNews();
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    showErrorMessage("Gagal memuat konfigurasi Firebase");
  }
}

// Panggil initializeFirebase saat DOM dimuat

// Inisialisasi CKEditor
let editor;

// Fungsi untuk Menampilkan Form dengan Swal
function showAddNewsForm(news = null, key = null) {
  Swal.fire({
    title: news ? 'Edit Berita' : 'Tambah Berita Baru',
    html: `
    <div class="space-y-6">
   <!-- Input untuk Title -->
  <div>
    <label for="swal-title" class="block text-start text-lg font-medium text-gray-700 mb-2">Title</label>
    <div class="relative">
      <!-- Icon (Opsional) -->
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>
      </div>
      <input
        id="swal-title"
        type="text"
        placeholder="Enter title"
        value="${news ? news.title : ''}"
        class="mt-1 block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 sm:text-sm placeholder-gray-400"
      />
    </div>
  </div>

  <!-- Input untuk Thumbnail (Google Drive ID) -->
  <div>
    <label for="swal-thumbnail" class="block text-start text-lg font-medium text-gray-700 mb-2">Thumbnail (Google Drive ID)</label>
    <div class="relative">
      <!-- Icon (Opsional) -->
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
      </div>
      <input
        id="swal-thumbnail"
        type="link"
        placeholder="Enter Link Google Drive"
        value="${news ? news.thumbnail : ''}"
        class="mt-1 block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 sm:text-sm placeholder-gray-400"
      />
    </div>
  </div>

  <!-- Textarea untuk Description -->
  <div>
    <label for="swal-description" class="block text-lg text-start font-medium text-gray-700">Description</label>
    <textarea
      id="swal-description"
      rows="4"
      placeholder="Enter description"
      class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
    >${news ? news.description : ''}</textarea>
  </div>
</div>`,
    focusConfirm: false,
    didOpen: () => {
      // Inisialisasi CKEditor setelah form SweetAlert2 ditampilkan
      ClassicEditor
        .create(document.querySelector('#swal-description'))
        .then(newEditor => {
          editor = newEditor;
        })
        .catch(error => {
          console.error("Error initializing CKEditor:", error);
        });
    },
    preConfirm: () => {
        // Ambil nilai dari input form
        const title = document.getElementById('swal-title').value;
        const thumbnailLink = document.getElementById('swal-thumbnail').value;
        const description = editor.getData(); // Ambil data dari CKEditor
      
        // Ekstrak ID dari link Google Drive
        const thumbnailId = extractGoogleDriveId(thumbnailLink);
      
        // Validasi link Google Drive
        if (!thumbnailId) {
          Swal.showValidationMessage('Link Google Drive tidak valid');
          return false; // Hentikan proses jika link tidak valid
        }
      
        // Kembalikan objek data yang akan disimpan
        return {
          title: title,
          thumbnail: thumbnailId, // Simpan ID-nya saja
          description: description
        };
      }
  }).then((result) => {
    if (result.isConfirmed) {
      if (news && key) {
        updateNews(key, result.value);
      } else {
        addNews(result.value);
      }
    }
  });
}
function extractGoogleDriveId(url) {
    // Regex untuk mengekstrak ID dari berbagai format link Google Drive
    const regex = /\/file\/d\/([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
  
    // Jika ID ditemukan, kembalikan ID-nya
    if (match && match[1]) {
      return match[1];
    }
  
    // Jika tidak ditemukan, kembalikan null
    return null;
  }
// Fungsi untuk Menambahkan Berita Baru ke Firebase
function addNews(news) {
  const newsRef = ref(database, 'news');
  push(newsRef, news)
    .then(() => {
      Swal.fire('Berhasil!', 'Berita telah ditambahkan.', 'success');
      loadNews();
    })
    .catch((error) => {
      Swal.fire('Gagal!', 'Gagal menambahkan berita.', 'error');
    });
}

// Fungsi untuk Memuat dan Menampilkan Data Berita
function loadNews() {
  const newsRef = ref(database, 'news');
  onValue(newsRef, (snapshot) => {
    const data = snapshot.val();
    const tableBody = document.querySelector('#content-table tbody');
    tableBody.innerHTML = ''; // Clear existing table rows

    if (data) {
      Object.keys(data).forEach((key) => {
        const row = `<tr>
          <td class="px-6 py-4 whitespace-nowrap">${data[key].title}</td>
          <td class="px-6 py-4 whitespace-nowrap"><img src="/image/${data[key].thumbnail}" alt="Thumbnail" style="width:100px;"></td>
          <td class="px-6 py-4 whitespace-nowrap">
            <button class="edit-btn text-blue-600 hover:text-blue-900" data-key="${key}">Edit</button>
            <button class="delete-btn text-red-600 hover:text-red-900" data-key="${key}">Delete</button>
          </td>
        </tr>`;
        tableBody.innerHTML += row;
      });

      // Tambahkan event listener untuk tombol edit dan delete
      document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', () => {
          const key = button.getAttribute('data-key');
          editNews(key);
        });
      });

      document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', () => {
          const key = button.getAttribute('data-key');
          deleteNews(key);
        });
      });
    } else {
      tableBody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">Tidak ada data ditemukan</td></tr>';
    }
  });
}

// Fungsi untuk Edit Berita
function editNews(key) {
  const newsRef = ref(database, `news/${key}`);
  get(newsRef).then((snapshot) => {
    const data = snapshot.val();
    showAddNewsForm(data, key);
  });
}

// Fungsi untuk Update Berita
function updateNews(key, news) {
  const newsRef = ref(database, `news/${key}`);
  update(newsRef, news)
    .then(() => {
      Swal.fire('Berhasil!', 'Berita telah diperbarui.', 'success');
      loadNews();
    })
    .catch((error) => {
      Swal.fire('Gagal!', 'Gagal memperbarui berita.', 'error');
    });
}

// Fungsi untuk Delete Berita
function deleteNews(key) {
  Swal.fire({
    title: 'Apakah Anda yakin?',
    text: "Anda tidak akan bisa mengembalikan ini!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Ya, hapus!'
  }).then((result) => {
    if (result.isConfirmed) {
      remove(ref(database, `news/${key}`)).then(() => {
        Swal.fire('Terhapus!', 'Berita telah dihapus.', 'success');
        loadNews();
      });
    }
  });
}

// Event Listener untuk Button Add News
document.getElementById('add-news').addEventListener('click', () => showAddNewsForm());



// Inisialisasi Firebase saat DOM dimuat
document.addEventListener('DOMContentLoaded', initializeFirebase);