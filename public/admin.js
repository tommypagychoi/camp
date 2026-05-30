const loginForm = document.querySelector("#adminLogin");
const adminMessage = document.querySelector("#adminMessage");
const adminList = document.querySelector("#adminList");
let adminKey = "";

const statusLabels = { pending: "확인대기", confirmed: "예약확정", canceled: "예약취소" };
const paymentLabels = { unpaid: "입금대기", paid: "입금완료", refunded: "환불완료" };

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", "x-admin-key": adminKey, ...(options.headers || {}) }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "요청에 실패했습니다.");
  return data;
}

function reservationCard(reservation) {
  const equipment = reservation.equipment?.length ? reservation.equipment.join(", ") : "선택 없음";
  return `
    <article class="admin-card" data-id="${reservation.id}">
      <div><strong>${reservation.name}</strong><span>${reservation.phone}</span></div>
      <p>${reservation.startDate} ~ ${reservation.endDate} · ${reservation.people}명</p>
      <p>장비: ${equipment}</p>
      <p>입금자명: ${reservation.depositName || "-"}</p>
      <p>요청: ${reservation.message || "-"}</p>
      <div class="admin-controls">
        <label>예약 상태 <select name="status">${Object.entries(statusLabels).map(([value, label]) => `<option value="${value}" ${reservation.status === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
        <label>입금 상태 <select name="paymentStatus">${Object.entries(paymentLabels).map(([value, label]) => `<option value="${value}" ${reservation.paymentStatus === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
        <label>입금액 <input name="depositAmount" type="number" min="0" value="${reservation.depositAmount || 0}"></label>
      </div>
      <div class="admin-actions"><button class="button primary" type="button" data-action="save">저장</button><button class="button danger" type="button" data-action="cancel">예약 취소</button></div>
      <small>입금 확인일: ${reservation.paidAt || "-"}</small>
    </article>`;
}

async function loadReservations() {
  adminMessage.textContent = "예약 목록을 불러오는 중입니다.";
  const reservations = await api("/api/admin/reservations");
  adminList.innerHTML = reservations.length ? reservations.map(reservationCard).join("") : '<div class="notice-box">예약 내역이 없습니다.</div>';
  adminMessage.textContent = `총 ${reservations.length}건의 예약을 불러왔습니다.`;
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  adminKey = new FormData(loginForm).get("adminKey");
  try { await loadReservations(); } catch (error) { adminMessage.textContent = error.message; }
});

adminList.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const card = button.closest(".admin-card");
  const id = card.dataset.id;
  try {
    if (button.dataset.action === "cancel") {
      await api(`/api/admin/reservations/${id}`, { method: "DELETE" });
    } else {
      await api(`/api/admin/reservations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: card.querySelector('[name="status"]').value,
          paymentStatus: card.querySelector('[name="paymentStatus"]').value,
          depositAmount: Number(card.querySelector('[name="depositAmount"]').value || 0)
        })
      });
    }
    await loadReservations();
  } catch (error) {
    adminMessage.textContent = error.message;
  }
});
