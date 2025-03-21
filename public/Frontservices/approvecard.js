// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-database.js";

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

    // Setelah Firebase diinisialisasi, fetch data testimonial yang sudah di-approve
    fetchApprovedTestimonials();
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
}

// Fungsi untuk fetch data testimonial yang sudah di-approve
async function fetchApprovedTestimonials() {
  try {
    const testimonialsRef = ref(database, 'testimoni');
    const snapshot = await get(testimonialsRef);

    if (snapshot.exists()) {
      const testimonials = [];
      snapshot.forEach((childSnapshot) => {
        const testimonial = childSnapshot.val();
        if (testimonial.approved) { // Hanya ambil yang approved
          testimonials.push(testimonial);
        }
      });

      // Render data ke card
      renderApprovedCards(testimonials);
    } else {
      console.log("No data available");
      renderApprovedCards([]); // Kosongkan card jika tidak ada data
    }
  } catch (error) {
    console.error("Error fetching approved testimonials:", error);
  }
}

// Fungsi untuk render data yang di-approve ke card
function renderApprovedCards(testimonials) {
  const cardContainer = document.getElementById('testi-card');
  if (!cardContainer) {
    console.error("Card container not found!");
    return;
  }

  cardContainer.innerHTML = ''; // Kosongkan container sebelum mengisi ulang

  if (testimonials.length === 0) {
    const containerContent = document.querySelector('.alumni-content'); // Ambil elemen dengan class container-content
    // Tambahkan class 'hidden' ke container-content jika tidak ada data
    if (containerContent) {
      containerContent.classList.add('hidden');
    }   

    return;
  }

  testimonials.forEach((testimonial) => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-lg overflow-hidden';
    card.innerHTML = `
      <img src="/image/${testimonial.thumbnail || 'https://via.placeholder.com/300'}" alt="Alumni Image" class="w-full h-48 object-cover">
      <div class="p-6">
        <h3 class="text-lg font-semibold text-gray-800">${testimonial.name || 'Nama Alumni'}</h3>
        <p class="text-sm text-gray-600 mt-2">
          <strong><i class="fa-solid fa-building me-2 text-lg"></i>Bidang Pekerjaan:</strong> ${testimonial.bidang || '-'}
        </p>
        <p class="text-sm text-gray-600">
          <strong><i class="fa-solid fa-location-dot me-2 text-lg"></i> Penempatan Kerja:</strong> ${testimonial.lokasi || '-'}
        </p>
        <p class="text-sm text-gray-600">
          <strong><i class="fa-solid fa-calendar me-2 text-lg"></i> Tahun Berangkat:</strong> ${testimonial.tahun || '-'}
        </p>
        <p class="text-sm text-gray-600 mt-4">${testimonial.pesan || 'Tidak ada pesan.'}</p>
      </div>
    `;
    cardContainer.appendChild(card);
  });
}

// Jalankan inisialisasi Firebase setelah DOM selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
  initializeFirebase();
});