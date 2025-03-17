import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getDatabase, ref, push, set } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-database.js";

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
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    showAlert("Error initializing Firebase. Please try again.", "error");
  }
}

function setupEventListeners() {
  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  } else {
    console.error("Form element not found!");
  }
}

async function handleFormSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);

  const name = formData.get('name');
  const thumbnail = formData.get('thumbnail');
  const bidang = formData.get('bidang');
  const lokasi = formData.get('lokasi');
  const tahun = formData.get('tahun');
  const pesan = formData.get('pesan');

  const testimonialData = {
    name,
    thumbnail,
    bidang,
    lokasi,
    tahun,
    pesan,
    timestamp: new Date().toISOString()
  };

  showLoading();

  try {
    const newTestimonialRef = push(ref(database, 'testimoni'));
    await set(newTestimonialRef, testimonialData);
    console.log("Testimonial submitted successfully!");

    // Beri jeda 1 detik sebelum menampilkan alert
    setTimeout(() => {
      showAlert("Testimonial submitted successfully!", "success");
    }, 1000);

    form.reset();
  } catch (error) {
    console.error("Error submitting testimonial:", error);

    // Beri jeda 1 detik sebelum menampilkan alert error
    setTimeout(() => {
      showAlert("Error submitting testimonial. Please try again.", "error");
    }, 1000);
  } finally {
    hideLoading();
  }
}

// Fungsi untuk menampilkan loading overlay
function showLoading() {
  const loadingOverlay = document.createElement('div');
  loadingOverlay.id = 'loading-overlay';
  loadingOverlay.className = 'fixed top-0 left-0 w-full h-full bg-white bg-opacity-80 flex justify-center items-center z-50';
  
  const loadingSpinner = document.createElement('div');
  loadingSpinner.className = 'text-lg font-semibold text-gray-800';
  loadingSpinner.textContent = 'Loading...';

  loadingOverlay.appendChild(loadingSpinner);
  document.body.appendChild(loadingOverlay);
}

// Fungsi untuk menyembunyikan loading overlay
function hideLoading() {
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.remove();
  }
}

// Fungsi untuk menampilkan alert Tailwind CSS
function showAlert(message, type) {
  const alertContainer = document.createElement('div');
  alertContainer.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg text-white ${
    type === "success" ? "bg-green-500" : "bg-red-500"
  }`;

  const alertMessage = document.createElement('p');
  alertMessage.textContent = message;
  alertContainer.appendChild(alertMessage);

  document.body.appendChild(alertContainer);

  // Hapus alert setelah 3 detik
  setTimeout(() => {
    alertContainer.remove();
  }, 3000);
}

// Initialize Firebase when the script loads
initializeFirebase();