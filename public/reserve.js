const form = document.querySelector("#reservationForm");
const formMessage = document.querySelector("#formMessage");

function parseDateKey(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
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
});
