const firebaseConfig = {
  apiKey: "AIzaSyA9t21iW6BnWe-c67CtMsk8V5j7j4MBb70",
  authDomain: "dreamsbeautiy.firebaseapp.com",
  projectId: "dreamsbeautiy",
  storageBucket: "dreamsbeautiy.firebasestorage.app",
  messagingSenderId: "1034221935895",
  appId: "1:1034221935895:web:e1c7f71d18711a62452b52"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

window.db = db;
window.auth = auth;