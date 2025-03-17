import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-database.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-analytics.js";

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

    // Cek apakah userAgent sudah ada di database
    const visitorRef = ref(database, 'visitors');
    onValue(visitorRef, (snapshot) => {
      if (snapshot.exists()) {
        const visitors = snapshot.val();
        const userAgentExists = Object.values(visitors).some(
          (visitor) => visitor.userAgent === navigator.userAgent
        );

        // Jika userAgent belum ada, simpan data pengunjung baru
        if (!userAgentExists) {
          push(visitorRef, {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
          });
        }
      } else {
        // Jika tidak ada data pengunjung sama sekali, simpan data pertama
        push(visitorRef, {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        });
      }
    });

    // Log pengunjung menggunakan Firebase Analytics
    const analytics = getAnalytics(firebaseApp);
    logEvent(analytics, 'page_view');
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
}

// Inisialisasi Firebase saat halaman utama dimuat
initializeFirebase();