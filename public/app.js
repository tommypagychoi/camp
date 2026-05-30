const calendarGrid = document.querySelector("#calendarGrid");
const currentMonthLabel = document.querySelector("#currentMonth");
const prevMonthButton = document.querySelector("#prevMonth");
const nextMonthButton = document.querySelector("#nextMonth");

let visibleDate = new Date();
visibleDate.setDate(1);

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function reservationTouchesDay(reservation, dayKey) {
  return reservation.startDate <= dayKey && reservation.endDate >= dayKey;
}

async function fetchReservations(monthDate) {
  const year = monthDate.getFullYear();
  const month = String(monthDate.getMonth() + 1).padStart(2, "0");
  const response = await fetch(`/api/reservations?month=${year}-${month}`);
  if (!response.ok) throw new Error("예약 정보를 불러오지 못했습니다.");
  return response.json();
}

function renderCalendar(reservations) {
  const year = visibleDate.getFullYear();
  const month = visibleDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const cells = [];

  currentMonthLabel.textContent = `${year}년 ${month + 1}월`;
  ["일", "월", "화", "수", "목", "금", "토"].forEach((day) => cells.push(`<div class="calendar-weekday">${day}</div>`));
  for (let index = 0; index < firstDay.getDay(); index += 1) cells.push('<div class="calendar-day muted"></div>');

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    const dayKey = toDateKey(new Date(year, month, day));
    const reservationHtml = reservations
      .filter((reservation) => reservationTouchesDay(reservation, dayKey))
      .map((reservation) => {
        const paymentLabel = reservation.paymentStatus === "paid" ? "입금확정" : "입금대기";
        const label = `${reservation.name} · ${reservation.people}명 · ${paymentLabel}`;
        return `<span class="reservation-pill ${reservation.status}">${label}</span>`;
      }).join("");
    cells.push(`<div class="calendar-day"><strong>${day}</strong><div class="reservation-list">${reservationHtml}</div></div>`);
  }

  calendarGrid.innerHTML = cells.join("");
}

async function refreshCalendar() {
  calendarGrid.innerHTML = '<div class="calendar-loading">예약 정보를 불러오는 중입니다.</div>';
  try {
    renderCalendar(await fetchReservations(visibleDate));
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

refreshCalendar();
