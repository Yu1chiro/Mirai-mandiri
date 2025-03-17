
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-database.js";

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

    // Setelah Firebase diinisialisasi, jalankan fungsi fetching data
    fetchTutors();
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
}

// Fungsi untuk mengambil data tutor dari Realtime Database dan menampilkan dalam card
function fetchTutors() {
  const tutorListContainer = document.getElementById('tutor-list');

  if (!tutorListContainer) {
    console.error("Elemen 'tutor-list' tidak ditemukan di DOM.");
    return;
  }

  tutorListContainer.innerHTML = `
  <div class="flex justify-center items-center py-4">
     <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
     <p class="ms-5">tunggu sebentar...</p>
             </div>
   `;
  const tutorRef = ref(database, 'tutor-list');
  onValue(tutorRef, (snapshot) => {
    tutorListContainer.innerHTML = ''; // Kosongkan container sebelum mengisi ulang
    if (snapshot.exists()) {
      // Iterasi semua data tutor
      snapshot.forEach((childSnapshot) => {
        const tutor = childSnapshot.val();

        // Buat card untuk setiap tutor
        const card = `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-100">
 <div class="relative">
   <img src="${tutor.thumbnail}" alt="${tutor.nama}" class="w-full h-52 object-cover">
   <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
     <span class="inline-block px-3 py-1 text-sm font-semibold text-white bg-yellow-600 rounded-full">${tutor.status}</span>
   </div>
 </div>
 <div class="p-6">
   <h3 class="text-xl font-semibold text-gray-800 mb-2 font-sans">${tutor.nama}</h3>
   <div class="flex items-center mb-3">
     <div class="flex items-center">
      <i class="fa-solid fa-certificate text-2xl text-yellow-600 mr-1"></i>
       <span class="text-lg font-medium text-gray-700">Sertifikasi : ${tutor.sertifikasi}</span>
     </div>
   </div>
   <div class="flex items-center mb-4">
     <svg xmlns="http://www.w3.org/2000/svg" class="h-auto w-8 text-yellow-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
     </svg>
     <span class="text-lg font-medium text-gray-700">Materi : ${tutor.bidangMapel}</span>
   </div>
 </div>
</div>
       `;
        tutorListContainer.innerHTML += card; // Tambahkan card ke container
      });
    } else {
      tutorListContainer.innerHTML = '<p class="text-center text-gray-600">Tidak ada data tutor.</p>';
    }
  });
}

// Inisialisasi Firebase saat halaman dimuat
initializeFirebase();