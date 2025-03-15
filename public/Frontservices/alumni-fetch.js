import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-database.js";

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

    // Setelah Firebase diinisialisasi, fetch data alumni
    fetchAlumniCards();
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
}

// Fungsi untuk fetch data alumni dan menampilkan dalam card
function fetchAlumniCards() {
  const alumniRef = ref(database, 'alumni-list');
  const alumniCardContainer = document.getElementById('alumni-card');

  // Tampilkan loading indicator
  alumniCardContainer.innerHTML = `
    <div class="col-span-full text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-2 text-gray-600">Memuat data alumni...</p>
    </div>
  `;

  onValue(alumniRef, (snapshot) => {
    alumniCardContainer.innerHTML = ''; // Kosongkan container sebelum mengisi ulang

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const alumni = childSnapshot.val();

        // Buat card template
        const card = `
          <div class="bg-white rounded-lg shadow-lg overflow-hidden">
            <img src="${alumni.thumbnail}" alt="Alumni Image" class="w-full h-48 object-cover">
            <div class="p-6">
              <h3 class="text-lg font-semibold text-gray-800">${alumni.nama}</h3>
              <p class="text-sm text-gray-600 mt-2">
                <strong><i class="fa-solid fa-building me-2 text-lg"></i>Bidang Pekerjaan:</strong> ${alumni.bidang}
              </p>
              <p class="text-sm text-gray-600">
                <strong><i class="fa-solid fa-location-dot me-2 text-lg"></i> Penempatan Kerja:</strong> ${alumni.location}
              </p>
              <p class="text-sm text-gray-600">
                <strong><i class="fa-solid fa-calendar me-2 text-lg"></i> Tahun Berangkat:</strong> ${alumni.tahun}
              </p>
              <p class="text-sm text-gray-600 mt-4">${alumni.deskripsi}</p>
            </div>
          </div>
        `;

        // Tambahkan card ke container
        alumniCardContainer.innerHTML += card;
      });
    } else {
      // Tampilkan pesan jika tidak ada data
      alumniCardContainer.innerHTML = `
        <div class="col-span-full text-center py-8">
          <p class="text-gray-600">Tidak ada data alumni.</p>
        </div>
      `;
    }
  }, (error) => {
    console.error("Error loading alumni data:", error);
    alumniCardContainer.innerHTML = `
      <div class="col-span-full text-center py-8">
        <p class="text-red-600">Gagal memuat data alumni.</p>
      </div>
    `;
  });
}

// Inisialisasi Firebase saat halaman dimuat
initializeFirebase();