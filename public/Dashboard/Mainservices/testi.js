// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getDatabase, ref, get, update, remove } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-database.js";

// Initialize Firebase
let firebaseApp;
let database;

// Fungsi untuk inisialisasi Firebase
async function initializeFirebase() {
  try {
    const response = await fetch('/firebase');
    const firebaseConfig = await response.json();
    firebaseApp = initializeApp(firebaseConfig);
    database = getDatabase(firebaseApp);
    console.log("Firebase initialized successfully!");

    // Setelah Firebase diinisialisasi, fetch data testimonial
    fetchTestimonials();
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
}

// Fungsi untuk fetch data testimonial dari Firebase
async function fetchTestimonials() {
  try {
    const testimonialsRef = ref(database, 'testimoni');
    const snapshot = await get(testimonialsRef);

    if (snapshot.exists()) {
      const testimonials = [];
      snapshot.forEach((childSnapshot) => {
        const testimonial = childSnapshot.val();
        testimonial.id = childSnapshot.key; // Simpan ID untuk aksi remove/approve
        testimonials.push(testimonial);
      });

      // Render data ke tabel
      renderTable(testimonials);
    } else {
      console.log("No data available");
      renderTable([]); // Kosongkan tabel jika tidak ada data
    }
  } catch (error) {
    console.error("Error fetching testimonials:", error);
  }
}

// Fungsi untuk render data ke tabel
function renderTable(testimonials) {
  const tableBody = document.querySelector('#alumni-table tbody');
  if (!tableBody) {
    console.error("Table body not found!");
    return;
  }

  tableBody.innerHTML = ''; // Kosongkan tabel sebelum mengisi ulang

  if (testimonials.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="px-6 py-4 text-center text-gray-500">Tidak ada data ditemukan.</td>
      </tr>
    `;
    return;
  }

  testimonials.forEach((testimonial) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${testimonial.name || '-'}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <img src="${testimonial.thumbnail || 'https://via.placeholder.com/40'}" alt="Thumbnail" class="w-10 h-10 rounded-full">
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${testimonial.bidang || '-'}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${testimonial.lokasi || '-'}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${testimonial.tahun || '-'}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${testimonial.pesan || '-'}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button onclick="approveTestimonial('${testimonial.id}')" class="text-green-600 hover:text-green-900">Approve</button>
        <button onclick="removeTestimonial('${testimonial.id}')" class="text-red-600 hover:text-red-900 ml-2">Remove</button>
        <button onclick="showDetail('${testimonial.id}')" class="text-blue-600 hover:text-blue-900">Detail</button>
      </td>
     
    `;
    tableBody.appendChild(row);
  });
}

// Fungsi untuk menampilkan detail testimonial
window.showDetail = async function (testimonialId) {
  try {
    const testimonialRef = ref(database, `testimoni/${testimonialId}`);
    const snapshot = await get(testimonialRef);

    if (snapshot.exists()) {
      const testimonial = snapshot.val();
      openDetailModal(testimonial); // Buka modal dengan detail testimonial
    } else {
      console.error("Testimonial not found!");
    }
  } catch (error) {
    console.error("Error fetching testimonial detail:", error);
  }
};

// Fungsi untuk membuka modal detail
function openDetailModal(testimonial) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50';

  const modalContent = document.createElement('div');
  modalContent.className = 'bg-white p-6 rounded-lg shadow-lg w-full max-w-md';

  modalContent.innerHTML = `
    <h2 class="text-xl font-bold mb-4">Detail Testimonial</h2>
    <div class="space-y-4">
      <p><strong>Nama:</strong> ${testimonial.name || '-'}</p>
      <p><strong>Thumbnail:</strong> <img src="${testimonial.thumbnail || 'https://via.placeholder.com/40'}" alt="Thumbnail" class="w-10 h-10 rounded-full"></p>
      <p><strong>Bidang:</strong> ${testimonial.bidang || '-'}</p>
      <p><strong>Lokasi:</strong> ${testimonial.lokasi || '-'}</p>
      <p><strong>Tahun:</strong> ${testimonial.tahun || '-'}</p>
      <p><strong>Pesan:</strong> ${testimonial.pesan || '-'}</p>
    </div>
    <button onclick="closeDetailModal()" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700">Tutup</button>
  `;

  modal.appendChild(modalContent);
  document.body.appendChild(modal);
}

// Fungsi untuk menutup modal detail
window.closeDetailModal = function () {
  const modal = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
  if (modal) {
    modal.remove();
  }
};

// Fungsi untuk approve testimonial
window.approveTestimonial = async function (testimonialId) {
  try {
    const testimonialRef = ref(database, `testimoni/${testimonialId}`);
    await update(testimonialRef, { approved: true }); // Set approved ke true
    Swal.fire({
        icon: 'success',
        title: 'Approve',
      });
    fetchTestimonials(); // Refresh data setelah approve
  } catch (error) {
    console.error("Error approving testimonial:", error);
  }
};

// Fungsi untuk remove testimonial
window.removeTestimonial = async function (testimonialId) {
  try {
    const testimonialRef = ref(database, `testimoni/${testimonialId}`);
    await remove(testimonialRef); // Hapus testimonial
    Swal.fire({
        icon: 'success',
        title: 'Removed',
      });
    fetchTestimonials(); // Refresh data setelah remove
  } catch (error) {
    console.error("Error removing testimonial:", error);
  }
};

// Jalankan inisialisasi Firebase setelah DOM selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
  initializeFirebase();
});