import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

// Inisialisasi Firebase
let firebaseApp;
let database;
let auth;

async function initializeFirebase() {
  try {
    const response = await fetch('/firebase'); // Ambil konfigurasi Firebase dari server
    const firebaseConfig = await response.json();

    firebaseApp = initializeApp(firebaseConfig); // Inisialisasi Firebase
    database = getDatabase(firebaseApp); // Dapatkan instance database
    auth = getAuth(firebaseApp); // Dapatkan instance auth

    console.log("Firebase initialized successfully!");

    // Setelah Firebase diinisialisasi, load data
    loadNews();
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    showErrorMessage("Gagal memuat konfigurasi Firebase");
  }
}

// Fungsi untuk memuat data dari Firebase Realtime Database
function loadNews() {
  const newsRef = ref(database, 'news'); // Ganti 'news' dengan path yang sesuai di database Anda

  onValue(newsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      displayData(data);
    } else {
      console.log("No data available");
      showErrorMessage("Tidak ada data yang tersedia");
    }
  }, (error) => {
    console.error("Error fetching data:", error);
    showErrorMessage("Gagal memuat data");
  });
}

// Fungsi untuk menampilkan data ke dalam template HTML
function displayData(data) {
  const informationContainer = document.getElementById('information');

  // Loop melalui data dan buat elemen HTML untuk setiap item
  Object.keys(data).forEach((key) => {
    const item = data[key];
    const content = `
      <div class="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
        <div class="flex flex-col md:flex-row items-center">
          <!-- Gambar (Lebih Besar) -->
          <div class="w-full md:w-1/2 lg:w-2/5">
            <img src="/image/${item.thumbnail}" alt="Banner Image" style="border-radius: 25px;" class="w-full h-full object-cover p-5 rounded-lg">
          </div>

          <!-- Konten Informasi -->
          <div class="w-full md:w-1/2 lg:w-3/5 p-5">
            <!-- Badge/Status Update -->
            <!-- Judul -->
            <h2 class="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              ${item.title}
            </h2>
            <!-- Deskripsi -->
            <div class="mb-5">
            ${item.description}
            </div>
            <!-- Tombol -->
            <a href="https://wa.me/6285333559620?text=Hallo+min+saya+ingin+tanya+terkait+pendaftaran+${item.title}" class="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-300">
              Konsul
            </a>
          </div>
        </div>
      </div>
    `;
    informationContainer.innerHTML += content; // Tambahkan konten ke container
  });
}

// Fungsi untuk menampilkan pesan error
function showErrorMessage() {
    const containerContent = document.querySelector('.container-content'); // Ambil elemen dengan class container-content
  
    // Tampilkan pesan error  
    // Tambahkan class 'hidden' ke container-content jika tidak ada data
    if (containerContent) {
      containerContent.classList.add('hidden');
    }
  }

// Jalankan inisialisasi Firebase saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
  initializeFirebase();
});