import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-database.js";

let firebaseApp;
let database;

// Fungsi untuk inisialisasi Firebase
async function initializeFirebase() {
  try {
    const response = await fetch('/firebase-config');
    const firebaseConfig = await response.json();
    firebaseApp = initializeApp(firebaseConfig);
    database = getDatabase(firebaseApp);
    console.log("Firebase initialized successfully!");

    // Setelah Firebase diinisialisasi, jalankan fungsi-fungsi yang membutuhkan Firebase
    fetchDataCount('alumni-list', 'alumni-count');
    fetchDataCount('checkout', 'checkout-count');
    fetchDataCount('list-program', 'program-count');
    fetchDataCount('tutor-list', 'tutor-count');

    // Ambil jumlah pengunjung
    const visitorRef = ref(database, 'visitors');
    onValue(visitorRef, (snapshot) => {
      const count = snapshot.exists() ? snapshot.size : 0;
      document.getElementById('visitor-count').textContent = count;
    });
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
}

// Fungsi untuk mengambil jumlah data dari Firebase
function fetchDataCount(path, elementId) {
  const dataRef = ref(database, path);
  onValue(dataRef, (snapshot) => {
    const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
    document.getElementById(elementId).textContent = count;
  }, (error) => {
    console.error(`Error fetching data from ${path}:`, error);
  });
}

// Inisialisasi Firebase saat halaman statistik dimuat
initializeFirebase();