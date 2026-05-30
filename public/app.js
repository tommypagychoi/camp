const calendarGrid = document.querySelector("#calendarGrid");
const currentMonthLabel = document.querySelector("#currentMonth");
const prevMonthButton = document.querySelector("#prevMonth");
const nextMonthButton = document.querySelector("#nextMonth");
const form = document.querySelector("#reservationForm");
const formMessage = document.querySelector("#formMessage");

let visibleDate = new Date();
visibleDate.setDate(1);

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function reservationTouchesDay(reservation, dayKey) {
  return reservation.startDate <= dayKey && reservation.endDate >= dayKey;
}

async function fetchReservations(monthDate) {
  const year = monthDate.getFullYear();
  const month = String(monthDate.getMonth() + 1).padStart(2, "0");
  const response = await fetch(`/api/reservations?month=${year}-${month}`);

  if (!response.ok) {
    throw new Error("예약 정보를 불러오지 못했습니다.");
  }

  return response.json();
}

function renderCalendar(reservations) {
  const year = visibleDate.getFullYear();
  const month = visibleDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const cells = [];

  currentMonthLabel.textContent = `${year}년 ${month + 1}월`;

  ["일", "월", "화", "수", "목", "금", "토"].forEach((day) => {
    cells.push(`<div class="calendar-weekday">${day}</div>`);
  });

  for (let index = 0; index < startOffset; index += 1) {
    cells.push('<div class="calendar-day muted"></div>');
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    const date = new Date(year, month, day);
    const dayKey = toDateKey(date);
    const dayReservations = reservations.filter((reservation) => reservationTouchesDay(reservation, dayKey));
    const reservationHtml = dayReservations.map((reservation) => {
      const label = `${reservation.name} · ${reservation.people}명`;
      return `<span class="reservation-pill ${reservation.status}">${label}</span>`;
    }).join("");

    cells.push(`
      <div class="calendar-day">
        <strong>${day}</strong>
        <div class="reservation-list">${reservationHtml}</div>
      </div>
    `);
  }

  calendarGrid.innerHTML = cells.join("");
}

async function refreshCalendar() {
  calendarGrid.innerHTML = '<div class="calendar-loading">예약 정보를 불러오는 중입니다.</div>';
  try {
    const reservations = await fetchReservations(visibleDate);
    renderCalendar(reservations);
  } catch (error) {
    calendarGrid.innerHTML = `<div class="calendar-loading error">${error.message}</div>`;
  }
}

prevMonthButton.addEventListener("click", () => {
  visibleDate = new Date(visibleDate.getFullYear(), visibleDate.getMonth() - 1, 1);
  refreshCalendar();
});

nextMonthButton.addEventListener("click", () => {
  visibleDate = new Date(visibleDate.getFullYear(), visibleDate.getMonth() + 1, 1);
  refreshCalendar();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formMessage.textContent = "예약 요청을 등록하는 중입니다.";

  const data = new FormData(form);
  const equipment = data.getAll("equipment");
  const payload = {
    name: data.get("name"),
    phone: data.get("phone"),
    startDate: data.get("startDate"),
    endDate: data.get("endDate"),
    people: Number(data.get("people")),
    equipment,
    message: data.get("message")
  };

  if (parseDateKey(payload.startDate) > parseDateKey(payload.endDate)) {
    formMessage.textContent = "종료일은 시작일 이후로 선택해주세요.";
    return;
  }

  const response = await fetch("/api/reservations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const result = await response.json();

  if (!response.ok) {
    formMessage.textContent = result.error || "예약 등록에 실패했습니다.";
    return;
  }

  form.reset();
  form.elements.people.value = 2;
  formMessage.textContent = result.message;
  await refreshCalendar();
});

refreshCalendar();
