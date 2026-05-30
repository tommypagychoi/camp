const form = document.querySelector("#reservationForm");
const formMessage = document.querySelector("#formMessage");
const apiBase = window.location.hostname.includes("github.io")
  ? "http://ccymproxmox.iptime.org:8094"
  : "";
const draftKey = "campReservationDrafts";

function parseDateKey(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function saveDraft(payload) {
  const drafts = JSON.parse(localStorage.getItem(draftKey) || "[]");
  drafts.push({
    ...payload,
    savedAt: new Date().toISOString(),
    syncStatus: "pending"
  });
  localStorage.setItem(draftKey, JSON.stringify(drafts));
  return drafts.length;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formMessage.textContent = "예약 요청을 등록하는 중입니다.";

  const data = new FormData(form);
  const payload = {
    name: data.get("name"),
    phone: data.get("phone"),
    depositName: data.get("depositName"),
    startDate: data.get("startDate"),
    endDate: data.get("endDate"),
    people: Number(data.get("people")),
    equipment: data.getAll("equipment"),
    message: data.get("message")
  };

  if (parseDateKey(payload.startDate) > parseDateKey(payload.endDate)) {
    formMessage.textContent = "종료일은 시작일 이후로 선택해주세요.";
    return;
  }

  try {
    const response = await fetch(`${apiBase}/api/reservations`, {
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
    formMessage.textContent = result.message || "예약 요청이 접수되었습니다.";
  } catch (error) {
    const draftCount = saveDraft(payload);
    form.reset();
    form.elements.people.value = 2;
    formMessage.textContent = `예약 요청이 임시 접수되었습니다. 현재 브라우저에 ${draftCount}건이 보관되어 있습니다.`;
  }
});
