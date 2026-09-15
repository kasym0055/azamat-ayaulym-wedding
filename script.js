"use strict";

// Замените только эти значения при подключении своего проекта Supabase.
const SUPABASE_URL = "https://chcgjtrxtajyzdnsbyeq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_PMajE5sRli2-eH4c1lII3g_j7Ch2HEk";
const TWO_GIS_URL = "https://2gis.kz/shymkent/geo/70000001026017256/69.619672,42.307668";
const MUSIC_START_TIME = 16;

document.body.classList.add("js-enabled");

// Ссылка уже предоставлена вместе с приглашением; при желании её можно заменить здесь.
document.getElementById("gis-link").href = TWO_GIS_URL;

// Октябрь 2026: 1 октября — четверг, 25 октября — воскресенье.
const calendarDays = document.getElementById("calendar-days");
const mondayOffset = (new Date(Date.UTC(2026, 9, 1)).getUTCDay() + 6) % 7;
const totalCells = Math.ceil((mondayOffset + 31) / 7) * 7;
for (let week = 0; week < totalCells / 7; week += 1) {
  const row = document.createElement("div");
  row.className = "calendar-row";
  row.setAttribute("role", "row");
  for (let weekday = 0; weekday < 7; weekday += 1) {
    const day = week * 7 + weekday - mondayOffset + 1;
    const cell = document.createElement("span");
    cell.className = "calendar-day";
    cell.setAttribute("role", "cell");
    if (day >= 1 && day <= 31) {
      const number = document.createElement("span");
      number.textContent = String(day);
      cell.append(number);
      if (day === 25) {
        cell.classList.add("is-wedding");
        cell.setAttribute("aria-label", "25 қазан, той күні");
      }
    } else {
      cell.setAttribute("aria-hidden", "true");
    }
    row.append(cell);
  }
  calendarDays.append(row);
}

// 18:00 в Шымкенте (UTC+5) = 13:00 UTC.
const weddingTime = Date.UTC(2026, 9, 25, 13, 0, 0);
const countdownParts = {
  days: document.getElementById("days"),
  hours: document.getElementById("hours"),
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds")
};
const finishedMessage = document.getElementById("countdown-finished");
function updateCountdown() {
  let remaining = Math.max(0, Math.floor((weddingTime - Date.now()) / 1000));
  const days = Math.floor(remaining / 86400);
  remaining %= 86400;
  const hours = Math.floor(remaining / 3600);
  remaining %= 3600;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  countdownParts.days.textContent = String(days);
  countdownParts.hours.textContent = String(hours).padStart(2, "0");
  countdownParts.minutes.textContent = String(minutes).padStart(2, "0");
  countdownParts.seconds.textContent = String(seconds).padStart(2, "0");
  finishedMessage.hidden = Date.now() < weddingTime;
}
updateCountdown();
setInterval(updateCountdown, 1000);

const audio = document.getElementById("background-music");
const musicButton = document.getElementById("music-button");
const musicStatus = document.getElementById("music-status");
let firstPlay = true;
let musicLoading = false;
function updateMusicButton() {
  const playing = !audio.paused;
  musicButton.classList.toggle("is-playing", playing);
  musicButton.setAttribute("aria-pressed", String(playing));
  const label = playing ? "Музыканы тоқтату" : "Музыканы қосу";
  musicButton.setAttribute("aria-label", label);
  musicButton.title = label;
}
musicButton.addEventListener("click", async () => {
  if (musicLoading) return;
  if (!audio.paused) {
    audio.pause();
    musicStatus.textContent = "Музыка тоқтатылды";
    return;
  }
  musicLoading = true;
  musicButton.disabled = true;
  try {
    if (firstPlay) {
      audio.preload = "auto";
      audio.addEventListener("loadedmetadata", () => {
        if (firstPlay && audio.duration > MUSIC_START_TIME) audio.currentTime = MUSIC_START_TIME;
      }, { once: true });
      audio.load();
      // Установка позиции и вызов play происходят в том же жесте пользователя.
      try { audio.currentTime = MUSIC_START_TIME; } catch (_) { /* metadata ещё загружаются */ }
    }
    await audio.play();
    if (firstPlay) {
      if (audio.duration > MUSIC_START_TIME && audio.currentTime < MUSIC_START_TIME - 0.5) audio.currentTime = MUSIC_START_TIME;
      firstPlay = false;
    }
    musicStatus.textContent = "Музыка қосылды";
  } catch (_) {
    musicStatus.textContent = "Музыка қолжетімсіз. Файлды тексеріңіз.";
  } finally {
    musicLoading = false;
    musicButton.disabled = false;
    updateMusicButton();
  }
});
audio.addEventListener("play", updateMusicButton);
audio.addEventListener("pause", updateMusicButton);
audio.addEventListener("error", () => {
  musicStatus.textContent = "Музыка қолжетімсіз. Файлды тексеріңіз.";
  updateMusicButton();
});

const rsvpForm = document.getElementById("rsvp-form");
const guestName = document.getElementById("guest-name");
const formMessage = document.getElementById("form-message");
const submitButton = document.getElementById("submit-button");
function showFormError(message, focusTarget) {
  formMessage.textContent = message;
  if (focusTarget) focusTarget.focus();
}
guestName.addEventListener("input", () => {
  guestName.classList.remove("is-invalid");
  formMessage.textContent = "";
});
rsvpForm.querySelectorAll('input[name="attendance"]').forEach((radio) => {
  radio.addEventListener("change", () => { formMessage.textContent = ""; });
});
rsvpForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = guestName.value.trim();
  const selected = rsvpForm.querySelector('input[name="attendance"]:checked');
  if (!name) {
    guestName.classList.add("is-invalid");
    showFormError("Аты-жөніңізді жазыңыз.", guestName);
    return;
  }
  if (!selected) {
    showFormError("Тойға қатысу туралы жауапты таңдаңыз.", rsvpForm.querySelector('input[name="attendance"]'));
    return;
  }
  if (!SUPABASE_URL.startsWith("https://") || SUPABASE_ANON_KEY === "YOUR_SUPABASE_ANON_KEY") {
    showFormError("Жауапты сақтау әзірше қосылмаған. Supabase параметрлерін енгізіңіз.");
    return;
  }
  submitButton.disabled = true;
  submitButton.textContent = "Жіберілуде…";
  formMessage.textContent = "";
  try {
    const endpoint = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/wedding_rsvps`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({ guest_name: name, attendance: selected.value })
    });
    if (!response.ok) throw new Error(`Guest response save failed (${response.status})`);
    rsvpForm.hidden = true;
    document.getElementById("success-message").hidden = false;
  } catch (_) {
    showFormError("Қате орын алды. Қайтадан жіберіп көріңіз.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Жіберу";
  }
});

const restaurantImage = document.querySelector(".restaurant-photo img");
restaurantImage.addEventListener("error", () => {
  restaurantImage.hidden = true;
  restaurantImage.parentElement.classList.add("image-unavailable");
});

const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }
  }, { rootMargin: "0px 0px -35px 0px", threshold: 0.08 });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}
